"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { EChartsOption } from "echarts";
import { AlertTriangle, Clock3, Database, Filter, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EChart } from "@/components/echart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DashboardFilters, DashboardResult, DashboardSlug, MetricResult } from "@/lib/dashboard/types";
import { formatDateTime, formatNumber } from "@/lib/utils";

const themes: Record<DashboardSlug, { accent: string; soft: string; gradient: string; palette: string[] }> = {
  maintenance: { accent: "text-cyan-700", soft: "bg-cyan-50", gradient: "from-cyan-500 to-sky-700", palette: ["#06b6d4", "#0284c7", "#67e8f9", "#155e75", "#a5f3fc"] },
  budget: { accent: "text-indigo-700", soft: "bg-indigo-50", gradient: "from-indigo-600 to-violet-800", palette: ["#4f46e5", "#d9a928", "#8b5cf6", "#818cf8", "#fbbf24"] },
  inventory: { accent: "text-emerald-700", soft: "bg-emerald-50", gradient: "from-emerald-500 to-teal-800", palette: ["#10b981", "#0f766e", "#34d399", "#14b8a6", "#a7f3d0"] },
  procurement: { accent: "text-amber-700", soft: "bg-amber-50", gradient: "from-amber-500 to-[#8d3b91]", palette: ["#f59e0b", "#8d3b91", "#fbbf24", "#a855f7", "#fcd34d"] },
};

const meta: Record<DashboardSlug, { title: string; subtitle: string }> = {
  maintenance: { title: "แผนกช่างและวางแผนการซ่อม", subtitle: "ความพร้อมอากาศยาน งานซ่อม และแผนบำรุงรักษา" },
  budget: { title: "แผนกงบประมาณ", subtitle: "ติดตามงบประมาณ การใช้จ่าย และภาระผูกพัน" },
  inventory: { title: "แผนกคลังพัสดุ", subtitle: "สถานะพัสดุ การรับเข้า การเบิก และสินค้าคงคลัง" },
  procurement: { title: "แผนกจัดซื้อ จ้างซ่อม", subtitle: "RFQ, PR, PO และประสิทธิภาพผู้ขาย" },
};

function valueOf(value: unknown) {
  return typeof value === "number" ? formatNumber(value) : String(value ?? "—");
}

function MetricTable({ rows, caption }: { rows: Record<string, unknown>[]; caption: string }) {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[540px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr>{columns.map((column) => <th key={column} scope="col" className="px-4 py-3">{column}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={index} className="hover:bg-slate-50/80">{columns.map((column) => <td key={column} className="whitespace-nowrap px-4 py-3 text-slate-700">{valueOf(row[column])}</td>)}</tr>)}</tbody>
      </table>
      {!rows.length && <p className="p-6 text-center text-sm text-slate-500">ไม่พบข้อมูลตามตัวกรองนี้</p>}
    </div>
  );
}

function chartOption(metric: MetricResult, palette: string[]): EChartsOption {
  const rows = metric.series ?? [];
  const labels = rows.map((row) => String(row.label ?? "ไม่ระบุ"));
  const values = rows.map((row) => Number(row.value ?? 0));
  const base: EChartsOption = { color: palette, animationDuration: 450, tooltip: { trigger: "axis" }, grid: { left: 12, right: 12, top: 22, bottom: 8, containLabel: true }, textStyle: { fontFamily: "Noto Sans Thai, Tahoma, sans-serif" } };
  if (metric.kind === "donut") return { ...base, tooltip: { trigger: "item" }, legend: { bottom: 0, type: "scroll" }, series: [{ type: "pie", radius: ["48%", "72%"], center: ["50%", "43%"], itemStyle: { borderColor: "#fff", borderWidth: 3, borderRadius: 6 }, label: { formatter: "{b}\n{d}%" }, data: rows.map((row) => ({ name: String(row.label ?? "ไม่ระบุ"), value: Number(row.value ?? 0) })) }] };
  if (metric.kind === "line") return { ...base, xAxis: { type: "category", data: labels, axisLabel: { rotate: labels.length > 7 ? 30 : 0 } }, yAxis: { type: "value" }, series: [{ type: "line", data: values, smooth: true, symbolSize: 8, areaStyle: { opacity: 0.12 }, lineStyle: { width: 3 } }] };
  return { ...base, xAxis: { type: "category", data: labels, axisLabel: { interval: 0, rotate: labels.length > 6 ? 28 : 0, overflow: "truncate", width: 90 } }, yAxis: { type: "value" }, series: [{ type: "bar", data: values, barMaxWidth: 42, itemStyle: { borderRadius: [7, 7, 0, 0] } }] };
}

