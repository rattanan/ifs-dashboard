import { describe, expect, it } from "vitest";
import { getMetricsForDashboard } from "../lib/dashboard/catalog";

describe("maintenance dashboard", () => {
  it("registers every requested repair-planning data set", () => {
    const metrics = getMetricsForDashboard("maintenance");
    expect(metrics).toHaveLength(15);
    expect(metrics.map((metric) => metric.id)).toEqual([
      "maintenance.aircraft-list",
      "maintenance.wo-work-type",
      "maintenance.wo-by-aircraft",
      "maintenance.wo-status",
      "maintenance.fault-report",
      "maintenance.wo-packages",
      "maintenance.grounded-list",
      "maintenance.pm-calendar",
      "maintenance.mmr-planned",
      "maintenance.mmr-released",
      "maintenance.pm-500-hours",
      "maintenance.new-part-update",
      "maintenance.component-life",
      "maintenance.component-midlife",
      "maintenance.component-calendar-due",
    ]);
  });

  it("uses the requested IFS sources and aggregation fields", () => {
    const metrics = getMetricsForDashboard("maintenance");
    const sql = Object.fromEntries(metrics.map((metric) => [metric.id, metric.sql]));
    expect(sql["maintenance.aircraft-list"]).toContain("EQUIPMENT_FUNCTIONAL_CFV");
    expect(sql["maintenance.wo-by-aircraft"]).toContain("GROUP BY MCH_CODE, WORK_TYPE_ID");
    expect(sql["maintenance.grounded-list"]).toContain("EQUIP_OBJECT_MEAS_GROUP_CFV");
    expect(sql["maintenance.mmr-planned"]).toContain("MAINT_MATERIAL_REQUISITION_UIV");
    expect(sql["maintenance.new-part-update"]).toContain("PART_SERIAL_CATALOG_CFV");
    expect(sql["maintenance.component-life"]).toContain("EQUIPMENT_SERIAL_UIV_CFV");
  });
});
