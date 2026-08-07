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
});
