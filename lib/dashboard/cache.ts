import type { MetricResult } from "./types";

const FRESH_MS = 5 * 60 * 1000;
const STALE_MS = 30 * 60 * 1000;
const values = new Map<string, { value: MetricResult; storedAt: number }>();

export function getCachedMetric(key: string, allowStale = false) {
  const entry = values.get(key);
  if (!entry) return undefined;
  const age = Date.now() - entry.storedAt;
  if (age <= FRESH_MS || (allowStale && age <= STALE_MS)) {
    return { ...entry.value, stale: age > FRESH_MS };
  }
  values.delete(key);
  return undefined;
}

export function setCachedMetric(key: string, value: MetricResult) {
  if (values.size > 300) {
    const oldestKey = values.keys().next().value;
    if (oldestKey) values.delete(oldestKey);
  }
  values.set(key, { value, storedAt: Date.now() });
}

export function clearDashboardCache(dashboard: string) {
  for (const key of values.keys()) {
    if (key.startsWith(`${dashboard}:`)) values.delete(key);
  }
}
