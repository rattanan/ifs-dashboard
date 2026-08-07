export type DashboardSlug = "summary" | "fleet-readiness" | "maintenance" | "budget" | "inventory" | "procurement";
export type MetricKind = "kpi" | "summary" | "bar" | "donut" | "line" | "gauge" | "table";

export interface DashboardFilters {
  site: "T10" | "T101";
  from?: string;
  to?: string;
  fiscalYear?: string;
  locationGroup?: string;
  locationSearch?: string;
  projectId?: string;
  buyer?: string;
  supplier?: string;
}

export interface MetricDefinition {
  id: string;
  dashboard: DashboardSlug;
  title: string;
  description: string;
  sourceElementId: string;
  sourceDataSourceId: string;
  allowedFilters: (keyof DashboardFilters)[];
  sql: string;
  kind: MetricKind;
  size?: "sm" | "md" | "lg" | "wide";
  valueLabel?: string;
}

export interface MetricResult {
  metricId: string;
  title: string;
  description: string;
  kind: MetricKind;
  size?: "sm" | "md" | "lg" | "wide";
  valueLabel?: string;
  generatedAt: string;
  filters: DashboardFilters;
  summary?: Record<string, number | string | null>;
  series?: Record<string, unknown>[];
  rows?: Record<string, unknown>[];
  stale?: boolean;
  dataSource?: "Oracle IFSAPP" | "MariaDB seed";
  error?: string;
}

export interface DashboardResult {
  dashboard: DashboardSlug;
  generatedAt: string;
  filters: DashboardFilters;
  metrics: MetricResult[];
}
