import { describe, expect, it } from "vitest";
import { buildDemoAvailabilityTrend, normalizeFleetStatus, normalizeFlightHours } from "../lib/dashboard/fleet-readiness-data";

describe("normalizeFleetStatus", () => {
  it("maps the Thai statuses used by Oracle IFSAPP", () => {
    expect(normalizeFleetStatus("ใช้งานได้")).toBe("ready");
    expect(normalizeFleetStatus("ใช้งานไม่ได้")).toBe("grounded");
    expect(normalizeFleetStatus("ใช้ราชการไม่ได้")).toBe("grounded");
  });

  it("does not treat blank or unfamiliar statuses as ready", () => {
    expect(normalizeFleetStatus(null)).toBe("unknown");
    expect(normalizeFleetStatus("สถานะใหม่จากต้นทาง")).toBe("unknown");
  });

  it("prioritizes specific maintenance conditions over a generic unavailable status", () => {
    expect(normalizeFleetStatus("รออะไหล่ ใช้งานไม่ได้")).toBe("parts");
    expect(normalizeFleetStatus("อยู่ระหว่างซ่อมบำรุง Grounded")).toBe("maintenance");
  });
});

describe("normalizeFlightHours", () => {
  it("keeps TSN values and distinguishes missing data from zero", () => {
    expect(normalizeFlightHours(2000)).toBe(2000);
    expect(normalizeFlightHours("5819")).toBe(5819);
    expect(normalizeFlightHours(null)).toBeNull();
    expect(normalizeFlightHours("")).toBeNull();
  });
});

describe("buildDemoAvailabilityTrend", () => {
  it("creates six bounded monthly points and preserves the current Oracle value as the last point", () => {
    const trend = buildDemoAvailabilityTrend(64.5, "2026-08-08T12:00:00.000Z");

    expect(trend).toHaveLength(6);
    expect(trend.at(-1)?.value).toBe(64.5);
    expect(new Set(trend.map((point) => point.label))).toHaveLength(6);
    expect(trend.every((point) => point.value >= 0 && point.value <= 100)).toBe(true);
  });
});
