"use client";

import type { EChartsOption } from "echarts";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Database,
  Gauge,
  PackageSearch,
  Plane,
  PlaneTakeoff,
  CircleHelp,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { EChart } from "@/components/echart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DashboardFilters, DashboardResult, MetricResult } from "@/lib/dashboard/types";
import {
  fleetReadinessSeed,
  fleetStatusLabels,
  normalizeFlightHours,
  normalizeFleetStatus,
  type FleetReadinessSnapshot,
  type FleetStatusCounts,
  type FleetStatusKey,
} from "@/lib/dashboard/fleet-readiness-data";
import { formatDateTime, formatNumber } from "@/lib/utils";

type Props = {
  data?: DashboardResult;
  filters: DashboardFilters;
  loading: boolean;
  error?: string;
  onChange: (key: keyof DashboardFilters, value: string) => void;
  onReset: () => void;
  onRefresh: () => void;
};

const statusOrder: FleetStatusKey[] = ["ready", "maintenance", "parts", "grounded", "unknown"];
const statusColors: Record<FleetStatusKey, string> = {
  ready: "#279532",
  maintenance: "#f0b429",
  parts: "#ed6b28",
  grounded: "#d94b65",
  unknown: "#64748b",
};
const statusSoftColors: Record<FleetStatusKey, string> = {
  ready: "#ecf8ee",
  maintenance: "#fff8df",
  parts: "#fff0e7",
  grounded: "#fdecef",
  unknown: "#f1f5f9",
};

function metric(data: DashboardResult | undefined, id: string) {
  return data?.metrics.find((item) => item.metricId === id);
}

function field(row: Record<string, unknown>, ...names: string[]) {
  const wanted = names.map((name) => name.toLowerCase());
  return Object.entries(row).find(([key]) => wanted.includes(key.toLowerCase()))?.[1];
}

