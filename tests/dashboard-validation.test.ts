import { describe, expect, it } from "vitest";
import { parseFilters } from "../lib/dashboard/validation";

describe("dashboard filters", () => {
  it("defaults to T10", () => expect(parseFilters({})).toEqual({ site: "T10" }));
  it("accepts the two approved sites", () => expect(parseFilters({ site: "T101", projectId: "B6201" })).toMatchObject({ site: "T101", projectId: "B6201" }));
  it("rejects unknown sites and oversized input", () => {
    expect(() => parseFilters({ site: "A0" })).toThrow();
    expect(() => parseFilters({ site: "T10", buyer: "x".repeat(41) })).toThrow();
  });
});

