import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getMetric } from "@/lib/dashboard/catalog";
import { loadMetricById } from "@/lib/dashboard/service";
import { parseFilters } from "@/lib/dashboard/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ metricId: string }> },
) {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  const { metricId } = await params;
  if (!getMetric(metricId)) {
    return NextResponse.json({ error: "ไม่พบ Card" }, { status: 404 });
  }

  try {
    return NextResponse.json(await loadMetricById(metricId, parseFilters(request.nextUrl.searchParams)));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ไม่สามารถโหลดรายละเอียดได้" },
      { status: 400 },
    );
  }
}
