"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { EChartsOption } from "echarts";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CalendarDays,
  Clock3,
  Database,
  Gauge,
  LayoutDashboard,
  PackageCheck,
  Plane,
  RefreshCw,
  ShoppingCart,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EChart } from "@/components/echart";
import { FleetReadinessDashboard } from "@/components/fleet-readiness-dashboard";
import { MaintenanceDashboard } from "@/components/maintenance-dashboard";
import { SummaryDashboard } from "@/components/summary-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DashboardFilters, DashboardResult, DashboardSlug, MetricResult } from "@/lib/dashboard/types";
import { formatDateTime, formatNumber } from "@/lib/utils";

type ToneKey = "cyan" | "blue" | "green" | "lime" | "purple" | "magenta" | "teal" | "slate";

type Tone = {
  bg: string;
  border: string;
  fg: string;
  muted: string;
  accent: string;
  soft: string;
  palette: string[];
};

const tones: Record<ToneKey, Tone> = {
  cyan: { bg: "#ffffff", border: "#dbeafe", fg: "#17346b", muted: "#64748b", accent: "#0d9dc7", soft: "#ecfeff", palette: ["#0d9dc7", "#1675dc", "#8d3b91", "#279532", "#f59e0b"] },
  blue: { bg: "#ffffff", border: "#dbeafe", fg: "#17346b", muted: "#64748b", accent: "#1675dc", soft: "#eff6ff", palette: ["#1675dc", "#0d9dc7", "#8d3b91", "#279532", "#f59e0b"] },
  green: { bg: "#ffffff", border: "#dcfce7", fg: "#17346b", muted: "#64748b", accent: "#279532", soft: "#f0fdf4", palette: ["#279532", "#0d9dc7", "#8d3b91", "#1675dc", "#f59e0b"] },
  lime: { bg: "#ffffff", border: "#ecfccb", fg: "#17346b", muted: "#64748b", accent: "#84a72c", soft: "#f7fee7", palette: ["#84a72c", "#279532", "#0d9dc7", "#8d3b91", "#f59e0b"] },
  purple: { bg: "#ffffff", border: "#ede9fe", fg: "#17346b", muted: "#64748b", accent: "#8d3b91", soft: "#faf5ff", palette: ["#8d3b91", "#1675dc", "#c6006f", "#0d9dc7", "#279532"] },
  magenta: { bg: "#ffffff", border: "#fce7f3", fg: "#17346b", muted: "#64748b", accent: "#c6006f", soft: "#fdf2f8", palette: ["#c6006f", "#8d3b91", "#1675dc", "#0d9dc7", "#279532"] },
  teal: { bg: "#ffffff", border: "#cffafe", fg: "#17346b", muted: "#64748b", accent: "#0d9dc7", soft: "#ecfeff", palette: ["#0d9dc7", "#279532", "#1675dc", "#8d3b91", "#f59e0b"] },
  slate: { bg: "#ffffff", border: "#e2e8f0", fg: "#17346b", muted: "#64748b", accent: "#475569", soft: "#f8fafc", palette: ["#475569", "#1675dc", "#8d3b91", "#0d9dc7", "#279532"] },
};

const themes: Record<DashboardSlug, { accent: string; icon: string; Icon: LucideIcon; defaultTone: ToneKey }> = {
  summary: { accent: "#8d3b91", icon: "bg-[#8d3b91]", Icon: LayoutDashboard, defaultTone: "purple" },
  "fleet-readiness": { accent: "#1675dc", icon: "bg-[#1675dc]", Icon: Plane, defaultTone: "blue" },
  maintenance: { accent: "#087fb5", icon: "bg-[#087fb5]", Icon: Wrench, defaultTone: "cyan" },
  budget: { accent: "#8d3b91", icon: "bg-[#8d3b91]", Icon: Gauge, defaultTone: "magenta" },
  inventory: { accent: "#279532", icon: "bg-[#279532]", Icon: Boxes, defaultTone: "green" },
  procurement: { accent: "#0d9dc7", icon: "bg-[#0d9dc7]", Icon: ShoppingCart, defaultTone: "teal" },
};

