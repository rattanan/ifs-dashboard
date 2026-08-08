"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Bot, ExternalLink, Loader2, Send, Sparkles, Trash2, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/utils";

type Source = { metricId: string; title: string; href: string; generatedAt: string; stale: boolean };
type Message = { role: "user" | "assistant"; content: string; source?: Source; sources?: Source[] };
const welcomeMessage: Message = { role: "assistant", content: "สวัสดีครับ ถามข้อมูลจาก IFS ได้ เช่น “สถานะอากาศยาน T10” หรือ “งบโครงการ B6201 คงเหลือเท่าไร”" };

export function Chatbot() {
  const [question, setQuestion] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [loading, setLoading] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string>();

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
      setMessages((items) => [...items, { role: "assistant", content: body.answer, source: body.source, sources: body.sources }]);
    } catch (error) {
      setMessages((items) => [...items, { role: "assistant", content: error instanceof Error ? error.message : "ระบบผู้ช่วยไม่พร้อมใช้งาน" }]);
    } finally { setLoading(false); }
  }

  async function clearHistory() {
    if (clearing) return;
    setClearing(true);
    setClearError(undefined);
    try {
      const response = await fetch("/api/chat", { method: "DELETE" });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "ไม่สามารถล้างประวัติการสนทนาได้");
      setConversationId(undefined);
      setMessages([welcomeMessage]);
      setQuestion("");
      setConfirmingClear(false);
    } catch (error) {
      setClearError(error instanceof Error ? error.message : "ไม่สามารถล้างประวัติการสนทนาได้");
    } finally {
      setClearing(false);
    }
  }

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild><button className="fixed bottom-20 right-4 z-40 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-[#8d3b91] text-white shadow-[0_12px_35px_rgba(14,165,233,0.35)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 lg:bottom-6 lg:right-6" aria-label="เปิดผู้ช่วย IFS"><Sparkles className="size-6" /></button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-slate-50 sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(720px,90vh)] sm:w-[min(440px,92vw)] sm:overflow-hidden sm:rounded-[24px] sm:border sm:border-slate-200 sm:shadow-2xl">
          <div className="flex items-center justify-between bg-[#0b1f33] px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-sky-400/15"><Bot className="size-5 text-sky-300" /></span><div><Dialog.Title className="font-bold">ผู้ช่วย IFS</Dialog.Title><Dialog.Description className="text-xs text-slate-400">ตอบจาก Card ที่ได้รับอนุญาตเท่านั้น</Dialog.Description></div></div><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon" className="text-slate-300 hover:bg-white/10 hover:text-white" aria-label="ล้างประวัติการสนทนา" title="ล้างประวัติ" disabled={loading || clearing} onClick={() => { setConfirmingClear(true); setClearError(undefined); }}><Trash2 className="size-4" /></Button><Dialog.Close asChild><Button variant="ghost" size="icon" className="text-white hover:bg-white/10" aria-label="ปิดผู้ช่วย"><X className="size-5" /></Button></Dialog.Close></div></div>
          {confirmingClear && <div role="alertdialog" aria-labelledby="clear-chat-title" aria-describedby="clear-chat-description" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-950"><div className="flex items-start gap-3"><Trash2 className="mt-0.5 size-4 shrink-0 text-amber-700" /><div className="min-w-0 flex-1"><p id="clear-chat-title" className="text-xs font-bold">ล้างประวัติการสนทนาทั้งหมด?</p><p id="clear-chat-description" className="mt-1 text-[10px] leading-4 text-amber-800">ข้อความทั้งหมดของบัญชีนี้จะถูกลบและไม่สามารถเรียกคืนได้</p>{clearError && <p aria-live="assertive" className="mt-1 text-[10px] font-semibold text-rose-700">{clearError}</p>}<div className="mt-2 flex gap-2"><Button type="button" variant="secondary" size="sm" disabled={clearing} onClick={() => { setConfirmingClear(false); setClearError(undefined); }}>ยกเลิก</Button><Button type="button" size="sm" disabled={clearing} onClick={() => void clearHistory()} className="bg-rose-600 text-white hover:bg-rose-700">{clearing ? <><Loader2 className="size-3.5 animate-spin" /> กำลังล้าง…</> : <><Trash2 className="size-3.5" /> ล้างทั้งหมด</>}</Button></div></div></div></div>}
          <div aria-live="polite" className="flex-1 space-y-4 overflow-y-auto p-4">{messages.map((message, index) => { const sources = message.sources ?? (message.source ? [message.source] : []); return <div key={index} className={message.role === "user" ? "ml-10 rounded-2xl rounded-br-md bg-sky-600 px-4 py-3 text-sm leading-6 text-white" : "mr-6 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm"}><p className="whitespace-pre-wrap">{message.content}</p>{sources.length > 0 && <div className="mt-3 space-y-1.5"><p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Card ต้นทาง {sources.length} รายการ</p>{sources.map((source) => <Link key={source.metricId} href={source.href} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-sky-700 hover:bg-sky-50"><span className="min-w-0"><strong className="block truncate">{source.title}</strong><span className="text-[10px] text-slate-400">{formatDateTime(source.generatedAt)}{source.stale ? " · ข้อมูลล่าสุดใน cache" : ""}</span></span><ExternalLink className="size-4 shrink-0" /></Link>)}</div>}</div>; })}{loading && <div className="mr-20 flex items-center gap-2 rounded-2xl bg-white p-4 text-sm text-slate-500"><Loader2 className="size-4 animate-spin" /> กำลังวิเคราะห์หลาย Dashboard…</div>}</div>
          <form onSubmit={submit} className="border-t border-slate-200 bg-white p-4"><div className="flex gap-2"><Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="ถามข้อมูลจาก IFS…" aria-label="คำถาม" maxLength={500} /><Button size="icon" disabled={loading || question.trim().length < 2} aria-label="ส่งคำถาม"><Send className="size-4" /></Button></div><p className="mt-2 text-center text-[10px] text-slate-400">Based on currently available and authorized data</p></form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
