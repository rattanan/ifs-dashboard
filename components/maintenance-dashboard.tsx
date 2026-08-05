"use client";

import type { EChartsOption } from "echarts";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  ClipboardList,
  Database,
  Gauge,
  PackageCheck,
  Plane,
  RefreshCw,
  RotateCcw,
  TableProperties,
  Wrench,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { EChart } from "@/components/echart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DashboardFilters, DashboardResult, MetricResult } from "@/lib/dashboard/types";
import { formatDateTime } from "@/lib/utils";

type Props = {
  data?: DashboardResult;
  filters: DashboardFilters;
  loading: boolean;
  error?: string;
  onChange: (key: keyof DashboardFilters, value: string) => void;
  onReset: () => void;
  onRefresh: () => void;
};

const workTypes = ["TO", "SB", "SL", "AD", "MOD", "FLG", "ALS", "ASB", "WPK", "INS", "MPD"];

function metric(data: DashboardResult | undefined, id: string) {
  return data?.metrics.find((item) => item.metricId === id);
}

function field(row: Record<string, unknown>, ...names: string[]) {
  const wanted = names.map((name) => name.toLowerCase());
  return Object.entries(row).find(([key]) => wanted.includes(key.toLowerCase()))?.[1];
}

function numeric(value: unknown) {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function display(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(value);
  return String(value);
}

function backlogOption(rows: Record<string, unknown>[], color = "#1675dc"): EChartsOption {
  const labels = rows.map((row) => String(field(row, "label") ?? "ไม่ระบุ"));
  const values = rows.map((row) => numeric(field(row, "value")));
  return {
    animationDuration: 350,
    color: [color],
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 8, right: 28, top: 8, bottom: 12, containLabel: true },
    xAxis: { type: "value", axisLabel: { color: "#64748b", fontSize: 10 }, splitLine: { lineStyle: { color: "#e2e8f0" } } },
    yAxis: { type: "category", inverse: true, data: labels, axisLabel: { color: "#17346b", fontSize: 10, fontWeight: "bold" }, axisTick: { show: false }, axisLine: { show: false } },
    series: [{ type: "bar", data: values, barMaxWidth: 17, itemStyle: { borderRadius: [0, 5, 5, 0] }, label: { show: true, position: "right", color: "#17346b", fontSize: 10 } }],
  };
}

function Warning({ source }: { source?: MetricResult }) {
  if (!source?.error) return null;
  return <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{source.error}</span></div>;
}

