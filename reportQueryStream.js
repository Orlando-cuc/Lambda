'use strict';
const { env } = require('../config/env');
const { Errors } = require('../utils/errors');

async function openReportQueryStream(connection, sql) {
  let query;
  try {
    query = connection.query({ sql, rowsAsArray: true });
    query.pause();

    const fields = await new Promise((resolve, reject) => {
      const onFields = (metadata) => { cleanup(); resolve(metadata); };
      const onError = (error) => { cleanup(); reject(error); };
      const cleanup = () => {
        query.off('fields', onFields);
        query.off('error', onError);
      };
      query.once('fields', onFields);
      query.once('error', onError);
      query.resume(); // metadata arrives before row flow; pause again immediately after metadata below
    });

    query.pause();
    const stream = query.stream({ highWaterMark: env.streamHighWaterMarkRows });
    query.resume();
    return { query, stream, fields };
  } catch (cause) {
    try { query?.destroy?.(); } catch {}
    throw Errors.dbQuery(cause);
  }
}

module.exports = { openReportQueryStream };
