import "server-only";

import oracledb, { type Pool } from "oracledb";
import { assertReadOnlySql } from "./sql-guard";

let poolPromise: Promise<Pool> | undefined;

function oracleConfig() {
  const host = process.env.Oracle_Host;
  const port = process.env.Oracle_Port;
  const service = process.env.Oracle_Database;
  const user = process.env.Oracle_Username;
  const password = process.env.Oracle_password;
  if (!host || !port || !service || !user || !password) {
    throw new Error("Oracle connection variables are incomplete");
  }
  return { user, password, connectString: `${host}:${port}/${service}` };
}

async function getOraclePool() {
  if (!poolPromise) {
    poolPromise = oracledb.createPool({
      ...oracleConfig(),
      poolMin: 0,
      poolMax: 6,
      poolIncrement: 1,
      poolTimeout: 60,
      queueTimeout: 15000,
    });
  }
  return poolPromise;
}

export async function executeReadOnly(
  sql: string,
  binds: Record<string, unknown>,
): Promise<Record<string, unknown>[]> {
  const guardedSql = assertReadOnlySql(sql);
  const pool = await getOraclePool();
  const connection = await pool.getConnection();
  connection.callTimeout = 15000;
  try {
    await connection.execute("SET TRANSACTION READ ONLY");
    const result = await connection.execute<Record<string, unknown>>(guardedSql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      maxRows: 500,
      fetchArraySize: 100,
    });
    return (result.rows ?? []) as Record<string, unknown>[];
  } finally {
    try {
      await connection.rollback();
    } finally {
      await connection.close();
    }
  }
}
