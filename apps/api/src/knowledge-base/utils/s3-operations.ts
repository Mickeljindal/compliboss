import { randomBytes } from 'crypto';
import { APP_AWS_KNOWLEDGE_BASE_BUCKET } from '@/app/s3';
import { isLocalStorage } from '@/app/storage/storage.config';
import {
  createDownloadUrl,
  deleteObject,
  putObject,
} from '@/app/storage/object-storage';
import {
  MAX_FILE_SIZE_BYTES,
  SIGNED_URL_EXPIRATION_SECONDS,
  sanitizeFileName,
  sanitizeMetadataFileName,
  generateS3Key,
} from './constants';

export interface UploadResult {
  s3Key: string;
  fileSize: number;
}

export interface SignedUrlResult {
  signedUrl: string;
}

/** Default bucket used for knowledge-base files when running in local mode. */
const LOCAL_KB_BUCKET = 'compliboss-knowledge-base';

/** Resolve the bucket for knowledge-base objects across both drivers. */
function knowledgeBaseBucket(): string {
  return APP_AWS_KNOWLEDGE_BASE_BUCKET || LOCAL_KB_BUCKET;
}

/**
 * Validates that storage is configured. In local mode there is nothing to
 * validate (files live on disk); in S3 mode the bucket env var is required.
 */
export function validateS3Config(): void {
  if (isLocalStorage()) {
    return;
  }
  if (!APP_AWS_KNOWLEDGE_BASE_BUCKET) {
    throw new Error(
      'Knowledge base bucket is not configured. Please set APP_AWS_KNOWLEDGE_BASE_BUCKET environment variable.',
    );
  }
}

/**
 * Uploads a document to the active storage backend
 */
export async function uploadToS3(
  organizationId: string,
  fileName: string,
  fileType: string,
  fileData: string,
): Promise<UploadResult> {
  validateS3Config();

  // Convert base64 to buffer
  const fileBuffer = Buffer.from(fileData, 'base64');

  // Validate file size
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB limit`,
    );
  }

  // Generate unique file key
  const fileId = randomBytes(16).toString('hex');
  const sanitized = sanitizeFileName(fileName);
  const s3Key = generateS3Key(organizationId, fileId, sanitized);

  await putObject({
    bucket: knowledgeBaseBucket(),
    key: s3Key,
    body: fileBuffer,
    contentType: fileType,
    metadata: {
      originalFileName: sanitizeMetadataFileName(fileName),
      organizationId,
    },
  });

  return {
    s3Key,
    fileSize: fileBuffer.length,
  };
}

/**
 * Generates a signed URL for downloading a document
 */
export async function generateDownloadUrl(
  s3Key: string,
  fileName: string,
): Promise<SignedUrlResult> {
  validateS3Config();

  const signedUrl = await createDownloadUrl({
    bucket: knowledgeBaseBucket(),
    key: s3Key,
    expiresInSeconds: SIGNED_URL_EXPIRATION_SECONDS,
    downloadFileName: fileName,
    disposition: 'attachment',
  });

  return { signedUrl };
}

/**
 * Generates a signed URL for viewing a document in browser
 */
export async function generateViewUrl(
  s3Key: string,
  fileName: string,
  fileType: string,
): Promise<SignedUrlResult> {
  validateS3Config();

  const signedUrl = await createDownloadUrl({
    bucket: knowledgeBaseBucket(),
    key: s3Key,
    expiresInSeconds: SIGNED_URL_EXPIRATION_SECONDS,
    downloadFileName: fileName,
    disposition: 'inline',
    contentType: fileType || 'application/octet-stream',
  });

  return { signedUrl };
}

/**
 * Deletes a document from storage
 * Returns true if successful, false if error (non-throwing)
 */
export async function deleteFromS3(s3Key: string): Promise<boolean> {
  try {
    validateS3Config();
    await deleteObject({ bucket: knowledgeBaseBucket(), key: s3Key });
    return true;
  } catch {
    return false;
  }
}
