import "dotenv/config";

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { fleetReadinessSeeds } from "../lib/db/schema";
import { fleetReadinessSeed } from "../lib/dashboard/fleet-readiness-data";

const connectionUrl = process.env.DATABASE_URL;
if (!connectionUrl) throw new Error("DATABASE_URL is not configured");

const pool = mysql.createPool({ uri: connectionUrl, connectionLimit: 2, timezone: "+07:00" });
const db = drizzle(pool);

async function main() {
  for (const site of ["T10", "T101"]) {
    await db
      .insert(fleetReadinessSeeds)
      .values({
        id: crypto.randomUUID(),
        site,
        snapshot: { ...fleetReadinessSeed, site },
        active: true,
        updatedAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: {
          snapshot: { ...fleetReadinessSeed, site },
          active: true,
          updatedAt: new Date(),
        },
      });
  }

  console.log("Fleet Readiness seed data is ready for T10 and T101");
  await pool.end();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : error);
  await pool.end();
  process.exit(1);
});
