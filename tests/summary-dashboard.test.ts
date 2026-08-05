import { describe, expect, it } from "vitest";
import { dashboardSlugs, getMetricsForDashboard } from "../lib/dashboard/catalog";

describe("summary dashboard", () => {
  it("registers the Summary route and speaker-note metric set", () => {
    expect(dashboardSlugs).toContain("summary");

    const metrics = getMetricsForDashboard("summary");
    expect(metrics).toHaveLength(5);
    expect(metrics.map((metric) => metric.id)).toEqual([
      "summary.budget",
      "summary.aircraft-readiness",
      "summary.aircraft-condition",
      "summary.aircraft-list",
      "summary.pr-status",
    ]);

    expect(metrics.find((metric) => metric.id === "summary.budget")?.sql).toContain(
      "PROJ_CON_DET_SUM_COST_PROJECT",
    );
    expect(metrics.find((metric) => metric.id === "summary.aircraft-list")?.sql).toContain(
      "EQUIPMENT_FUNCTIONAL_UIV_CFV",
    );
    expect(metrics.find((metric) => metric.id === "summary.pr-status")?.sql).toContain(
      "C_APPROVAL_PUR",
    );
  });
});
