import "server-only";

import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql, { type Pool } from "mysql2/promise";
import * as schema from "./schema";

type Database = MySql2Database<typeof schema>;
const globalDatabase = globalThis as typeof globalThis & {
  __tpadMysqlPool?: Pool;
  __tpadDatabase?: Database;
};

let pool = globalDatabase.__tpadMysqlPool;
let database = globalDatabase.__tpadDatabase;

export function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not configured");
    pool = mysql.createPool({
      uri: url,
      connectionLimit: 10,
      enableKeepAlive: true,
      timezone: "+07:00",
    });
    if (process.env.NODE_ENV !== "production") globalDatabase.__tpadMysqlPool = pool;
  }
  return pool;
}

export function getDb() {
  if (!database) {
    database = drizzle(getPool(), { schema, mode: "default" });
    if (process.env.NODE_ENV !== "production") globalDatabase.__tpadDatabase = database;
  }
  return database;
}