function Panel({ title, subtitle, icon, children, className = "", alert = false }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode; className?: string; alert?: boolean }) {
  return (
    <Card className={`min-w-0 overflow-hidden rounded-2xl border ${alert ? "border-rose-100" : "border-slate-200"} shadow-[0_8px_30px_rgba(15,23,42,.06)] ${className}`}>
      <header className={`flex items-start gap-3 border-b px-4 py-3.5 sm:px-5 ${alert ? "border-rose-100 bg-gradient-to-r from-rose-50 to-white" : "border-slate-100"}`}>
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${alert ? "bg-rose-100 text-rose-600" : "bg-blue-50 text-[#1675dc]"}`}>{icon}</span>
        <div className="min-w-0"><h2 className="text-sm font-bold text-[#17346b] sm:text-base">{title}</h2><p className="mt-0.5 text-[10px] leading-4 text-slate-500 sm:text-xs">{subtitle}</p></div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </Card>
  );
}

function PaginatedTable({ source, pageSize = 7, dangerColumns = [] }: { source?: MetricResult; pageSize?: number; dangerColumns?: string[] }) {
  const rows = source?.rows ?? [];
  const columns = rows[0] ? Object.keys(rows[0]) : [];
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  const visible = rows.slice((current - 1) * pageSize, current * pageSize);
  return (
    <div>
      <Warning source={source} />
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[760px] text-left text-xs text-slate-700">
          <caption className="sr-only">{source?.title ?? "ตารางข้อมูล"}</caption>
          <thead className="bg-[#17346b] text-[10px] uppercase tracking-wide text-white"><tr>{columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap px-3 py-2.5 font-semibold">{column}</th>)}</tr></thead>
          <tbody>{visible.map((row, rowIndex) => <tr key={`${current}-${rowIndex}`} className="border-t border-slate-100 even:bg-slate-50/70 hover:bg-blue-50/70">{columns.map((column) => {
            const dangerous = dangerColumns.some((name) => name.toLowerCase() === column.toLowerCase()) && numeric(row[column]) > 0;
            return <td key={column} className={`max-w-80 truncate whitespace-nowrap px-3 py-2.5 ${dangerous ? "font-bold text-rose-600" : ""}`} title={String(row[column] ?? "")}>{display(row[column])}</td>;
          })}</tr>)}</tbody>
        </table>
        {!rows.length && <div className="grid min-h-32 place-items-center text-xs text-slate-400">ไม่พบข้อมูลตามตัวกรองนี้</div>}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500"><p>แสดง {rows.length ? (current - 1) * pageSize + 1 : 0}–{Math.min(current * pageSize, rows.length)} จาก {rows.length} รายการ</p><div className="flex items-center gap-2"><Button variant="secondary" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>ก่อนหน้า</Button><span>{current} / {totalPages}</span><Button variant="secondary" size="sm" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>ถัดไป</Button></div></div>
    </div>
  );
}

function WorkOrderMatrix({ source }: { source?: MetricResult }) {
  const matrix = useMemo(() => {
    const rows = source?.rows ?? [];
    const aircraft = Array.from(new Set(rows.map((row) => String(field(row, "aircraft") ?? "ไม่ระบุ"))));
    const foundTypes = Array.from(new Set(rows.map((row) => String(field(row, "work type") ?? "ไม่ระบุ"))));
    const columns = [...workTypes.filter((type) => foundTypes.includes(type)), ...foundTypes.filter((type) => !workTypes.includes(type))];
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(`${field(row, "aircraft")}|${field(row, "work type")}`, numeric(field(row, "wo count")));
    return { aircraft, columns, counts };
  }, [source?.rows]);
  const columnTotals = matrix.columns.map((column) => matrix.aircraft.reduce((sum, aircraft) => sum + (matrix.counts.get(`${aircraft}|${column}`) ?? 0), 0));
  return (
    <div>
      <Warning source={source} />
      <div className="max-h-[520px] overflow-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[980px] text-xs text-slate-700"><caption className="sr-only">งานรอดำเนินการ แยกตามอากาศยาน</caption><thead className="sticky top-0 z-10 bg-[#17346b] text-white"><tr><th className="sticky left-0 bg-[#17346b] px-3 py-2.5 text-left">อากาศยาน</th>{matrix.columns.map((column) => <th key={column} className="px-3 py-2.5 text-right">{column}</th>)}<th className="bg-[#8d3b91] px-3 py-2.5 text-right">รวม</th></tr></thead>
          <tbody>{matrix.aircraft.map((aircraft) => { const values = matrix.columns.map((column) => matrix.counts.get(`${aircraft}|${column}`) ?? 0); return <tr key={aircraft} className="border-t border-slate-100 even:bg-slate-50/80"><th className="sticky left-0 bg-inherit px-3 py-2.5 text-left font-bold text-[#17346b]">{aircraft}</th>{values.map((value, index) => <td key={`${aircraft}-${matrix.columns[index]}`} className="px-3 py-2.5 text-right tabular-nums">{value || "—"}</td>)}<td className="bg-violet-50 px-3 py-2.5 text-right font-bold text-[#8d3b91]">{values.reduce((sum, value) => sum + value, 0)}</td></tr>; })}</tbody>
          {matrix.aircraft.length > 0 && <tfoot className="sticky bottom-0 bg-blue-50 font-bold text-[#17346b]"><tr><th className="sticky left-0 bg-blue-50 px-3 py-2.5 text-left">รวม</th>{columnTotals.map((value, index) => <td key={matrix.columns[index]} className="px-3 py-2.5 text-right">{value}</td>)}<td className="px-3 py-2.5 text-right">{columnTotals.reduce((sum, value) => sum + value, 0)}</td></tr></tfoot>}
        </table>
        {!matrix.aircraft.length && <div className="grid min-h-36 place-items-center text-xs text-slate-400">ไม่พบข้อมูลตามตัวกรองนี้</div>}
      </div>
    </div>
  );
}

export function MaintenanceDashboard({ data, filters, loading, error, onChange, onReset, onRefresh }: Props) {
  const get = (id: string) => metric(data, `maintenance.${id}`);
  if (loading && !data) return <div className="grid min-h-screen gap-3 bg-[#f7f9fc] p-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="h-52 animate-pulse rounded-2xl bg-slate-200" />)}</div>;
  return (
    <div className="min-h-screen bg-[#f7f9fc] px-3 py-3 sm:px-4 lg:px-5">
      <header className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-[#eaf4ff] via-white to-[#f3edff] p-4 shadow-sm sm:p-5"><Wrench className="pointer-events-none absolute -bottom-12 right-5 size-52 text-blue-700/[.05]" /><div className="relative flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#1675dc] to-[#8d3b91] text-white shadow-lg shadow-blue-200"><Wrench className="size-6" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#8d3b91]">TPAD IFSAPP Dashboard</p><h1 className="text-xl font-bold text-[#17346b] sm:text-3xl">แผนกช่างและวางแผนการซ่อม</h1><p className="text-xs text-slate-500">ภาพรวม Fleet · Work Order · MMR · PM และ Component</p></div></div><div className="rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-right shadow-sm"><p className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-[#17346b]"><Database className="size-3.5 text-blue-600" /> Oracle IFSAPP</p><p className="mt-0.5 text-[9px] text-slate-400">{data ? `ล่าสุด ${formatDateTime(data.generatedAt)}` : "กำลังเชื่อมต่อ"}</p></div></div></header>

      <section aria-label="ตัวกรอง Dashboard" className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="grid gap-3 sm:grid-cols-[220px_1fr] lg:grid-cols-[220px_1fr_auto]"><label className="text-[11px] font-semibold text-slate-600"><span className="mb-1 block">Site</span><select value={filters.site} onChange={(event) => onChange("site", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"><option value="T10">T10</option><option value="T101">T101</option></select></label><div className="hidden lg:block" /><div className="flex items-end gap-2"><Button variant="secondary" onClick={onReset} disabled={loading}><RotateCcw className="size-4" /> รีเซ็ต</Button><Button onClick={onRefresh} disabled={loading} className="bg-[#1675dc] hover:bg-blue-700"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> รีเฟรช</Button></div></div></section>
      {error && <div className="mt-3 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{error}</div>}

      <section className="mt-3 grid gap-3 xl:grid-cols-12"><Panel title="รายการอากาศยานแยกตามประเภทและสถานะ" subtitle="Fleet และสภาพปัจจุบันของอากาศยานที่ Condition ไม่ใช่ ‘อื่น ๆ’" icon={<Plane className="size-4" />} className="xl:col-span-7"><PaginatedTable source={get("aircraft-list")} /></Panel><Panel title="จำนวนงานคงค้าง แยกตามประเภทของงาน" subtitle="เปรียบเทียบ Backlog ของแต่ละ Work Type" icon={<Gauge className="size-4" />} className="xl:col-span-5"><Warning source={get("wo-work-type")} /><EChart option={backlogOption(get("wo-work-type")?.series ?? [])} label="กราฟจำนวนงานคงค้างแยกตามประเภท" className="h-[330px]" /></Panel></section>
      <div className="mt-3"><Panel title="งานรอดำเนินการ แยกตามอากาศยาน" subtitle="Pivot Matrix: แถวเป็น MCH_CODE คอลัมน์เป็น WORK_TYPE_ID" icon={<TableProperties className="size-4" />}><WorkOrderMatrix source={get("wo-by-aircraft")} /></Panel></div>
      <section className="mt-3 grid gap-3 xl:grid-cols-12"><Panel title="WO แยกตามสถานะ" subtitle="ติดตาม Work Order lifecycle และคอขวดในกระบวนการซ่อม" icon={<ClipboardList className="size-4" />} className="xl:col-span-7"><Warning source={get("wo-status")} /><EChart option={backlogOption(get("wo-status")?.series ?? [], "#8d3b91")} label="กราฟ WO แยกตามสถานะ" className="h-[330px]" /></Panel><Panel title="Fault Report ที่สร้างใหม่" subtitle="Alert รายการความขัดข้องที่ยังต้องประเมิน" icon={<AlertTriangle className="size-4" />} alert className="xl:col-span-5"><PaginatedTable source={get("fault-report")} pageSize={6} /></Panel></section>
      <section className="mt-3 grid gap-3 xl:grid-cols-2"><Panel title="WO Package แยกตามอากาศยาน" subtitle="ชุดงานซ่อมตามรอบและ Package ที่ยังไม่ปิด" icon={<PackageCheck className="size-4" />}><PaginatedTable source={get("wo-packages")} /></Panel><Panel title="อากาศยานที่ไม่มีการบินมากกว่า 7 วัน" subtitle="Exception: เครื่องที่ไม่มีการบันทึก TSN เกิน 7 วัน" icon={<Plane className="size-4" />} alert><PaginatedTable source={get("grounded-list")} dangerColumns={["Grounded Days"]} /></Panel></section>
      <section className="mt-3 grid gap-3 xl:grid-cols-2"><Panel title="รายการใบเบิก MMR ที่รอการอนุมัติ" subtitle="ใบเบิกวัสดุซ่อมสถานะ Planned" icon={<ClipboardList className="size-4" />}><PaginatedTable source={get("mmr-planned")} /></Panel><Panel title="รายการใบเบิก MMR ที่อนุมัติแล้ว" subtitle="ใบเบิกสถานะ Released พร้อมผู้รับของและสถานะคลัง" icon={<PackageCheck className="size-4" />}><PaginatedTable source={get("mmr-released")} /></Panel></section>
      <section className="mt-3 grid gap-3 xl:grid-cols-2"><Panel title="PM ของ Aircraft ที่ครบกำหนดใน 6 เดือน" subtitle="Calendar PM ประเภท WPK ที่ครบกำหนดภายใน 180 วัน" icon={<CalendarClock className="size-4" />}><PaginatedTable source={get("pm-calendar")} /></Panel><Panel title="PM ของ Aircraft ที่ครบกำหนดใน 500 Hrs" subtitle="Condition PM ประเภท WPK/ALS ที่ Remaining ต่ำกว่า 500 ชั่วโมง" icon={<Gauge className="size-4" />} alert><PaginatedTable source={get("pm-500-hours")} dangerColumns={["Remaining"]} /></Panel></section>
      <div className="mt-3"><Panel title="New Part Update" subtitle="Part Serial ที่ยังไม่มีข้อมูล TSN และ TSO" icon={<Boxes className="size-4" />}><PaginatedTable source={get("new-part-update")} /></Panel></div>
      <section className="mt-3 grid gap-3 xl:grid-cols-3"><Panel title="Component: Life Limits" subtitle="เหลืออายุใช้งานน้อยกว่า 100 ชั่วโมง" icon={<AlertTriangle className="size-4" />} alert><PaginatedTable source={get("component-life")} dangerColumns={["Remaining Hours"]} pageSize={6} /></Panel><Panel title="Component: Mid Life Limits" subtitle="Mid-life คงเหลือระหว่าง -1,000 ถึงต่ำกว่า 100 ชั่วโมง" icon={<AlertTriangle className="size-4" />} alert><PaginatedTable source={get("component-midlife")} dangerColumns={["Mid Remain Hr"]} pageSize={6} /></Panel><Panel title="Component ครบกำหนดภายใน 180 วัน" subtitle="Calendar due date และจำนวนวันคงเหลือ" icon={<CalendarClock className="size-4" />} alert><PaginatedTable source={get("component-calendar-due")} dangerColumns={["Days Remaining"]} pageSize={6} /></Panel></section>
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-[10px] text-slate-500"><p>Last updated: {data ? formatDateTime(data.generatedAt) : "—"}</p><p>Oracle IFSAPP · Read only · Cache 5 นาที</p></footer>
    </div>
  );
}
