'use strict';
const { PassThrough } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { env } = require('../config/env');
const { createConnection, closeConnection } = require('../database/mysqlDatabase');
const { openReportQueryStream } = require('../database/reportQueryStream');
const reportRepository = require('../repositories/reportRepository');
const { validateReportDefinition } = require('../validators/reportValidator');
const { CsvTransform, ByteCounter } = require('./csvService');
const { createStreamingUpload } = require('./s3Service');
const { buildS3Key } = require('../utils/naming');
const { AppError, Errors } = require('../utils/errors');
const logger = require('../utils/logger');

async function generateReport({ idReporte, context }) {
  const startedAt = Date.now();
  let connection;
  let dbStream;
  let upload;
  let timeoutTimer;
  let rows = 0;
  let firstRowAt = null;
  const requestId = context?.awsRequestId;

  const logBase = { idReporte, requestId };
  logger.info('report.start', logBase);

  try {
    connection = await createConnection();
    const configStart = Date.now();
    const report = await reportRepository.findById(connection, idReporte);
    logger.info('report.config.loaded', { ...logBase, durationMs: Date.now() - configStart });

    const sql = validateReportDefinition(report);
    const key = buildS3Key({
      prefix: env.reportsPrefix,
      route: report.RUTA_S3,
      filename: report.NOMBRE_ARCHIVO || report.CODIGO || `reporte_${idReporte}`
    });

    const queryStart = Date.now();
    const opened = await openReportQueryStream(connection, sql);
    dbStream = opened.stream;
    const headers = opened.fields.map((field) => field.name);
    logger.info('report.query.metadata', {
      ...logBase,
      columns: headers.length,
      metadataMs: Date.now() - queryStart
    });

    const csv = new CsvTransform(headers, {
      onRow: () => {
        rows += 1;
        if (rows === 1) {
          firstRowAt = Date.now();
          logger.info('report.first_row', { ...logBase, firstRowMs: firstRowAt - startedAt });
        }
        if (rows % env.progressEveryRows === 0) {
          logger.info('report.progress', { ...logBase, rows, elapsedMs: Date.now() - startedAt });
        }
      }
    });
    const counter = new ByteCounter();
    const body = new PassThrough({ highWaterMark: 1024 * 1024 });
    upload = createStreamingUpload({ key, body });

    if (context?.getRemainingTimeInMillis) {
      timeoutTimer = setInterval(() => {
        const remainingMs = context.getRemainingTimeInMillis();
        if (remainingMs <= env.timeoutSafetyMs) {
          const error = Errors.timeoutRisk();
          logger.warn('report.timeout_risk', { ...logBase, rows, remainingMs });
          dbStream?.destroy(error);
          body.destroy(error);
          upload?.abort().catch(() => {});
        }
      }, 1000);
      timeoutTimer.unref?.();
    }

    const uploadPromise = upload.done().catch((cause) => {
      body.destroy(cause);
      dbStream?.destroy(cause);
      throw Errors.s3Upload(cause);
    });

    const pipelinePromise = pipeline(dbStream, csv, counter, body).catch((cause) => {
      upload?.abort().catch(() => {});
      if (cause instanceof AppError) throw cause;
      throw Errors.dbQuery(cause);
    });

    await Promise.all([pipelinePromise, uploadPromise]);

    const durationMs = Date.now() - startedAt;
    logger.info('report.completed', {
      ...logBase,
      rows,
      bytes: counter.bytes,
      durationMs,
      key
    });

    return {
      success: true,
      idReporte,
      registros: rows,
      bucket: env.s3Bucket,
      key,
      size: counter.bytes,
      durationMs
    };
  } catch (error) {
    logger.error('report.failed', {
      ...logBase,
      code: error.code || 'INTERNAL_ERROR',
      rows,
      durationMs: Date.now() - startedAt,
      errorName: error.name,
      // Do not log SQL, credentials, query text or secrets.
      message: error.message
    });
    if (upload) await upload.abort().catch(() => {});
    if (error instanceof AppError) throw error;
    throw Errors.internal(error);
  } finally {
    if (timeoutTimer) clearInterval(timeoutTimer);
    if (dbStream && !dbStream.destroyed) dbStream.destroy();
    await closeConnection(connection);
  }
}

module.exports = { generateReport };
