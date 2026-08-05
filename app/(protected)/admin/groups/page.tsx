import { asc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { getDb } from "@/lib/db";
import { articleGroups } from "@/lib/db/schema";
import { createGroupAction, setGroupActiveAction } from "../actions";

export default async function AdminGroupsPage() {
  const groups = await getDb().select().from(articleGroups).orderBy(asc(articleGroups.sortOrder), asc(articleGroups.name));
  return <div className="grid gap-6 lg:grid-cols-[380px_1fr]"><Card><CardHeader><h2 className="font-bold">เพิ่มกลุ่มบทความ</h2></CardHeader><CardContent><form action={createGroupAction} className="space-y-4"><label className="block text-sm font-semibold">ชื่อกลุ่ม<Input name="name" className="mt-1.5" required /></label><label className="block text-sm font-semibold">Slug<Input name="slug" className="mt-1.5" required pattern="[a-z0-9-]+" placeholder="maintenance-knowledge" /></label><label className="block text-sm font-semibold">คำอธิบาย<Textarea name="description" className="mt-1.5 min-h-24" /></label><label className="block text-sm font-semibold">ลำดับ<Input name="sortOrder" type="number" defaultValue="0" min="0" className="mt-1.5" /></label><Button className="w-full">สร้างกลุ่ม</Button></form></CardContent></Card><Card><CardHeader><h2 className="font-bold">กลุ่มบทความทั้งหมด</h2></CardHeader><CardContent className="space-y-3">{groups.map((group) => <div key={group.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"><div><div className="flex items-center gap-2"><p className="font-bold">{group.name}</p><Badge className={group.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}>{group.active ? "ใช้งาน" : "ซ่อน"}</Badge></div><p className="mt-1 text-sm text-slate-500">/{group.slug} · ลำดับ {group.sortOrder}</p><p className="mt-1 text-xs text-slate-400">{group.description}</p></div><form action={setGroupActiveAction}><input type="hidden" name="id" value={group.id} /><input type="hidden" name="active" value={String(!group.active)} /><Button variant="secondary" size="sm">{group.active ? "ซ่อนกลุ่ม" : "เปิดใช้งาน"}</Button></form></div>)}</CardContent></Card></div>;
}

