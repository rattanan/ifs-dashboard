import { getMetric } from "@/lib/dashboard/catalog";
import type { DashboardFilters, MetricDefinition } from "@/lib/dashboard/types";

export type ChatPlanId =
  | "maintenance-overview"
  | "maintenance-causes"
  | "inventory-risks"
  | "procurement-linkage"
  | "executive-actions"
  | "single-card";

export interface ChatPlan {
  id: ChatPlanId;
  metricIds: string[];
  objective: string;
}

const plans: Record<Exclude<ChatPlanId, "single-card">, ChatPlan> = {
  "maintenance-overview": {
    id: "maintenance-overview",
    metricIds: [
      "maintenance.wo-status",
      "maintenance.wo-work-type",
      "maintenance.wo-by-aircraft",
      "maintenance.grounded-list",
    ],
    objective: "สรุปสถานการณ์งานซ่อม สถานะงาน backlog ประเภทงาน และจุดผิดปกติที่ควรจับตา",
  },
  "maintenance-causes": {
    id: "maintenance-causes",
    metricIds: [
      "maintenance.wo-status",
      "maintenance.wo-work-type",
      "maintenance.wo-by-aircraft",
      "inventory.mmr-warehouse",
      "inventory.low-stock",
    ],
    objective: "วิเคราะห์สาเหตุของงานค้างจากสถานะงาน ประเภทงาน อากาศยาน และข้อจำกัดด้านอะไหล่",
  },
  "inventory-risks": {
    id: "inventory-risks",
    metricIds: [
      "inventory.low-stock",
      "inventory.mr-status",
      "inventory.mr-lines",
      "inventory.incoming",
    ],
    objective: "ชี้ปัญหาอะไหล่ขาด อะไหล่ต่ำกว่าจุดสั่งซื้อ ใบเบิกค้าง และของที่กำลังรับเข้าคลัง",
  },
  "procurement-linkage": {
    id: "procurement-linkage",
    metricIds: [
      "inventory.low-stock",
      "inventory.mr-lines",
      "procurement.po-lines",
      "procurement.pr-approval-status",
      "procurement.po-status",
      "procurement.overdue",
    ],
    objective: "เชื่อม Part No ที่มีความเสี่ยงกับ MR, PR และ PO ที่กำลังดำเนินการ โดยยืนยันความสัมพันธ์จากรหัส Part No เท่านั้น",
  },
  "executive-actions": {
    id: "executive-actions",
    metricIds: [
      "maintenance.wo-status",
      "maintenance.wo-work-type",
      "inventory.low-stock",
      "inventory.mr-lines",
      "procurement.po-lines",
      "procurement.pr-approval-status",
      "procurement.overdue",
    ],
    objective: "สรุป Executive Action ที่ลงมือได้ทันที พร้อมจำนวนรายการ เหตุผล และลำดับความสำคัญจากข้อมูลจริง",
  },
};

const singleCardIntents = [
  { terms: ["อากาศยาน", "aircraft", "ความพร้อม"], metricId: "fleet-readiness.status-summary" },
  { terms: ["work order", "wo"], metricId: "maintenance.wo-status" },
  { terms: ["mmr"], metricId: "maintenance.mmr-planned" },
  { terms: ["pm", "บำรุงรักษา"], metricId: "maintenance.pm-calendar" },
  { terms: ["component", "ชิ้นส่วนใกล้ครบ"], metricId: "maintenance.component-life" },
  { terms: ["งบ", "budget", "ใช้จ่าย", "คงเหลือ"], metricId: "budget.summary" },
  { terms: ["invoice", "ใบแจ้งหนี้"], metricId: "budget.overdue-invoices" },
  { terms: ["คลัง", "inventory", "mr line", "เบิก"], metricId: "inventory.mr-status" },
  { terms: ["หมดอายุ", "expiry"], metricId: "inventory.expiring" },
  { terms: ["ต่ำกว่าจุดสั่งซื้อ", "order point", "low stock"], metricId: "inventory.low-stock" },
  { terms: ["rfq", "ใบเสนอราคา"], metricId: "procurement.rfq-status" },
  { terms: ["supplier", "ผู้ขาย", "ส่งมอบ"], metricId: "procurement.delivery-rate" },
  { terms: ["purchase order", "po", "จัดซื้อ"], metricId: "procurement.po-status" },
] as const;

