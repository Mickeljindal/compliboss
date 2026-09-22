import { Injectable, NotFoundException } from '@nestjs/common';
import { BUCKET_NAME, s3Client } from '@/app/s3';
import {
  isLocalStorage,
  resolveUploadsBucket,
} from '@/app/storage/storage.config';
import {
  createDownloadUrl,
  putObject,
} from '@/app/storage/object-storage';
import { db } from '@db';

@Injectable()
export class BrowserbaseScreenshotService {
  private get bucketName(): string {
    if (!isLocalStorage() && !BUCKET_NAME) {
      throw new Error(
        'APP_AWS_BUCKET_NAME is not set — configure S3 credentials in apps/api/.env (or set STORAGE_DRIVER=local)',
      );
    }
    return resolveUploadsBucket();
  }

  private get storageReady(): boolean {
    return isLocalStorage() || !!s3Client;
  }

  async uploadScreenshot({
    organizationId,
    automationId,
    runId,
    base64Screenshot,
  }: {
    organizationId: string;
    automationId: string;
    runId: string;
    base64Screenshot: string;
  }): Promise<string> {
    if (!this.storageReady) {
      throw new Error(
        'Storage not configured — set S3 credentials or STORAGE_DRIVER=local',
      );
    }
    const buffer = Buffer.from(base64Screenshot, 'base64');
    const key = `browser-automations/${organizationId}/${automationId}/${runId}.jpg`;

    await putObject({
      bucket: this.bucketName,
      key,
      body: buffer,
      contentType: 'image/jpeg',
    });

    return key;
  }

  async getPresignedUrl({
    key,
    expiresIn,
    responseContentDisposition,
  }: {
    key: string;
    expiresIn?: number;
    responseContentDisposition?: string;
  }): Promise<string> {
    const isAttachment = responseContentDisposition?.startsWith('attachment');
    return createDownloadUrl({
      bucket: this.bucketName,
      key,
      expiresInSeconds: expiresIn ?? 3600,
      disposition: isAttachment ? 'attachment' : 'inline',
      contentType: 'image/jpeg',
    });
  }

  async getScreenshotRedirectUrl(input: {
    runId: string;
    organizationId: string;
    download?: boolean;
  }): Promise<string> {
    const { runId, organizationId, download } = input;

    const run = await db.browserAutomationRun.findUnique({
      where: { id: runId },
      include: { automation: { include: { task: true } } },
    });

    if (!run || !run.screenshotUrl) {
      throw new NotFoundException('Screenshot not found');
    }

    if (run.automation.task.organizationId !== organizationId) {
      throw new NotFoundException('Screenshot not found');
    }

    const responseContentDisposition = download
      ? `attachment; filename="screenshot-${runId}.jpg"`
      : undefined;

    return this.getPresignedUrl({
      key: run.screenshotUrl,
      responseContentDisposition,
    });
  }
}