const meta: Record<DashboardSlug, { title: string; subtitle: string }> = {
  summary: { title: "Summary", subtitle: "ภาพรวมงบประมาณ · อากาศยาน · WO และความเสี่ยงที่ต้องติดตาม" },
  "fleet-readiness": { title: "Fleet Readiness", subtitle: "Mission Ready · Grounded · Availability · MTBF และ MTTR" },
  maintenance: { title: "แผนกช่างและวางแผนการซ่อม", subtitle: "ความพร้อมอากาศยาน · WO · MMR · PM และ Component" },
  budget: { title: "แผนกงบประมาณ", subtitle: "งบประมาณประจำปี · ใช้จริง · ผูกพัน · คงเหลือ" },
  inventory: { title: "แผนกคลังพัสดุ", subtitle: "MR · MMR · PO รับเข้า · Turn-in และ Unserviceable" },
  procurement: { title: "แผนกจัดซื้อ จ้างซ่อม", subtitle: "RFQ · PR · PO · Delivery และ Supplier Performance" },
};

const metricIcons = [BarChart3, PackageCheck, CalendarDays, Gauge, Clock3, Database];
const summaryLabels: Record<string, string> = {
  budget: "งบประมาณประจำปี",
  actual: "งบจ่ายจริงไปแล้ว",
  committed: "งบผูกพัน",
  balance: "งบคงเหลือ",
};

function valueOf(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isFinite(number) && typeof value !== "boolean") return formatNumber(number);
  return String(value);
}

function compactValue(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return valueOf(value);
  return new Intl.NumberFormat("th-TH", {
    notation: Math.abs(number) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(number);
}

function toneForMetric(metric: MetricResult, dashboard: DashboardSlug): Tone {
  const id = metric.metricId;
  let key: ToneKey = themes[dashboard].defaultTone;

  if (dashboard === "summary") {
    if (id.includes("budget")) key = "magenta";
    else if (id.includes("aircraft")) key = "blue";
    else if (id.includes("grounded") || id.includes("wo")) key = "cyan";
    else key = "purple";
  } else if (dashboard === "maintenance") {
    if (id.includes("mmr")) key = "lime";
    else if (id.includes("pm") || id.includes("component")) key = "purple";
    else if (id.includes("new-part")) key = "slate";
    else if (id.includes("grounded") || id.includes("wo")) key = "cyan";
    else key = "blue";
  } else if (dashboard === "budget") {
    if (id === "budget.summary" || id.includes("overdue") || id.includes("po-")) key = "magenta";
    else if (id.includes("utilization") || id.includes("balance") || id.includes("cost")) key = "lime";
    else key = "purple";
  } else if (dashboard === "inventory") {
    if (id.includes("mr") || id.includes("mmr") || id.includes("pick")) key = id.includes("status") ? "lime" : "green";
    else if (id.includes("return") || id.includes("unserviceable")) key = "blue";
    else key = "teal";
  } else if (dashboard === "procurement") {
    if (id.includes("rfq") || id.includes("pr-") || id.includes("po-")) key = "green";
    else if (id.includes("quality") || id.includes("reliability")) key = "cyan";
    else key = "teal";
  }

  return tones[key];
}

function MetricTable({ rows, caption, compact = false }: { rows: Record<string, unknown>[]; caption: string; compact?: boolean }) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const visible = compact ? rows.slice(0, 6) : rows;
  const borderColor = "#e2e8f0";
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[620px] text-left text-[11px] text-slate-700">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-y bg-[#17346b] text-[10px] font-bold text-white" style={{ borderColor }}>
            {columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap px-2.5 py-2">{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, index) => (
            <tr key={index} className="border-b transition even:bg-slate-50/70 hover:bg-blue-50/70" style={{ borderColor }}>
              {columns.map((column) => <td key={column} className="max-w-56 truncate whitespace-nowrap px-2.5 py-2">{valueOf(row[column])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="grid min-h-32 place-items-center text-xs text-slate-400">ไม่พบข้อมูลตามตัวกรองนี้</p>}
    </div>
  );
}

function chartOption(metric: MetricResult, tone: Tone): EChartsOption {
  const rows = metric.series ?? [];
  const labels = rows.map((row) => String(row.label ?? "ไม่ระบุ"));
  const values = rows.map((row) => Number(row.value ?? 0));
  const axis = { color: "#64748b", fontSize: 9 };
  const splitLine = { lineStyle: { color: "#e2e8f0" } };
  const base: EChartsOption = {
    color: tone.palette,
    animationDuration: 300,
    textStyle: { fontFamily: "Noto Sans Thai, Tahoma, sans-serif", fontSize: 10, color: "#17346b" },
    tooltip: { trigger: "axis", backgroundColor: "rgba(8,15,31,.94)", borderColor: "#334155", textStyle: { color: "#fff", fontSize: 10 } },
    grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
  };

  if (metric.kind === "gauge") {
    const raw = Number(metric.summary?.value ?? 0);
    const value = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 0));
    return {
      ...base,
      series: [{
        type: "gauge",
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        center: ["50%", "58%"],
        radius: "82%",
        axisLine: { lineStyle: { width: 22, color: [[value / 100, tone.accent], [1, "#e2e8f0"]] } },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: { valueAnimation: true, offsetCenter: [0, "8%"], color: tone.fg, fontSize: 28, fontWeight: "bold", formatter: "{value}%" },
        data: [{ value }],
      }],
    };
  }

  if (metric.kind === "donut") {
    return {
      ...base,
      tooltip: { trigger: "item", backgroundColor: "rgba(8,15,31,.94)", borderColor: "#334155", textStyle: { color: "#fff", fontSize: 10 } },
      legend: { bottom: 0, type: "scroll", itemWidth: 8, itemHeight: 8, textStyle: { color: "#475569", fontSize: 9 } },
      series: [{ type: "pie", radius: ["45%", "71%"], center: ["50%", "43%"], itemStyle: { borderColor: "#ffffff", borderWidth: 3 }, label: { show: values.length <= 5, color: "#17346b", fontSize: 9 }, data: rows.map((row) => ({ name: String(row.label ?? "ไม่ระบุ"), value: Number(row.value ?? 0) })) }],
    };
  }

  if (metric.kind === "line") {
    return {
      ...base,
      xAxis: { type: "category", boundaryGap: false, data: labels, axisLine: { lineStyle: { color: tone.border } }, axisLabel: { ...axis, interval: 0 } },
      yAxis: { type: "value", axisLabel: axis, splitLine },
      series: [{ type: "line", data: values, smooth: true, symbolSize: 6, areaStyle: { opacity: 0.12 }, lineStyle: { width: 3, color: tone.accent }, itemStyle: { color: tone.accent } }],
    };
  }

  const horizontal = labels.some((label) => label.length > 15) || labels.length > 7;
  if (horizontal) {
    return {
      ...base,
      grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: "value", axisLabel: axis, splitLine },
      yAxis: { type: "category", inverse: true, data: labels, axisLabel: { ...axis, width: 120, overflow: "truncate" } },
      series: [{ type: "bar", data: values, barMaxWidth: 18, itemStyle: { color: tone.accent, borderRadius: [0, 5, 5, 0] }, label: { show: true, position: "right", color: tone.fg, fontSize: 9 } }],
    };
  }

  return {
    ...base,
    xAxis: { type: "category", data: labels, axisLine: { lineStyle: { color: tone.border } }, axisLabel: { ...axis, interval: 0, rotate: labels.length > 5 ? 22 : 0, overflow: "truncate", width: 74 } },
    yAxis: { type: "value", axisLabel: axis, splitLine },
    series: [{ type: "bar", data: values, barMaxWidth: 32, itemStyle: { color: tone.accent, borderRadius: [5, 5, 0, 0] }, label: { show: values.length < 7, position: "top", color: tone.fg, fontSize: 9 } }],
  };
}

