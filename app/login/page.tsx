import type { Metadata } from "next";
import { Activity, Gauge, Plane, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.25fr_0.75fr]">
      <section className="aviation-glow surface-grid relative hidden min-h-screen overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-24 top-24 size-96 rounded-full border border-white/10" />
        <div className="absolute -right-4 top-44 size-64 rounded-full border border-white/10" />
        <BrandMark />
        <div className="relative z-10 max-w-3xl pb-12">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs font-semibold tracking-wide text-sky-200">
            <Plane className="size-4" /> IFS ERP · EXECUTIVE INTELLIGENCE
          </div>
          <h1 className="text-balance text-5xl font-bold leading-[1.18] text-white xl:text-6xl">
            ข้อมูลพร้อมขึ้นบิน<br />เพื่อทุกการตัดสินใจ
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            ศูนย์รายงานผู้บริหารกองบินตำรวจ เชื่อมข้อมูลภารกิจ งานซ่อม งบประมาณ คลังพัสดุ และการจัดซื้อจาก IFS ในมุมมองเดียว
          </p>
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
            {[
              [Activity, "Live IFS", "ข้อมูลปัจจุบัน"],
              [Gauge, "6 Dashboards", "ครบทุกสายงาน"],
              [ShieldCheck, "Read only", "ปลอดภัยกับ Oracle"],
            ].map(([Icon, title, detail]) => (
              <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                <Icon className="mb-4 size-5 text-sky-300" />
                <p className="font-semibold text-white">{String(title)}</p>
                <p className="mt-1 text-xs text-slate-400">{String(detail)}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500">กองบินตำรวจ · Thai Police Aviation Division</p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-5 py-10 sm:px-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-[#8d3b91] to-amber-400" />
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="relative w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandMark className="[&_span_span]:text-slate-950" />
          </div>
          <div className="rounded-[28px] border border-white bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] sm:p-9">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#8d3b91]">Secure access</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">ยินดีต้อนรับ</h2>
            <p className="mb-8 mt-2 text-sm leading-6 text-slate-500">เข้าสู่ระบบเพื่อเปิดดูรายงานผู้บริหารและสอบถามข้อมูลผ่านผู้ช่วยอัจฉริยะ</p>
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
