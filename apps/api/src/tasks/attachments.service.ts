import { AttachmentEntityType, AttachmentType } from '@db';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { db } from '@db';
import { randomBytes } from 'crypto';
import { resolveUploadsBucket } from '@/app/storage/storage.config';
import {
  createDownloadUrl,
  deleteObject,
  putObject,
} from '@/app/storage/object-storage';
import { AttachmentResponseDto } from './dto/task-responses.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { validateFileContent } from '../utils/file-type-validation';

@Injectable()
export class AttachmentsService {
  private bucketName: string;
  private readonly MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
  private readonly SIGNED_URL_EXPIRY = 900; // 15 minutes

  constructor() {
    // Resolves to APP_AWS_BUCKET_NAME in S3 mode, or the local default bucket
    // when STORAGE_DRIVER=local. Object ops go through the shared storage
    // helpers, so no S3 client is required at construction time.
    this.bucketName = resolveUploadsBucket();
  }

  /**
   * Upload attachment to S3 and create database record
   */
  async uploadAttachment(
    organizationId: string,
    entityId: string,
    entityType: AttachmentEntityType,
    uploadDto: UploadAttachmentDto,
    userId?: string,
  ): Promise<AttachmentResponseDto> {
    try {
      // Blocked file extensions for security
      const BLOCKED_EXTENSIONS = [
        'exe',
        'bat',
        'cmd',
        'com',
        'scr',
        'msi', // Windows executables
        'js',
        'vbs',
        'vbe',
        'wsf',
        'wsh',
        'ps1', // Scripts
        'sh',
        'bash',
        'zsh', // Shell scripts
        'dll',
        'sys',
        'drv', // System files
        'app',
        'deb',
        'rpm', // Application packages
        'jar', // Java archives (can execute)
        'pif',
        'lnk',
        'cpl', // Shortcuts and control panel
        'hta',
        'reg', // HTML apps and registry
      ];

      // Blocked MIME types for security
      const BLOCKED_MIME_TYPES = [
        'application/x-msdownload', // .exe
        'application/x-msdos-program',
        'application/x-executable',
        'application/x-sh', // Shell scripts
        'application/x-bat', // Batch files
        'text/x-sh',
        'text/x-python',
        'text/x-perl',
        'text/x-ruby',
        'application/x-httpd-php', // PHP files
        'application/x-javascript', // Executable JS (not JSON)
        'application/javascript',
        'text/javascript',
      ];

      // Validate file extension
      const fileExt = uploadDto.fileName.split('.').pop()?.toLowerCase();
      if (fileExt && BLOCKED_EXTENSIONS.includes(fileExt)) {
        throw new BadRequestException(
          `File extension '.${fileExt}' is not allowed for security reasons`,
        );
      }

      // Validate MIME type
      if (BLOCKED_MIME_TYPES.includes(uploadDto.fileType.toLowerCase())) {
        throw new BadRequestException(
          `File type '${uploadDto.fileType}' is not allowed for security reasons`,
        );
      }

      // Validate file size
      const fileBuffer = Buffer.from(uploadDto.fileData, 'base64');
      if (fileBuffer.length > this.MAX_FILE_SIZE_BYTES) {
        throw new BadRequestException(
          `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
        );
      }

      // Validate file content matches declared MIME type
      validateFileContent(fileBuffer, uploadDto.fileType, uploadDto.fileName);

      // Generate unique file key
      const fileId = randomBytes(16).toString('hex');
      const sanitizedFileName = this.sanitizeFileName(uploadDto.fileName);
      const timestamp = Date.now();
      const s3Key = `${organizationId}/attachments/${entityType}/${entityId}/${timestamp}-${fileId}-${sanitizedFileName}`;

      // Upload via the active storage driver (S3 or local filesystem)
      await putObject({
        bucket: this.bucketName,
        key: s3Key,
        body: fileBuffer,
        contentType: uploadDto.fileType,
        metadata: {
          originalFileName: uploadDto.fileName,
          organizationId,
          entityId,
          entityType,
          ...(userId && { uploadedBy: userId }),
        },
      });

      // Create database record
      const attachment = await db.attachment.create({
        data: {
          name: uploadDto.fileName,
          url: s3Key,
          type: this.mapFileTypeToAttachmentType(uploadDto.fileType),
          entityId,
          entityType,
          organizationId,
        },
      });

      // Generate signed URL for immediate access
      const downloadUrl = await this.generateSignedUrl(s3Key);

      return {
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        downloadUrl,
        createdAt: attachment.createdAt,
        size: fileBuffer.length,
      };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to upload attachment');
    }
  }

  /**
   * Get all attachments for an entity
   */
  async getAttachments(
    organizationId: string,
    entityId: string,
    entityType: AttachmentEntityType,
  ): Promise<AttachmentResponseDto[]> {
    const attachments = await db.attachment.findMany({
      where: {
        organizationId,
        entityId,
        entityType,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Generate signed URLs for all attachments
    const attachmentsWithUrls = await Promise.all(
      attachments.map(async (attachment) => {
        const downloadUrl = await this.generateSignedUrl(attachment.url);
        return {
          id: attachment.id,
          name: attachment.name,
          type: attachment.type,
          downloadUrl,
          createdAt: attachment.createdAt,
        };
      }),
    );

    return attachmentsWithUrls;
  }

  /**
   * Get download URL for an attachment
   */
  async getAttachmentDownloadUrl(
    organizationId: string,
    attachmentId: string,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    try {
      // Get attachment record
      const attachment = await db.attachment.findFirst({
        where: {
          id: attachmentId,
          organizationId,
        },
      });

      if (!attachment) {
        throw new BadRequestException('Attachment not found');
      }

      // Generate signed URL
      const downloadUrl = await this.generateSignedUrl(attachment.url);

      return {
        downloadUrl,
        expiresIn: this.SIGNED_URL_EXPIRY,
      };
    } catch (error) {
      console.error('Error generating download URL:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  /**
   * Delete attachment from S3 and database
   */
  async deleteAttachment(
    organizationId: string,
    attachmentId: string,
  ): Promise<void> {
    try {
      // Get attachment record
      const attachment = await db.attachment.findFirst({
        where: {
          id: attachmentId,
          organizationId,
        },
      });

      if (!attachment) {
        throw new BadRequestException('Attachment not found');
      }

      // Delete via the active storage driver
      await deleteObject({ bucket: this.bucketName, key: attachment.url });

      // Delete from database
      await db.attachment.delete({
        where: {
          id: attachmentId,
          organizationId,
        },
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete attachment');
    }
  }

  /**
   * Generate signed URL for file download
   */
  private async generateSignedUrl(s3Key: string): Promise<string> {
    return createDownloadUrl({
      bucket: this.bucketName,
      key: s3Key,
      expiresInSeconds: this.SIGNED_URL_EXPIRY,
    });
  }

  /**
   * Sanitize filename for S3 storage
   */
  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  /**
   * Map MIME type to AttachmentType enum
   */
  private mapFileTypeToAttachmentType(fileType: string): AttachmentType {
    const type = fileType.split('/')[0];
    switch (type) {
      case 'image':
        return AttachmentType.image;
      case 'video':
        return AttachmentType.video;
      case 'audio':
        return AttachmentType.audio;
      case 'application':
      case 'text':
        return AttachmentType.document;
      default:
        return AttachmentType.other;
    }
  }
}
