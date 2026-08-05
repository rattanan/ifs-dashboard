import { desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/utils";
import { setContentStatusAction } from "../actions";

export default async function AdminContentPage() {
  const items = await getDb().select().from(contents).orderBy(desc(contents.updatedAt), desc(contents.createdAt));
  return <Card><CardHeader className="items-center"><div><h2 className="font-bold">ข่าวและบทความ</h2><p className="mt-1 text-xs text-slate-500">จัดการฉบับร่าง เผยแพร่ ปักหมุด และ archive</p></div><Link href="/admin/content/new" className="inline-flex min-h-11 items-center rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700">สร้างเนื้อหา</Link></CardHeader><CardContent className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><Badge className={item.type === "NEWS" ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700"}>{item.type === "NEWS" ? "ข่าว" : "บทความ"}</Badge><Badge className={item.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : item.status === "ARCHIVED" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}>{item.status}</Badge>{item.pinned && <Badge className="bg-amber-100 text-amber-800">ปักหมุด</Badge>}</div><h3 className="mt-2 font-bold text-slate-900">{item.title}</h3><p className="mt-1 text-xs text-slate-400">แก้ไข {formatDateTime(item.updatedAt ?? item.createdAt)}</p></div><Link href={`/admin/content/${item.id}`} className="text-sm font-semibold text-sky-700">แก้ไข</Link></div><div className="mt-4 flex flex-wrap gap-2">{item.status !== "PUBLISHED" && <form action={setContentStatusAction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="PUBLISHED" /><Button size="sm">เผยแพร่</Button></form>}{item.status !== "DRAFT" && <form action={setContentStatusAction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="DRAFT" /><Button variant="secondary" size="sm">กลับเป็นฉบับร่าง</Button></form>}{item.status !== "ARCHIVED" && <form action={setContentStatusAction}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="ARCHIVED" /><Button variant="secondary" size="sm">Archive</Button></form>}</div></div>)}</CardContent></Card>;
}
