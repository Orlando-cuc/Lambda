'use strict';
const { Transform } = require('node:stream');

function csvCell(value) {
  if (value === null || value === undefined) return '';
  let text;
  if (Buffer.isBuffer(value)) text = value.toString('utf8');
  else if (value instanceof Date) text = value.toISOString();
  else if (typeof value === 'object') text = JSON.stringify(value);
  else text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

class CsvTransform extends Transform {
  constructor(headers, { onRow } = {}) {
    super({ writableObjectMode: true });
    this.headers = headers;
    this.onRow = onRow;
    this.headerWritten = false;
  }

  _transform(row, encoding, callback) {
    try {
      if (!this.headerWritten) {
        this.push(`${this.headers.map(csvCell).join(',')}\r\n`);
        this.headerWritten = true;
      }
      this.push(`${row.map(csvCell).join(',')}\r\n`);
      this.onRow?.();
      callback();
    } catch (error) { callback(error); }
  }

  _flush(callback) {
    if (!this.headerWritten) this.push(`${this.headers.map(csvCell).join(',')}\r\n`);
    callback();
  }
}

class ByteCounter extends Transform {
  constructor() { super(); this.bytes = 0; }
  _transform(chunk, encoding, callback) {
    this.bytes += Buffer.byteLength(chunk);
    callback(null, chunk);
  }
}

module.exports = { CsvTransform, ByteCounter, csvCell };
