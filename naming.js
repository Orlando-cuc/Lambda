'use strict';
const crypto = require('node:crypto');

function safeSegment(value, fallback = 'reporte') {
  const cleaned = String(value || fallback)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._/-]+/g, '_')
    .replace(/\.{2,}/g, '.')
    .replace(/^\/+|\/+$/g, '');
  return cleaned || fallback;
}

function buildS3Key({ prefix, route, filename }) {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const uuid = crypto.randomUUID();
  const base = safeSegment(filename || 'reporte').replace(/\.csv$/i, '');
  const parts = [safeSegment(prefix, 'reportes')];
  if (route) parts.push(safeSegment(route, ''));
  parts.push(`${base}-${date}-${uuid}.csv`);
  return parts.filter(Boolean).join('/');
}

module.exports = { buildS3Key };
