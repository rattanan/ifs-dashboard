import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { chatConversations, chatMessages } from "@/lib/db/schema";
import { loadMetric } from "@/lib/dashboard/service";
import type { DashboardFilters, MetricDefinition, MetricResult } from "@/lib/dashboard/types";
import { extractFilters, planQuestion, resolvePlanMetrics, type ChatPlan } from "./intent";

type HistoryMessage = {
  role: "USER" | "ASSISTANT";
  content: string;
  metricRefs: string[] | null;
  filterSnapshot: Record<string, string | null> | null;
};

type LoadedMetric = {
  definition: MetricDefinition;
  result: MetricResult;
};

function metricValues(metric: MetricResult) {
  return metric.series ?? metric.rows ?? (metric.summary ? [metric.summary] : []);
}

function compactMetric(metric: MetricResult) {
  return {
    metricId: metric.metricId,
    title: metric.title,
    generatedAt: metric.generatedAt,
    filters: metric.filters,
    summary: metric.summary,
    series: metric.series?.slice(0, 30),
    rows: metric.rows?.slice(0, 50),
    stale: metric.stale,
    error: metric.error,
  };
}

function describeMetric(metric: MetricResult) {
  if (metric.error && metricValues(metric).length === 0) return `${metric.title}: อ่านข้อมูลไม่ได้ (${metric.error})`;
  if (metric.summary) {
    const values = Object.entries(metric.summary).map(([key, value]) => `${key}: ${value ?? "—"}`).join(", ");
    return `${metric.title}: ${values}`;
  }
  const rows = metricValues(metric);
  const preview = rows.slice(0, 3).map((row) => Object.values(row).join(" / ")).join("; ");
  return `${metric.title}: ${rows.length} รายการ/กลุ่ม${preview ? ` (${preview})` : ""}`;
}

function numericSummary(metric: MetricResult | undefined, key = "value") {
  const value = metric?.summary?.[key];
  return typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : undefined;
}

function linkedProcurementSummary(metrics: LoadedMetric[]) {
  const byId = new Map(metrics.map((item) => [item.definition.id, item.result]));
  const lowStock = byId.get("inventory.low-stock")?.rows ?? [];
  const mrLines = byId.get("inventory.mr-lines")?.rows ?? [];
  const poLines = byId.get("procurement.po-lines")?.rows ?? [];
  const riskyParts = new Set(lowStock.map((row) => String(row["Part No"] ?? "")).filter(Boolean));
  const linkedMr = mrLines.filter((row) => riskyParts.has(String(row["Part No"] ?? "")));
  const linkedPo = poLines.filter((row) => riskyParts.has(String(row["Part No"] ?? "")));
  const poPreview = linkedPo.slice(0, 5).map((row) => `${row["Part No"]}: PO ${row.PO} (${row.Status})`).join(", ");

  return [
    `พบอะไหล่ต่ำกว่าจุดสั่งซื้อ ${lowStock.length} รายการ`,
    `เชื่อมกับ MR ที่ยังดำเนินการอยู่ได้ ${linkedMr.length} รายการ`,
    `เชื่อมกับ PO ที่ยังเปิดอยู่ได้ ${linkedPo.length} รายการ${poPreview ? ` ได้แก่ ${poPreview}` : ""}`,
    linkedPo.length === 0 && lowStock.length > 0
      ? "ยังไม่พบ PO ที่ยืนยันได้จาก Part No ในชุดข้อมูลนี้ ควรตรวจสอบการสร้าง PR/PO สำหรับรายการ Critical"
      : "ควรตรวจวันรับตามแผนและสถานะ PO ของรายการที่เชื่อมโยงได้",
  ].join("\n");
}

function executiveFallback(metrics: LoadedMetric[]) {
  const byId = new Map(metrics.map((item) => [item.definition.id, item.result]));
  const woStatus = byId.get("maintenance.wo-status");
  const lowStock = byId.get("inventory.low-stock")?.rows ?? [];
  const poLines = byId.get("procurement.po-lines")?.rows ?? [];
  const overdue = numericSummary(byId.get("procurement.overdue"));
  const statusEvidence = metricValues(woStatus ?? {} as MetricResult).slice(0, 6)
    .map((row) => `${row.label ?? row.Status ?? "ไม่ระบุ"} ${row.value ?? "—"}`)
    .join(", ");

  return [
    "ข้อเสนอเพื่อสั่งการ",
    `1. มอบหมายทีมซ่อมทบทวน WO ตามสถานะที่ค้าง${statusEvidence ? ` (${statusEvidence})` : ""} และกำหนดผู้รับผิดชอบ/วันปิดงาน`,
    `2. ให้คลังตรวจสอบอะไหล่ Critical ที่ต่ำกว่าจุดสั่งซื้อ ${lowStock.length} รายการ และยืนยันรายการที่กระทบ WO ก่อน`,
    `3. ให้จัดซื้อติดตาม PO ที่ยังเปิด ${poLines.length} รายการ${overdue === undefined ? "" : ` โดยมีรายการเกินกำหนด ${overdue} รายการ`} พร้อมรายงานกำหนดรับใหม่`,
    "ตัวเลขข้างต้นอ้างอิงข้อมูล Card ปัจจุบัน โปรดเปิด Card ต้นทางเพื่อตรวจสอบรายการก่อนสั่งการ",
  ].join("\n");
}

function localSummary(plan: ChatPlan, metrics: LoadedMetric[]) {
  if (plan.id === "procurement-linkage") return linkedProcurementSummary(metrics);
  if (plan.id === "executive-actions") return executiveFallback(metrics);
  return [`สรุป: ${plan.objective}`, ...metrics.map(({ result }) => `• ${describeMetric(result)}`)].join("\n");
}

