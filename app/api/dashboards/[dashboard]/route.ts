import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { dashboardSlugs } from "@/lib/dashboard/catalog";
import { loadDashboard } from "@/lib/dashboard/service";
import { parseFilters } from "@/lib/dashboard/validation";
import type { DashboardSlug } from "@/lib/dashboard/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dashboard: string }> },
) {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const { dashboard } = await params;
  if (!dashboardSlugs.includes(dashboard as DashboardSlug)) {
    return NextResponse.json({ error: "ไม่พบ Dashboard" }, { status: 404 });
  }

  try {
    const filters = parseFilters(request.nextUrl.searchParams);
    return NextResponse.json(await loadDashboard(dashboard as DashboardSlug, filters));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ตัวกรองไม่ถูกต้อง" },
      { status: 400 },
    );
  }
}

