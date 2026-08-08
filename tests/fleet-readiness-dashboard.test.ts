import { describe, expect, it } from "vitest";
import { getMetricsForDashboard, dashboardSlugs } from "../lib/dashboard/catalog";
import { fleetReadinessSeed } from "../lib/dashboard/fleet-readiness-data";
import { buildFleetReadinessSeedMetric } from "../lib/dashboard/fleet-readiness-metrics";

describe("fleet readiness dashboard", () => {
  it("registers the route and all visual data sources", () => {
    expect(dashboardSlugs).toContain("fleet-readiness");
    expect(getMetricsForDashboard("fleet-readiness").map((metric) => metric.id)).toEqual([
      "fleet-readiness.aircraft-list",
      "fleet-readiness.status-summary",
      "fleet-readiness.availability-trend",
      "fleet-readiness.kpis",
      "fleet-readiness.unit-availability",
    ]);
  });

  it("builds seed metrics with the same card and chart contracts as Oracle metrics", () => {
    const filters = { site: "T10" as const };
    const metrics = getMetricsForDashboard("fleet-readiness")
      .map((definition) => buildFleetReadinessSeedMetric(definition, filters, fleetReadinessSeed))
      .filter((metric) => Boolean(metric));

    expect(metrics).toHaveLength(5);
    expect(metrics.find((metric) => metric?.metricId === "fleet-readiness.availability-trend")?.series).toHaveLength(6);
    expect(metrics.find((metric) => metric?.metricId === "fleet-readiness.kpis")?.summary?.MTBF).toBe(320.5);
    expect(metrics.find((metric) => metric?.metricId === "fleet-readiness.aircraft-list")?.rows).toHaveLength(10);
  });

  it("calculates unit availability from Thai Oracle statuses", () => {
    const sql = getMetricsForDashboard("fleet-readiness")
      .find((metric) => metric.id === "fleet-readiness.unit-availability")?.sql;

    expect(sql).toContain("'ใช้งานได้'");
    expect(sql).toContain('AS "rate"');
  });

  it("reads accumulated flight hours from the TSN equipment parameter", () => {
    const metrics = getMetricsForDashboard("fleet-readiness");
    const aircraftSql = metrics.find((metric) => metric.id === "fleet-readiness.aircraft-list")?.sql;
    const kpiSql = metrics.find((metric) => metric.id === "fleet-readiness.kpis")?.sql;

    for (const sql of [aircraftSql, kpiSql]) {
      expect(sql).toContain("EQUIP_OBJ_PARAM");
      expect(sql).toContain("TEST_POINT_ID = 'TSN'");
      expect(sql).toContain("PARAMETER_CODE = 'TSN'");
      expect(sql).toContain("tsn.LAST_VALUE");
      expect(sql).not.toContain("CF$_C_TSN");
    }
  });

  it("loads all aircraft for the sortable paginated table", () => {
    const sql = getMetricsForDashboard("fleet-readiness")
      .find((metric) => metric.id === "fleet-readiness.aircraft-list")?.sql;

    expect(sql).toContain('a.GROUP_ID AS "groupId"');
    expect(sql).not.toContain("a.MCH_NAME");
    expect(sql).toContain("ORDER BY tsn.LAST_VALUE DESC NULLS LAST, a.MCH_CODE");
    expect(sql).not.toContain("FETCH FIRST");
  });

  it("groups the readiness summary by both status and condition", () => {
    const sql = getMetricsForDashboard("fleet-readiness")
      .find((metric) => metric.id === "fleet-readiness.status-summary")?.sql;

    expect(sql).toContain('CF$_C_CONDITION AS "condition"');
    expect(sql).toContain("GROUP BY TYPE, CF$_C_STATUS, CF$_C_CONDITION");
  });
});
