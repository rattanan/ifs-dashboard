import { notFound } from "next/navigation";
import { DashboardPage } from "@/components/dashboard-page";
import { dashboardSlugs } from "@/lib/dashboard/catalog";
import type { DashboardSlug } from "@/lib/dashboard/types";

export default async function DashboardRoute({ params }: { params: Promise<{ dashboard: string }> }) {
  const { dashboard } = await params;
  if (!dashboardSlugs.includes(dashboard as DashboardSlug)) notFound();
  return <DashboardPage dashboard={dashboard as DashboardSlug} />;
}
