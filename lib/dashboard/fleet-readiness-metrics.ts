import type { DashboardFilters, MetricDefinition, MetricResult } from "./types";
import { fleetReadinessSeed, fleetStatusLabels, type FleetReadinessSnapshot } from "./fleet-readiness-data";

function metricBase(metric: MetricDefinition, filters: DashboardFilters, generatedAt: string): MetricResult {
  return {
    metricId: metric.id,
    title: metric.title,
    description: metric.description,
    kind: metric.kind,
    size: metric.size,
    valueLabel: metric.valueLabel,
    generatedAt,
    filters,
    dataSource: "MariaDB seed",
    stale: true,
  };
}

function statusRows(snapshot: FleetReadinessSnapshot) {
  return snapshot.byType.flatMap((item) => [
    { type: item.type, status: fleetStatusLabels.ready, value: item.ready },
    { type: item.type, status: fleetStatusLabels.maintenance, value: item.maintenance },
    { type: item.type, status: fleetStatusLabels.parts, value: item.parts },
    { type: item.type, status: fleetStatusLabels.grounded, value: item.grounded },
    { type: item.type, status: fleetStatusLabels.unknown, value: item.unknown },
  ]);
}

export function buildFleetReadinessSeedMetric(
  metric: MetricDefinition,
  filters: DashboardFilters,
  snapshot: FleetReadinessSnapshot = fleetReadinessSeed,
): MetricResult | undefined {
  if (metric.dashboard !== "fleet-readiness") return undefined;

  const result = metricBase(metric, filters, snapshot.generatedAt);
  switch (metric.id) {
    case "fleet-readiness.aircraft-list":
      result.rows = snapshot.aircraft.map((row) => ({
        Rank: row.rank,
        Aircraft: row.aircraft,
        Model: row.model,
        Type: row.type,
        "Flight Hours": row.flightHours,
        Status: fleetStatusLabels[row.status],
        Event: row.event,
      }));
      return result;
    case "fleet-readiness.status-summary":
      result.rows = statusRows(snapshot);
      return result;
    case "fleet-readiness.availability-trend":
      result.series = snapshot.availabilityTrend;
      return result;
    case "fleet-readiness.kpis":
      result.summary = {
        "Aircraft Total": snapshot.totalAircraft,
        MTBF: snapshot.kpis.mtbf,
        "MTBF Delta": snapshot.kpis.mtbfDelta,
        MTTR: snapshot.kpis.mttr,
        "MTTR Delta": snapshot.kpis.mttrDelta,
        Grounded: snapshot.kpis.grounded,
        "Grounded Delta": snapshot.kpis.groundedDelta,
        "Days Since Last Flight": snapshot.kpis.daysSinceLastFlight,
        "Days Since Last Flight Delta": snapshot.kpis.daysSinceLastFlightDelta,
        "Flight Hours": snapshot.kpis.flightHours,
        "Flight Hours Delta": snapshot.kpis.flightHoursDelta,
        Utilization: snapshot.kpis.utilization,
        "Utilization Delta": snapshot.kpis.utilizationDelta,
      };
      return result;
    case "fleet-readiness.unit-availability":
      result.rows = snapshot.unitAvailability;
      return result;
    default:
      return undefined;
  }
}

export function demoFleetReadinessSnapshot(site: string) {
  return { ...fleetReadinessSeed, site };
}
