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
  RefreshCw,
  ShoppingCart,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EChart } from "@/components/echart";
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
  palette: string[];
};

const tones: Record<ToneKey, Tone> = {
  cyan: { bg: "#0797c2", border: "rgba(255,255,255,.28)", fg: "#ffffff", muted: "rgba(255,255,255,.74)", palette: ["#ffffff", "#b8e85c", "#72d9f1", "#ffd166", "#f7a8d8"] },
  blue: { bg: "#087eaf", border: "rgba(255,255,255,.28)", fg: "#ffffff", muted: "rgba(255,255,255,.74)", palette: ["#ffffff", "#9ed04a", "#66d3ef", "#ffd166", "#d8b4fe"] },
  green: { bg: "#279532", border: "rgba(255,255,255,.30)", fg: "#ffffff", muted: "rgba(255,255,255,.76)", palette: ["#ffffff", "#bfe875", "#7de3a4", "#ffe08a", "#d8b4fe"] },
  lime: { bg: "#96c435", border: "rgba(255,255,255,.36)", fg: "#ffffff", muted: "rgba(255,255,255,.82)", palette: ["#ffffff", "#166534", "#075985", "#7c3aed", "#f97316"] },
  purple: { bg: "#82458f", border: "rgba(255,255,255,.30)", fg: "#ffffff", muted: "rgba(255,255,255,.78)", palette: ["#ffffff", "#d5f26c", "#65d6f2", "#ffd166", "#fca5a5"] },
  magenta: { bg: "#c6006f", border: "rgba(255,255,255,.34)", fg: "#ffffff", muted: "rgba(255,255,255,.82)", palette: ["#ffffff", "#b8e85c", "#66d3ef", "#ffd166", "#d8b4fe"] },
  teal: { bg: "#0d9dc7", border: "rgba(255,255,255,.30)", fg: "#ffffff", muted: "rgba(255,255,255,.78)", palette: ["#ffffff", "#b7e35e", "#fbd38d", "#c4b5fd", "#fca5a5"] },
  slate: { bg: "#4c4b50", border: "rgba(255,255,255,.28)", fg: "#ffffff", muted: "rgba(255,255,255,.74)", palette: ["#ffffff", "#b8e85c", "#73d8f0", "#ffd166", "#d8b4fe"] },
};

const themes: Record<DashboardSlug, { accent: string; icon: string; Icon: LucideIcon; defaultTone: ToneKey }> = {
  summary: { accent: "#8d3b91", icon: "bg-[#8d3b91]", Icon: LayoutDashboard, defaultTone: "purple" },
  maintenance: { accent: "#087fb5", icon: "bg-[#087fb5]", Icon: Wrench, defaultTone: "cyan" },
  budget: { accent: "#8d3b91", icon: "bg-[#8d3b91]", Icon: Gauge, defaultTone: "magenta" },
  inventory: { accent: "#279532", icon: "bg-[#279532]", Icon: Boxes, defaultTone: "green" },
  procurement: { accent: "#0d9dc7", icon: "bg-[#0d9dc7]", Icon: ShoppingCart, defaultTone: "teal" },
};

