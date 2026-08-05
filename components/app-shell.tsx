"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Boxes,
  House,
  LogOut,
  Menu,
  Newspaper,
  PlaneTakeoff,
  ReceiptText,
  Settings,
  ShoppingCart,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "หน้าแรก", icon: House },
  { href: "/dashboards/maintenance", label: "ช่างและแผนซ่อม", icon: Wrench },
  { href: "/dashboards/budget", label: "งบประมาณ", icon: ReceiptText },
  { href: "/dashboards/inventory", label: "คลังพัสดุ", icon: Boxes },
  { href: "/dashboards/procurement", label: "จัดซื้อ / จ้างซ่อม", icon: ShoppingCart },
];

function Navigation({ user, mobile = false }: { user: SessionUser; mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="เมนูหลัก" className={cn("space-y-1", mobile && "mt-8")}>
      {navigation.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              active ? "bg-white/12 text-white shadow-sm" : "text-slate-300 hover:bg-white/[0.07] hover:text-white",
            )}
          >
            <Icon className={cn("size-[18px]", active ? "text-sky-300" : "text-slate-400 group-hover:text-sky-300")} />
            {item.label}
          </Link>
        );
      })}
      <Link href="/content" className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white">
        <Newspaper className="size-[18px] text-slate-400 group-hover:text-sky-300" /> ข่าวและบทความ
      </Link>
      {user.role === "ADMIN" && (
        <Link href="/admin/users" className={cn("group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition", pathname.startsWith("/admin") ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/[0.07] hover:text-white")}>
          <Settings className="size-[18px] text-slate-400 group-hover:text-sky-300" /> ผู้ดูแลระบบ
        </Link>
      )}
    </nav>
  );
}

function UserPanel({ user }: { user: SessionUser }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-[#8d3b91] text-sm font-bold text-white">{user.displayName.slice(0, 1)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user.displayName}</p>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">{user.role === "ADMIN" ? "Administrator" : "Read only"}</p>
        </div>
        <form action={logoutAction}>
          <button aria-label="ออกจากระบบ" className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <a href="#main-content" className="sr-only z-[100] rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">ข้ามไปยังเนื้อหา</a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#091b2d] p-4 lg:flex">
        <BrandMark className="px-1 py-2" />
        <div className="mt-8 flex-1"><Navigation user={user} /></div>
        <UserPanel user={user} />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <PlaneTakeoff className="size-5 text-sky-600" />
          <span className="font-bold text-slate-900">TPAD Executive</span>
        </div>
        <Dialog.Root>
          <Dialog.Trigger asChild><Button variant="ghost" size="icon" aria-label="เปิดเมนู"><Menu className="size-5" /></Button></Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[88vw] max-w-sm bg-[#091b2d] p-5 shadow-2xl">
              <Dialog.Title className="sr-only">เมนูหลัก</Dialog.Title>
              <div className="flex items-center justify-between"><BrandMark /><Dialog.Close asChild><Button variant="ghost" size="icon" className="text-white hover:bg-white/10"><X className="size-5" /></Button></Dialog.Close></div>
              <Navigation user={user} mobile />
              <div className="absolute inset-x-5 bottom-5"><UserPanel user={user} /></div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>

      <div className="lg:pl-64">
        <main id="main-content" className="min-h-screen pb-24 lg:pb-8">{children}</main>
      </div>

      <nav aria-label="เมนูมือถือ" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur lg:hidden">
        {navigation.map((item) => {
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} aria-label={item.label} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-medium text-slate-500 hover:bg-slate-100 hover:text-sky-700"><Icon className="size-[18px]" /><span className="max-w-full truncate">{item.label.split("และ")[0]}</span></Link>;
        })}
      </nav>
    </div>
  );
}
