import { describe, expect, it } from "vitest";
import { metricCatalog } from "../lib/dashboard/catalog";
import { assertReadOnlySql, pickQueryBinds } from "../lib/dashboard/sql-guard";

describe("Oracle SQL guard", () => {
  it("accepts every static catalog query", () => {
    for (const metric of metricCatalog) expect(assertReadOnlySql(metric.sql)).toBe(metric.sql.trim());
  });

  it.each(["DELETE FROM users", "BEGIN NULL END", "SELECT * FROM x;", "SELECT * FROM x -- comment", "WITH x AS (SELECT 1 a FROM dual) UPDATE y SET a=1"])("rejects prohibited SQL: %s", (sql) => {
    expect(() => assertReadOnlySql(sql)).toThrow();
  });

  it("only picks named binds declared by a fixed query", () => {
    expect(pickQueryBinds("SELECT * FROM x WHERE site=:site AND buyer=:buyer", { site: "T10", buyer: "A", ignored: "unsafe" })).toEqual({ site: "T10", buyer: "A" });
  });
});