const meta: Record<DashboardSlug, { title: string; subtitle: string }> = {
  summary: { title: "Summary", subtitle: "ภาพรวมงบประมาณ · อากาศยาน · WO และความเสี่ยงที่ต้องติดตาม" },
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

function MetricTable({ rows, caption, compact = false, tone }: { rows: Record<string, unknown>[]; caption: string; compact?: boolean; tone?: Tone }) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const visible = compact ? rows.slice(0, 6) : rows;
  const borderColor = tone?.border ?? "#e2e8f0";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-[11px]" style={{ color: tone?.fg ?? "#334155" }}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-y text-[10px] font-bold" style={{ borderColor, backgroundColor: tone ? "rgba(0,0,0,.13)" : "#f8fafc", color: tone?.fg ?? "#17346b" }}>
            {columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap px-2.5 py-2">{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, index) => (
            <tr key={index} className="border-b transition hover:bg-white/10" style={{ borderColor }}>
              {columns.map((column) => <td key={column} className="max-w-56 truncate whitespace-nowrap px-2.5 py-2">{valueOf(row[column])}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="grid min-h-32 place-items-center text-xs" style={{ color: tone?.muted ?? "#94a3b8" }}>ไม่พบข้อมูลตามตัวกรองนี้</p>}
    </div>
  );
}

function chartOption(metric: MetricResult, tone: Tone): EChartsOption {
  const rows = metric.series ?? [];
  const labels = rows.map((row) => String(row.label ?? "ไม่ระบุ"));
  const values = rows.map((row) => Number(row.value ?? 0));
  const axis = { color: tone.fg, fontSize: 9 };
  const splitLine = { lineStyle: { color: tone.border } };
  const base: EChartsOption = {
    color: tone.palette,
    animationDuration: 300,
    textStyle: { fontFamily: "Noto Sans Thai, Tahoma, sans-serif", fontSize: 10, color: tone.fg },
    tooltip: { trigger: "axis", backgroundColor: "rgba(8,15,31,.94)", borderColor: tone.border, textStyle: { color: "#fff", fontSize: 10 } },
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
        axisLine: { lineStyle: { width: 22, color: [[value / 100, tone.palette[1]], [1, "rgba(255,255,255,.18)"]] } },
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
      tooltip: { trigger: "item", backgroundColor: "rgba(8,15,31,.94)", borderColor: tone.border, textStyle: { color: "#fff", fontSize: 10 } },
      legend: { bottom: 0, type: "scroll", itemWidth: 8, itemHeight: 8, textStyle: { color: tone.fg, fontSize: 9 } },
      series: [{ type: "pie", radius: ["45%", "71%"], center: ["50%", "43%"], itemStyle: { borderColor: tone.bg, borderWidth: 2 }, label: { show: values.length <= 5, color: tone.fg, fontSize: 9 }, data: rows.map((row) => ({ name: String(row.label ?? "ไม่ระบุ"), value: Number(row.value ?? 0) })) }],
    };
  }

  if (metric.kind === "line") {
    return {
      ...base,
      xAxis: { type: "category", boundaryGap: false, data: labels, axisLine: { lineStyle: { color: tone.border } }, axisLabel: { ...axis, interval: 0 } },
      yAxis: { type: "value", axisLabel: axis, splitLine },
      series: [{ type: "line", data: values, smooth: true, symbolSize: 6, areaStyle: { opacity: 0.2 }, lineStyle: { width: 3, color: tone.palette[1] }, itemStyle: { color: tone.palette[1] } }],
    };
  }

  const horizontal = labels.some((label) => label.length > 15) || labels.length > 7;
  if (horizontal) {
    return {
      ...base,
      grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: "value", axisLabel: axis, splitLine },
      yAxis: { type: "category", inverse: true, data: labels, axisLabel: { ...axis, width: 120, overflow: "truncate" } },
      series: [{ type: "bar", data: values, barMaxWidth: 18, itemStyle: { color: tone.palette[1], borderRadius: 0 }, label: { show: true, position: "right", color: tone.fg, fontSize: 9 } }],
    };
  }

  return {
    ...base,
    xAxis: { type: "category", data: labels, axisLine: { lineStyle: { color: tone.border } }, axisLabel: { ...axis, interval: 0, rotate: labels.length > 5 ? 22 : 0, overflow: "truncate", width: 74 } },
    yAxis: { type: "value", axisLabel: axis, splitLine },
    series: [{ type: "bar", data: values, barMaxWidth: 32, itemStyle: { color: tone.palette[1], borderRadius: 0 }, label: { show: values.length < 7, position: "top", color: tone.fg, fontSize: 9 } }],
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
    <section aria-label="ตัวชี้วัดสำคัญ" className="grid gap-px overflow-hidden border border-white bg-white/80 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item, index) => {
        const Icon = metricIcons[index % metricIcons.length];
        return (
          <div key={item.id} className="min-w-0 p-3" style={{ backgroundColor: item.tone.bg, color: item.tone.fg }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold" title={item.label}>{item.label}</p>
                <p className="mt-2 truncate text-[28px] font-bold leading-none">{compactValue(item.value)} <span className="text-[10px] font-medium" style={{ color: item.tone.muted }}>{item.unit}</span></p>
              </div>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/15"><Icon className="size-4" /></span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2"><p className="text-[9px] font-medium" style={{ color: item.tone.muted }}>{item.stale ? "ข้อมูลสำรองล่าสุด" : "ข้อมูลจาก Oracle IFSAPP"}</p><Sparkline color={item.tone.fg} /></div>
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
      <section className={`min-w-0 overflow-hidden border border-white/90 shadow-[0_2px_8px_rgba(15,23,42,.14)] ${span}`} style={{ backgroundColor: tone.bg, color: tone.fg }}>
        <header className="flex min-h-12 items-start justify-between gap-2 border-b px-3 py-2" style={{ borderColor: tone.border }}>
          <div className="min-w-0"><h2 className="truncate text-[13px] font-bold" title={metric.title}>{metric.title}</h2><p className="mt-0.5 truncate text-[9px]" style={{ color: tone.muted }}>{metric.description}</p></div>
          {metric.stale && <Badge className="shrink-0 rounded-sm bg-amber-200 px-1.5 py-0.5 text-[9px] text-amber-950">Stale</Badge>}
        </header>
        <div className="px-3 pb-2.5 pt-1">
          {metric.error && <div className="mb-2 flex items-start gap-2 border border-rose-200/60 bg-rose-950/35 p-2 text-[10px] text-rose-50"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{metric.error}</span></div>}
          {!sourceRows.length && !metric.error && <div className="grid min-h-32 place-items-center text-xs" style={{ color: tone.muted }}>ไม่พบข้อมูลตามตัวกรองนี้</div>}
          {metric.kind === "table" && <div className={chartHeight}><MetricTable rows={metric.rows ?? []} caption={metric.title} compact tone={tone} /></div>}
          {metric.kind === "summary" && <div className="grid grid-cols-2 gap-px py-2">{Object.entries(metric.summary ?? {}).map(([key, value]) => <div key={key} className="p-2" style={{ backgroundColor: "rgba(0,0,0,.12)" }}><p className="truncate text-[9px] font-semibold uppercase" style={{ color: tone.muted }}>{summaryLabels[key] ?? key}</p><p className="mt-1 text-lg font-bold">{compactValue(value)}</p></div>)}</div>}
          {metric.kind === "kpi" && <div className="my-2 border border-white/20 p-4" style={{ backgroundColor: "rgba(0,0,0,.12)" }}><p className="text-4xl font-bold">{compactValue(metric.summary?.value)} <span className="text-xs font-medium" style={{ color: tone.muted }}>{metric.valueLabel}</span></p><p className="mt-1 text-[10px]" style={{ color: tone.muted }}>อัปเดต {formatDateTime(metric.generatedAt)}</p></div>}
          {metric.kind !== "table" && metric.kind !== "summary" && metric.kind !== "kpi" && <><EChart option={chartOption(metric, tone)} label={`กราฟ ${metric.title}`} className={chartHeight} /><div className="sr-only"><MetricTable rows={metric.series ?? []} caption={`ข้อมูลกราฟ ${metric.title}`} /></div></>}
          {sourceRows.length > 0 && <Dialog.Trigger asChild><button type="button" className="mt-1 min-h-9 text-[10px] font-semibold underline-offset-2 hover:underline" style={{ color: tone.fg }}>ดูรายละเอียด ({sourceRows.length} รายการ) →</button></Dialog.Trigger>}
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
  const kpis = makeKpis(data?.metrics ?? [], dashboard);
  const cards = (data?.metrics ?? []).filter((metric) => !["kpi", "summary"].includes(metric.kind));
  const ThemeIcon = themes[dashboard].Icon;

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

  return (
    <div className="min-h-screen bg-[#f2f0f3] px-2 py-2 sm:px-3 lg:px-4">
      <header className="mb-2 border-b-4 border-[#8d3b91] bg-white px-3 py-3 shadow-sm sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className={`grid size-11 place-items-center text-white ${themes[dashboard].icon}`}><ThemeIcon className="size-5" /></span><div><p className="text-[9px] font-bold uppercase tracking-[.18em] text-[#8d3b91]">TPAD IFSAPP Dashboard</p><h1 className="text-xl font-bold leading-tight text-[#102b5d] sm:text-2xl">{meta[dashboard].title}</h1><p className="text-[10px] text-slate-500">{meta[dashboard].subtitle}</p></div></div><div className="flex items-center gap-2 text-right"><div><p className="text-[10px] font-bold text-[#17346b]">Data Source: Oracle IFSAPP</p><p className="text-[9px] text-slate-400">{data ? `ล่าสุด ${formatDateTime(data.generatedAt)}` : "กำลังเชื่อมต่อ"}</p></div><span className={`size-2 rounded-full ${loading ? "animate-pulse bg-amber-400" : "bg-emerald-500"}`} /></div></div>
      </header>

      <section aria-label="ตัวกรอง Dashboard" className="mb-2 border border-[#6c2b74] bg-[#873c90] p-2 shadow-sm"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <FilterSelect label="Site" value={filters.site} onChange={(value) => change("site", value)} options={["T10", "T101"]} dark />
        {dashboard === "budget" && <FilterInput label="Project" value={filters.projectId} onChange={(value) => change("projectId", value)} placeholder="เช่น B6800" dark />}
        {dashboard === "budget" && <FilterInput label="Fiscal Year" value={filters.fiscalYear} onChange={(value) => change("fiscalYear", value)} placeholder="เช่น 2569" dark />}
        {dashboard === "inventory" && <><FilterSelect label="Location Group" value={filters.locationGroup ?? ""} onChange={(value) => change("locationGroup", value)} options={["", "DM-A", "DM-A1", "DM-L", "DM-P", "DM-UN", "TPAD", "TR-L", "TR-P"]} dark /><FilterInput label="Location" value={filters.locationSearch} onChange={(value) => change("locationSearch", value)} placeholder="ค้นหา Location" dark /></>}
        {dashboard === "procurement" && <><FilterInput label="Buyer" value={filters.buyer} onChange={(value) => change("buyer", value)} placeholder="ทั้งหมด" dark /><FilterInput label="Supplier" value={filters.supplier} onChange={(value) => change("supplier", value)} placeholder="ทั้งหมด" dark /></>}
        <FilterInput label="Period from" value={filters.from} onChange={(value) => change("from", value)} type="date" dark /><FilterInput label="Period to" value={filters.to} onChange={(value) => change("to", value)} type="date" dark />
        <div className="flex items-end gap-2"><Button onClick={reset} disabled={loading} variant="secondary" className="min-h-11 flex-1 rounded-none border-white/30 bg-white/10 px-3 text-xs text-white hover:bg-white/20">รีเซ็ต</Button><Button onClick={() => void load(true)} disabled={loading} variant="primary" className="min-h-11 flex-1 rounded-none bg-[#c6006f] px-3 text-xs hover:bg-[#a9005d]"><RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} /> รีเฟรช</Button></div>
      </div></section>

      {error && <div className="mb-2 flex items-start gap-2 border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{error}</span></div>}
      {loading && !data ? <div className="grid gap-px border border-white bg-white sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-28 animate-pulse bg-slate-300" />)}</div> : <KpiStrip items={kpis} />}
      <div className="mt-2 grid grid-cols-1 gap-px border border-white bg-white md:grid-cols-2 xl:grid-cols-12">{cards.map((metric) => <MetricCard key={metric.metricId} metric={metric} dashboard={dashboard} />)}</div>
      <footer className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#8d3b91] pt-2 text-[10px] text-slate-500"><p className="flex items-center gap-1"><Clock3 className="size-3.5" /> Last updated: {data ? formatDateTime(data.generatedAt) : "—"}</p><p className="flex items-center gap-1"><Database className="size-3.5" /> Oracle IFSAPP · Read only · Cache 5 นาที</p></footer>
    </div>
  );
}

function FilterInput({ label, value, onChange, placeholder, type = "text", dark = false }: { label: string; value?: string; onChange: (value: string) => void; placeholder?: string; type?: string; dark?: boolean }) {
  return <label className={`text-[10px] font-semibold ${dark ? "text-white" : "text-slate-500"}`}><span className="mb-1 block">{label}</span><Input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={`h-10 min-h-10 rounded-none px-2.5 text-xs ${dark ? "border-white/30 bg-white text-slate-900 placeholder:text-slate-400" : ""}`} /></label>;
}

function FilterSelect({ label, value, onChange, options, dark = false }: { label: string; value: string; onChange: (value: string) => void; options: string[]; dark?: boolean }) {
  return <label className={`text-[10px] font-semibold ${dark ? "text-white" : "text-slate-500"}`}><span className="mb-1 block">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className={`h-10 w-full rounded-none border px-2.5 text-xs outline-none focus:ring-2 focus:ring-sky-300 ${dark ? "border-white/30 bg-white text-slate-900" : "border-slate-200 bg-white text-slate-800"}`}>{options.map((option) => <option key={option} value={option}>{option || "ทั้งหมด"}</option>)}</select></label>;
}