function Sparkline({ color }: { color: string }) {
  return <svg aria-hidden="true" viewBox="0 0 84 28" className="h-7 w-20 opacity-80"><path d="M1 23 L13 18 L24 21 L35 11 L47 16 L59 7 L70 13 L83 4" fill="none" stroke={color} strokeWidth="2" /><path d="M1 23 L13 18 L24 21 L35 11 L47 16 L59 7 L70 13 L83 4 L83 28 L1 28Z" fill={color} opacity=".12" /></svg>;
}

type KpiItem = { id: string; label: string; value: unknown; unit?: string; stale?: boolean; tone: Tone };

function makeKpis(metrics: MetricResult[], dashboard: DashboardSlug): KpiItem[] {
  const direct: KpiItem[] = [];
  for (const metric of metrics) {
    const tone = toneForMetric(metric, dashboard);
    if (metric.kind === "summary") {
      for (const [label, value] of Object.entries(metric.summary ?? {})) direct.push({ id: `${metric.metricId}-${label}`, label: summaryLabels[label] ?? label, value, stale: metric.stale, tone });
    } else if (metric.kind === "kpi" || metric.kind === "gauge") {
      direct.push({ id: metric.metricId, label: metric.title, value: metric.summary?.value, unit: metric.valueLabel, stale: metric.stale, tone });
    }
  }

  const headlineChartIds = dashboard === "inventory"
    ? new Set(["inventory.mr-status", "inventory.mmr-warehouse", "inventory.po-receipt", "inventory.returns"])
    : dashboard === "procurement"
      ? new Set(["procurement.rfq-status", "procurement.po-status"])
      : new Set<string>();
  const aggregates = metrics
    .filter((metric) => headlineChartIds.has(metric.metricId))
    .map((metric) => ({
      id: `${metric.metricId}-headline`,
      label: metric.title,
      value: (metric.series ?? []).reduce((sum, row) => sum + Number(row.value ?? 0), 0),
      stale: metric.stale,
      tone: toneForMetric(metric, dashboard),
    }));

  return [...direct, ...aggregates].slice(0, 8);
}

