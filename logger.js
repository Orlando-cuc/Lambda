'use strict';

function emit(level, message, fields = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields
  }));
}

module.exports = {
  info: (message, fields) => emit('INFO', message, fields),
  warn: (message, fields) => emit('WARN', message, fields),
  error: (message, fields) => emit('ERROR', message, fields)
};
