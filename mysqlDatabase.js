'use strict';
const mysql = require('mysql2');
const { env } = require('../config/env');
const { getDbSecret } = require('../services/secretsService');
const { Errors } = require('../utils/errors');

async function createConnection() {
  try {
    const secret = await getDbSecret();
    const connection = mysql.createConnection({
      host: env.dbHostOverride || secret.host,
      port: env.dbHostOverride ? env.dbPortOverride : Number(secret.port || env.dbPortOverride),
      user: secret.username || secret.user,
      password: secret.password,
      database: env.dbNameOverride || secret.dbname || secret.database,
      charset: env.dbCharset,
      connectTimeout: env.dbConnectTimeoutMs,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      multipleStatements: false,
      supportBigNumbers: true,
      bigNumberStrings: true,
      dateStrings: true,
      decimalNumbers: false
    });
    await connection.promise().connect();
    return connection;
  } catch (cause) {
    throw Errors.dbConnection(cause);
  }
}

async function closeConnection(connection) {
  if (!connection) return;
  try { await connection.promise().end(); } catch { connection.destroy(); }
}

module.exports = { createConnection, closeConnection };
