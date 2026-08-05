import "server-only";

import { loadMetricById } from "./service";
import type { DashboardFilters, DashboardSlug, MetricResult } from "./types";

export type HomeHighlightMetric = {
  label: string;
  value: number | string | null;
  unit?: string;
};

export type HomeDashboardHighlight = {
  dashboard: DashboardSlug;
  metrics: HomeHighlightMetric[];
  note?: HomeHighlightMetric;
  insight: string;
  stale: boolean;
  hasError: boolean;
  generatedAt: string;
};

type HighlightConfig = {
  dashboard: DashboardSlug;
  filters: DashboardFilters;
  metricIds: string[];
};

const configs: HighlightConfig[] = [
  { dashboard: "summary", filters: { site: "T10", projectId: "B6800" }, metricIds: ["summary.budget", "summary.aircraft-readiness"] },
  { dashboard: "maintenance", filters: { site: "T10" }, metricIds: ["maintenance.wo-status", "maintenance.grounded-list"] },
  { dashboard: "budget", filters: { site: "T10" }, metricIds: ["budget.summary", "budget.utilization"] },
  { dashboard: "inventory", filters: { site: "T10" }, metricIds: ["inventory.mr-status", "inventory.po-receipt"] },
  { dashboard: "procurement", filters: { site: "T10" }, metricIds: ["procurement.rfq-status", "procurement.po-status"] },
];

