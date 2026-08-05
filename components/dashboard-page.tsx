"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { EChartsOption } from "echarts";
import {
  AlertTriangle, BarChart3, Boxes, CalendarDays, CheckCircle2, Clock3, Database,
  Filter, Gauge, PackageCheck, RefreshCw, ShoppingCart, Wrench, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EChart } from "@/components/echart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DashboardFilters, DashboardResult, DashboardSlug, MetricResult } from "@/lib/dashboard/types";
import { formatDateTime, formatNumber } from "@/lib/utils";

const themes: Record<DashboardSlug, { accent: string; icon: string; soft: string; palette: string[]; Icon: LucideIcon }> = {
  maintenance: { accent: "#087fb5", icon: "bg-sky-600", soft: "bg-sky-50 text-sky-700", palette: ["#1689d8", "#0ea5e9", "#22c1c3", "#65c7f7", "#94a3b8"], Icon: Wrench },
  budget: { accent: "#4f46e5", icon: "bg-indigo-600", soft: "bg-indigo-50 text-indigo-700", palette: ["#2563eb", "#22a65a", "#f59e0b", "#7c3aed", "#94a3b8"], Icon: Gauge },
  inventory: { accent: "#059669", icon: "bg-emerald-600", soft: "bg-emerald-50 text-emerald-700", palette: ["#1388cf", "#20a75a", "#7c3aed", "#f59e0b", "#94a3b8"], Icon: Boxes },
  procurement: { accent: "#7c3aed", icon: "bg-violet-600", soft: "bg-violet-50 text-violet-700", palette: ["#1675dc", "#20a75a", "#ef4444", "#7c3aed", "#f97316", "#0891b2"], Icon: ShoppingCart },
};

const meta: Record<DashboardSlug, { title: string; subtitle: string }> = {
  maintenance: { title: "แผนกช่างและวางแผนการซ่อม", subtitle: "Maintenance Planning & Aircraft Readiness" },
  budget: { title: "แผนกงบประมาณ", subtitle: "Budget Performance & Cost Control" },
  inventory: { title: "แผนกคลังพัสดุ", subtitle: "Warehouse & Material Requisition Control" },
  procurement: { title: "แผนกจัดซื้อ จ้างซ่อม", subtitle: "Procurement & Supplier Performance" },
};

const metricIcons = [BarChart3, CheckCircle2, CalendarDays, PackageCheck, Clock3, Database];
const metricColors = ["bg-blue-600", "bg-emerald-600", "bg-orange-500", "bg-violet-600", "bg-cyan-600", "bg-rose-500"];

function valueOf(value: unknown) {
  return typeof value === "number" ? formatNumber(value) : String(value ?? "—");
}

function compactValue(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return valueOf(value);
  return new Intl.NumberFormat("th-TH", { notation: Math.abs(number) >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(number);
}

function MetricTable({ rows, caption, compact = false }: { rows: Record<string, unknown>[]; caption: string; compact?: boolean }) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const visible = compact ? rows.slice(0, 5) : rows;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-[11px]">
        <caption className="sr-only">{caption}</caption>
        <thead><tr className="border-y border-slate-200 bg-slate-50 text-[10px] font-bold text-[#17346b]">{columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap px-2.5 py-2">{column}</th>)}</tr></thead>
        <tbody>{visible.map((row, index) => <tr key={index} className="border-b border-slate-100 hover:bg-blue-50/40">{columns.map((column) => <td key={column} className="max-w-56 truncate whitespace-nowrap px-2.5 py-2 text-slate-700">{valueOf(row[column])}</td>)}</tr>)}</tbody>
      </table>
      {!rows.length && <p className="grid min-h-32 place-items-center text-xs text-slate-400">ไม่พบข้อมูลตามตัวกรองนี้</p>}
    </div>
  );
}

function chartOption(metric: MetricResult, palette: string[]): EChartsOption {
  const rows = metric.series ?? [];
  const labels = rows.map((row) => String(row.label ?? "ไม่ระบุ"));
  const values = rows.map((row) => Number(row.value ?? 0));
  const base: EChartsOption = {
    color: palette, animationDuration: 300, tooltip: { trigger: "axis" },
    grid: { left: 8, right: 12, top: 25, bottom: 8, containLabel: true },
    textStyle: { fontFamily: "Noto Sans Thai, Tahoma, sans-serif", fontSize: 10, color: "#334155" },
  };
  if (metric.kind === "donut") return { ...base, tooltip: { trigger: "item" }, legend: { bottom: 0, type: "scroll", itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 9 } }, series: [{ type: "pie", radius: ["48%", "72%"], center: ["38%", "43%"], itemStyle: { borderColor: "#fff", borderWidth: 2 }, label: { show: false }, data: rows.map((row) => ({ name: String(row.label ?? "ไม่ระบุ"), value: Number(row.value ?? 0) })) }] };
  if (metric.kind === "line") return { ...base, xAxis: { type: "category", boundaryGap: false, data: labels, axisLine: { lineStyle: { color: "#cbd5e1" } }, axisLabel: { fontSize: 9 } }, yAxis: { type: "value", splitLine: { lineStyle: { color: "#edf2f7" } } }, series: [{ type: "line", data: values, smooth: true, symbolSize: 6, areaStyle: { opacity: 0.12 }, lineStyle: { width: 2.5 } }] };
  const horizontal = labels.some((label) => label.length > 15) || labels.length > 7;
  if (horizontal) return { ...base, grid: { left: 8, right: 20, top: 8, bottom: 8, containLabel: true }, xAxis: { type: "value", splitLine: { lineStyle: { color: "#edf2f7" } } }, yAxis: { type: "category", inverse: true, data: labels, axisLabel: { width: 110, overflow: "truncate", fontSize: 9 } }, series: [{ type: "bar", data: values, barMaxWidth: 16, itemStyle: { borderRadius: [0, 4, 4, 0] }, label: { show: true, position: "right", fontSize: 9 } }] };
  return { ...base, xAxis: { type: "category", data: labels, axisLabel: { interval: 0, rotate: labels.length > 5 ? 22 : 0, overflow: "truncate", width: 70, fontSize: 9 } }, yAxis: { type: "value", splitLine: { lineStyle: { color: "#edf2f7" } } }, series: [{ type: "bar", data: values, barMaxWidth: 32, itemStyle: { borderRadius: [4, 4, 0, 0] }, label: { show: values.length < 7, position: "top", fontSize: 9 } }] };
}

