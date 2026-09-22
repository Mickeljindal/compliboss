import { createHmac, timingSafeEqual } from 'crypto';
import { mkdir, readFile, rm, copyFile, stat, writeFile } from 'fs/promises';
import path from 'path';
import {
  getApiPublicBaseUrl,
  getLocalStorageDir,
  getLocalUploadSecret,
} from './storage.config';

/**
 * Filesystem storage driver.
 *
 * Stores each object at `${LOCAL_STORAGE_DIR}/${bucket}/${key}`. Keys use the
 * same `${orgId}/uploads/${purpose}/...` layout as the S3 flow, so switching
 * backends does not change how features reference their files.
 */

/**
 * Resolve the on-disk path for a bucket+key, guarding against path traversal.
 * The resolved path MUST stay inside the bucket root; anything escaping it
 * (via `..`, absolute keys, etc.) is rejected.
 */
export function resolveLocalObjectPath(bucket: string, key: string): string {
  const root = path.resolve(getLocalStorageDir(), sanitizeSegment(bucket));
  const target = path.resolve(root, key);

  const rootWithSep = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (target !== root && !target.startsWith(rootWithSep)) {
    throw new Error('Invalid storage key: path traversal detected');
  }
  return target;
}

/** Keep a bucket name to a safe single path segment. */
function sanitizeSegment(segment: string): string {
  const cleaned = segment.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!cleaned || cleaned === '.' || cleaned === '..') {
    throw new Error('Invalid storage bucket name');
  }
  return cleaned;
}

export async function writeLocalObject(
  bucket: string,
  key: string,
  body: Buffer,
): Promise<void> {
  const filePath = resolveLocalObjectPath(bucket, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
}

export async function readLocalObject(
  bucket: string,
  key: string,
): Promise<Buffer> {
  const filePath = resolveLocalObjectPath(bucket, key);
  return readFile(filePath);
}

/**
 * Return an object's size in bytes, or `undefined` if it does not exist. Mirrors
 * the "size unknown vs zero" contract of the S3 HEAD helper.
 */
export async function statLocalObjectSize(
  bucket: string,
  key: string,
): Promise<number | undefined> {
  try {
    const filePath = resolveLocalObjectPath(bucket, key);
    const info = await stat(filePath);
    return info.size;
  } catch {
    return undefined;
  }
}

/** Delete an object. No-op (resolves) if the file does not exist. */
export async function deleteLocalObject(
  bucket: string,
  key: string,
): Promise<void> {
  const filePath = resolveLocalObjectPath(bucket, key);
  await rm(filePath, { force: true });
}

/** Copy an object within local storage (used e.g. for policy PDF versioning). */
export async function copyLocalObject(
  bucket: string,
  sourceKey: string,
  destinationKey: string,
): Promise<void> {
  const source = resolveLocalObjectPath(bucket, sourceKey);
  const destination = resolveLocalObjectPath(bucket, destinationKey);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

/**
 * Sign a token that authorizes a single scoped action (upload or download) on
 * one bucket+key until it expires. This is the local analogue of an S3
 * presigned URL signature. The scope prevents an upload token from being
 * replayed as a download token and vice versa.
 */
export type LocalTokenScope = 'upload' | 'download';

export function signLocalToken(params: {
  scope: LocalTokenScope;
  bucket: string;
  key: string;
  expiresAtMs: number;
}): string {
  const payload = `${params.scope}:${params.bucket}:${params.key}:${params.expiresAtMs}`;
  return createHmac('sha256', getLocalUploadSecret())
    .update(payload)
    .digest('hex');
}

/**
 * Verify a token matches the scope+bucket+key+expiry and has not expired. Uses
 * a constant-time comparison to avoid leaking the signature via timing.
 */
export function verifyLocalToken(params: {
  scope: LocalTokenScope;
  bucket: string;
  key: string;
  expiresAtMs: number;
  token: string;
}): boolean {
  if (!Number.isFinite(params.expiresAtMs) || Date.now() > params.expiresAtMs) {
    return false;
  }
  const expected = signLocalToken({
    scope: params.scope,
    bucket: params.bucket,
    key: params.key,
    expiresAtMs: params.expiresAtMs,
  });
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(params.token, 'utf8');
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

/** Verify an upload-scoped token (used by the local upload PUT endpoint). */
export function verifyLocalUploadToken(params: {
  bucket: string;
  key: string;
  expiresAtMs: number;
  token: string;
}): boolean {
  return verifyLocalToken({ scope: 'upload', ...params });
}

/** Verify a download-scoped token (used by the local download GET endpoint). */
export function verifyLocalDownloadToken(params: {
  bucket: string;
  key: string;
  expiresAtMs: number;
  token: string;
}): boolean {
  return verifyLocalToken({ scope: 'download', ...params });
}

/**
 * Build the absolute upload URL a client PUTs raw bytes to. Query params carry
 * the bucket, key, expiry and signature so the (public) upload endpoint can
 * validate the request without a session.
 */
export function buildLocalUploadUrl(params: {
  bucket: string;
  key: string;
  expiresInSeconds: number;
}): { uploadUrl: string; expiresAtMs: number } {
  const expiresAtMs = Date.now() + params.expiresInSeconds * 1000;
  const token = signLocalToken({
    scope: 'upload',
    bucket: params.bucket,
    key: params.key,
    expiresAtMs,
  });
  const url = new URL(`${getApiPublicBaseUrl()}/v1/uploads/local`);
  url.searchParams.set('bucket', params.bucket);
  url.searchParams.set('key', params.key);
  url.searchParams.set('exp', String(expiresAtMs));
  url.searchParams.set('token', token);
  return { uploadUrl: url.toString(), expiresAtMs };
}

/**
 * Build an absolute, time-limited download URL for a stored object — the local
 * analogue of an S3 presigned GET URL. Services that previously returned a
 * signed S3 URL for viewing (attachments, org logos, org charts, knowledge
 * base) can return this instead when running in local mode.
 */
export function buildLocalDownloadUrl(params: {
  bucket: string;
  key: string;
  expiresInSeconds: number;
  /** Optional download filename (sets Content-Disposition filename). */
  downloadFileName?: string;
  /** 'inline' (default) to view in-browser, or 'attachment' to force download. */
  disposition?: 'inline' | 'attachment';
  /** Optional forced Content-Type (otherwise inferred from the key extension). */
  contentType?: string;
}): string {
  const expiresAtMs = Date.now() + params.expiresInSeconds * 1000;
  const token = signLocalToken({
    scope: 'download',
    bucket: params.bucket,
    key: params.key,
    expiresAtMs,
  });
  const url = new URL(`${getApiPublicBaseUrl()}/v1/files/local`);
  url.searchParams.set('bucket', params.bucket);
  url.searchParams.set('key', params.key);
  url.searchParams.set('exp', String(expiresAtMs));
  url.searchParams.set('token', token);
  // Presentation-only params — not part of the signature. They control how the
  // file is served (filename/disposition/type), never whether it can be read,
  // so leaving them unsigned is safe.
  if (params.downloadFileName) {
    url.searchParams.set('filename', params.downloadFileName);
  }
  if (params.disposition) {
    url.searchParams.set('disposition', params.disposition);
  }
  if (params.contentType) {
    url.searchParams.set('type', params.contentType);
  }
  return url.toString();
}
