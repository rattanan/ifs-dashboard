import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { chatConversations, chatMessages } from "@/lib/db/schema";
import { loadMetric } from "@/lib/dashboard/service";
import type { DashboardFilters, MetricResult } from "@/lib/dashboard/types";
import { mapQuestionToIntent, extractFilters } from "./intent";

function localSummary(metric: MetricResult) {
  if (metric.error && !metric.summary && !metric.series && !metric.rows) return `ไม่สามารถอ่านข้อมูล ${metric.title} ได้ในขณะนี้: ${metric.error}`;
  if (metric.summary) {
    const values = Object.entries(metric.summary).map(([key, value]) => `${key}: ${value ?? "—"}`).join(", ");
    return `จาก Card “${metric.title}” พบว่า ${values}`;
  }
  const rows = metric.series ?? metric.rows ?? [];
  const preview = rows.slice(0, 5).map((row) => Object.values(row).join(" = ")).join("; ");
  return `จาก Card “${metric.title}” พบ ${rows.length} รายการ/กลุ่ม${preview ? ` โดยรายการสำคัญคือ ${preview}` : ""}`;
}

async function aiSummary(question: string, metric: MetricResult) {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!baseUrl || !apiKey || !model) return localSummary(metric);

  const dto = { title: metric.title, generatedAt: metric.generatedAt, filters: metric.filters, summary: metric.summary, series: metric.series?.slice(0, 20), rows: metric.rows?.slice(0, 20), stale: metric.stale };
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: "system", content: "คุณคือผู้ช่วยรายงานผู้บริหารกองบินตำรวจ สรุปข้อมูลภาษาไทยให้กระชับ ระบุว่าเป็นข้อมูลจาก Card และห้ามแต่งตัวเลขที่ไม่มีใน DTO" }, { role: "user", content: JSON.stringify({ question, data: dto }) }] }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("AI unavailable");
    const body = await response.json() as { choices?: { message?: { content?: string } }[] };
    const generated = body.choices?.[0]?.message?.content?.trim();
    return generated?.replace(/\*\*/g, "").replace(/^\s*\*\s*/gm, "• ") || localSummary(metric);
  } catch {
    return localSummary(metric);
  }
}

export async function answerQuestion(input: { userId: string; question: string; conversationId?: string; filters?: Partial<DashboardFilters> }) {
  const metric = mapQuestionToIntent(input.question);
  const filters = extractFilters(input.question, input.filters);
  const result = await loadMetric(metric, filters);
  const answer = await aiSummary(input.question, result);
  const db = getDb();
  let conversationId = input.conversationId;
  if (conversationId) {
    const owned = await db.select({ id: chatConversations.id }).from(chatConversations).where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, input.userId))).limit(1);
    if (!owned[0]) conversationId = undefined;
  }
  if (!conversationId) {
    conversationId = crypto.randomUUID();
    await db.insert(chatConversations).values({ id: conversationId, userId: input.userId, title: input.question.slice(0, 200) });
  }
  const snapshot = Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, value == null ? null : String(value)]));
  await db.insert(chatMessages).values([
    { id: crypto.randomUUID(), conversationId, role: "USER", content: input.question, filterSnapshot: snapshot },
    { id: crypto.randomUUID(), conversationId, role: "ASSISTANT", content: answer, metricRefs: [metric.id], filterSnapshot: snapshot },
  ]);
  return { conversationId, answer, source: { metricId: metric.id, title: metric.title, generatedAt: result.generatedAt, href: `/dashboards/${metric.dashboard}`, stale: result.stale ?? false } };
}
