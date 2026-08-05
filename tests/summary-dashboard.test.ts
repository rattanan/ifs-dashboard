import { describe, expect, it } from "vitest";
import { dashboardSlugs, getMetricsForDashboard } from "../lib/dashboard/catalog";

describe("summary dashboard", () => {
  it("registers the Summary route and speaker-note metric set", () => {
    expect(dashboardSlugs).toContain("summary");

    const metrics = getMetricsForDashboard("summary");
    expect(metrics).toHaveLength(8);
    expect(metrics.map((metric) => metric.id)).toEqual([
      "summary.budget",
      "summary.budget-by-project",
      "summary.aircraft-status",
      "summary.aircraft-list",
      "summary.wo-by-aircraft",
      "summary.wo-status",
      "summary.wo-packages",
      "summary.grounded-aircraft",
    ]);

    expect(metrics.find((metric) => metric.id === "summary.aircraft-list")?.sql).toContain(
      "EQUIPMENT_FUNCTIONAL_CFV",
    );
    expect(metrics.find((metric) => metric.id === "summary.wo-by-aircraft")?.sql).toContain(
      "ACTIVE_SEPARATE_OVERVIEW",
    );
    expect(metrics.find((metric) => metric.id === "summary.wo-packages")?.sql).toContain(
      "ACTIVE_SEPARATE_ELS_VIEW",
    );
    expect(metrics.find((metric) => metric.id === "summary.grounded-aircraft")?.sql).toContain(
      "EQUIP_OBJECT_MEAS_GROUP_CFV",
    );
  });
});
