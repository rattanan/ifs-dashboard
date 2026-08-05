import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8"><header className="mb-6"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#8d3b91]">Administration</p><h1 className="mt-1 text-3xl font-bold text-slate-950">จัดการระบบ</h1></header><AdminNav />{children}</div>;
}