function Sparkline({ color }: { color: string }) {
  return <svg aria-hidden="true" viewBox="0 0 84 28" className="h-7 w-20"><path d="M1 23 L13 18 L24 21 L35 11 L47 16 L59 7 L70 13 L83 4" fill="none" stroke={color} strokeWidth="2"/><path d="M1 23 L13 18 L24 21 L35 11 L47 16 L59 7 L70 13 L83 4 L83 28 L1 28Z" fill={color} opacity=".09"/></svg>;
}

type KpiItem = { label: string; value: unknown; unit?: string; stale?: boolean };

function makeKpis(metrics: MetricResult[]): KpiItem[] {
  const direct: KpiItem[] = [];
  for (const metric of metrics) {
    if (metric.kind === "summary") {
      for (const [label, value] of Object.entries(metric.summary ?? {})) direct.push({ label, value, stale: metric.stale });
    } else if (metric.kind === "kpi" || metric.kind === "gauge") {
      direct.push({ label: metric.title, value: metric.summary?.value, unit: metric.valueLabel, stale: metric.stale });
    }
  }
  const aggregates: KpiItem[] = metrics.filter((metric) => ["bar", "donut", "line"].includes(metric.kind)).map((metric) => ({ label: metric.title, value: (metric.series ?? []).reduce((sum, row) => sum + Number(row.value ?? 0), 0), stale: metric.stale }));
  return [...direct, ...aggregates].slice(0, 6);
}

function KpiStrip({ items }: { items: KpiItem[] }) {
  return <section aria-label="ตัวชี้วัดสำคัญ" className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">{items.map((item, index) => {
    const Icon = metricIcons[index % metricIcons.length];
    const color = metricColors[index % metricColors.length];
    const stroke = ["#2563eb", "#059669", "#f97316", "#7c3aed", "#0891b2", "#ef4444"][index % 6];
    return <div key={`${item.label}-${index}`} className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,.035)]">
      <div className="flex items-start gap-2.5"><span className={`grid size-9 shrink-0 place-items-center rounded-full text-white ${color}`}><Icon className="size-[17px]" /></span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-[#17346b]" title={item.label}>{item.label}</p><div className="mt-0.5 flex items-end justify-between gap-1"><p className="truncate text-[22px] font-bold leading-none text-[#0d2b67]">{compactValue(item.value)} <span className="text-[9px] font-medium text-slate-500">{item.unit}</span></p><Sparkline color={stroke} /></div></div></div>
      <p className={`mt-1 text-[9px] font-medium ${item.stale ? "text-amber-600" : "text-emerald-600"}`}>{item.stale ? "ข้อมูลสำรองล่าสุด" : "● ข้อมูลจาก Oracle IFSAPP"}</p>
    </div>;
  })}</section>;
}

