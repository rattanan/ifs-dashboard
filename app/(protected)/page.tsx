import {
  ArrowRight,
  Bell,
  Boxes,
  CircleGauge,
  Database,
  Grid2X2,
  LayoutDashboard,
  Plane,
  ReceiptText,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/session";
import { getPublishedContentsForUser, getUnreadContentCount } from "@/lib/content";
import { loadHomeDashboardHighlights, type HomeHighlightMetric } from "@/lib/dashboard/home-highlights";
import type { DashboardSlug } from "@/lib/dashboard/types";
import { formatDateTime, formatNumber } from "@/lib/utils";

const dashboardDefinitions: Array<{
  slug: DashboardSlug;
  href: string;
  number: string;
  title: string;
  detail: string;
  icon: typeof LayoutDashboard;
  accent: string;
  soft: string;
  button: string;
}> = [
  { slug: "summary", href: "/dashboards/summary", number: "0", title: "Summary", detail: "ภาพรวมงบประมาณ อากาศยาน และงานซ่อม", icon: LayoutDashboard, accent: "#8d3b91", soft: "bg-violet-50", button: "bg-violet-700" },
  { slug: "fleet-readiness", href: "/dashboards/fleet-readiness", number: "1", title: "Fleet Readiness", detail: "Mission Ready, Grounded และ Availability ของฝูงบิน", icon: Plane, accent: "#1675dc", soft: "bg-blue-50", button: "bg-blue-600" },
  { slug: "maintenance", href: "/dashboards/maintenance", number: "2", title: "แผนกช่างและวางแผนการซ่อม", detail: "การวางแผนและบริหารงานซ่อมบำรุง", icon: Wrench, accent: "#087fb5", soft: "bg-cyan-50", button: "bg-cyan-600" },
  { slug: "budget", href: "/dashboards/budget", number: "3", title: "แผนกงบประมาณ", detail: "งบประมาณและการควบคุมค่าใช้จ่าย", icon: ReceiptText, accent: "#07968f", soft: "bg-teal-50", button: "bg-teal-600" },
  { slug: "inventory", href: "/dashboards/inventory", number: "4", title: "แผนกคลังพัสดุ", detail: "บริหารจัดการวัสดุและคลังสินค้า", icon: Boxes, accent: "#284eb8", soft: "bg-indigo-50", button: "bg-indigo-700" },
  { slug: "procurement", href: "/dashboards/procurement", number: "5", title: "แผนกจัดซื้อ จ้างซ่อม", detail: "จัดซื้อจัดจ้างและบริหารซัพพลายเออร์", icon: ShoppingCart, accent: "#78429c", soft: "bg-violet-50", button: "bg-violet-700" },
];

function formatHomeValue(metric: HomeHighlightMetric) {
  if (metric.value === null || metric.value === undefined || metric.value === "") return "—";
  const number = Number(metric.value);
  if (Number.isFinite(number) && typeof metric.value !== "boolean") return formatNumber(number);
  return String(metric.value);
}

function latestGeneratedAt(values: { generatedAt: string }[]) {
  return values.reduce((latest, value) => (
    new Date(value.generatedAt).getTime() > new Date(latest).getTime() ? value.generatedAt : latest
  ), new Date(0).toISOString());
}

export default async function HomePage() {
  const user = await requireUser();
  const [items, unreadAlertCount, dashboardHighlights] = await Promise.all([
    getPublishedContentsForUser(user.id, 8),
    getUnreadContentCount(user.id),
    loadHomeDashboardHighlights(),
  ]);
  const pinned = items.find((item) => item.pinned);
  const highlightsByDashboard = new Map(dashboardHighlights.map((item) => [item.dashboard, item]));
  const dataHasError = dashboardHighlights.some((item) => item.hasError);
  const dataIsStale = dashboardHighlights.some((item) => item.stale);
  const latestDataAt = latestGeneratedAt(dashboardHighlights);
  const dataStatus = dataHasError ? "ตรวจสอบ" : dataIsStale ? "สำรอง" : "พร้อม";
  const dataStatusFooter = dataHasError ? "บาง metric โหลดไม่ได้" : dataIsStale ? "ข้อมูลสำรองล่าสุด" : "Oracle IFSAPP";

  return <div className="w-full min-w-0 px-3 py-3 sm:px-4 lg:px-5">
    <header className="flex min-w-0 flex-col items-stretch justify-between gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center">
      <div className="min-w-0"><h1 className="text-xl font-bold leading-tight text-[#0a2453] sm:text-3xl">TPAD IFSAPP Dashboard Center</h1><p className="text-xs text-slate-500">Oracle IFS Analytics Portal · กองบินตำรวจ</p></div>
      <div className="flex w-full min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm sm:w-auto"><RefreshCw className="size-5 shrink-0 text-blue-600"/><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-[#17346b]">อัปเดตข้อมูลล่าสุด</p><p className="truncate text-[9px] text-slate-400">{formatDateTime(latestDataAt)}</p></div><span className={`size-2 shrink-0 rounded-full ${dataHasError ? "bg-amber-500" : "bg-emerald-500"}`}/><span className="ml-2 grid size-9 shrink-0 place-items-center rounded-full bg-indigo-600 font-bold text-white">{user.displayName.slice(0, 1)}</span><div className="hidden min-w-0 sm:block"><p className="truncate text-[11px] font-bold text-slate-800">{user.displayName}</p><p className="truncate text-[9px] text-slate-500">{user.role === "ADMIN" ? "Administrator" : "Read only"}</p></div></div>
    </header>

    <section className="mt-3 grid min-w-0 gap-2 xl:grid-cols-[2.15fr_repeat(3,1fr)]">
      <div className="relative min-w-0 min-h-40 overflow-hidden rounded-lg border border-indigo-100 bg-gradient-to-r from-[#eef0ff] via-white to-[#eaf4ff] p-4 sm:p-5"><div className="absolute -right-4 bottom-[-38px] text-sky-700/10"><Plane className="size-56"/></div><div className="relative flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-700 to-indigo-500 text-white sm:size-14"><CircleGauge className="size-6 sm:size-7"/></span><div className="min-w-0"><h2 className="text-lg font-bold leading-6 text-[#3a176e] sm:text-2xl">ยินดีต้อนรับสู่ศูนย์วิเคราะห์ข้อมูล</h2><p className="mt-2 max-w-xl text-xs leading-6 text-slate-600">ศูนย์รวมข้อมูลสำคัญจาก Oracle IFSAPP เพื่อการบริหารจัดการและตัดสินใจอย่างมีประสิทธิภาพ ครอบคลุมทุกกระบวนการของกองบินตำรวจ</p></div></div></div>
      <StatusCard icon={Grid2X2} label="Dashboards ทั้งหมด" value={String(dashboardHighlights.length)} footer="พร้อมใช้งาน" color="text-blue-600" iconBg="bg-blue-600"/>
      <StatusCard icon={Bell} label="Alerts ที่ยังไม่อ่าน" value={String(unreadAlertCount)} footer="รายการใหม่" color="text-orange-600" iconBg="bg-orange-500"/>
      <StatusCard icon={Database} label="สถานะข้อมูลล่าสุด" value={dataStatus} footer={dataStatusFooter} color={dataHasError ? "text-amber-600" : "text-violet-700"} iconBg={dataHasError ? "bg-amber-500" : "bg-violet-600"}/>
    </section>

    <section className="mt-2 min-w-0 rounded-lg border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-[#17346b]">การแจ้งเตือนล่าสุด</p><Link href="/content" className="shrink-0 text-[10px] font-semibold text-blue-700">ดูทั้งหมด</Link></div><div className="mt-2 min-w-0 space-y-1.5">{items.slice(0, 3).map((item, index) => <Link key={item.id} href={`/content/${item.slug}`} className={`flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-[11px] transition hover:bg-slate-50 ${item.readAt ? "text-slate-500" : "text-[#263b70]"}`}><span aria-label={item.readAt ? "อ่านแล้ว" : "ยังไม่อ่าน"} className={`size-2 shrink-0 rounded-full ${item.readAt ? "bg-slate-300" : index === 0 ? "bg-rose-500" : index === 1 ? "bg-orange-500" : "bg-amber-400"}`}/><span className="min-w-0 flex-1 truncate">{item.title}</span>{!item.readAt && <span className="shrink-0 text-[9px] font-semibold text-orange-600">ใหม่</span>}<time className="shrink-0 text-[9px] text-slate-400">{item.publishAt ? formatDateTime(item.publishAt) : "ล่าสุด"}</time></Link>)}{!items.length && <p className="text-[11px] text-slate-400">ยังไม่มีการแจ้งเตือน</p>}</div></section>

    {pinned && <Link href={`/content/${pinned.slug}`} className="mt-2 flex min-w-0 min-h-11 items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs"><Badge className="shrink-0 bg-amber-500 text-white">ประกาศสำคัญ</Badge><span className="min-w-0 flex-1 truncate font-semibold text-amber-950">{pinned.title}</span><ArrowRight className="size-4 shrink-0 text-amber-700"/></Link>}

    <section className="mt-4 min-w-0">
      <div className="mb-3 flex min-w-0 flex-wrap items-end justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700"><Sparkles className="size-4"/></span><h2 className="text-base font-bold text-[#17346b]">Business Insight</h2></div><p className="mt-1 text-[11px] text-slate-500">วิเคราะห์จาก metric สำคัญของแต่ละ Dashboard เพื่อช่วยจัดลำดับการตัดสินใจ</p></div><Badge className="shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1 text-white">AI-ready insight</Badge></div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-6">{dashboardDefinitions.map((dashboard, index) => { const Icon = dashboard.icon; const highlight = highlightsByDashboard.get(dashboard.slug); const span = index < 3 ? "xl:col-span-2" : "xl:col-span-3"; const mobileBalance = index === dashboardDefinitions.length - 1 ? "sm:col-span-2 xl:col-span-3" : ""; return <Link key={dashboard.href} href={dashboard.href} className={`group relative flex min-w-0 min-h-[340px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,.06)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,.12)] ${span} ${mobileBalance}`}>
        <div className={`relative overflow-hidden ${dashboard.soft} p-4 sm:p-5`}><div className="absolute -bottom-12 -right-6 opacity-[.09]"><Icon className="size-44" style={{ color: dashboard.accent }}/></div><div className="relative flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${dashboard.accent}, #8d3b91)` }}><Icon className="size-5"/></span><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.16em]" style={{ color: dashboard.accent }}>Dashboard {dashboard.number}</p><h3 className="mt-1 text-sm font-bold leading-5 text-[#17346b] sm:text-base">{dashboard.title}</h3><p className="mt-1 text-[10px] text-slate-500">{dashboard.detail}</p></div></div><ArrowRight className="mt-1 size-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700"/></div></div>
        <div className="grid min-w-0 grid-cols-2 divide-x divide-slate-100 border-y border-slate-100">{(highlight?.metrics ?? []).map((metric) => <div key={metric.label} className="min-w-0 p-3.5 sm:p-4"><p className="truncate text-[10px] font-medium text-slate-500" title={metric.label}>{metric.label}</p><p className="mt-1 truncate text-xl font-bold tabular-nums" style={{ color: dashboard.accent }}>{formatHomeValue(metric)} <span className="text-[9px] font-medium text-slate-400">{metric.unit}</span></p></div>)}</div>
        <div className="flex flex-1 flex-col p-4"><div className="flex flex-1 items-start gap-3 rounded-xl border p-3" style={{ backgroundColor: `${dashboard.accent}08`, borderColor: `${dashboard.accent}24` }}><span className="grid size-8 shrink-0 place-items-center rounded-lg text-white" style={{ backgroundColor: dashboard.accent }}><Sparkles className="size-4"/></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: dashboard.accent }}>Business Insight</p>{highlight?.stale && <Badge className="bg-amber-100 text-amber-800">ข้อมูลสำรอง</Badge>}</div><p className="mt-1.5 text-[11px] leading-5 text-slate-600">{highlight?.insight ?? "กำลังวิเคราะห์ข้อมูลจาก Dashboard"}</p></div></div>{highlight?.note && <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[10px]"><span className="font-medium text-slate-500">{highlight.note.label}</span><span className="font-bold text-slate-700">{formatHomeValue(highlight.note)} {highlight.note.unit}</span></div>}<span className={`mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-white shadow-sm ${dashboard.button}`}>เปิด Dashboard <ArrowRight className="size-4 transition group-hover:translate-x-1"/></span></div>
      </Link>; })}</div>
    </section>

    <section className="mt-3 min-w-0 rounded-lg border border-slate-200 bg-white"><div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3"><h2 className="min-w-0 truncate text-sm font-bold text-[#17346b]">ข่าวและบทความล่าสุด</h2><Link href="/content" className="shrink-0 text-[11px] font-semibold text-blue-700">ดูทั้งหมด →</Link></div><div className="grid min-w-0 divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">{items.slice(0, 4).map((item) => <Link key={item.id} href={`/content/${item.slug}`} className={`flex min-w-0 items-start gap-3 p-3 hover:bg-slate-50 ${item.readAt ? "opacity-70" : ""}`}><Badge className={`shrink-0 ${item.type === "NEWS" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"}`}>{item.type === "NEWS" ? "ข่าว" : "บทความ"}</Badge><div className="min-w-0"><h3 className="truncate text-xs font-bold text-slate-800">{item.title}</h3><p className="mt-1 line-clamp-1 text-[10px] text-slate-500">{item.summary}</p></div></Link>)}</div></section>
  </div>;
}

function StatusCard({ icon: Icon, label, value, footer, color, iconBg }: { icon: typeof Grid2X2; label: string; value: string; footer: string; color: string; iconBg: string }) { return <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,.035)]"><div className="flex min-w-0 items-center gap-2"><span className={`grid size-9 shrink-0 place-items-center rounded-full text-white ${iconBg}`}><Icon className="size-[18px]"/></span><p className="min-w-0 truncate text-[11px] font-semibold leading-4 text-[#17346b]">{label}</p></div><p className={`mt-3 text-3xl font-bold ${color}`}>{value}</p><p className="mt-1 text-[10px] text-slate-500">{footer}</p></div>; }