function numeric(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function countsFromAircraft(rows: FleetReadinessSnapshot["aircraft"]): FleetStatusCounts {
  const counts: FleetStatusCounts = { ready: 0, maintenance: 0, parts: 0, grounded: 0, unknown: 0 };
  for (const row of rows) counts[row.status] += 1;
  return counts;
}

function aircraftRows(source: MetricResult | undefined) {
  const rows = source?.rows ?? [];
  if (!rows.length) return fleetReadinessSeed.aircraft;
  return rows.map((row, index) => ({
    rank: numeric(field(row, "rank"), index + 1),
    aircraft: String(field(row, "aircraft", "aircraft id", "mch code") ?? `AIR-${index + 1}`),
    model: String(field(row, "model", "description", "type") ?? "—"),
    type: String(field(row, "type", "machine type") ?? "Helicopter") as "Helicopter" | "Fixed Wing",
    flightHours: normalizeFlightHours(field(row, "flight hours", "flightHours", "hours")),
    status: normalizeFleetStatus(field(row, "status", "condition")),
    event: String(field(row, "event", "response", "last activity") ?? "—"),
  }));
}

function statusCountsFromMetric(source: MetricResult | undefined, fallback: FleetStatusCounts) {
  const rows = source?.rows ?? [];
  const counts: FleetStatusCounts = { ready: 0, maintenance: 0, parts: 0, grounded: 0, unknown: 0 };
  for (const row of rows) counts[normalizeFleetStatus(field(row, "status", "condition"))] += numeric(field(row, "value", "count"));
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  return total > 0 ? counts : fallback;
}

function byTypeFromMetric(source: MetricResult | undefined, fallback: FleetReadinessSnapshot["byType"]) {
  const rows = source?.rows ?? [];
  const grouped = new Map<string, FleetReadinessSnapshot["byType"][number]>();
  for (const row of rows) {
    const type = String(field(row, "type", "unit") ?? "Helicopter");
    const current = grouped.get(type) ?? { type: type as "Helicopter" | "Fixed Wing", total: 0, ready: 0, maintenance: 0, parts: 0, grounded: 0, unknown: 0 };
    const status = normalizeFleetStatus(field(row, "status", "condition"));
    const value = numeric(field(row, "value", "count"));
    current[status] += value;
    current.total += value;
    grouped.set(type, current);
  }
  return grouped.size ? Array.from(grouped.values()) : fallback;
}

function unitRows(source: MetricResult | undefined, fallback: FleetReadinessSnapshot["unitAvailability"]) {
  const rows = source?.rows ?? [];
  const parsed = rows
    .map((row) => {
      const total = numeric(field(row, "total"));
      const available = numeric(field(row, "available", "ready"));
      const rate = numeric(field(row, "rate", "availability"), total > 0 ? available / total * 100 : 0);
      return { unit: String(field(row, "unit", "type") ?? "ไม่ระบุ"), available, total, rate };
    })
    .filter((row) => row.total > 0);
  return parsed.length ? parsed : fallback;
}

function viewModel(data: DashboardResult | undefined) {
  const list = metric(data, "fleet-readiness.aircraft-list");
  const status = metric(data, "fleet-readiness.status-summary");
  const trend = metric(data, "fleet-readiness.availability-trend");
  const kpis = metric(data, "fleet-readiness.kpis");
  const units = metric(data, "fleet-readiness.unit-availability");
  const aircraft = aircraftRows(list);
  const statusCounts = statusCountsFromMetric(status, countsFromAircraft(aircraft.length ? aircraft : fleetReadinessSeed.aircraft));
  const actualTotal = Object.values(statusCounts).reduce((sum, value) => sum + value, 0);
  const summary = kpis?.summary ?? {};
  const readKpi = (name: string, fallback: number) => numeric(field(summary, name), fallback);
  const sources = new Set(
    (data?.metrics ?? [])
      .map((item) => item.dataSource ?? (item.error ? undefined : "Oracle IFSAPP"))
      .filter((source): source is "Oracle IFSAPP" | "MariaDB seed" => Boolean(source)),
  );
  const usingSeed = !data || sources.has("MariaDB seed");
  const sourceLabel = sources.size > 1 ? "Oracle IFSAPP + MariaDB seed" : usingSeed ? "MariaDB seed" : "Oracle IFSAPP";
  const trendRows = (trend?.series ?? [])
    .map((row) => ({ label: String(field(row, "label") ?? "—"), value: numeric(field(row, "value")) }))
    .filter((row) => row.value > 0);

  return {
    totalAircraft: actualTotal || readKpi("aircraftTotal", fleetReadinessSeed.totalAircraft),
    statusCounts,
    byType: byTypeFromMetric(status, fleetReadinessSeed.byType),
    availabilityTrend: trendRows.length ? trendRows : fleetReadinessSeed.availabilityTrend,
    kpis: {
      mtbf: readKpi("mtbf", fleetReadinessSeed.kpis.mtbf),
      mtbfDelta: readKpi("mtbfDelta", fleetReadinessSeed.kpis.mtbfDelta),
      mttr: readKpi("mttr", fleetReadinessSeed.kpis.mttr),
      mttrDelta: readKpi("mttrDelta", fleetReadinessSeed.kpis.mttrDelta),
      grounded: readKpi("grounded", fleetReadinessSeed.kpis.grounded),
      groundedDelta: readKpi("groundedDelta", fleetReadinessSeed.kpis.groundedDelta),
      daysSinceLastFlight: readKpi("daysSinceLastFlight", fleetReadinessSeed.kpis.daysSinceLastFlight),
      daysSinceLastFlightDelta: readKpi("daysSinceLastFlightDelta", fleetReadinessSeed.kpis.daysSinceLastFlightDelta),
      flightHours: readKpi("flightHours", fleetReadinessSeed.kpis.flightHours),
      flightHoursDelta: readKpi("flightHoursDelta", fleetReadinessSeed.kpis.flightHoursDelta),
      utilization: readKpi("utilization", fleetReadinessSeed.kpis.utilization),
      utilizationDelta: readKpi("utilizationDelta", fleetReadinessSeed.kpis.utilizationDelta),
    },
    aircraft,
    unitAvailability: unitRows(units, fleetReadinessSeed.unitAvailability),
    sourceLabel,
    usingSeed,
    generatedAt: data?.generatedAt ?? fleetReadinessSeed.generatedAt,
  };
}

function panelTitle(title: string, subtitle: string, icon: ReactNode) {
  return (
    <header className="flex items-start gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#1675dc]">{icon}</span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-[#17346b] sm:text-base">{title}</h2>
        <p className="mt-0.5 text-[10px] leading-4 text-slate-500 sm:text-xs">{subtitle}</p>
      </div>
    </header>
  );
}

function Panel({ title, subtitle, icon, children, className = "" }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return <Card className={`min-w-0 overflow-hidden rounded-2xl border-slate-200 shadow-[0_8px_30px_rgba(15,23,42,.06)] ${className}`}>{panelTitle(title, subtitle, icon)}<div className="p-4 sm:p-5">{children}</div></Card>;
}

function donutOption(counts: FleetStatusCounts): EChartsOption {
  return {
    animationDuration: 450,
    color: statusOrder.map((status) => statusColors[status]),
    tooltip: { trigger: "item", backgroundColor: "rgba(15,23,42,.94)", borderColor: "#334155", textStyle: { color: "#fff", fontSize: 11 } },
    legend: { orient: "vertical", right: 4, top: "middle", itemWidth: 9, itemHeight: 9, itemGap: 12, textStyle: { color: "#475569", fontSize: 10 } },
    series: [{
      type: "pie",
      radius: ["51%", "74%"],
      center: ["31%", "50%"],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: "#fff", borderWidth: 3 },
      label: { show: false },
      data: statusOrder.map((status) => ({ name: fleetStatusLabels[status], value: counts[status] })),
    }],
  };
}

function trendOption(rows: Array<{ label: string; value: number }>): EChartsOption {
  return {
    animationDuration: 450,
    color: ["#1675dc"],
    tooltip: { trigger: "axis", valueFormatter: (value) => `${value}%`, backgroundColor: "rgba(15,23,42,.94)", borderColor: "#334155", textStyle: { color: "#fff", fontSize: 11 } },
    grid: { left: 6, right: 16, top: 18, bottom: 10, containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: rows.map((row) => row.label), axisLabel: { color: "#64748b", fontSize: 10 }, axisLine: { lineStyle: { color: "#dbeafe" } } },
    yAxis: { type: "value", min: 0, max: 100, interval: 25, axisLabel: { color: "#64748b", fontSize: 10, formatter: "{value}%" }, splitLine: { lineStyle: { color: "#e2e8f0", type: "dashed" } } },
    series: [{ type: "line", data: rows.map((row) => row.value), smooth: true, symbol: "circle", symbolSize: 7, lineStyle: { width: 3, color: "#1675dc" }, itemStyle: { color: "#1675dc", borderColor: "#fff", borderWidth: 2 }, areaStyle: { color: "rgba(22,117,220,.14)" }, label: { show: true, position: "top", color: "#17346b", fontSize: 10, formatter: "{c}%" } }],
  };
}

function byTypeOption(rows: FleetReadinessSnapshot["byType"]): EChartsOption {
  const series = statusOrder.map((status) => ({
    name: fleetStatusLabels[status],
    type: "bar" as const,
    stack: "aircraft",
    barWidth: 28,
    itemStyle: { color: statusColors[status], borderRadius: status === "grounded" ? [0, 5, 5, 0] : undefined },
    label: { show: true, position: "inside" as const, color: "#fff", fontSize: 10, formatter: "{c}" },
    data: rows.map((row) => row[status]),
  }));
  return {
    animationDuration: 450,
    color: statusOrder.map((status) => statusColors[status]),
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, backgroundColor: "rgba(15,23,42,.94)", borderColor: "#334155", textStyle: { color: "#fff", fontSize: 11 } },
    legend: { top: 0, right: 0, itemWidth: 9, itemHeight: 9, textStyle: { color: "#475569", fontSize: 9 } },
    grid: { left: 4, right: 12, top: 34, bottom: 8, containLabel: true },
    xAxis: { type: "value", max: 25, axisLabel: { color: "#64748b", fontSize: 9 }, splitLine: { lineStyle: { color: "#e2e8f0" } } },
    yAxis: { type: "category", data: rows.map((row) => `${row.type}\n${row.total} ลำ`), axisLabel: { color: "#17346b", fontSize: 10, lineHeight: 16 }, axisTick: { show: false }, axisLine: { show: false } },
    series,
  };
}

