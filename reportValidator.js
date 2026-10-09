'use strict';
const { Parser } = require('node-sql-parser');
const { Errors } = require('../utils/errors');
const parser = new Parser();

const forbidden = /\b(INSERT|UPDATE|DELETE|REPLACE|MERGE|DROP|ALTER|TRUNCATE|CREATE|RENAME|GRANT|REVOKE|CALL|EXEC(?:UTE)?|PREPARE|DEALLOCATE|HANDLER|LOAD\s+DATA|INTO\s+OUTFILE|INTO\s+DUMPFILE|SET|USE|LOCK|UNLOCK|KILL|SHUTDOWN|ANALYZE|OPTIMIZE|REPAIR)\b/i;
const comments = /(--[^\r\n]*|#[^\r\n]*|\/\*[\s\S]*?\*\/)/;

function validateReportDefinition(report) {
  if (!report) throw Errors.notFound();
  if (!report.ACTIVO) throw Errors.disabled();
  if (String(report.FORMATO || '').toUpperCase() !== 'CSV') {
    throw Errors.invalidDefinition('Only CSV reports are enabled by this implementation.');
  }
  const original = String(report.SQL_REPORTE || '').trim();
  if (!original) throw Errors.invalidDefinition('SQL_REPORTE is empty.');
  if (comments.test(original)) throw Errors.invalidDefinition('SQL comments are not allowed in SQL_REPORTE.');

  // Permit one optional trailing semicolon, but no semicolon anywhere else.
  const sql = original.endsWith(';') ? original.slice(0, -1).trim() : original;
  if (sql.includes(';')) throw Errors.invalidDefinition('Multiple statements are not allowed.');
  if (!/^\s*(SELECT|WITH)\b/i.test(sql)) throw Errors.invalidDefinition('SQL_REPORTE must start with SELECT or WITH.');
  if (forbidden.test(sql)) throw Errors.invalidDefinition('SQL_REPORTE contains a forbidden SQL operation.');

  try {
    const ast = parser.astify(sql, { database: 'MySQL' });
    if (Array.isArray(ast) || ast?.type !== 'select') {
      throw new Error('AST is not a single SELECT statement');
    }
  } catch (cause) {
    throw Errors.invalidDefinition(`SQL_REPORTE could not be validated as a single MySQL SELECT: ${cause.message}`);
  }
  return sql;
}

module.exports = { validateReportDefinition };
