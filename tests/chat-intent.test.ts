import { describe, expect, it } from "vitest";
import { extractFilters, mapQuestionToIntent } from "../lib/chat/intent";

describe("chat intent mapping", () => {
  it("maps Thai questions to a fixed metric", () => expect(mapQuestionToIntent("งบโครงการ B6201 คงเหลือเท่าไร").id).toBe("budget.summary"));
  it("extracts only approved filters", () => expect(extractFilters("สถานะอากาศยาน T101 โครงการ B6201")).toMatchObject({ site: "T101", projectId: "B6201" }));
});