function StatusBadge({ status }: { status: FleetStatusKey }) {
  return <Badge className="whitespace-nowrap px-2 py-1 text-[10px]" style={{ backgroundColor: statusSoftColors[status], color: statusColors[status] }}>{fleetStatusLabels[status]}</Badge>;
}

function HeadlineCard({ label, value, unit, detail, color, icon }: { label: string; value: string | number; unit: string; detail: string; color: string; icon: ReactNode }) {
  return <Card className="relative min-w-0 overflow-hidden rounded-2xl border-slate-200 p-4 shadow-[0_8px_30px_rgba(15,23,42,.06)]"><span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: color }} /><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-[11px] font-bold text-[#17346b]" title={label}>{label}</p><p className="mt-3 truncate text-[28px] font-bold leading-none tabular-nums" style={{ color }}>{formatNumber(value)} <span className="text-[11px] font-medium text-slate-400">{unit}</span></p></div><span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `${color}12`, color }}>{icon}</span></div><p className="mt-3 truncate border-t border-slate-100 pt-2 text-[10px] text-slate-500">{detail}</p></Card>;
}

type SecondaryKpi = { label: string; value: number; unit: string; delta: number; color: string; icon: ReactNode; inverse?: boolean };

function SecondaryKpiCard({ item }: { item: SecondaryKpi }) {
  const favorable = item.inverse ? item.delta < 0 : item.delta > 0;
  const TrendIcon = item.delta >= 0 ? ArrowUpRight : ArrowDownRight;
  return <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4"><div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${item.color}12`, color: item.color }}>{item.icon}</span><p className="truncate text-[10px] font-semibold text-slate-600" title={item.label}>{item.label}</p></div><span className={`flex shrink-0 items-center text-[10px] font-bold ${favorable ? "text-emerald-600" : "text-rose-600"}`}><TrendIcon className="size-3.5" /> {Math.abs(item.delta).toFixed(1)}%</span></div><p className="mt-4 text-2xl font-bold tabular-nums" style={{ color: item.color }}>{formatNumber(item.value)} <span className="text-[10px] font-medium text-slate-400">{item.unit}</span></p><p className="mt-1 text-[9px] text-slate-400">เทียบกับช่วงก่อนหน้า</p></div>;
}

