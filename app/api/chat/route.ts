import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { writeAudit } from "@/lib/audit";
import { answerQuestion, clearChatHistory } from "@/lib/chat/service";
import { dashboardFiltersSchema } from "@/lib/dashboard/validation";

const requestSchema = z.object({
  question: z.string().trim().min(2).max(500),
  conversationId: z.string().uuid().optional(),
  filters: dashboardFiltersSchema.partial().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  try {
    const input = requestSchema.parse(await request.json());
    return NextResponse.json(await answerQuestion({ userId: user.id, ...input }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ไม่สามารถตอบคำถามได้" }, { status: 400 });
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  try {
    const result = await clearChatHistory(user.id);
    await writeAudit({
      actorId: user.id,
      action: "CHAT_HISTORY_CLEAR",
      entityType: "CHAT_CONVERSATION",
      metadata: result,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ไม่สามารถล้างประวัติการสนทนาได้" }, { status: 500 });
  }
}
