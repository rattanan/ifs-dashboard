import { getMetric } from "@/lib/dashboard/catalog";
import type { DashboardFilters } from "@/lib/dashboard/types";

const intents = [
  { terms: ["อากาศยาน", "aircraft", "ความพร้อม"], metricId: "maintenance.aircraft-status" },
  { terms: ["work order", "wo", "งานซ่อม"], metricId: "maintenance.wo-status" },
  { terms: ["mmr"], metricId: "maintenance.mmr-status" },
  { terms: ["pm", "บำรุงรักษา"], metricId: "maintenance.pm-six-months" },
  { terms: ["component", "ชิ้นส่วนใกล้ครบ"], metricId: "maintenance.component-life" },
  { terms: ["งบ", "budget", "ใช้จ่าย", "คงเหลือ"], metricId: "budget.summary" },
  { terms: ["invoice", "ใบแจ้งหนี้"], metricId: "budget.overdue-invoices" },
  { terms: ["คลัง", "inventory", "mr line", "เบิก"], metricId: "inventory.mr-status" },
  { terms: ["หมดอายุ", "expiry"], metricId: "inventory.expiring" },
  { terms: ["ต่ำกว่าจุดสั่งซื้อ", "order point", "low stock"], metricId: "inventory.low-stock" },
  { terms: ["rfq", "ใบเสนอราคา"], metricId: "procurement.rfq-status" },
  { terms: ["supplier", "ผู้ขาย", "ส่งมอบ"], metricId: "procurement.supplier-delivery" },
  { terms: ["purchase order", "po", "จัดซื้อ"], metricId: "procurement.po-status" },
] as const;

export function mapQuestionToIntent(question: string) {
  const normalized = question.toLocaleLowerCase("th-TH");
  const match = intents.find((intent) => intent.terms.some((term) => normalized.includes(term)));
  return getMetric(match?.metricId ?? "maintenance.aircraft-status")!;
}

export function extractFilters(question: string, defaults?: Partial<DashboardFilters>): DashboardFilters {
  const upper = question.toUpperCase();
  const site = upper.includes("T101") ? "T101" : upper.includes("T10") ? "T10" : defaults?.site ?? "T10";
  const projectId = upper.match(/\bB\d{3,8}\b/)?.[0] ?? defaults?.projectId;
  return { site, projectId, fiscalYear: defaults?.fiscalYear, buyer: defaults?.buyer, supplier: defaults?.supplier };
}

