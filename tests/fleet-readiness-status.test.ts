import { describe, expect, it } from "vitest";
import { normalizeFleetStatus, normalizeFlightHours } from "../lib/dashboard/fleet-readiness-data";

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
});

describe("normalizeFlightHours", () => {
  it("keeps TSN values and distinguishes missing data from zero", () => {
    expect(normalizeFlightHours(2000)).toBe(2000);
    expect(normalizeFlightHours("5819")).toBe(5819);
    expect(normalizeFlightHours(null)).toBeNull();
    expect(normalizeFlightHours("")).toBeNull();
  });
});
