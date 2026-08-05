import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ContentAdminForm } from "@/components/content-admin-form";
import { getArticleGroups } from "@/lib/content";
import { getDb } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { updateContentAction } from "../../actions";

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [groups, rows] = await Promise.all([getArticleGroups(), getDb().select().from(contents).where(eq(contents.id, id)).limit(1)]);
  if (!rows[0]) notFound();
  return <Card className="mx-auto max-w-3xl"><CardHeader><div><h2 className="text-xl font-bold">แก้ไขเนื้อหา</h2><p className="mt-1 text-sm text-slate-500">การเปลี่ยนแปลงจะบันทึกใน audit log</p></div></CardHeader><CardContent><ContentAdminForm action={updateContentAction} groups={groups} content={rows[0]} /></CardContent></Card>;
}
