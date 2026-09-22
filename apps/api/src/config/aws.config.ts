import { registerAs } from '@nestjs/config';
import { z } from 'zod';

// When STORAGE_DRIVER=local, files are stored on the API server's disk and no
// AWS/S3 credentials are needed — so the S3 fields are only required in S3 mode.
const isLocalStorage = process.env.STORAGE_DRIVER === 'local';

const requiredInS3Mode = (field: string) =>
  isLocalStorage ? z.string().optional().default('') : z.string().min(1, field);

const awsConfigSchema = z.object({
  region: z.string().default('us-east-1'),
  accessKeyId: requiredInS3Mode('AWS_ACCESS_KEY_ID is required'),
  secretAccessKey: requiredInS3Mode('AWS_SECRET_ACCESS_KEY is required'),
  bucketName: requiredInS3Mode('AWS_BUCKET_NAME is required'),
  endpoint: z.string().optional(),
});

export type AwsConfig = z.infer<typeof awsConfigSchema>;

export const awsConfig = registerAs('aws', (): AwsConfig => {
  const config = {
    region: process.env.APP_AWS_REGION || 'us-east-1',
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || '',
    bucketName: process.env.APP_AWS_BUCKET_NAME || '',
    endpoint: process.env.APP_AWS_ENDPOINT || '',
  };

  // Validate configuration at startup (S3 fields only enforced in S3 mode).
  const result = awsConfigSchema.safeParse(config);

  if (!result.success) {
    throw new Error(
      `AWS configuration validation failed: ${result.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')}`,
    );
  }

  return result.data;
});