function KpiStrip({ items }: { items: KpiItem[] }) {
  if (!items.length) return null;
  return (
    <section aria-label="ตัวชี้วัดสำคัญ" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      {items.map((item, index) => {
        const Icon = metricIcons[index % metricIcons.length];
        return (
          <div key={item.id} className="relative min-w-0 overflow-hidden rounded-2xl border p-4 shadow-[0_8px_30px_rgba(15,23,42,.06)]" style={{ backgroundColor: item.tone.bg, borderColor: item.tone.border, color: item.tone.fg }}>
            <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: item.tone.accent }} />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold" title={item.label}>{item.label}</p>
                <p className="mt-3 truncate text-[28px] font-bold leading-none" style={{ color: item.tone.accent }}>{compactValue(item.value)} <span className="text-[10px] font-medium text-slate-400">{item.unit}</span></p>
              </div>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: item.tone.soft, color: item.tone.accent }}><Icon className="size-4" /></span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2"><p className="text-[9px] font-medium" style={{ color: item.tone.muted }}>{item.stale ? "ข้อมูลสำรองล่าสุด" : "ข้อมูลจาก Oracle IFSAPP"}</p><Sparkline color={item.tone.accent} /></div>
          </div>
        );
      })}
    </section>
  );
}

function MetricCard({ metric, dashboard }: { metric: MetricResult; dashboard: DashboardSlug }) {
  const tone = toneForMetric(metric, dashboard);
  const sourceRows = metric.rows ?? metric.series ?? (metric.summary ? [metric.summary] : []);
  const span = metric.kind === "table" || metric.size === "wide" ? "xl:col-span-6" : metric.size === "lg" ? "xl:col-span-4" : "xl:col-span-3";
  const chartHeight = metric.kind === "table" ? "min-h-[170px]" : metric.size === "lg" ? "h-56" : "h-48";

  return (
    <Dialog.Root>
      <section className={`min-w-0 overflow-hidden rounded-2xl border shadow-[0_8px_30px_rgba(15,23,42,.06)] ${span}`} style={{ backgroundColor: tone.bg, borderColor: tone.border, color: tone.fg }}>
        <header className="flex min-h-16 items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: tone.soft, color: tone.accent }}><BarChart3 className="size-4" /></span><div className="min-w-0"><h2 className="truncate text-sm font-bold" title={metric.title}>{metric.title}</h2><p className="mt-0.5 truncate text-[10px]" style={{ color: tone.muted }}>{metric.description}</p></div></div>
          {metric.stale && <Badge className="shrink-0 rounded-sm bg-amber-200 px-1.5 py-0.5 text-[9px] text-amber-950">Stale</Badge>}
        </header>
        <div className="p-4 sm:p-5">
          {metric.error && <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-[10px] text-rose-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{metric.error}</span></div>}
          {!sourceRows.length && !metric.error && <div className="grid min-h-32 place-items-center text-xs" style={{ color: tone.muted }}>ไม่พบข้อมูลตามตัวกรองนี้</div>}
          {metric.kind === "table" && <div className={chartHeight}><MetricTable rows={metric.rows ?? []} caption={metric.title} compact /></div>}
          {metric.kind === "summary" && <div className="grid grid-cols-2 gap-2 py-2">{Object.entries(metric.summary ?? {}).map(([key, value]) => <div key={key} className="rounded-xl p-3" style={{ backgroundColor: tone.soft }}><p className="truncate text-[9px] font-semibold uppercase" style={{ color: tone.muted }}>{summaryLabels[key] ?? key}</p><p className="mt-1 text-lg font-bold" style={{ color: tone.accent }}>{compactValue(value)}</p></div>)}</div>}
          {metric.kind === "kpi" && <div className="my-2 rounded-xl border p-4" style={{ backgroundColor: tone.soft, borderColor: tone.border }}><p className="text-4xl font-bold" style={{ color: tone.accent }}>{compactValue(metric.summary?.value)} <span className="text-xs font-medium text-slate-500">{metric.valueLabel}</span></p><p className="mt-1 text-[10px]" style={{ color: tone.muted }}>อัปเดต {formatDateTime(metric.generatedAt)}</p></div>}
          {metric.kind !== "table" && metric.kind !== "summary" && metric.kind !== "kpi" && <><EChart option={chartOption(metric, tone)} label={`กราฟ ${metric.title}`} className={chartHeight} /><div className="sr-only"><MetricTable rows={metric.series ?? []} caption={`ข้อมูลกราฟ ${metric.title}`} /></div></>}
          {sourceRows.length > 0 && <Dialog.Trigger asChild><button type="button" className="mt-2 min-h-9 text-[10px] font-semibold underline-offset-2 hover:underline" style={{ color: tone.accent }}>ดูรายละเอียด ({sourceRows.length} รายการ) →</button></Dialog.Trigger>}
        </div>
      </section>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/60" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-4xl overflow-y-auto bg-white p-5 text-slate-900 shadow-2xl sm:p-7">
          <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-bold text-[#102b5d]">{metric.title}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-500">{metric.description} · {formatDateTime(metric.generatedAt)}</Dialog.Description></div><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="ปิด"><X className="size-5" /></Button></Dialog.Close></div>
          <div className="mt-6"><MetricTable rows={sourceRows} caption={metric.title} /></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function DashboardPage({ dashboard }: { dashboard: DashboardSlug }) {
  const [filters, setFilters] = useState<DashboardFilters>(
    dashboard === "summary" ? { site: "T10", projectId: "B6800" } : { site: "T10" },
  );
  const [data, setData] = useState<DashboardResult>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, String(value)])).toString(), [filters]);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch(force ? `/api/dashboards/${dashboard}/refresh` : `/api/dashboards/${dashboard}?${query}`, force ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(filters) } : undefined);
      const body = await response.json() as DashboardResult & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "ไม่สามารถโหลด Dashboard ได้");
      setData(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ไม่สามารถโหลด Dashboard ได้");
    } finally {
      setLoading(false);
    }
  }, [dashboard, filters, query]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/dashboards/${dashboard}?${query}`, { signal: controller.signal }).then(async (response) => {
      const body = await response.json() as DashboardResult & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "ไม่สามารถโหลด Dashboard ได้");
      setData(body);
    }).catch((cause: unknown) => {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(cause instanceof Error ? cause.message : "ไม่สามารถโหลด Dashboard ได้");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [dashboard, query]);

  const change = (key: keyof DashboardFilters, value: string) => {
    setLoading(true);
    setError(undefined);
    setFilters((current) => ({ ...current, [key]: value || undefined }));
  };
  const reset = () => {
    setLoading(true);
    setError(undefined);
    setFilters(dashboard === "summary" ? { site: "T10", projectId: "B6800" } : { site: "T10" });
  };
  if (dashboard === "summary") {
    return (
      <SummaryDashboard
        data={data}
        filters={filters}
        loading={loading}
        error={error}
        onChange={change}
        onReset={reset}
        onRefresh={() => void load(true)}
      />
    );
  }

  if (dashboard === "maintenance") {
    return (
      <MaintenanceDashboard
        data={data}
        filters={filters}
        loading={loading}
        error={error}
        onChange={change}
        onReset={reset}
        onRefresh={() => void load(true)}
      />
    );
  }

  if (dashboard === "fleet-readiness") {
    return (
      <FleetReadinessDashboard
        data={data}
        filters={filters}
        loading={loading}
        error={error}
        onChange={change}
        onReset={reset}
        onRefresh={() => void load(true)}
      />
    );
  }

  return <DepartmentDashboard dashboard={dashboard} data={data} filters={filters} loading={loading} error={error} onChange={change} onReset={reset} onRefresh={() => void load(true)} />;
}

type DepartmentSlug = Exclude<DashboardSlug, "summary" | "maintenance" | "fleet-readiness">;

type DepartmentDashboardProps = {
  dashboard: DepartmentSlug;
  data?: DashboardResult;
  filters: DashboardFilters;
  loading: boolean;
  error?: string;
  onChange: (key: keyof DashboardFilters, value: string) => void;
  onReset: () => void;
  onRefresh: () => void;
};

export function DepartmentDashboard({ dashboard, data, filters, loading, error, onChange, onReset, onRefresh }: DepartmentDashboardProps) {
  const kpis = makeKpis(data?.metrics ?? [], dashboard);
  const cards = (data?.metrics ?? []).filter((metric) => !["kpi", "summary"].includes(metric.kind));
  const ThemeIcon = themes[dashboard].Icon;

  return (
    <div className="min-h-screen bg-[#f7f9fc] px-3 py-3 sm:px-4 lg:px-5">
      <header className="relative mb-3 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-[#eef4ff] via-white to-[#f8effb] p-4 shadow-sm sm:p-5">
        <ThemeIcon className="pointer-events-none absolute -bottom-14 right-4 size-56 opacity-[.045]" style={{ color: themes[dashboard].accent }} />
        <div className="relative flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${themes[dashboard].accent}, #8d3b91)` }}><ThemeIcon className="size-6" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d3b91]">TPAD IFSAPP Dashboard</p><h1 className="text-xl font-bold leading-tight text-[#17346b] sm:text-3xl">{meta[dashboard].title}</h1><p className="mt-0.5 text-xs text-slate-500">{meta[dashboard].subtitle}</p></div></div><div className="rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-right shadow-sm backdrop-blur"><p className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-[#17346b]"><Database className="size-3.5" style={{ color: themes[dashboard].accent }} /> Oracle IFSAPP</p><p className="mt-0.5 text-[9px] text-slate-400">{data ? `ล่าสุด ${formatDateTime(data.generatedAt)}` : "กำลังเชื่อมต่อ"}</p></div></div>
      </header>

      <section aria-label="ตัวกรอง Dashboard" className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <FilterSelect label="Site" value={filters.site} onChange={(value) => onChange("site", value)} options={["T10", "T101"]} />
        {dashboard === "budget" && <FilterInput label="Project" value={filters.projectId} onChange={(value) => onChange("projectId", value)} placeholder="เช่น B6800" />}
        {dashboard === "budget" && <FilterInput label="Fiscal Year" value={filters.fiscalYear} onChange={(value) => onChange("fiscalYear", value)} placeholder="เช่น 2569" />}
        {dashboard === "inventory" && <><FilterSelect label="Location Group" value={filters.locationGroup ?? ""} onChange={(value) => onChange("locationGroup", value)} options={["", "DM-A", "DM-A1", "DM-L", "DM-P", "DM-UN", "TPAD", "TR-L", "TR-P"]} /><FilterInput label="Location" value={filters.locationSearch} onChange={(value) => onChange("locationSearch", value)} placeholder="ค้นหา Location" /></>}
        {dashboard === "procurement" && <><FilterInput label="Buyer" value={filters.buyer} onChange={(value) => onChange("buyer", value)} placeholder="ทั้งหมด" /><FilterInput label="Supplier" value={filters.supplier} onChange={(value) => onChange("supplier", value)} placeholder="ทั้งหมด" /></>}
        <FilterInput label="Period from" value={filters.from} onChange={(value) => onChange("from", value)} type="date" /><FilterInput label="Period to" value={filters.to} onChange={(value) => onChange("to", value)} type="date" />
        <div className="flex items-end gap-2"><Button onClick={onReset} disabled={loading} variant="secondary" className="min-h-11 flex-1 rounded-xl px-3 text-xs">รีเซ็ต</Button><Button onClick={onRefresh} disabled={loading} className="min-h-11 flex-1 rounded-xl px-3 text-xs text-white" style={{ backgroundColor: themes[dashboard].accent }}><RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} /> รีเฟรช</Button></div>
      </div></section>

      {error && <div className="mb-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{error}</span></div>}
      {loading && !data ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200" />)}</div> : <KpiStrip items={kpis} />}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">{cards.map((metric) => <MetricCard key={metric.metricId} metric={metric} dashboard={dashboard} />)}</div>
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-[10px] text-slate-500"><p className="flex items-center gap-1"><Clock3 className="size-3.5" /> Last updated: {data ? formatDateTime(data.generatedAt) : "—"}</p><p className="flex items-center gap-1"><Database className="size-3.5" /> Oracle IFSAPP · Read only · Cache 5 นาที</p></footer>
    </div>
  );
}

function FilterInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value?: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="text-[11px] font-semibold text-slate-600"><span className="mb-1 block">{label}</span><Input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 min-h-11 rounded-xl border-slate-200 px-3 text-sm focus-visible:ring-sky-200" /></label>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="text-[11px] font-semibold text-slate-600"><span className="mb-1 block">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100">{options.map((option) => <option key={option} value={option}>{option || "ทั้งหมด"}</option>)}</select></label>;
}