function MetricCard({ metric, dashboard }: { metric: MetricResult; dashboard: DashboardSlug }) {
  const theme = themes[dashboard];
  const sourceRows = metric.rows ?? metric.series ?? (metric.summary ? [metric.summary] : []);
  const summaryEntries = Object.entries(metric.summary ?? {});
  return (
    <Dialog.Root>
      <Card className={`min-w-0 overflow-hidden ${metric.kind === "table" || metric.kind === "summary" ? "xl:col-span-2" : ""}`}>
        <CardHeader>
          <div><h2 className="font-bold text-slate-950">{metric.title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{metric.description}</p></div>
          {metric.stale && <Badge className="shrink-0 bg-amber-100 text-amber-800">ข้อมูลล่าสุด</Badge>}
        </CardHeader>
        <CardContent>
          {metric.error && !sourceRows.length ? (
            <div className="flex min-h-40 flex-col items-center justify-center rounded-xl bg-rose-50 px-5 text-center"><AlertTriangle className="size-7 text-rose-500" /><p className="mt-3 text-sm font-semibold text-rose-800">Card นี้ไม่สามารถโหลดได้</p><p className="mt-1 line-clamp-2 text-xs text-rose-600">{metric.error}</p></div>
          ) : metric.kind === "kpi" ? (
            <div className={`rounded-2xl ${theme.soft} p-6`}><p className={`text-4xl font-bold tracking-tight ${theme.accent}`}>{valueOf(metric.summary?.value)}</p><p className="mt-2 text-sm text-slate-500">ข้อมูล ณ {formatDateTime(metric.generatedAt)}</p></div>
          ) : metric.kind === "summary" ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{summaryEntries.map(([key, value]) => <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{key}</p><p className="mt-2 text-xl font-bold text-slate-900">{valueOf(value)}</p></div>)}</div>
          ) : metric.kind === "gauge" ? (
            <div className="grid min-h-64 place-items-center"><div className={`grid size-44 place-items-center rounded-full bg-gradient-to-br ${theme.gradient} p-3 shadow-lg`}><div className="grid size-full place-items-center rounded-full bg-white"><div className="text-center"><p className={`text-4xl font-bold ${theme.accent}`}>{valueOf(metric.summary?.value)}%</p><p className="mt-1 text-xs text-slate-500">Budget utilization</p></div></div></div></div>
          ) : metric.kind === "table" ? <MetricTable rows={metric.rows ?? []} caption={metric.title} /> : (
            <><EChart option={chartOption(metric, theme.palette)} label={`กราฟ ${metric.title}`} /><div className="sr-only"><MetricTable rows={metric.series ?? []} caption={`ข้อมูลสำหรับกราฟ ${metric.title}`} /></div></>
          )}
          {sourceRows.length > 0 && <Dialog.Trigger asChild><Button variant="ghost" className="mt-3 w-full">ดูรายละเอียดข้อมูล</Button></Dialog.Trigger>}
        </CardContent>
      </Card>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 overflow-y-auto bg-white p-5 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[min(720px,92vw)] sm:p-7 sm:shadow-2xl">
          <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-xl font-bold text-slate-950">{metric.title}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-500">{metric.description}</Dialog.Description></div><Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="ปิดรายละเอียด"><X className="size-5" /></Button></Dialog.Close></div>
          <div className="mt-6"><MetricTable rows={sourceRows} caption={`รายละเอียด ${metric.title}`} /></div>
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-400"><Database className="size-4" /> IFS Oracle · อ่านอย่างเดียว · {formatDateTime(metric.generatedAt)}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function DashboardPage({ dashboard }: { dashboard: DashboardSlug }) {
  const [filters, setFilters] = useState<DashboardFilters>({ site: "T10", projectId: dashboard === "budget" ? "B6201" : undefined });
  const [data, setData] = useState<DashboardResult>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, String(value)])).toString(), [filters]);

  const load = useCallback(async (force = false) => {
    setLoading(true); setError(undefined);
    try {
      const response = await fetch(force ? `/api/dashboards/${dashboard}/refresh` : `/api/dashboards/${dashboard}?${query}`, force ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(filters) } : undefined);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "ไม่สามารถโหลด Dashboard ได้");
      setData(body);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "ไม่สามารถโหลด Dashboard ได้"); }
    finally { setLoading(false); }
  }, [dashboard, filters, query]);

  useEffect(() => {
    let active = true;
    fetch(`/api/dashboards/${dashboard}?${query}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "ไม่สามารถโหลด Dashboard ได้");
        if (active) setData(body);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "ไม่สามารถโหลด Dashboard ได้");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [dashboard, query]);
  const change = (key: keyof DashboardFilters, value: string) => setFilters((current) => ({ ...current, [key]: value || undefined }));

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <header className={`relative overflow-hidden rounded-[26px] bg-gradient-to-r ${themes[dashboard].gradient} px-5 py-7 text-white sm:px-8`}><div className="absolute -right-12 -top-16 size-56 rounded-full border-[34px] border-white/10" /><div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">IFS Executive Dashboard</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">{meta[dashboard].title}</h1><p className="mt-2 max-w-2xl text-sm text-white/80">{meta[dashboard].subtitle}</p></div></header>

      <section aria-label="ตัวกรอง Dashboard" className="sticky top-16 z-20 mt-4 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur lg:top-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-32 flex-1 text-xs font-semibold text-slate-600"><span className="mb-1.5 flex items-center gap-1"><Filter className="size-3.5" /> Site</span><select value={filters.site} onChange={(e) => change("site", e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"><option>T10</option><option>T101</option></select></label>
          {dashboard === "budget" && <><label className="min-w-36 flex-1 text-xs font-semibold text-slate-600">Project ID<Input className="mt-1.5" value={filters.projectId ?? ""} onChange={(e) => change("projectId", e.target.value)} placeholder="B6201" /></label><label className="min-w-32 flex-1 text-xs font-semibold text-slate-600">ปีงบประมาณ<Input className="mt-1.5" value={filters.fiscalYear ?? ""} onChange={(e) => change("fiscalYear", e.target.value)} placeholder="2569" /></label></>}
          {dashboard === "inventory" && <><label className="min-w-36 flex-1 text-xs font-semibold text-slate-600">Location Group<select value={filters.locationGroup ?? ""} onChange={(e) => change("locationGroup", e.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">ทั้งหมด</option>{["DM-A","DM-A1","DM-L","DM-P","DM-UN","TPAD","TR-L","TR-P"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="min-w-40 flex-[2] text-xs font-semibold text-slate-600">ค้นหา Location<Input className="mt-1.5" value={filters.locationSearch ?? ""} onChange={(e) => change("locationSearch", e.target.value)} placeholder="รหัสหรือชื่อ Location" /></label></>}
          {dashboard === "procurement" && <><label className="min-w-32 flex-1 text-xs font-semibold text-slate-600">Buyer<Input className="mt-1.5" value={filters.buyer ?? ""} onChange={(e) => change("buyer", e.target.value)} placeholder="ทั้งหมด" /></label><label className="min-w-40 flex-1 text-xs font-semibold text-slate-600">Supplier<Input className="mt-1.5" value={filters.supplier ?? ""} onChange={(e) => change("supplier", e.target.value)} placeholder="ทั้งหมด" /></label></>}
          <Button onClick={() => void load(true)} disabled={loading} className="shrink-0"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
        </div>
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><p className="flex items-center gap-1.5"><Clock3 className="size-4" />{data ? `อัปเดตล่าสุด ${formatDateTime(data.generatedAt)}` : "กำลังเชื่อมต่อ IFS Oracle"}</p><p>Cache 5 นาที · stale fallback สูงสุด 30 นาที</p></div>
      {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
      {loading && !data ? <div className="mt-6 grid gap-4 md:grid-cols-2"><div className="h-72 animate-pulse rounded-2xl bg-slate-200" /><div className="h-72 animate-pulse rounded-2xl bg-slate-200" /><div className="h-52 animate-pulse rounded-2xl bg-slate-200 md:col-span-2" /></div> : <div className="mt-6 grid gap-4 md:grid-cols-2">{data?.metrics.map((metric) => <MetricCard key={metric.metricId} metric={metric} dashboard={dashboard} />)}</div>}
    </div>
  );
}
