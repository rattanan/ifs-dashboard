"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Bot, ExternalLink, Loader2, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string; source?: { title: string; href: string; generatedAt: string; stale: boolean } };

export function Chatbot() {
  const [question, setQuestion] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "สวัสดีครับ ถามข้อมูลจาก IFS ได้ เช่น “สถานะอากาศยาน T10” หรือ “งบโครงการ B6201 คงเหลือเท่าไร”" }]);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || loading) return;
    setMessages((items) => [...items, { role: "user", content: text }]);
    setQuestion(""); setLoading(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: text, conversationId }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "ไม่สามารถตอบคำถามได้");
      setConversationId(body.conversationId);
      setMessages((items) => [...items, { role: "assistant", content: body.answer, source: body.source }]);
    } catch (error) {
      setMessages((items) => [...items, { role: "assistant", content: error instanceof Error ? error.message : "ระบบผู้ช่วยไม่พร้อมใช้งาน" }]);
    } finally { setLoading(false); }
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild><button className="fixed bottom-20 right-4 z-40 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-[#8d3b91] text-white shadow-[0_12px_35px_rgba(14,165,233,0.35)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 lg:bottom-6 lg:right-6" aria-label="เปิดผู้ช่วย IFS"><Sparkles className="size-6" /></button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-slate-50 sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(720px,90vh)] sm:w-[min(440px,92vw)] sm:overflow-hidden sm:rounded-[24px] sm:border sm:border-slate-200 sm:shadow-2xl">
          <div className="flex items-center justify-between bg-[#0b1f33] px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-sky-400/15"><Bot className="size-5 text-sky-300" /></span><div><Dialog.Title className="font-bold">ผู้ช่วย IFS</Dialog.Title><Dialog.Description className="text-xs text-slate-400">ตอบจาก Card ที่ได้รับอนุญาตเท่านั้น</Dialog.Description></div></div><Dialog.Close asChild><Button variant="ghost" size="icon" className="text-white hover:bg-white/10" aria-label="ปิดผู้ช่วย"><X className="size-5" /></Button></Dialog.Close></div>
          <div aria-live="polite" className="flex-1 space-y-4 overflow-y-auto p-4">{messages.map((message, index) => <div key={index} className={message.role === "user" ? "ml-10 rounded-2xl rounded-br-md bg-sky-600 px-4 py-3 text-sm leading-6 text-white" : "mr-6 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm"}><p className="whitespace-pre-wrap">{message.content}</p>{message.source && <Link href={message.source.href} className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs text-sky-700 hover:bg-sky-50"><span><strong>{message.source.title}</strong><br /><span className="text-slate-400">{formatDateTime(message.source.generatedAt)}{message.source.stale ? " · ข้อมูลล่าสุดใน cache" : ""}</span></span><ExternalLink className="size-4 shrink-0" /></Link>}</div>)}{loading && <div className="mr-20 flex items-center gap-2 rounded-2xl bg-white p-4 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" /> กำลังอ่านข้อมูล…</div>}</div>
          <form onSubmit={submit} className="border-t border-slate-200 bg-white p-4"><div className="flex gap-2"><Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="ถามข้อมูลจาก IFS…" aria-label="คำถาม" maxLength={500} /><Button size="icon" disabled={loading || question.trim().length < 2} aria-label="ส่งคำถาม"><Send className="size-4" /></Button></div><p className="mt-2 text-center text-[10px] text-slate-400">คำตอบเพื่อสนับสนุนการตัดสินใจ โปรดตรวจสอบ Card ต้นทาง</p></form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