const defaultMetricId = "fleet-readiness.status-summary";

function includesAny(value: string, terms: readonly string[]) {
  return terms.some((term) => value.includes(term));
}

function singleCardPlan(metricId: string): ChatPlan {
  return { id: "single-card", metricIds: [metricId], objective: "ตอบคำถามจาก Card ที่เกี่ยวข้องโดยตรง" };
}

export function planQuestion(question: string, previousMetricIds: string[] = []): ChatPlan {
  const normalized = question.toLocaleLowerCase("th-TH");

  if (includesAny(normalized, ["ควรสั่งการ", "ควรทำอะไร", "action", "สรุปให้หน่อย"])) {
    return plans["executive-actions"];
  }
  if (includesAny(normalized, ["po", "purchase order", "pr", "กำลังซื้อ", "จัดซื้อ"]) &&
      includesAny(normalized, ["พวกนี้", "อะไหล่", "ชิ้นส่วน", "มี po", "มี pr"])) {
    return plans["procurement-linkage"];
  }
  if (includesAny(normalized, ["อะไหล่", "ชิ้นส่วน", "stock", "สต็อก"]) &&
      includesAny(normalized, ["ปัญหา", "ขาด", "ต่ำ", "ไม่มี", "เสี่ยง"])) {
    return plans["inventory-risks"];
  }
  if (includesAny(normalized, ["ทำไม", "สาเหตุ"]) && includesAny(normalized, ["งานค้าง", "backlog", "งานซ่อม"])) {
    return plans["maintenance-causes"];
  }
  if (includesAny(normalized, ["งานซ่อม", "maintenance"]) &&
      includesAny(normalized, ["สถานการณ์", "ภาพรวม", "เป็นอย่างไร", "ตอนนี้"])) {
    return plans["maintenance-overview"];
  }

  const isContextualFollowUp = includesAny(normalized, ["แล้ว", "พวกนี้", "เรื่องนี้", "ทำไม", "สรุป"]);
  if (isContextualFollowUp && previousMetricIds.some((id) => id.startsWith("procurement."))) {
    return plans["executive-actions"];
  }
  if (isContextualFollowUp && previousMetricIds.some((id) => id.startsWith("inventory."))) {
    return plans["procurement-linkage"];
  }
  if (isContextualFollowUp && previousMetricIds.some((id) => id.startsWith("maintenance."))) {
    return plans["maintenance-causes"];
  }

  const match = singleCardIntents.find((intent) => intent.terms.some((term) =>
    term === "po" ? /\bpo\b/.test(normalized) : normalized.includes(term),
  ));
  return singleCardPlan(match?.metricId ?? defaultMetricId);
}

export function resolvePlanMetrics(plan: ChatPlan): MetricDefinition[] {
  return plan.metricIds.map((metricId) => {
    const metric = getMetric(metricId);
    if (!metric) throw new Error(`ตั้งค่า Chat bot ไม่ถูกต้อง: ไม่พบ Card ${metricId}`);
    return metric;
  });
}

export function mapQuestionToIntent(question: string) {
  return resolvePlanMetrics(planQuestion(question))[0];
}

export function extractFilters(question: string, defaults?: Partial<DashboardFilters>): DashboardFilters {
  const upper = question.toUpperCase();
  const site = upper.includes("T101") ? "T101" : upper.includes("T10") ? "T10" : defaults?.site ?? "T10";
  const projectId = upper.match(/\bB\d{3,8}\b/)?.[0] ?? defaults?.projectId;
  return { site, projectId, fiscalYear: defaults?.fiscalYear, buyer: defaults?.buyer, supplier: defaults?.supplier };
}
