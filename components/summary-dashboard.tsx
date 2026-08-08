"use client";

import type { EChartsOption } from "echarts";
import {
  AlertTriangle,
  Banknote,
  ChartNoAxesCombined,
  CircleGauge,
  Database,
  Plane,
  RefreshCw,
  RotateCcw,
  TableProperties,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { EChart } from "@/components/echart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DashboardFilters, DashboardResult, MetricResult } from "@/lib/dashboard/types";
import { formatDateTime } from "@/lib/utils";

type SummaryDashboardProps = {
  data?: DashboardResult;
  filters: DashboardFilters;
  loading: boolean;
  error?: string;
  onChange: (key: keyof DashboardFilters, value: string) => void;
  onReset: () => void;
  onRefresh: () => void;
};

type AircraftFamily = "fixed" | "rotary";
type Readiness = Record<AircraftFamily, { available: number; unavailable: number }>;

const familyLabels: Record<AircraftFamily, string> = {
  fixed: "เครื่องปีกติด",
  rotary: "เครื่องปีกหมุน",
};

function metric(data: DashboardResult | undefined, id: string) {
  return data?.metrics.find((item) => item.metricId === id);
}

function field(row: Record<string, unknown>, ...names: string[]) {
  const wanted = names.map((name) => name.toLowerCase());
  const entry = Object.entries(row).find(([key]) => wanted.includes(key.toLowerCase()));
  return entry?.[1];
}

function numeric(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown) {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric(value));
}

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(value);
  const parsed = Number(value);
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(parsed)) {
    return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(parsed);
  }
  return String(value);
}

function aircraftFamily(value: unknown): AircraftFamily {
  const type = String(value ?? "").toUpperCase();
  if (
    type.includes("ปีกหมุน") ||
    /(ROTARY|HELICOPTER|HELI|BELL|SIKORSKY|EUROCOPTER|H145|H225|AW\d|EC\d|AS\d)/.test(type)
  ) {
    return "rotary";
  }
  return "fixed";
}

function availability(value: unknown): "available" | "unavailable" {
  const status = String(value ?? "").trim().toLowerCase();
  if (status.includes("ไม่ได้") || /(unavailable|not available|grounded|unserviceable)/.test(status)) {
    return "unavailable";
  }
  return "available";
}

function readinessFrom(rows: Record<string, unknown>[]): Readiness {
  const result: Readiness = {
    fixed: { available: 0, unavailable: 0 },
    rotary: { available: 0, unavailable: 0 },
  };
  for (const row of rows) {
    const family = aircraftFamily(field(row, "type"));
    const state = availability(field(row, "status"));
    result[family][state] += numeric(field(row, "value"));
  }
  return result;
}

function budgetOption(estimated: number, actual: number): EChartsOption {
  return {
    animationDuration: 350,
    color: ["#8d3b91", "#1675dc"],
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      valueFormatter: (value) => `${money(value)} บาท`,
    },
    legend: { bottom: 0, textStyle: { color: "#475569", fontSize: 11 } },
    grid: { left: 12, right: 24, top: 12, bottom: 42, containLabel: true },
    xAxis: {
      type: "value",
      axisLabel: {
        color: "#64748b",
        formatter: (value: number) => new Intl.NumberFormat("th-TH", { notation: "compact", maximumFractionDigits: 1 }).format(value),
      },
      splitLine: { lineStyle: { color: "#e2e8f0" } },
    },
    yAxis: {
      type: "category",
      data: ["รวมทุกโครงการ"],
      axisLabel: { color: "#17346b", fontWeight: "bold" },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      { name: "งบประมาณ", type: "bar", data: [estimated], barWidth: 20, itemStyle: { borderRadius: [0, 6, 6, 0] } },
      { name: "จ่ายจริง", type: "bar", data: [actual], barWidth: 20, itemStyle: { borderRadius: [0, 6, 6, 0] } },
    ],
  };
}

