"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  House,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  PlaneTakeoff,
  ReceiptText,
  ShieldCheck,
  Settings,
  ShoppingCart,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { logoutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "หน้าแรก", icon: House },
  { href: "/dashboards/summary", label: "Summary", icon: LayoutDashboard },
  { href: "/dashboards/maintenance", label: "ช่างและแผนซ่อม", icon: Wrench },
  { href: "/dashboards/budget", label: "งบประมาณ", icon: ReceiptText },
  { href: "/dashboards/inventory", label: "คลังพัสดุ", icon: Boxes },
  { href: "/dashboards/procurement", label: "จัดซื้อ / จ้างซ่อม", icon: ShoppingCart },
];

function Navigation({ user, mobile = false, collapsed = false }: { user: SessionUser; mobile?: boolean; collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="เมนูหลัก" className={cn("space-y-1", mobile && "mt-7")}>
      {navigation.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "group flex min-h-11 items-center rounded-lg text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
              collapsed ? "justify-center px-2" : "gap-3 px-3",
              active ? "bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-md" : "text-slate-200 hover:bg-white/[0.07] hover:text-white",
            )}
          >
            <Icon className={cn("size-[18px] shrink-0", active ? "text-sky-300" : "text-slate-400 group-hover:text-sky-300")} />
            <span className={cn("truncate", collapsed && "sr-only")}>{item.label}</span>
          </Link>
        );
      })}
      <Link
        href="/content"
        aria-label={collapsed ? "ข่าวและบทความ" : undefined}
        title={collapsed ? "ข่าวและบทความ" : undefined}
        className={cn("group flex min-h-11 items-center rounded-lg text-[13px] font-medium text-slate-200 transition hover:bg-white/[0.07] hover:text-white", collapsed ? "justify-center px-2" : "gap-3 px-3")}
      >
        <Newspaper className="size-[18px] shrink-0 text-slate-400 group-hover:text-sky-300" />
        <span className={cn("truncate", collapsed && "sr-only")}>ข่าวและบทความ</span>
      </Link>
      {user.role === "ADMIN" && (
        <Link
          href="/admin/users"
          aria-label={collapsed ? "ผู้ดูแลระบบ" : undefined}
          title={collapsed ? "ผู้ดูแลระบบ" : undefined}
          className={cn("group flex min-h-11 items-center rounded-lg text-[13px] font-medium transition", collapsed ? "justify-center px-2" : "gap-3 px-3", pathname.startsWith("/admin") ? "bg-gradient-to-r from-sky-600 to-cyan-600 text-white" : "text-slate-200 hover:bg-white/[0.07] hover:text-white")}
        >
          <Settings className="size-[18px] shrink-0 text-slate-400 group-hover:text-sky-300" />
          <span className={cn("truncate", collapsed && "sr-only")}>ผู้ดูแลระบบ</span>
        </Link>
      )}
    </nav>
  );
}

function UserPanel({ user, collapsed = false }: { user: SessionUser; collapsed?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-sky-300/20 bg-sky-950/40", collapsed ? "p-1" : "p-3")}>
      <div className={cn("flex items-center", collapsed ? "flex-col gap-1" : "gap-3")}>
        <span className={cn("grid place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-[#8d3b91] text-sm font-bold text-white", collapsed ? "size-8" : "size-9")}>{user.displayName.slice(0, 1)}</span>
        {collapsed ? (
          <form action={logoutAction}>
            <button aria-label="ออกจากระบบ" title="ออกจากระบบ" className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white">
              <LogOut className="size-4" />
            </button>
          </form>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user.displayName}</p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">{user.role === "ADMIN" ? "Administrator" : "Read only"}</p>
            </div>
            <form action={logoutAction}>
              <button aria-label="ออกจากระบบ" className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white">
                <LogOut className="size-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <a href="#main-content" className="sr-only z-[100] rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">ข้ามไปยังเนื้อหา</a>
      <aside id="desktop-sidebar" aria-label="เมนูด้านซ้าย" className={cn("fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden bg-[#031d3b] p-3 transition-[width] duration-200 lg:flex", sidebarCollapsed ? "lg:w-[68px]" : "lg:w-[220px]")}>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-[radial-gradient(circle_at_40%_90%,rgba(14,165,233,.22),transparent_55%)]" />
        <div className={cn("relative border-b border-white/10", sidebarCollapsed ? "pb-3" : "px-1 pb-3")}>
          <BrandMark compact={sidebarCollapsed} className={cn("pt-2", sidebarCollapsed && "justify-center")} />
          <button
            type="button"
            aria-controls="desktop-sidebar"
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? "เปิดเมนูด้านซ้าย" : "ปิดเมนูด้านซ้าย"}
            title={sidebarCollapsed ? "เปิดเมนูด้านซ้าย" : "ปิดเมนูด้านซ้าย"}
            onClick={() => setSidebarCollapsed((value) => !value)}
            className={cn("mt-2 grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400", sidebarCollapsed ? "mx-auto" : "ml-auto")}
          >
            {sidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>
        {!sidebarCollapsed && <p className="relative mb-2 mt-5 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-sky-400">Operations center</p>}
        <div className="relative flex-1"><Navigation user={user} collapsed={sidebarCollapsed} /></div>
        {!sidebarCollapsed && <div className="relative mb-2 rounded-lg border border-white/10 bg-white/[.035] p-3 text-[10px] leading-5 text-slate-300"><p className="flex items-center gap-2 font-semibold text-white"><ShieldCheck className="size-4 text-emerald-400"/> ปลอดภัย & เชื่อถือได้</p><p className="mt-1">เชื่อมต่อ Oracle IFSAPP<br/>แบบอ่านข้อมูลเท่านั้น</p><p className="mt-1 text-emerald-400">● สถานะระบบปกติ</p></div>}
        <UserPanel user={user} collapsed={sidebarCollapsed} />
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

      <div className={cn("transition-[padding-left] duration-200", sidebarCollapsed ? "lg:pl-[68px]" : "lg:pl-[220px]")}>
        <main id="main-content" className="min-h-screen pb-24 lg:pb-8">{children}</main>
      </div>

      <nav aria-label="เมนูมือถือ" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-6 rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur lg:hidden">
        {navigation.map((item) => {
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} aria-label={item.label} className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[9px] font-medium text-slate-500 hover:bg-slate-100 hover:text-sky-700"><Icon className="size-[18px]" /><span className="max-w-full truncate">{item.label.split("และ")[0]}</span></Link>;
        })}
      </nav>
    </div>
  );
}