function numeric(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function summaryValue(metric: MetricResult | undefined, key: string) {
  if (!metric?.summary) return null;
  return metric.summary[key] ?? null;
}

function seriesTotal(metric: MetricResult | undefined) {
  if (!metric) return null;
  if (metric.error && !metric.series) return null;
  return (metric.series ?? []).reduce((total, row) => total + numeric(row.value), 0);
}

function rowCount(metric: MetricResult | undefined) {
  if (!metric) return null;
  if (metric.error && !metric.rows) return null;
  return metric.rows?.length ?? 0;
}

function readyAircraftCount(metric: MetricResult | undefined) {
  if (!metric) return null;
  if (metric.error && !metric.rows) return null;
  return (metric.rows ?? []).reduce((total, row) => {
    const status = String(row.status ?? "").trim().toLowerCase();
    const unavailable = status.includes("ไม่ได้") || /(unavailable|not available|grounded|unserviceable)/.test(status);
    return total + (unavailable ? 0 : numeric(row.value));
  }, 0);
}

function latestDate(metrics: MetricResult[]) {
  return metrics.reduce((latest, metric) => {
    return new Date(metric.generatedAt).getTime() > new Date(latest).getTime() ? metric.generatedAt : latest;
  }, new Date(0).toISOString());
}

function insightNumber(value: number | string | null | undefined, unit = "") {
  if (value === null || value === undefined || value === "") return "ยังไม่มีข้อมูล";
  const number = Number(value);
  const formatted = Number.isFinite(number)
    ? new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(number)
    : String(value);
  return `${formatted}${unit ? ` ${unit}` : ""}`;
}

function buildBusinessInsight(
  dashboard: DashboardSlug,
  highlights: HomeHighlightMetric[],
  note: HomeHighlightMetric | undefined,
  hasError: boolean,
  stale: boolean,
) {
  if (hasError) return "ข้อมูลบาง metric ยังโหลดไม่ครบ ควรเปิด Dashboard เพื่อตรวจสอบก่อนใช้ประกอบการตัดสินใจ";
  const prefix = stale ? "วิเคราะห์จากข้อมูลสำรองล่าสุด: " : "";
  switch (dashboard) {
    case "summary":
      return `${prefix}งบประมาณปีนี้ ${insightNumber(highlights[0]?.value, highlights[0]?.unit)} และมีอากาศยานพร้อมใช้ ${insightNumber(highlights[1]?.value, highlights[1]?.unit)} ควรติดตามความพร้อมควบคู่กับอัตราเบิกจ่าย`;
    case "maintenance": {
      const grounded = numeric(highlights[1]?.value);
      return grounded > 0
        ? `${prefix}พบอากาศยานหยุดบินเกิน 7 วัน ${insightNumber(grounded, "ลำ")} ขณะมี WO เปิด ${insightNumber(highlights[0]?.value, "รายการ")} ควรเร่งจัดลำดับงานซ่อม`
        : `${prefix}ไม่พบอากาศยานหยุดบินเกิน 7 วัน และมี WO เปิด ${insightNumber(highlights[0]?.value, "รายการ")}`;
    }
    case "budget": {
      const utilization = numeric(note?.value);
      const signal = utilization < 30 ? "อัตราเบิกจ่ายยังต่ำ ควรตรวจสอบแผนการใช้จ่าย" : utilization > 80 ? "อัตราใช้จ่ายอยู่ในระดับสูง ควรเฝ้าระวังงบคงเหลือ" : "อัตราใช้จ่ายอยู่ในช่วงติดตามตามแผน";
      return `${prefix}ใช้จ่ายจริง ${insightNumber(highlights[1]?.value, "บาท")} จากงบรวม ${insightNumber(highlights[0]?.value, "บาท")} หรือ ${insightNumber(note?.value, "%")} — ${signal}`;
    }
    case "inventory":
      return `${prefix}มี MR รอคลัง ${insightNumber(highlights[0]?.value, "รายการ")} และ PO รอตรวจรับ ${insightNumber(highlights[1]?.value, "รายการ")} ควรจัดลำดับรายการที่กระทบงานซ่อมก่อน`;
    case "procurement":
      return `${prefix}มี RFQ เปิดอยู่ ${insightNumber(highlights[0]?.value, "รายการ")} และ PO เปิดอยู่ ${insightNumber(highlights[1]?.value, "รายการ")} ควรติดตามรายการเกินกำหนดและความพร้อมของ Supplier`;
  }
}

function buildHighlights(dashboard: DashboardSlug, metrics: MetricResult[]): HomeDashboardHighlight {
  const byId = new Map(metrics.map((metric) => [metric.metricId, metric]));
  const get = (id: string) => byId.get(id);
  let highlights: HomeHighlightMetric[];
  let note: HomeHighlightMetric | undefined;

  switch (dashboard) {
    case "summary": {
      const budget = get("summary.budget");
      highlights = [
        { label: "งบประมาณปีนี้", value: summaryValue(budget, "estimated"), unit: "บาท" },
        { label: "อากาศยานพร้อมใช้", value: readyAircraftCount(get("summary.aircraft-readiness")), unit: "ลำ" },
      ];
      break;
    }
    case "maintenance":
      highlights = [
        { label: "WO ที่เปิดอยู่", value: seriesTotal(get("maintenance.wo-status")), unit: "รายการ" },
        { label: "หยุดบินเกิน 7 วัน", value: rowCount(get("maintenance.grounded-list")), unit: "ลำ" },
      ];
      break;
    case "budget": {
      const summary = get("budget.summary");
      highlights = [
        { label: "งบประมาณรวม", value: summaryValue(summary, "budget"), unit: "บาท" },
        { label: "ใช้จริง", value: summaryValue(summary, "actual"), unit: "บาท" },
      ];
      note = { label: "สัดส่วนการใช้จ่าย", value: summaryValue(get("budget.utilization"), "value"), unit: "%" };
      break;
    }
    case "inventory":
      highlights = [
        { label: "MR line รอคลัง", value: seriesTotal(get("inventory.mr-status")), unit: "รายการ" },
        { label: "PO รอตรวจรับ", value: seriesTotal(get("inventory.po-receipt")), unit: "รายการ" },
      ];
      break;
    case "procurement":
      highlights = [
        { label: "RFQ ที่เปิดอยู่", value: seriesTotal(get("procurement.rfq-status")), unit: "รายการ" },
        { label: "PO ที่เปิดอยู่", value: seriesTotal(get("procurement.po-status")), unit: "รายการ" },
      ];
      break;
  }

  const hasError = metrics.some((metric) => Boolean(metric.error));
  const stale = metrics.some((metric) => metric.stale);
  return {
    dashboard,
    metrics: highlights,
    note,
    insight: buildBusinessInsight(dashboard, highlights, note, hasError, stale),
    stale,
    hasError,
    generatedAt: latestDate(metrics),
  };
}

export async function loadHomeDashboardHighlights() {
  return Promise.all(
    configs.map(async ({ dashboard, filters, metricIds }) => {
      const metrics = await Promise.all(metricIds.map((metricId) => loadMetricById(metricId, filters)));
      return buildHighlights(dashboard, metrics);
    }),
  );
}
