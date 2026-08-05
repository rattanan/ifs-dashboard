import { ArrowRight, Boxes, ChevronRight, Plane, ReceiptText, ShoppingCart, Sparkles, Wrench } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getPublishedContents } from "@/lib/content";
import { formatDateTime } from "@/lib/utils";

const dashboards = [
  { href: "/dashboards/maintenance", title: "ช่างและวางแผนซ่อม", detail: "ความพร้อมอากาศยาน · WO · PM · MMR", icon: Wrench, color: "from-cyan-500 to-sky-700", glow: "bg-cyan-400" },
  { href: "/dashboards/budget", title: "งบประมาณ", detail: "งบตั้งต้น · ใช้จริง · ผูกพัน · คงเหลือ", icon: ReceiptText, color: "from-indigo-600 to-violet-800", glow: "bg-indigo-400" },
  { href: "/dashboards/inventory", title: "คลังพัสดุ", detail: "MR · รับเข้า · คงคลัง · อายุพัสดุ", icon: Boxes, color: "from-emerald-500 to-teal-800", glow: "bg-emerald-400" },
  { href: "/dashboards/procurement", title: "จัดซื้อ จ้างซ่อม", detail: "RFQ · PR · PO · Supplier Performance", icon: ShoppingCart, color: "from-amber-500 to-[#8d3b91]", glow: "bg-amber-400" },
];

export default async function HomePage() {
  const [user, items] = await Promise.all([requireUser(), getPublishedContents(8)]);
  const pinned = items.find((item) => item.pinned) ?? items[0];
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <section className="relative overflow-hidden rounded-[28px] bg-[#0b1f33] px-5 py-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.15)] sm:px-8 lg:px-10 lg:py-10">
        <div className="absolute right-[-5%] top-[-45%] size-96 rounded-full border-[54px] border-sky-400/10" />
        <div className="absolute bottom-[-45%] left-[35%] size-80 rounded-full bg-[#8d3b91]/20 blur-3xl" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <Badge className="mb-5 bg-sky-400/15 text-sky-200"><Sparkles className="mr-1.5 size-3.5" /> Executive intelligence</Badge>
            <p className="text-sm text-slate-300">สวัสดี {user.displayName}</p>
            <h1 className="mt-2 max-w-3xl text-balance text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">มองเห็นทุกภารกิจ<br className="hidden sm:block" /> ตัดสินใจได้จากข้อมูลจริง</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">รายงานผู้บริหารจาก IFS ERP ครอบคลุมงานซ่อม งบประมาณ คลังพัสดุ และการจัดซื้อ พร้อมผู้ช่วยอัจฉริยะสำหรับค้นหาคำตอบอย่างรวดเร็ว</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
            <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-sky-400/15"><Plane className="size-5 text-sky-300" /></span><div><p className="text-xs text-slate-400">Oracle IFS UAT</p><p className="font-semibold">เชื่อมต่อแบบ Read only</p></div></div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center"><div><p className="text-xl font-bold">4</p><p className="text-[10px] text-slate-400">Dashboard</p></div><div><p className="text-xl font-bold">2</p><p className="text-[10px] text-slate-400">Site</p></div><div><p className="text-xl font-bold">5m</p><p className="text-[10px] text-slate-400">Cache</p></div></div>
          </div>
        </div>
      </section>

      {pinned && (
        <Link href={`/content/${pinned.slug}`} className="mt-5 flex min-h-14 items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm transition hover:border-amber-300 hover:bg-amber-100/70 sm:px-5">
          <Badge className="shrink-0 bg-amber-500 text-white">ประกาศ</Badge><span className="min-w-0 flex-1 truncate font-semibold text-amber-950">{pinned.title}</span><ChevronRight className="size-4 shrink-0 text-amber-700" />
        </Link>
      )}

      <section className="mt-9">
        <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600">Operations overview</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Dashboard หลัก</h2></div></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboards.map((dashboard) => {
            const Icon = dashboard.icon;
            return (
              <Link key={dashboard.href} href={dashboard.href} className={`group relative min-h-56 overflow-hidden rounded-[24px] bg-gradient-to-br ${dashboard.color} p-6 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2`}>
                <span className={`absolute -right-8 -top-8 size-32 rounded-full ${dashboard.glow} opacity-20 blur-2xl`} />
                <div className="relative flex h-full flex-col"><span className="grid size-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Icon className="size-6" /></span><h3 className="mt-auto text-xl font-bold">{dashboard.title}</h3><p className="mt-2 text-sm leading-6 text-white/75">{dashboard.detail}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">เปิด Dashboard <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8d3b91]">Knowledge hub</p><h2 className="mt-1 text-2xl font-bold text-slate-950">ข่าวและบทความล่าสุด</h2></div><Link href="/content" className="text-sm font-semibold text-sky-700 hover:text-sky-900">ดูทั้งหมด</Link></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.slice(0, 6).map((item) => (
            <Link key={item.id} href={`/content/${item.slug}`}>
              <Card className="h-full transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"><CardContent className="flex h-full flex-col p-5"><div className="flex items-center justify-between gap-3"><Badge className={item.type === "NEWS" ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700"}>{item.type === "NEWS" ? "ข่าว" : "บทความ"}</Badge>{item.publishAt && <time className="text-xs text-slate-400">{formatDateTime(item.publishAt)}</time>}</div><h3 className="mt-4 text-lg font-bold leading-7 text-slate-900">{item.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.summary}</p><p className="mt-auto pt-5 text-xs font-semibold text-sky-700">{item.groupName ?? "ทั่วไป"}</p></CardContent></Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
