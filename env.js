'use strict';

function int(name, fallback) {
  const value = process.env[name];
  if (value == null || value === '') return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid integer environment variable: ${name}`);
  return parsed;
}

const env = Object.freeze({
  awsRegion: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
  s3Bucket: process.env.REPORTS_BUCKET,
  dbSecretArn: process.env.DB_SECRET_ARN,
  dbHostOverride: process.env.DB_HOST || null,
  dbPortOverride: int('DB_PORT', 3306),
  dbNameOverride: process.env.DB_NAME || null,
  dbConnectTimeoutMs: int('DB_CONNECT_TIMEOUT_MS', 10000),
  dbCharset: process.env.DB_CHARSET || 'utf8mb4',
  streamHighWaterMarkRows: int('STREAM_HIGH_WATER_MARK_ROWS', 64),
  s3PartSizeMb: int('S3_PART_SIZE_MB', 12),
  s3QueueSize: int('S3_QUEUE_SIZE', 2),
  progressEveryRows: int('PROGRESS_EVERY_ROWS', 100000),
  timeoutSafetyMs: int('TIMEOUT_SAFETY_MS', 45000),
  reportsPrefix: (process.env.REPORTS_PREFIX || 'reportes').replace(/^\/+|\/+$/g, ''),
  s3Sse: process.env.S3_SSE || 'AES256',
  s3KmsKeyId: process.env.S3_KMS_KEY_ID || null,
  secretCacheTtlMs: int('SECRET_CACHE_TTL_MS', 300000)
});

function validateEnv() {
  const missing = [];
  if (!env.s3Bucket) missing.push('REPORTS_BUCKET');
  if (!env.dbSecretArn) missing.push('DB_SECRET_ARN');
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  if (env.s3PartSizeMb < 5) throw new Error('S3_PART_SIZE_MB must be >= 5 for multipart upload');
  if (env.s3QueueSize < 1) throw new Error('S3_QUEUE_SIZE must be >= 1');
}

module.exports = { env, validateEnv };
