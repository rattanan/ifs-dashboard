import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ContentAdminForm } from "@/components/content-admin-form";
import { getArticleGroups } from "@/lib/content";
import { createContentAction } from "../../actions";

export default async function NewContentPage() {
  const groups = await getArticleGroups();
  return <Card className="mx-auto max-w-3xl"><CardHeader><div><h2 className="text-xl font-bold">สร้างข่าวหรือบทความ</h2><p className="mt-1 text-sm text-slate-500">บันทึกเป็นฉบับร่างหรือเผยแพร่บนหน้าแรกได้ทันที</p></div></CardHeader><CardContent><ContentAdminForm action={createContentAction} groups={groups} /></CardContent></Card>;
}

