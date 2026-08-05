import { ChevronRight, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getContentParagraphs } from "@/lib/content-body";
import { getPublishedContentBySlug } from "@/lib/content";
import { formatDateTime } from "@/lib/utils";

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublishedContentBySlug(slug);
  if (!item) notFound();
  const paragraphs = getContentParagraphs(item.bodyJson);
  return <article className="mx-auto max-w-3xl px-4 py-7 sm:px-6 lg:py-10"><nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500"><Link href="/" aria-label="หน้าแรก"><Home className="size-4" /></Link><ChevronRight className="size-3.5" /><Link href="/content">ข่าวและบทความ</Link><ChevronRight className="size-3.5" /><span className="truncate">{item.title}</span></nav><header className="mt-8"><Badge className={item.type === "NEWS" ? "bg-sky-50 text-sky-700" : "bg-violet-50 text-violet-700"}>{item.type === "NEWS" ? "ข่าว" : "บทความ"} · {item.groupName ?? "ทั่วไป"}</Badge><h1 className="mt-5 text-balance text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">{item.title}</h1>{item.summary && <p className="mt-4 text-lg leading-8 text-slate-600">{item.summary}</p>}<div className="mt-5 border-b border-slate-200 pb-6 text-xs text-slate-400">โดย {item.authorName}{item.publishAt ? ` · ${formatDateTime(item.publishAt)}` : ""}</div></header>{item.coverImage && <Image src={item.coverImage} alt={item.title} width={1200} height={630} className="mt-7 aspect-[16/9] w-full rounded-3xl object-cover" />}<div className="space-y-5 py-8 text-[17px] leading-8 text-slate-700">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article>;
}
