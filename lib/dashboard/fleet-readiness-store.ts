import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { fleetReadinessSeeds } from "@/lib/db/schema";
import { snapshotForSite, type FleetReadinessSnapshot } from "./fleet-readiness-data";

const CACHE_MS = 5 * 60 * 1000;
const snapshotCache = new Map<string, { storedAt: number; snapshot: FleetReadinessSnapshot }>();

function isSnapshot(value: unknown): value is FleetReadinessSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FleetReadinessSnapshot>;
  return Boolean(
    typeof candidate.generatedAt === "string" &&
      typeof candidate.totalAircraft === "number" &&
      candidate.statusCounts &&
      candidate.availabilityTrend &&
      candidate.byType &&
      candidate.kpis &&
      candidate.aircraft &&
      candidate.unitAvailability,
  );
}

export async function loadFleetReadinessSnapshot(site: string) {
  const cached = snapshotCache.get(site);
  if (cached && Date.now() - cached.storedAt <= CACHE_MS) return cached.snapshot;

  const fallback = snapshotForSite(site);
  try {
    const rows = await getDb()
      .select({ snapshot: fleetReadinessSeeds.snapshot })
      .from(fleetReadinessSeeds)
      .where(and(eq(fleetReadinessSeeds.site, site), eq(fleetReadinessSeeds.active, true)))
      .orderBy(desc(fleetReadinessSeeds.createdAt))
      .limit(1);
    const candidate = rows[0]?.snapshot;
    if (isSnapshot(candidate)) {
      const snapshot = { ...candidate, site };
      snapshotCache.set(site, { storedAt: Date.now(), snapshot });
      return snapshot;
    }
  } catch {
    // The seed table is optional in local development; keep the UI usable without it.
  }

  snapshotCache.set(site, { storedAt: Date.now(), snapshot: fallback });
  return fallback;
}