function donutOption(values: { available: number; unavailable: number }): EChartsOption {
  const total = values.available + values.unavailable;
  return {
    animationDuration: 350,
    color: ["#1675dc", "#8d3b91"],
    tooltip: { trigger: "item", formatter: "{b}: {c} ลำ ({d}%)" },
    legend: { bottom: 0, itemWidth: 9, itemHeight: 9, textStyle: { color: "#475569", fontSize: 10 } },
    title: {
      text: new Intl.NumberFormat("th-TH").format(total),
      subtext: "อากาศยาน",
      left: "center",
      top: "34%",
      textStyle: { color: "#17346b", fontSize: 23, fontWeight: "bold" },
      subtextStyle: { color: "#94a3b8", fontSize: 10 },
    },
    series: [{
      type: "pie",
      radius: ["52%", "75%"],
      center: ["50%", "43%"],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: "#ffffff", borderWidth: 3, borderRadius: 4 },
      label: { show: true, formatter: "{c}", color: "#17346b", fontSize: 11, fontWeight: "bold" },
      data: [
        { name: "ใช้งานได้", value: values.available },
        { name: "ใช้งานไม่ได้", value: values.unavailable },
      ],
    }],
  };
}

function MetricWarning({ metric }: { metric?: MetricResult }) {
  if (!metric?.error) return null;
  return (
    <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{metric.error}</span>
    </div>
  );
}

function Panel({ title, subtitle, icon, children, className = "" }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={`min-w-0 overflow-hidden rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,.06)] ${className}`}>
      <header className="flex items-start gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-[#8d3b91]">{icon}</span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#17346b] sm:text-base">{title}</h2>
          <p className="mt-0.5 text-[10px] leading-4 text-slate-500 sm:text-xs">{subtitle}</p>
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </Card>
  );
}

function KpiCard({ title, value, detail, icon, accent, className = "" }: { title: string; value: unknown; detail: string; icon: ReactNode; accent: "violet" | "blue"; className?: string }) {
  const palette = accent === "violet"
    ? { border: "border-violet-100", soft: "bg-violet-50", text: "text-[#8d3b91]", bar: "bg-[#8d3b91]" }
    : { border: "border-blue-100", soft: "bg-blue-50", text: "text-[#1675dc]", bar: "bg-[#1675dc]" };
  return (
    <Card className={`relative min-w-0 overflow-hidden rounded-2xl ${palette.border} shadow-[0_8px_30px_rgba(15,23,42,.06)] ${className}`}>
      <div className={`absolute inset-y-0 left-0 w-1.5 ${palette.bar}`} />
      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#17346b]">{title}</p>
            <p className="mt-1 text-[10px] text-slate-500">Project Budget</p>
          </div>
          <span className={`grid size-10 place-items-center rounded-xl ${palette.soft} ${palette.text}`}>{icon}</span>
        </div>
        <p className={`mt-6 break-words text-2xl font-bold tabular-nums tracking-tight ${palette.text} sm:text-3xl`}>{money(value)}</p>
        <p className="mt-1 text-[10px] font-medium text-slate-400">บาท</p>
        <p className="mt-5 border-t border-slate-100 pt-3 text-[10px] leading-4 text-slate-500">{detail}</p>
      </div>
    </Card>
  );
}

function MatrixTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: Array<{ label: string; values: number[]; total: number }> }) {
  const columnTotals = columns.map((_, index) => rows.reduce((sum, row) => sum + row.values[index], 0));
  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[560px] text-left text-xs text-slate-700">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-[#17346b] text-white">
          <tr>
            <th scope="col" className="px-3 py-2.5 font-semibold">ประเภทอากาศยาน</th>
            {columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">{column}</th>)}
            <th scope="col" className="px-3 py-2.5 text-right font-semibold">รวม</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-slate-100 even:bg-slate-50/70">
              <th scope="row" className="whitespace-nowrap px-3 py-2.5 font-semibold text-[#17346b]">{row.label}</th>
              {row.values.map((value, index) => <td key={`${row.label}-${columns[index]}`} className="px-3 py-2.5 text-right tabular-nums">{value}</td>)}
              <td className="bg-violet-50 px-3 py-2.5 text-right font-bold tabular-nums text-[#8d3b91]">{row.total}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-slate-200 bg-blue-50 font-bold text-[#17346b]">
            <th scope="row" className="px-3 py-2.5">รวม</th>
            {columnTotals.map((value, index) => <td key={`total-${columns[index]}`} className="px-3 py-2.5 text-right tabular-nums">{value}</td>)}
            <td className="px-3 py-2.5 text-right tabular-nums">{grandTotal}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const prPreferredColumns = [
  "PR_NO", "REQUISITION_NO", "PURCHASE_REQ_NO", "RESPONSIBLE", "RESPONSIBLE_ID",
  "START_DATE", "APPROVER", "APPROVAL_DATE", "AUTHORIZED_BY", "STATE", "STATUS",
];

const columnLabels: Record<string, string> = {
  TYPE: "ประเภทเครื่อง",
  "AIRCRAFT NAME": "ชื่ออากาศยาน",
  "AIRCRAFT NO": "หมายเลขอากาศยาน",
  STATUS: "สถานะ",
  RESPONSE: "ผู้ดูแล / Response",
  PR_NO: "เลข PR",
  REQUISITION_NO: "เลข PR",
  PURCHASE_REQ_NO: "เลข PR",
  RESPONSIBLE: "ผู้รับผิดชอบ",
  RESPONSIBLE_ID: "ผู้รับผิดชอบ",
  START_DATE: "วันที่เริ่ม",
  APPROVER: "ผู้ให้เห็นชอบ",
  APPROVAL_DATE: "วันที่เห็นชอบ",
  AUTHORIZED_BY: "ผู้พิจารณา",
  STATE: "สถานะ",
};

function selectedColumns(rows: Record<string, unknown>[], preferred?: string[]) {
  const keys = rows[0] ? Object.keys(rows[0]) : [];
  if (!preferred?.length) return keys;
  const chosen = preferred
    .map((name) => keys.find((key) => key.toLowerCase() === name.toLowerCase()))
    .filter((key): key is string => Boolean(key));
  for (const key of keys) {
    if (chosen.length >= 8) break;
    if (!chosen.includes(key)) chosen.push(key);
  }
  return chosen;
}

function PaginatedTable({ rows, caption, preferredColumns, pageSize = 8 }: { rows: Record<string, unknown>[]; caption: string; preferredColumns?: string[]; pageSize?: number }) {
  const [page, setPage] = useState(1);
  const columns = selectedColumns(rows, preferredColumns);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[760px] text-left text-xs text-slate-700">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-[#17346b]">
            <tr>{columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap border-b border-slate-200 px-3 py-2.5">{columnLabels[column.toUpperCase()] ?? column}</th>)}</tr>
          </thead>
          <tbody>
            {visible.map((row, index) => (
              <tr key={`${currentPage}-${index}`} className="border-b border-slate-100 transition last:border-0 hover:bg-blue-50/60">
                {columns.map((column) => <td key={column} className="max-w-72 truncate whitespace-nowrap px-3 py-2.5" title={String(row[column] ?? "")}>{display(row[column])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="grid min-h-32 place-items-center text-xs text-slate-400">ไม่พบข้อมูลตามตัวกรองนี้</div>}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
        <p>แสดง {rows.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, rows.length)} จาก {rows.length} รายการ</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>ก่อนหน้า</Button>
          <span className="min-w-16 text-center">{currentPage} / {totalPages}</span>
          <Button type="button" variant="secondary" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>ถัดไป</Button>
        </div>
      </div>
    </div>
  );
}

export function SummaryDashboard({ data, filters, loading, error, onChange, onReset, onRefresh }: SummaryDashboardProps) {
  const budgetMetric = metric(data, "summary.budget");
  const readinessMetric = metric(data, "summary.aircraft-readiness");
  const conditionMetric = metric(data, "summary.aircraft-condition");
  const aircraftMetric = metric(data, "summary.aircraft-list");
  const prMetric = metric(data, "summary.pr-status");

  const estimated = numeric(field(budgetMetric?.summary ?? {}, "estimated"));
  const actual = numeric(field(budgetMetric?.summary ?? {}, "actual"));
  const utilization = estimated > 0 ? Math.min(100, actual / estimated * 100) : 0;
  const readiness = useMemo(() => readinessFrom(readinessMetric?.rows ?? []), [readinessMetric?.rows]);
  const readinessRows = (["fixed", "rotary"] as AircraftFamily[]).map((family) => ({
    label: familyLabels[family],
    values: [readiness[family].available, readiness[family].unavailable],
    total: readiness[family].available + readiness[family].unavailable,
  }));

  const conditionMatrix = useMemo(() => {
    const rows = conditionMetric?.rows ?? [];
    const columns = Array.from(new Set(rows.map((row) => String(field(row, "condition") ?? "ไม่ระบุ"))));
    const counts: Record<AircraftFamily, Record<string, number>> = { fixed: {}, rotary: {} };
    for (const row of rows) {
      const family = aircraftFamily(field(row, "type"));
      const condition = String(field(row, "condition") ?? "ไม่ระบุ");
      counts[family][condition] = (counts[family][condition] ?? 0) + 1;
    }
    return {
      columns,
      rows: (["fixed", "rotary"] as AircraftFamily[]).map((family) => {
        const values = columns.map((column) => counts[family][column] ?? 0);
        return { label: familyLabels[family], values, total: values.reduce((sum, value) => sum + value, 0) };
      }),
    };
  }, [conditionMetric?.rows]);

  if (loading && !data) {
    return <div className="grid min-h-screen gap-3 bg-[#f7f9fc] p-3 sm:grid-cols-2 lg:p-5 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-52 animate-pulse rounded-2xl bg-slate-200" />)}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc] px-3 py-3 sm:px-4 lg:px-5">
      <header className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-[#eef0ff] via-white to-[#eaf4ff] p-4 shadow-sm sm:p-5">
        <Plane className="pointer-events-none absolute -bottom-14 right-2 size-56 text-sky-700/[.06]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#8d3b91] to-[#1675dc] text-white shadow-lg shadow-violet-200"><CircleGauge className="size-6" /></span>
            <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d3b91]">TPAD IFSAPP Dashboard</p><h1 className="text-2xl font-bold text-[#17346b] sm:text-3xl">Summary</h1><p className="text-xs text-slate-500">ภาพรวมงบประมาณ · ความพร้อมอากาศยาน · PR Workflow</p></div>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-right shadow-sm backdrop-blur"><p className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-[#17346b]"><Database className="size-3.5 text-blue-600" /> Oracle IFSAPP</p><p className="mt-0.5 text-[9px] text-slate-400">{data ? `ล่าสุด ${formatDateTime(data.generatedAt)}` : "กำลังเชื่อมต่อ"}</p></div>
        </div>
      </header>

      <section aria-label="ตัวกรอง Summary" className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <label className="text-[11px] font-semibold text-slate-600"><span className="mb-1 block">Site</span><select value={filters.site} onChange={(event) => onChange("site", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"><option value="T10">T10</option><option value="T101">T101</option></select></label>
          <div className="flex items-end justify-start gap-2 sm:justify-end"><Button variant="secondary" onClick={onReset} disabled={loading}><RotateCcw className="size-4" /> รีเซ็ต</Button><Button onClick={onRefresh} disabled={loading} className="bg-[#1675dc] hover:bg-blue-700"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> รีเฟรช</Button></div>
        </div>
      </section>

      {error && <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</div>}

      <section aria-label="ภาพรวมงบประมาณ" className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-12">
        <KpiCard title="งบประมาณประจำปี" value={estimated} detail="วงเงินที่ได้รับอนุมัติรวมทุกโครงการ" icon={<Banknote className="size-5" />} accent="violet" className="xl:col-span-3" />
        <KpiCard title="งบจ่ายจริงไปแล้ว" value={actual} detail={`เบิกจ่ายแล้ว ${utilization.toFixed(2)}% ของงบประมาณประจำปี`} icon={<ChartNoAxesCombined className="size-5" />} accent="blue" className="xl:col-span-3" />
        <Panel title="Budget Graph" subtitle="เปรียบเทียบงบประมาณกับงบจ่ายจริงรวมทุกโครงการ" icon={<ChartNoAxesCombined className="size-4" />} className="lg:col-span-2 xl:col-span-6">
          <MetricWarning metric={budgetMetric} />
          <EChart option={budgetOption(estimated, actual)} label="กราฟเปรียบเทียบงบประมาณกับงบจ่ายจริง" className="h-56" />
        </Panel>
      </section>

      <section aria-label="ความพร้อมอากาศยาน" className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-12">
        <Panel title="สถานะอากาศยานเครื่องปีกหมุน" subtitle="Aircraft readiness ของเฮลิคอปเตอร์" icon={<Plane className="size-4" />} className="xl:col-span-3"><MetricWarning metric={readinessMetric} /><EChart option={donutOption(readiness.rotary)} label="Donut Chart สถานะอากาศยานเครื่องปีกหมุน" className="h-64" /></Panel>
        <Panel title="สถานะอากาศยานเครื่องปีกติด" subtitle="Aircraft readiness ของเครื่องบินปีกตรึง" icon={<Plane className="size-4" />} className="xl:col-span-3"><MetricWarning metric={readinessMetric} /><EChart option={donutOption(readiness.fixed)} label="Donut Chart สถานะอากาศยานเครื่องปีกติด" className="h-64" /></Panel>
        <Panel title="จำนวนอากาศยานที่ใช้งานได้" subtitle="Fleet Availability Summary แยกตามประเภทและสถานะ" icon={<TableProperties className="size-4" />} className="lg:col-span-2 xl:col-span-6"><MetricWarning metric={readinessMetric} /><MatrixTable caption="จำนวนอากาศยานที่ใช้งานได้" columns={["ใช้งานได้", "ใช้งานไม่ได้"]} rows={readinessRows} /></Panel>
      </section>

      <div className="mt-3 space-y-3">
        <Panel title="สถานะอากาศยาน แยกตามแผนและประเภท" subtitle="Pivot Matrix แสดง Condition ของอากาศยานแต่ละประเภท" icon={<TableProperties className="size-4" />}><MetricWarning metric={conditionMetric} /><MatrixTable caption="สถานะอากาศยาน แยกตามแผนและประเภท" columns={conditionMatrix.columns} rows={conditionMatrix.rows} /></Panel>
        <Panel title="รายการสถานะอากาศยาน" subtitle="Drill-down รายเครื่อง พร้อมสถานะ หมายเลขอากาศยาน และผู้ดูแล" icon={<Plane className="size-4" />}><MetricWarning metric={aircraftMetric} /><PaginatedTable rows={aircraftMetric?.rows ?? []} caption="รายการสถานะอากาศยาน" preferredColumns={["Type", "Aircraft Name", "Aircraft No", "Status", "Response"]} /></Panel>
        <Panel title="สถานะการจัดทำ PR" subtitle="Workflow การขอซื้อหรือขอจ้างและสถานะการอนุมัติ" icon={<TableProperties className="size-4" />}><MetricWarning metric={prMetric} /><PaginatedTable rows={prMetric?.rows ?? []} caption="สถานะการจัดทำ PR" preferredColumns={prPreferredColumns} /></Panel>
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-[10px] text-slate-500"><p>Last updated: {data ? formatDateTime(data.generatedAt) : "—"}</p><p>Oracle IFSAPP · Read only · Cache 5 นาที</p></footer>
    </div>
  );
}