function MetricCard({ metric, dashboard }: { metric: MetricResult; dashboard: DashboardSlug }) {
  const theme = themes[dashboard];
  const sourceRows = metric.rows ?? metric.series ?? (metric.summary ? [metric.summary] : []);
  const span = metric.kind === "table" || metric.size === "wide" ? "xl:col-span-6" : metric.size === "lg" ? "xl:col-span-4" : "xl:col-span-3";
  return <Dialog.Root>
    <section className={`min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,.035)] ${span}`}>
      <header className="flex min-h-10 items-start justify-between gap-2 px-3 pt-2.5"><div className="min-w-0"><h2 className="truncate text-[12px] font-bold text-[#123b82]">{metric.title}</h2><p className="mt-0.5 truncate text-[9px] text-slate-500">{metric.description}</p></div>{metric.stale && <Badge className="shrink-0 bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-800">Stale</Badge>}</header>
      <div className="px-3 pb-2.5 pt-1">
        {metric.error && !sourceRows.length ? <div className="grid min-h-40 place-items-center rounded-md bg-rose-50 p-4 text-center"><div><AlertTriangle className="mx-auto size-6 text-rose-500"/><p className="mt-2 text-xs font-semibold text-rose-800">Card นี้โหลดไม่สำเร็จ</p><p className="mt-1 line-clamp-2 text-[10px] text-rose-600">{metric.error}</p></div></div>
        : metric.kind === "table" ? <MetricTable rows={metric.rows ?? []} caption={metric.title} compact />
        : metric.kind === "gauge" ? <div className="relative mx-auto mt-2 h-44 max-w-72 overflow-hidden"><div className="absolute inset-x-4 top-5 aspect-[2/1] overflow-hidden"><div className="aspect-square rounded-full border-[24px] border-slate-100" style={{ borderTopColor: theme.accent, borderRightColor: theme.accent, transform: "rotate(-45deg)" }}/></div><div className="absolute inset-x-0 bottom-6 text-center"><p className="text-3xl font-bold" style={{ color: theme.accent }}>{valueOf(metric.summary?.value)}%</p><p className="text-[10px] text-slate-500">เป้าหมาย 90%</p></div></div>
        : metric.kind === "summary" ? <div className="grid grid-cols-2 gap-2 py-2">{Object.entries(metric.summary ?? {}).map(([key, value]) => <div key={key} className="rounded-md bg-slate-50 p-2"><p className="truncate text-[9px] uppercase text-slate-500">{key}</p><p className="mt-1 text-base font-bold text-[#17346b]">{compactValue(value)}</p></div>)}</div>
        : metric.kind === "kpi" ? <div className={`my-2 rounded-md p-4 ${theme.soft}`}><p className="text-3xl font-bold">{compactValue(metric.summary?.value)} <span className="text-xs font-medium">{metric.valueLabel}</span></p><p className="mt-1 text-[10px] opacity-70">อัปเดต {formatDateTime(metric.generatedAt)}</p></div>
        : <><EChart option={chartOption(metric, theme.palette)} label={`กราฟ ${metric.title}`} className={metric.size === "lg" ? "h-52" : "h-48"}/><div className="sr-only"><MetricTable rows={metric.series ?? []} caption={`ข้อมูลกราฟ ${metric.title}`}/></div></>}
        {sourceRows.length > 0 && <Dialog.Trigger asChild><button className="mt-1 min-h-11 text-[10px] font-semibold text-blue-700 hover:text-blue-900">ดูรายละเอียด ({sourceRows.length} รายการ) →</button></Dialog.Trigger>}
      </div>
    </section>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/45"/><Dialog.Content className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-bold text-[#102b5d]">{metric.title}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-500">{metric.description} · {formatDateTime(metric.generatedAt)}</Dialog.Description></div><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="ปิด"><X className="size-5"/></Button></Dialog.Close></div><div className="mt-6"><MetricTable rows={sourceRows} caption={metric.title}/></div></Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}

export function DashboardPage({ dashboard }: { dashboard: DashboardSlug }) {
  const [filters, setFilters] = useState<DashboardFilters>({ site: "T10" });
  const [data, setData] = useState<DashboardResult>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, String(value)])).toString(), [filters]);
  const load = useCallback(async (force = false) => { setLoading(true); setError(undefined); try { const response = await fetch(force ? `/api/dashboards/${dashboard}/refresh` : `/api/dashboards/${dashboard}?${query}`, force ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(filters) } : undefined); const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "ไม่สามารถโหลด Dashboard ได้"); setData(body); } catch (cause) { setError(cause instanceof Error ? cause.message : "ไม่สามารถโหลด Dashboard ได้"); } finally { setLoading(false); } }, [dashboard, filters, query]);
  useEffect(() => { let active = true; fetch(`/api/dashboards/${dashboard}?${query}`).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "ไม่สามารถโหลด Dashboard ได้"); if (active) setData(body); }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "ไม่สามารถโหลด Dashboard ได้"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [dashboard, query]);
  const change = (key: keyof DashboardFilters, value: string) => setFilters((current) => ({ ...current, [key]: value || undefined }));
  const kpis = makeKpis(data?.metrics ?? []);
  const cards = (data?.metrics ?? []).filter((metric) => !["kpi", "summary"].includes(metric.kind));
  const ThemeIcon = themes[dashboard].Icon;

  return <div className="px-3 py-3 sm:px-4 lg:px-5">
    <header className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3"><div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-lg text-white ${themes[dashboard].icon}`}><ThemeIcon className="size-5"/></span><div><h1 className="text-xl font-bold leading-tight text-[#0b2452] sm:text-2xl">{meta[dashboard].title}</h1><p className="text-[11px] text-slate-500">{meta[dashboard].subtitle} <Badge className="ml-1 bg-blue-50 px-1.5 py-0.5 text-[9px] text-blue-700 ring-1 ring-blue-200">◉ Data Source: Oracle IFSAPP</Badge></p></div></div><div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"><RefreshCw className={`size-4 text-blue-600 ${loading ? "animate-spin" : ""}`}/><div><p className="text-[10px] font-semibold text-[#17346b]">อัปเดตข้อมูล</p><p className="text-[9px] text-slate-400">ล่าสุด {data ? formatDateTime(data.generatedAt) : "กำลังเชื่อมต่อ"}</p></div><span className="ml-1 size-2 rounded-full bg-emerald-500"/></div></header>

    <section aria-label="ตัวกรอง Dashboard" className="sticky top-16 z-20 mb-2 rounded-lg border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur lg:top-2"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
      <FilterSelect label="Site" value={filters.site} onChange={(value) => change("site", value)} options={["T10", "T101"]}/>
      {dashboard === "budget" && <><FilterInput label="Project" value={filters.projectId} onChange={(value) => change("projectId", value)} placeholder="ทั้งหมด"/><FilterInput label="Fiscal Year" value={filters.fiscalYear} onChange={(value) => change("fiscalYear", value)} placeholder="2569"/></>}
      {dashboard === "inventory" && <><FilterSelect label="Location Group" value={filters.locationGroup ?? ""} onChange={(value) => change("locationGroup", value)} options={["", "DM-A", "DM-A1", "DM-L", "DM-P", "DM-UN", "TPAD", "TR-L", "TR-P"]}/><FilterInput label="Location" value={filters.locationSearch} onChange={(value) => change("locationSearch", value)} placeholder="ค้นหา Location"/></>}
      {dashboard === "procurement" && <><FilterInput label="Buyer" value={filters.buyer} onChange={(value) => change("buyer", value)} placeholder="ทั้งหมด"/><FilterInput label="Supplier" value={filters.supplier} onChange={(value) => change("supplier", value)} placeholder="ทั้งหมด"/></>}
      <FilterInput label="Period from" value={filters.from} onChange={(value) => change("from", value)} type="date"/><FilterInput label="Period to" value={filters.to} onChange={(value) => change("to", value)} type="date"/>
      <Button onClick={() => void load(true)} disabled={loading} variant="secondary" className="min-h-11 self-end text-xs text-blue-700"><Filter className="size-3.5"/> รีเซ็ต/รีเฟรช</Button>
    </div></section>

    {error && <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}
    {loading && !data ? <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-lg bg-slate-200"/>)}</div> : <KpiStrip items={kpis}/>} 
    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-12">{cards.map((metric) => <MetricCard key={metric.metricId} metric={metric} dashboard={dashboard}/>)}</div>
    <footer className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2 text-[10px] text-slate-500"><p className="flex items-center gap-1"><Clock3 className="size-3.5"/> Last updated: {data ? formatDateTime(data.generatedAt) : "—"}</p><p className="flex items-center gap-1"><Database className="size-3.5"/> Oracle IFSAPP · Read only · Cache 5 นาที</p></footer>
  </div>;
}

function FilterInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value?: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="text-[10px] font-medium text-slate-500"><span className="mb-1 block">{label}</span><Input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 min-h-11 rounded-md px-2.5 text-xs"/></label>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="text-[10px] font-medium text-slate-500"><span className="mb-1 block">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500">{options.map((option) => <option key={option} value={option}>{option || "ทั้งหมด"}</option>)}</select></label>;
}
