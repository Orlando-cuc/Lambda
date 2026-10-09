'use strict';
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { env } = require('../config/env');
const client = new SecretsManagerClient({ region: env.awsRegion });
let cache = null;

async function getDbSecret() {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.value;
  const response = await client.send(new GetSecretValueCommand({ SecretId: env.dbSecretArn }));
  const raw = response.SecretString || Buffer.from(response.SecretBinary).toString('utf8');
  const value = JSON.parse(raw);
  cache = { value, expiresAt: now + env.secretCacheTtlMs };
  return value;
}

module.exports = { getDbSecret };
