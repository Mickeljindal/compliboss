import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getObjectAsBuffer, getSignedUrl, s3Client } from '../s3';
import { isLocalStorage } from './storage.config';
import {
  buildLocalDownloadUrl,
  copyLocalObject,
  deleteLocalObject,
  writeLocalObject,
} from './local-storage';

/**
 * Driver-agnostic object storage helpers.
 *
 * These wrap the two backends (S3 and local filesystem) behind one API so
 * feature services don't branch on the driver themselves. In S3 mode the
 * behaviour is identical to the previous direct-S3 calls; in local mode the
 * same operations hit the filesystem and the on-server upload/download
 * endpoints. Switch backends with STORAGE_DRIVER=local.
 */

function assertS3(): NonNullable<typeof s3Client> {
  if (!s3Client) {
    throw new Error('S3 client not configured');
  }
  return s3Client;
}

export async function putObject(params: {
  bucket: string;
  key: string;
  body: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}): Promise<void> {
  if (isLocalStorage()) {
    await writeLocalObject(params.bucket, params.key, params.body);
    return;
  }
  await assertS3().send(
    new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      Metadata: params.metadata,
    }),
  );
}

export async function deleteObject(params: {
  bucket: string;
  key: string;
}): Promise<void> {
  if (isLocalStorage()) {
    await deleteLocalObject(params.bucket, params.key);
    return;
  }
  await assertS3().send(
    new DeleteObjectCommand({ Bucket: params.bucket, Key: params.key }),
  );
}

export async function copyObject(params: {
  bucket: string;
  sourceKey: string;
  destinationKey: string;
}): Promise<void> {
  if (isLocalStorage()) {
    await copyLocalObject(
      params.bucket,
      params.sourceKey,
      params.destinationKey,
    );
    return;
  }
  await assertS3().send(
    new CopyObjectCommand({
      Bucket: params.bucket,
      CopySource: `${params.bucket}/${params.sourceKey}`,
      Key: params.destinationKey,
    }),
  );
}

/** Read a full object into a Buffer (delegates to app/s3 which is local-aware). */
export async function readObjectBuffer(params: {
  bucket: string;
  key: string;
}): Promise<Buffer> {
  return getObjectAsBuffer(params.bucket, params.key);
}

/**
 * Produce a time-limited URL to view/download an object — a presigned S3 GET in
 * S3 mode, or a signed local `/v1/files/local` URL in local mode.
 */
export async function createDownloadUrl(params: {
  bucket: string;
  key: string;
  expiresInSeconds: number;
  downloadFileName?: string;
  disposition?: 'inline' | 'attachment';
  contentType?: string;
}): Promise<string> {
  if (isLocalStorage()) {
    return buildLocalDownloadUrl({
      bucket: params.bucket,
      key: params.key,
      expiresInSeconds: params.expiresInSeconds,
      downloadFileName: params.downloadFileName,
      disposition: params.disposition,
      contentType: params.contentType,
    });
  }

  const contentDisposition = params.downloadFileName
    ? `${params.disposition ?? 'attachment'}; filename="${params.downloadFileName}"`
    : params.disposition;

  const command = new GetObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    ResponseContentDisposition: contentDisposition,
    ResponseContentType: params.contentType,
  });
  return getSignedUrl(assertS3(), command, {
    expiresIn: params.expiresInSeconds,
  });
}
