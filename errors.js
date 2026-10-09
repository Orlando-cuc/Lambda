'use strict';

class AppError extends Error {
  constructor(code, message, options = {}) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.code = code;
    this.statusCode = options.statusCode || 500;
    this.retryable = Boolean(options.retryable);
  }
}

const Errors = {
  invalidId: () => new AppError('INVALID_REPORT_ID', 'idReporte must be a positive integer.', { statusCode: 400 }),
  notFound: () => new AppError('REPORT_NOT_FOUND', 'The requested report does not exist.', { statusCode: 404 }),
  disabled: () => new AppError('REPORT_DISABLED', 'The requested report is disabled.', { statusCode: 409 }),
  invalidDefinition: (msg = 'The report definition is not allowed.') => new AppError('INVALID_REPORT_DEFINITION', msg, { statusCode: 422 }),
  dbConnection: (cause) => new AppError('DATABASE_CONNECTION_ERROR', 'Unable to connect to the report database.', { cause, retryable: true }),
  dbQuery: (cause) => new AppError('DATABASE_QUERY_ERROR', 'The report query failed.', { cause, retryable: true }),
  s3Upload: (cause) => new AppError('S3_UPLOAD_ERROR', 'Unable to upload the generated report.', { cause, retryable: true }),
  timeoutRisk: () => new AppError('TIMEOUT_RISK', 'Execution was stopped before the Lambda timeout to allow controlled cleanup.', { retryable: true }),
  internal: (cause) => new AppError('INTERNAL_ERROR', 'Unexpected report generation error.', { cause })
};

function publicError(error, requestId) {
  const e = error instanceof AppError ? error : Errors.internal(error);
  return {
    success: false,
    error: { code: e.code, message: e.message, retryable: e.retryable },
    requestId
  };
}

module.exports = { AppError, Errors, publicError };
