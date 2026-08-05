import { describe, expect, it } from "vitest";
import { getContentParagraphs, normalizeContentBody } from "./content-body";

describe("content body normalization", () => {
  it("reads the canonical paragraphs object", () => {
    expect(getContentParagraphs({ paragraphs: ["ย่อหน้าแรก", "ย่อหน้าที่สอง"] })).toEqual([
      "ย่อหน้าแรก",
      "ย่อหน้าที่สอง",
    ]);
  });

  it("parses JSON strings returned from the longtext-backed column", () => {
    expect(getContentParagraphs('{"paragraphs":["ย่อหน้าแรก"]}')).toEqual(["ย่อหน้าแรก"]);
  });

  it("keeps legacy arrays readable and ignores invalid values", () => {
    expect(normalizeContentBody(["ย่อหน้าแรก", 42, "", "ย่อหน้าที่สอง"])).toEqual({
      paragraphs: ["ย่อหน้าแรก", "ย่อหน้าที่สอง"],
    });
  });

  it("returns an empty body instead of throwing for malformed data", () => {
    expect(getContentParagraphs({ title: "ไม่มีเนื้อหา" })).toEqual([]);
  });
});
