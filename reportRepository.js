'use strict';
const { Errors } = require('../utils/errors');

async function findById(connection, idReporte) {
  try {
    const [rows] = await connection.promise().execute(
      `SELECT ID_REPORTE, CODIGO, NOMBRE, DESCRIPCION, SQL_REPORTE, FORMATO,
              NOMBRE_ARCHIVO, RUTA_S3, ACTIVO, FECHA_CREACION, FECHA_MODIFICACION
         FROM TBL_REPORTES
        WHERE ID_REPORTE = ?
        LIMIT 1`,
      [idReporte]
    );
    return rows[0] || null;
  } catch (cause) {
    throw Errors.dbQuery(cause);
  }
}

module.exports = { findById };