function AircraftTable({ rows }: { rows: FleetReadinessSnapshot["aircraft"] }) {
  return <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[700px] text-left text-xs text-slate-700"><caption className="sr-only">สถานะอากาศยานรายลำ Top 10</caption><thead className="bg-[#17346b] text-[10px] font-semibold text-white"><tr><th scope="col" className="px-3 py-2.5 text-center">#</th><th scope="col" className="px-3 py-2.5">Aircraft ID</th><th scope="col" className="px-3 py-2.5">ประเภท</th><th scope="col" className="px-3 py-2.5 text-right">ชั่วโมงบินสะสม</th><th scope="col" className="px-3 py-2.5">สถานะปัจจุบัน</th><th scope="col" className="px-3 py-2.5">ภารกิจล่าสุด / กำหนดการ</th></tr></thead><tbody>{rows.map((row) => <tr key={row.aircraft} className="border-t border-slate-100 even:bg-slate-50/70 hover:bg-blue-50/70"><td className="px-3 py-2.5 text-center text-slate-400">{row.rank}</td><th scope="row" className="whitespace-nowrap px-3 py-2.5 font-semibold text-[#17346b]">{row.aircraft}</th><td className="px-3 py-2.5"><span className="whitespace-nowrap">{row.model}</span><span className="ml-1 text-[10px] text-slate-400">· {row.type}</span></td><td className="px-3 py-2.5 text-right tabular-nums">{row.flightHours === null ? <span className="text-slate-400">—</span> : formatNumber(row.flightHours)}</td><td className="px-3 py-2.5"><StatusBadge status={row.status} /></td><td className="max-w-44 truncate px-3 py-2.5 text-slate-500" title={row.event}>{row.event}</td></tr>)}</tbody></table></div>;
}

function UnitAvailability({ rows }: { rows: FleetReadinessSnapshot["unitAvailability"] }) {
  return <div className="space-y-4">{rows.map((row) => { const barColor = row.rate >= 70 ? "#279532" : row.rate >= 60 ? "#f0b429" : "#ed6b28"; return <div key={row.unit}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-full border border-amber-200 bg-amber-50 text-[#d9a928]"><Plane className="size-4" /></span><p className="min-w-0 truncate text-[11px] font-medium text-slate-600" title={row.unit}>{row.unit}</p></div><div className="shrink-0 text-right"><p className="text-sm font-bold text-[#17346b]">{row.rate.toFixed(1)}%</p><p className="text-[9px] text-slate-400">{row.available} / {row.total} ลำ</p></div></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, row.rate))}%`, backgroundColor: barColor }} /></div></div>; })}</div>;
}

export function FleetReadinessDashboard({ data, filters, loading, error, onChange, onReset, onRefresh }: Props) {
  const view = useMemo(() => viewModel(data), [data]);
  const availability = view.totalAircraft > 0 ? view.statusCounts.ready / view.totalAircraft * 100 : 0;
  const availabilityDetail = view.availabilityTrend.length > 1
    ? `เทียบกับช่วงก่อนหน้า ${view.availabilityTrend.at(-1)!.value - view.availabilityTrend.at(-2)!.value >= 0 ? "+" : ""}${(view.availabilityTrend.at(-1)!.value - view.availabilityTrend.at(-2)!.value).toFixed(1)}%`
    : "ข้อมูลปัจจุบันจาก Oracle IFSAPP";
  const donut = useMemo(() => donutOption(view.statusCounts), [view.statusCounts]);
  const trend = useMemo(() => trendOption(view.availabilityTrend), [view.availabilityTrend]);
  const byType = useMemo(() => byTypeOption(view.byType), [view.byType]);
  const secondaryKpis: SecondaryKpi[] = [
    { label: "MTBF (ชั่วโมง)", value: view.kpis.mtbf, unit: "ชม.", delta: view.kpis.mtbfDelta, color: "#279532", icon: <Clock3 className="size-4" /> },
    { label: "MTTR (ชั่วโมง)", value: view.kpis.mttr, unit: "ชม.", delta: view.kpis.mttrDelta, color: "#1675dc", icon: <Wrench className="size-4" />, inverse: true },
    { label: "Aircraft On Ground", value: view.kpis.grounded, unit: "ลำ", delta: view.kpis.groundedDelta, color: "#d94b65", icon: <ShieldAlert className="size-4" /> },
    { label: "Days Since Last Flight", value: view.kpis.daysSinceLastFlight, unit: "วัน", delta: view.kpis.daysSinceLastFlightDelta, color: "#d94b65", icon: <CalendarDays className="size-4" /> },
    { label: "Flight Hours (รวม)", value: view.kpis.flightHours, unit: "ชม.", delta: view.kpis.flightHoursDelta, color: "#279532", icon: <PlaneTakeoff className="size-4" /> },
    { label: "Utilization Rate", value: view.kpis.utilization, unit: "%", delta: view.kpis.utilizationDelta, color: "#1675dc", icon: <Gauge className="size-4" /> },
  ];

  return <div className="min-h-screen bg-[#f7f9fc] px-3 py-3 sm:px-4 lg:px-5">
    <header className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-[#eef0ff] via-white to-[#eaf4ff] p-4 shadow-sm sm:p-5">
      <PlaneTakeoff className="pointer-events-none absolute -bottom-16 right-4 size-64 text-sky-700/[.06]" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#1675dc] to-[#8d3b91] text-white shadow-lg shadow-blue-200"><CircleGauge className="size-6" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d3b91]">TPAD IFSAPP · Fleet Analytics</p><h1 className="text-2xl font-bold leading-tight text-[#17346b] sm:text-3xl">Fleet Readiness Dashboard</h1><p className="mt-0.5 text-xs text-slate-500">มุมมองผู้บริหารสำหรับ Mission Ready, Grounded, Availability, MTBF และ MTTR</p></div></div>
        <div className="flex items-center gap-2 rounded-xl border border-white/80 bg-white/80 px-3 py-2 shadow-sm backdrop-blur"><div className="text-right"><p className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-[#17346b]"><Database className={view.usingSeed ? "size-3.5 text-amber-500" : "size-3.5 text-emerald-600"} /> {view.sourceLabel}</p><p className="mt-0.5 text-[9px] text-slate-400">ข้อมูลล่าสุด {formatDateTime(view.generatedAt)}</p></div><span className={`size-2 rounded-full ${view.usingSeed ? "bg-amber-400" : "bg-emerald-500"}`} aria-label={view.usingSeed ? "ใช้ข้อมูล seed" : "เชื่อมต่อ Oracle แล้ว"} /> </div>
      </div>
    </header>

    <section aria-label="ตัวกรอง Fleet Readiness" className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[180px_220px_1fr_auto]"><label className="text-[11px] font-semibold text-slate-600"><span className="mb-1 block">Site</span><select value={filters.site} onChange={(event) => onChange("site", event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"><option value="T10">T10</option><option value="T101">T101</option></select></label><label className="text-[11px] font-semibold text-slate-600"><span className="mb-1 block">ช่วงข้อมูล</span><select defaultValue="6" className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"><option value="1">30 วันล่าสุด</option><option value="6">6 เดือนล่าสุด</option><option value="12">12 เดือนล่าสุด</option></select></label><div className="hidden lg:block" /><div className="flex items-end gap-2"><Button variant="secondary" onClick={onReset} disabled={loading}><RotateCcw className="size-4" /> รีเซ็ต</Button><Button onClick={onRefresh} disabled={loading} className="bg-[#1675dc] hover:bg-blue-700"><RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} /> รีเฟรช</Button></div></div></section>

    {error && <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{error}</span></div>}
    {view.usingSeed && <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><Database className="mt-0.5 size-4 shrink-0" /><span>Oracle ยังไม่มีข้อมูล Fleet Readiness ที่พร้อมใช้ จึงแสดงข้อมูล seed จาก MariaDB เพื่อให้ใช้งานและตรวจสอบ layout ได้ก่อน</span></div>}

    <section aria-label="Fleet readiness headline cards" className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7"><HeadlineCard label="อากาศยานทั้งหมด" value={view.totalAircraft} unit="ลำ" detail="Fleet registry" color="#1675dc" icon={<Plane className="size-4" />} /><HeadlineCard label="พร้อมปฏิบัติการ" value={view.statusCounts.ready} unit="ลำ" detail={`${percent(availability)} ของ Fleet ทั้งหมด`} color="#279532" icon={<CheckCircle2 className="size-4" />} /><HeadlineCard label="อยู่ระหว่างซ่อมบำรุง" value={view.statusCounts.maintenance} unit="ลำ" detail={`${percent(view.statusCounts.maintenance / view.totalAircraft * 100)} ของ Fleet ทั้งหมด`} color="#f0b429" icon={<Wrench className="size-4" />} /><HeadlineCard label="รออะไหล่" value={view.statusCounts.parts} unit="ลำ" detail={`${percent(view.statusCounts.parts / view.totalAircraft * 100)} ของ Fleet ทั้งหมด`} color="#ed6b28" icon={<PackageSearch className="size-4" />} /><HeadlineCard label="หยุดใช้งาน (Grounded)" value={view.statusCounts.grounded} unit="ลำ" detail={`${percent(view.statusCounts.grounded / view.totalAircraft * 100)} ของ Fleet ทั้งหมด`} color="#d94b65" icon={<ShieldAlert className="size-4" />} /><HeadlineCard label="ไม่ระบุสถานะ" value={view.statusCounts.unknown} unit="ลำ" detail={`${percent(view.statusCounts.unknown / view.totalAircraft * 100)} ของ Fleet ทั้งหมด`} color="#64748b" icon={<CircleHelp className="size-4" />} /><HeadlineCard label="Availability Rate" value={availability} unit="%" detail={availabilityDetail} color="#0d9dc7" icon={<Activity className="size-4" />} /></section>

    <section aria-label="Fleet readiness charts" className="mt-3 grid gap-3 xl:grid-cols-12"><Panel title="สถานะความพร้อมใช้งาน" subtitle="สัดส่วนอากาศยานทั้งหมดแยกตามสถานะ" icon={<CircleGauge className="size-4" />} className="xl:col-span-4"><div className="relative"><EChart option={donut} label="Donut chart สถานะความพร้อมใช้งาน" className="h-64" /><div className="pointer-events-none absolute left-[31%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"><p className="text-3xl font-bold leading-none text-[#17346b]">{view.totalAircraft}</p><p className="mt-1 text-[10px] text-slate-500">ลำ<br />Total</p></div></div></Panel><Panel title="แนวโน้ม Availability Rate" subtitle="ย้อนหลัง 6 เดือน" icon={<TrendingUp className="size-4" />} className="xl:col-span-4"><EChart option={trend} label="Line chart แนวโน้ม Availability Rate" className="h-64" /></Panel><Panel title="อากาศยานตามสถานะ (แยกประเภท)" subtitle="เปรียบเทียบ Helicopter และ Fixed Wing" icon={<BarChart3 className="size-4" />} className="xl:col-span-4"><EChart option={byType} label="Stacked bar chart อากาศยานตามสถานะและประเภท" className="h-64" /></Panel></section>

    <section aria-label="Fleet reliability details" className="mt-3 grid gap-3 xl:grid-cols-12"><Panel title="ตัวชี้วัดสำคัญ" subtitle="Reliability, flight activity และการใช้ประโยชน์ฝูงบิน" icon={<Gauge className="size-4" />} className="xl:col-span-5"><div className="grid grid-cols-2 gap-2.5">{secondaryKpis.map((item) => <SecondaryKpiCard key={item.label} item={item} />)}</div></Panel><Panel title="สถานะอากาศยานรายลำ (Top 10)" subtitle="เรียงตามทะเบียนเครื่องและชั่วโมงบินสะสม" icon={<Plane className="size-4" />} className="xl:col-span-7"><AircraftTable rows={view.aircraft} /></Panel></section>

    <section className="mt-3"><Panel title="Availability Rate ตามฐานบิน" subtitle="เปรียบเทียบอากาศยานพร้อมใช้และ Fleet ทั้งหมดของแต่ละหน่วย" icon={<PlaneTakeoff className="size-4" />}><UnitAvailability rows={view.unitAvailability} /></Panel></section>

    <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-[10px] text-slate-500"><p className="flex items-center gap-1"><Clock3 className="size-3.5" /> Last updated: {formatDateTime(view.generatedAt)}</p><p className="flex items-center gap-1"><Database className="size-3.5" /> {view.sourceLabel} · Read only · Cache 5 นาที</p></footer>
  </div>;
}
