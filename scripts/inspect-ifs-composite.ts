import "dotenv/config";
import oracledb from "oracledb";

const pages = {
  maintenance: "8aec388b-286c-4150-9d4d-84dccd071b8e",
  budget: "55812687-f21e-4497-a01e-91c08abb39cf",
  inventory: "409d1586-cd7b-47a8-9b32-4767e537224a",
  procurement: "67b3015e-4d54-4cff-b8e0-49ac318a94b7",
};

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match?.[1]?.replace(/<[^>]+>/g, " ").replaceAll("&amp;", "&").replace(/\s+/g, " ").trim() || null;
}

async function main() {
  const { Oracle_Host: host, Oracle_Port: port, Oracle_Database: service, Oracle_Username: user, Oracle_password: password } = process.env;
  if (!host || !port || !service || !user || !password) throw new Error("Oracle configuration is incomplete");
  (oracledb as unknown as { fetchAsString: unknown[]; CLOB: unknown }).fetchAsString = [(oracledb as unknown as { CLOB: unknown }).CLOB];
  const connection = await oracledb.createPool({ user, password, connectString: `${host}:${port}/${service}`, poolMin: 0, poolMax: 1 });
  const db = await connection.getConnection();
  try {
    await db.execute("SET TRANSACTION READ ONLY");
    for (const [dashboard, pageId] of Object.entries(pages)) {
      const page = await db.execute<Record<string, unknown>>("SELECT VALUE FROM COMPOSITE_PAGE WHERE ID=:id", { id: pageId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
      const pageXml = String(page.rows?.[0]?.VALUE ?? "");
      const elementIds = Array.from(pageXml.matchAll(/<Element id="([^"]+)"/g), (match) => match[1]);
      console.log(`\n## ${dashboard} (${elementIds.length})`);
      for (const id of elementIds) {
        const element = await db.execute<Record<string, unknown>>("SELECT VALUE FROM COMPOSITE_PAGE_ELEMENT WHERE ID=:id", { id }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const xml = String(element.rows?.[0]?.VALUE ?? "");
        console.log(JSON.stringify({
          id,
          type: xml.match(/^<([^>]+)>/)?.[1],
          title: tag(xml, "Title"),
          name: tag(xml, "Name"),
          dataSourceId: tag(xml, "DataSourceId"),
          columns: Array.from(xml.matchAll(/<MappedColumn>[\s\S]*?<Column>([\s\S]*?)<\/Column>/g), (match) => match[1].replaceAll("&amp;", "&")).slice(0, 14),
        }));
      }
    }
  } finally {
    await db.rollback();
    await db.close();
    await connection.close(0);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