async function aiSummary(question: string, plan: ChatPlan, metrics: LoadedMetric[], history: HistoryMessage[]) {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!baseUrl || !apiKey || !model) return localSummary(plan, metrics);

  const data = metrics.map(({ definition, result }) => ({ dashboard: definition.dashboard, ...compactMetric(result) }));
  const recentConversation = history.slice(-6).map((message) => ({
    role: message.role === "USER" ? "user" : "assistant",
    content: message.content,
  }));
  const system = [
    "คุณคือผู้ช่วยวิเคราะห์ข้อมูลผู้บริหารกองบินตำรวจ ตอบภาษาไทยแบบกระชับและตรงคำถาม",
    "ใช้เฉพาะตัวเลขและข้อเท็จจริงใน DATA จาก Card ที่ได้รับอนุญาต ห้ามแต่งตัวเลขหรือสรุปความสัมพันธ์ที่ไม่มีหลักฐาน",
    "ใช้บทสนทนาก่อนหน้าเพื่อเข้าใจคำว่า พวกนี้ เรื่องนี้ แล้ว หรือคำถามต่อเนื่อง แต่ให้ถือ DATA ล่าสุดเป็นแหล่งตัวเลขเท่านั้น",
    "เมื่อต้องเชื่อมอะไหล่กับ MR/PR/PO ให้ยืนยันด้วย Part No ที่ตรงกัน ถ้าเชื่อมไม่ได้ต้องบอกว่าไม่พบข้อมูลยืนยัน",
    "เมื่อถามสาเหตุ ให้แยกข้อเท็จจริงออกจากข้อสันนิษฐาน และระบุสิ่งที่ควรตรวจสอบเพิ่ม",
    "เมื่อถามว่าควรสั่งการอะไร ให้ตอบเป็นรายการ Executive Action ที่มีลำดับความสำคัญ จำนวนรายการจากข้อมูล และหน่วยงานที่ควรรับผิดชอบ",
    "ปิดท้ายด้วยคำเตือนสั้น ๆ ให้ตรวจสอบ Card ต้นทางก่อนตัดสินใจ",
  ].join("\n");

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [
          { role: "system", content: system },
          ...recentConversation,
          { role: "user", content: JSON.stringify({ question, objective: plan.objective, data }) },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error("AI unavailable");
    const body = await response.json() as { choices?: { message?: { content?: string } }[] };
    const generated = body.choices?.[0]?.message?.content?.trim();
    return generated?.replace(/\*\*/g, "").replace(/^\s*\*\s*/gm, "• ") || localSummary(plan, metrics);
  } catch {
    return localSummary(plan, metrics);
  }
}

function filtersFromHistory(history: HistoryMessage[]): Partial<DashboardFilters> {
  const snapshot = [...history].reverse().find((message) => message.filterSnapshot)?.filterSnapshot;
  if (!snapshot) return {};
  return {
    site: snapshot.site === "T101" ? "T101" : snapshot.site === "T10" ? "T10" : undefined,
    projectId: snapshot.projectId ?? undefined,
    fiscalYear: snapshot.fiscalYear ?? undefined,
    buyer: snapshot.buyer ?? undefined,
    supplier: snapshot.supplier ?? undefined,
  };
}

export async function answerQuestion(input: { userId: string; question: string; conversationId?: string; filters?: Partial<DashboardFilters> }) {
  const db = getDb();
  let conversationId = input.conversationId;
  let history: HistoryMessage[] = [];

  if (conversationId) {
    const owned = await db.select({ id: chatConversations.id }).from(chatConversations)
      .where(and(eq(chatConversations.id, conversationId), eq(chatConversations.userId, input.userId))).limit(1);
    if (!owned[0]) {
      conversationId = undefined;
    } else {
      history = (await db.select({
        role: chatMessages.role,
        content: chatMessages.content,
        metricRefs: chatMessages.metricRefs,
        filterSnapshot: chatMessages.filterSnapshot,
      }).from(chatMessages).where(eq(chatMessages.conversationId, conversationId))
        .orderBy(desc(chatMessages.createdAt)).limit(10)).reverse();
    }
  }

  const previousMetricIds = [...new Set(history.flatMap((message) => message.metricRefs ?? []))];
  const plan = planQuestion(input.question, previousMetricIds);
  const definitions = resolvePlanMetrics(plan);
  const filters = extractFilters(input.question, { ...filtersFromHistory(history), ...input.filters });
  const results = await Promise.all(definitions.map((definition) => loadMetric(definition, filters)));
  const loadedMetrics = definitions.map((definition, index) => ({ definition, result: results[index] }));
  const answer = await aiSummary(input.question, plan, loadedMetrics, history);

  if (!conversationId) {
    conversationId = crypto.randomUUID();
    await db.insert(chatConversations).values({ id: conversationId, userId: input.userId, title: input.question.slice(0, 200) });
  }

  const snapshot = Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, value == null ? null : String(value)]));
  await db.insert(chatMessages).values([
    { id: crypto.randomUUID(), conversationId, role: "USER", content: input.question, filterSnapshot: snapshot },
    { id: crypto.randomUUID(), conversationId, role: "ASSISTANT", content: answer, metricRefs: definitions.map((metric) => metric.id), filterSnapshot: snapshot },
  ]);

  const sources = loadedMetrics.map(({ definition, result }) => ({
    metricId: definition.id,
    title: definition.title,
    generatedAt: result.generatedAt,
    href: `/dashboards/${definition.dashboard}`,
    stale: result.stale ?? false,
  }));
  return { conversationId, answer, source: sources[0], sources };
}
