'use strict';
const { Errors } = require('../utils/errors');

function validateInput(event) {
  const raw = event?.idReporte;
  const id = typeof raw === 'string' && /^\d+$/.test(raw) ? Number(raw) : raw;
  if (!Number.isSafeInteger(id) || id <= 0) throw Errors.invalidId();
  return id;
}

module.exports = { validateInput };
