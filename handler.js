'use strict';
const { validateEnv } = require('./config/env');
const { validateInput } = require('./validators/inputValidator');
const { generateReport } = require('./services/reportService');
const { publicError } = require('./utils/errors');

exports.handler = async (event, context) => {
  try {
    validateEnv();
    const idReporte = validateInput(event);
    return await generateReport({ idReporte, context });
  } catch (error) {
    return publicError(error, context?.awsRequestId);
  }
};
