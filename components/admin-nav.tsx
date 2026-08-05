import Link from "next/link";

export function AdminNav() {
  return <nav aria-label="เมนูผู้ดูแล" className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 text-sm font-semibold"><Link className="min-h-11 whitespace-nowrap rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-100" href="/admin/users">ผู้ใช้งาน</Link><Link className="min-h-11 whitespace-nowrap rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-100" href="/admin/content">ข่าวและบทความ</Link><Link className="min-h-11 whitespace-nowrap rounded-xl px-4 py-3 text-slate-600 hover:bg-slate-100" href="/admin/groups">กลุ่มบทความ</Link></nav>;
}

