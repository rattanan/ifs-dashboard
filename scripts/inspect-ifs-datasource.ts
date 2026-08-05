import "dotenv/config";
import oracledb from "oracledb";

function decode(value: string) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&apos;", "'").replaceAll("&quot;", '"');
}

function tag(xml: string, name: string) {
  return decode(xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const ids = process.argv.slice(2);
  if (!ids.length) throw new Error("Pass one or more COMPOSITE_PAGE_DATA_SOURCE ids");
  const { Oracle_Host: host, Oracle_Port: port, Oracle_Database: service, Oracle_Username: user, Oracle_password: password } = process.env;
  if (!host || !port || !service || !user || !password) throw new Error("Oracle configuration is incomplete");
  const oracle = oracledb as unknown as { fetchAsString: unknown[]; CLOB: unknown };
  oracle.fetchAsString = [oracle.CLOB];
  const pool = await oracledb.createPool({ user, password, connectString: `${host}:${port}/${service}`, poolMin: 0, poolMax: 1 });
  const db = await pool.getConnection();
  try {
    await db.execute("SET TRANSACTION READ ONLY");
    for (const id of ids) {
      const result = await db.execute<Record<string, unknown>>("SELECT VALUE FROM COMPOSITE_PAGE_DATA_SOURCE WHERE ID=:id", { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      const xml = String(result.rows?.[0]?.VALUE ?? "");
      console.log(JSON.stringify({ id, view: tag(xml, "View"), where: tag(xml, "Where"), orderBy: tag(xml, "OrderBy"), columns: Array.from(xml.matchAll(/<Column>([\s\S]*?)<\/Column>/g), (match) => decode(match[1]).trim()) }, null, 2));
    }
  } finally {
    await db.rollback(); await db.close(); await pool.close(0);
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
