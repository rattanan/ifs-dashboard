import "dotenv/config";

import oracledb from "oracledb";
import { metricCatalog } from "../lib/dashboard/catalog";
import { assertReadOnlySql, pickQueryBinds } from "../lib/dashboard/sql-guard";

async function main() {
  const host = process.env.Oracle_Host;
  const port = process.env.Oracle_Port;
  const service = process.env.Oracle_Database;
  const user = process.env.Oracle_Username;
  const password = process.env.Oracle_password;
  if (!host || !port || !service || !user || !password) throw new Error("Oracle configuration is incomplete");

  const pool = await oracledb.createPool({ user, password, connectString: `${host}:${port}/${service}`, poolMin: 0, poolMax: 2 });
  const defaults = { site: "T10", projectId: "B6201", fiscalYear: null, buyer: null, supplier: null, locationGroup: null, locationSearch: null, from: null, to: null };
  let passed = 0;
  const failures: { id: string; error: string }[] = [];

  const selectedIds = new Set(process.argv.slice(2));
  const selectedMetrics = selectedIds.size ? metricCatalog.filter((metric) => selectedIds.has(metric.id)) : metricCatalog;
  try {
    for (const metric of selectedMetrics) {
      const connection = await pool.getConnection();
      connection.callTimeout = 15000;
      try {
        const sql = assertReadOnlySql(metric.sql);
        await connection.execute("SET TRANSACTION READ ONLY");
        await connection.execute(sql, pickQueryBinds(sql, defaults), { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 1 });
        passed += 1;
        console.log(`PASS ${metric.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
        failures.push({ id: metric.id, error: message });
        console.log(`FAIL ${metric.id}: ${message}`);
      } finally {
        await connection.rollback();
        await connection.close();
      }
    }
  } finally {
    await pool.close(0);
  }

  console.log(JSON.stringify({ passed, failed: failures.length, total: selectedMetrics.length, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
