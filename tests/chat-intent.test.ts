import { describe, expect, it } from "vitest";
import { extractFilters, mapQuestionToIntent, planQuestion, resolvePlanMetrics } from "../lib/chat/intent";

describe("chat intent mapping", () => {
  it.each([
    ["สถานะอากาศยาน T10", "fleet-readiness.status-summary"],
    ["สถานะ work order", "maintenance.wo-status"],
    ["รายการ MMR", "maintenance.mmr-planned"],
    ["แผน PM หกเดือน", "maintenance.pm-calendar"],
    ["component ใกล้ครบกำหนด", "maintenance.component-life"],
    ["งบโครงการ B6201 คงเหลือเท่าไร", "budget.summary"],
    ["invoice เกินกำหนด", "budget.overdue-invoices"],
    ["สถานะคลัง", "inventory.mr-status"],
    ["พัสดุหมดอายุ", "inventory.expiring"],
    ["สินค้าต่ำกว่าจุดสั่งซื้อ", "inventory.low-stock"],
    ["สถานะ RFQ", "procurement.rfq-status"],
    ["อัตราส่งมอบของผู้ขาย", "procurement.delivery-rate"],
    ["สถานะ purchase order", "procurement.po-status"],
    ["สถานะ PO", "procurement.po-status"],
  ])("maps %s to %s", (question, metricId) => {
    expect(mapQuestionToIntent(question).id).toBe(metricId);
  });

  it("uses fleet readiness as the safe default", () => {
    expect(mapQuestionToIntent("ขอข้อมูลภาพรวม").id).toBe("fleet-readiness.status-summary");
  });

  it("extracts only approved filters", () => expect(extractFilters("สถานะอากาศยาน T101 โครงการ B6201")).toMatchObject({ site: "T101", projectId: "B6201" }));
});

describe("executive conversation scenario", () => {
  it.each([
    ["ตอนนี้งานซ่อมมีสถานการณ์เป็นอย่างไรบ้าง", "maintenance-overview"],
    ["ทำไมงานค้างถึงเยอะ?", "maintenance-causes"],
    ["เรื่องอะไหล่มีปัญหาอะไรบ้าง?", "inventory-risks"],
    ["แล้วมี PO ที่กำลังซื้อของพวกนี้อยู่หรือเปล่า?", "procurement-linkage"],
    ["สรุปให้หน่อยว่าผมควรสั่งการอะไร", "executive-actions"],
  ])("plans %s as %s", (question, planId) => {
    const plan = planQuestion(question);
    expect(plan.id).toBe(planId);
    expect(resolvePlanMetrics(plan)).toHaveLength(plan.metricIds.length);
  });

  it("uses previous inventory context for an ambiguous follow-up", () => {
    expect(planQuestion("แล้วเรื่องนี้ไปถึงไหนแล้ว?", ["inventory.low-stock"]).id).toBe("procurement-linkage");
  });

  it("keeps the site filter across follow-up questions", () => {
    expect(extractFilters("แล้วมี PO หรือยัง?", { site: "T101" }).site).toBe("T101");
  });
});
