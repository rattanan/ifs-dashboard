import { BookOpen, CalendarDays, Newspaper } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPublishedContents } from "@/lib/content";
import { formatDateTime } from "@/lib/utils";

export default async function ContentIndexPage() {
  const items = await getPublishedContents(100);
  return <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8"><div className="rounded-[26px] bg-gradient-to-br from-[#0b1f33] to-[#173a5e] px-6 py-8 text-white"><p className="text-xs font-bold uppercase tracking-[.18em] text-sky-300">TPAD Knowledge Hub</p><h1 className="mt-2 text-3xl font-bold">ข่าวและบทความ</h1><p className="mt-2 text-sm text-slate-300">ข่าวสาร ประกาศ และองค์ความรู้สำหรับบุคลากรกองบินตำรวจ</p></div><div className="mt-7 grid gap-4 md:grid-cols-2">{items.map((item) => <Link key={item.id} href={`/content/${item.slug}`}><Card className="h-full transition hover:border-sky-200 hover:shadow-lg"><CardContent className="p-5"><div className="flex items-center justify-between"><Badge className={item.type === "NEWS" ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700"}>{item.type === "NEWS" ? <><Newspaper className="mr-1 size-3" />ข่าว</> : <><BookOpen className="mr-1 size-3" />บทความ</>}</Badge>{item.publishAt && <time className="flex items-center gap-1 text-xs text-slate-400"><CalendarDays className="size-3.5" />{formatDateTime(item.publishAt)}</time>}</div><h2 className="mt-4 text-lg font-bold leading-7 text-slate-900">{item.title}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.summary}</p><p className="mt-5 text-xs font-semibold text-sky-700">{item.groupName ?? "ทั่วไป"}</p></CardContent></Card></Link>)}</div>{!items.length && <p className="mt-12 text-center text-slate-500">ยังไม่มีเนื้อหาที่เผยแพร่</p>}</div>;
}

