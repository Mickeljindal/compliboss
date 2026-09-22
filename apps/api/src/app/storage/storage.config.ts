import path from 'path';
import '../../config/load-env';

/**
 * Storage driver selection.
 *
 * CompliBoss supports two backends for uploaded files:
 *   - 's3'    : Amazon S3 (or any S3-compatible endpoint). Default, preserves
 *               the original presigned-URL behaviour.
 *   - 'local' : the API server's own filesystem. Files are written under
 *               LOCAL_STORAGE_DIR and served/uploaded through the API itself,
 *               so no external object store is required.
 *
 * Switch with STORAGE_DRIVER=local. Everything else in the app keeps calling
 * the same helpers in app/s3.ts — only the backend changes.
 */
export type StorageDriver = 'local' | 's3';

export function getStorageDriver(): StorageDriver {
  return process.env.STORAGE_DRIVER === 'local' ? 'local' : 's3';
}

export function isLocalStorage(): boolean {
  return getStorageDriver() === 'local';
}

/**
 * Absolute base directory for local file storage. Every object is stored at
 * `${LOCAL_STORAGE_DIR}/${bucket}/${key}`. Defaults to a folder next to the
 * running process so it works out of the box; set LOCAL_STORAGE_DIR to a
 * persistent volume path in production (e.g. /var/lib/compliboss/uploads).
 */
export function getLocalStorageDir(): string {
  const configured = process.env.LOCAL_STORAGE_DIR?.trim();
  if (configured) {
    return path.resolve(configured);
  }
  return path.resolve(process.cwd(), '.compliboss-storage');
}

/**
 * Logical bucket name used when partitioning local files. In S3 mode the real
 * bucket names come from the APP_AWS_* env vars; in local mode a single default
 * bucket keeps keys org-scoped and tidy.
 */
export const DEFAULT_LOCAL_BUCKET = 'compliboss-uploads';

/**
 * Resolve the bucket to use for the general uploads flow. Falls back to the
 * local default when the S3 bucket env var is absent (local mode).
 */
export function resolveUploadsBucket(): string {
  return process.env.APP_AWS_BUCKET_NAME || DEFAULT_LOCAL_BUCKET;
}

/** Default bucket for organization assets (logos, favicons) in local mode. */
export const DEFAULT_LOCAL_ORG_ASSETS_BUCKET = 'compliboss-org-assets';

/** Resolve the bucket for organization assets across both drivers. */
export function resolveOrgAssetsBucket(): string {
  return (
    process.env.APP_AWS_ORG_ASSETS_BUCKET || DEFAULT_LOCAL_ORG_ASSETS_BUCKET
  );
}

/**
 * Secret used to HMAC-sign local upload tokens. Reuses the app auth secret so
 * self-hosters don't have to configure another one. The token is what makes an
 * otherwise-public local upload endpoint safe: it binds a specific bucket+key
 * and an expiry, exactly like an S3 presigned URL signature.
 */
export function getLocalUploadSecret(): string {
  const secret =
    process.env.LOCAL_STORAGE_UPLOAD_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.SECRET_KEY;
  if (!secret) {
    throw new Error(
      'Local storage upload secret missing. Set LOCAL_STORAGE_UPLOAD_SECRET (or AUTH_SECRET).',
    );
  }
  return secret;
}

/**
 * Public base URL of the API, used to build the absolute upload URL handed back
 * to clients (the local analogue of an S3 presigned URL).
 */
export function getApiPublicBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_PUBLIC_URL ||
    process.env.BASE_URL ||
    `http://localhost:${process.env.PORT ?? 3333}`
  ).replace(/\/+$/, '');
}
