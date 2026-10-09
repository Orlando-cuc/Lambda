'use strict';
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const { env } = require('../config/env');

const s3 = new S3Client({ region: env.awsRegion });

function createStreamingUpload({ key, body }) {
  const params = {
    Bucket: env.s3Bucket,
    Key: key,
    Body: body,
    ContentType: 'text/csv; charset=utf-8',
    ContentDisposition: 'attachment',
    ServerSideEncryption: env.s3Sse
  };
  if (env.s3Sse === 'aws:kms' && env.s3KmsKeyId) params.SSEKMSKeyId = env.s3KmsKeyId;

  return new Upload({
    client: s3,
    params,
    queueSize: env.s3QueueSize,
    partSize: env.s3PartSizeMb * 1024 * 1024,
    leavePartsOnError: false
  });
}

module.exports = { createStreamingUpload };
