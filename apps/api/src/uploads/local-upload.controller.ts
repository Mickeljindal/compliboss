import {
  BadRequestException,
  Controller,
  Logger,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Request } from 'express';
import { HybridAuthGuard } from '../auth/hybrid-auth.guard';
import { Public } from '../auth/public.decorator';
import { isLocalStorage } from '../app/storage/storage.config';
import {
  verifyLocalUploadToken,
  writeLocalObject,
} from '../app/storage/local-storage';
import { MAX_UPLOAD_BYTES } from './upload-limits';

/**
 * Local filesystem upload endpoint — the on-server analogue of an S3 presigned
 * PUT. It is only active when STORAGE_DRIVER=local.
 *
 * SECURITY: this endpoint is intentionally @Public() (no session/API key),
 * exactly like an S3 presigned URL is unauthenticated. Access is gated instead
 * by an HMAC token in the query string that binds the exact bucket + key +
 * expiry (see local-storage.ts). Only a caller who first hit the authenticated
 * `POST /v1/uploads/presign` can obtain a valid token, and it stops working
 * once it expires. The stored key is org-scoped, so files stay isolated.
 *
 * The raw request bytes are delivered as a Buffer on `req.body` by the
 * express.raw() parser registered for this path in main.ts.
 */
@Controller({ path: 'uploads', version: '1' })
@UseGuards(HybridAuthGuard)
export class LocalUploadController {
  private readonly logger = new Logger(LocalUploadController.name);

  @Put('local')
  @Public()
  @ApiExcludeEndpoint()
  async uploadLocal(
    @Query('bucket') bucket: string,
    @Query('key') key: string,
    @Query('exp') exp: string,
    @Query('token') token: string,
    @Req() req: Request,
  ): Promise<{ ok: true }> {
    if (!isLocalStorage()) {
      throw new BadRequestException(
        'Local upload endpoint is disabled (STORAGE_DRIVER is not "local").',
      );
    }
    if (!bucket || !key || !exp || !token) {
      throw new BadRequestException('Missing upload parameters.');
    }

    const expiresAtMs = Number(exp);
    const valid = verifyLocalUploadToken({ bucket, key, expiresAtMs, token });
    if (!valid) {
      throw new BadRequestException('Invalid or expired upload token.');
    }

    const body: unknown = req.body;
    if (!Buffer.isBuffer(body)) {
      throw new BadRequestException(
        'Expected raw binary request body for local upload.',
      );
    }
    if (body.length === 0) {
      throw new BadRequestException('Empty upload body.');
    }
    if (body.length > MAX_UPLOAD_BYTES) {
      throw new BadRequestException(
        `File exceeds the maximum allowed size of ${Math.floor(
          MAX_UPLOAD_BYTES / (1024 * 1024),
        )}MB`,
      );
    }

    await writeLocalObject(bucket, key, body);
    this.logger.log(
      `Stored local upload at ${bucket}/${key} (${body.length} bytes)`,
    );
    return { ok: true };
  }
}
