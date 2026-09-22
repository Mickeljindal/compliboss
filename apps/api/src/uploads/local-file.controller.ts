import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import path from 'path';
import { HybridAuthGuard } from '../auth/hybrid-auth.guard';
import { Public } from '../auth/public.decorator';
import { isLocalStorage } from '../app/storage/storage.config';
import {
  readLocalObject,
  verifyLocalDownloadToken,
} from '../app/storage/local-storage';

/** Minimal extension -> MIME map so common files preview inline in the browser. */
const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.json': 'application/json',
};

function mimeForKey(key: string): string {
  return MIME_BY_EXT[path.extname(key).toLowerCase()] ?? 'application/octet-stream';
}

/**
 * Local filesystem download endpoint — the on-server analogue of an S3
 * presigned GET URL. Active only when STORAGE_DRIVER=local.
 *
 * SECURITY: intentionally @Public() (no session), gated by an HMAC token in the
 * query string that binds the exact bucket + key + expiry and a 'download'
 * scope (see local-storage.ts). This mirrors how a presigned S3 GET URL is
 * itself an unauthenticated, time-limited, signed link.
 */
@Controller({ path: 'files', version: '1' })
@UseGuards(HybridAuthGuard)
export class LocalFileController {
  @Get('local')
  @Public()
  @ApiExcludeEndpoint()
  async downloadLocal(
    @Query('bucket') bucket: string,
    @Query('key') key: string,
    @Query('exp') exp: string,
    @Query('token') token: string,
    @Query('filename') filename?: string,
    @Query('disposition') disposition?: string,
    @Query('type') type?: string,
  ): Promise<StreamableFile> {
    if (!isLocalStorage()) {
      throw new BadRequestException(
        'Local file endpoint is disabled (STORAGE_DRIVER is not "local").',
      );
    }
    if (!bucket || !key || !exp || !token) {
      throw new BadRequestException('Missing download parameters.');
    }

    const expiresAtMs = Number(exp);
    if (!verifyLocalDownloadToken({ bucket, key, expiresAtMs, token })) {
      throw new BadRequestException('Invalid or expired download token.');
    }

    let buffer: Buffer;
    try {
      buffer = await readLocalObject(bucket, key);
    } catch {
      throw new NotFoundException('File not found.');
    }

    const dispositionKind = disposition === 'attachment' ? 'attachment' : 'inline';
    const safeName = (filename ?? path.basename(key)).replace(/["\\\r\n]/g, '_');

    return new StreamableFile(buffer, {
      type: type || mimeForKey(key),
      disposition: `${dispositionKind}; filename="${safeName}"`,
    });
  }
}
