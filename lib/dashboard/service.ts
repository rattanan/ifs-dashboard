import "server-only";

import { getMetric, getMetricsForDashboard } from "./catalog";
import { getCachedMetric, setCachedMetric } from "./cache";
import { buildFleetReadinessSeedMetric } from "./fleet-readiness-metrics";
import { loadFleetReadinessSnapshot } from "./fleet-readiness-store";
import { executeReadOnly } from "./oracle";
import { pickQueryBinds } from "./sql-guard";
import type { DashboardFilters, DashboardResult, DashboardSlug, MetricDefinition, MetricResult } from "./types";

function cacheKey(metric: MetricDefinition, filters: DashboardFilters) {
  return `${metric.dashboard}:${metric.id}:${JSON.stringify(filters)}`;
}

function normalizeValue(value: unknown): number | string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function normalizeRows(rows: Record<string, unknown>[]) {
  return rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeValue(value)])),
  );
}

async function fleetReadinessFallback(metric: MetricDefinition, filters: DashboardFilters) {
  if (metric.dashboard !== "fleet-readiness") return undefined;
  const snapshot = await loadFleetReadinessSnapshot(filters.site);
  return buildFleetReadinessSeedMetric(metric, filters, snapshot);
}

export async function loadMetric(
  metric: MetricDefinition,
  filters: DashboardFilters,
  force = false,
): Promise<MetricResult> {
  const key = cacheKey(metric, filters);
  if (!force) {
    const cached = getCachedMetric(key);
    if (cached) return cached;
  }

  try {
    const binds = pickQueryBinds(metric.sql, filters as unknown as Record<string, unknown>);
    const rows = normalizeRows(await executeReadOnly(metric.sql, binds));
    if (!rows.length) {
      const fallback = await fleetReadinessFallback(metric, filters);
      if (fallback) {
        setCachedMetric(key, fallback);
        return fallback;
      }
    }
    const result: MetricResult = {
      metricId: metric.id,
      title: metric.title,
      description: metric.description,
      kind: metric.kind,
      size: metric.size,
      valueLabel: metric.valueLabel,
      generatedAt: new Date().toISOString(),
      filters,
      summary: metric.kind === "kpi" || metric.kind === "summary" || metric.kind === "gauge" ? rows[0] : undefined,
      series: ["bar", "donut", "line"].includes(metric.kind) ? rows : undefined,
      rows: metric.kind === "table" ? rows : undefined,
      dataSource: "Oracle IFSAPP",
    };
    setCachedMetric(key, result);
    return result;
  } catch (error) {
    const fallback = await fleetReadinessFallback(metric, filters);
    if (fallback) {
      setCachedMetric(key, fallback);
      return fallback;
    }
    const stale = getCachedMetric(key, true);
    if (stale) return { ...stale, stale: true, error: "Oracle ไม่ตอบสนอง กำลังแสดงข้อมูลล่าสุด" };
    return {
      metricId: metric.id,
      title: metric.title,
      description: metric.description,
      kind: metric.kind,
      generatedAt: new Date().toISOString(),
      filters,
      error: error instanceof Error ? error.message : "ไม่สามารถอ่านข้อมูลได้",
    };
  }
}

export async function loadDashboard(
  dashboard: DashboardSlug,
  filters: DashboardFilters,
  force = false,
): Promise<DashboardResult> {
  const metrics = await Promise.all(
    getMetricsForDashboard(dashboard).map((metric) => loadMetric(metric, filters, force)),
  );
  return { dashboard, generatedAt: new Date().toISOString(), filters, metrics };
}

export async function loadMetricById(metricId: string, filters: DashboardFilters, force = false) {
  const metric = getMetric(metricId);
  if (!metric) throw new Error("Unknown metric");
  return loadMetric(metric, filters, force);
}
