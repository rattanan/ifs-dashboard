export type FleetStatusKey = "ready" | "maintenance" | "parts" | "grounded" | "unknown";

export type FleetStatusCounts = Record<FleetStatusKey, number>;

export type FleetReadinessSnapshot = {
  site: string;
  generatedAt: string;
  totalAircraft: number;
  statusCounts: FleetStatusCounts;
  availabilityTrend: Array<{ label: string; value: number }>;
  byType: Array<{
    type: "Helicopter" | "Fixed Wing";
    total: number;
    ready: number;
    maintenance: number;
    parts: number;
    grounded: number;
    unknown: number;
  }>;
  kpis: {
    mtbf: number;
    mtbfDelta: number;
    mttr: number;
    mttrDelta: number;
    grounded: number;
    groundedDelta: number;
    daysSinceLastFlight: number;
    daysSinceLastFlightDelta: number;
    flightHours: number;
    flightHoursDelta: number;
    utilization: number;
    utilizationDelta: number;
  };
  aircraft: Array<{
    rank: number;
    aircraft: string;
    groupId: string;
    model: string;
    type: "Helicopter" | "Fixed Wing";
    flightHours: number | null;
    status: FleetStatusKey;
    event: string;
  }>;
  unitAvailability: Array<{
    unit: string;
    available: number;
    total: number;
    rate: number;
  }>;
};

export const fleetStatusLabels: Record<FleetStatusKey, string> = {
  ready: "พร้อมปฏิบัติการ",
  maintenance: "อยู่ระหว่างซ่อมบำรุง",
  parts: "รออะไหล่",
  grounded: "หยุดใช้งาน (Grounded)",
  unknown: "ไม่ระบุสถานะ",
};

export function normalizeFleetStatus(value: unknown): FleetStatusKey {
  const status = String(value ?? "").trim().toLowerCase();
  if (!status) return "unknown";
  if (
    status.includes("ground") ||
    status.includes("หยุด") ||
    status.includes("unavailable") ||
    status.includes("ใช้งานไม่ได้") ||
    status.includes("ใช้ราชการไม่ได้")
  ) return "grounded";
  if (status.includes("part") || status.includes("อะไหล่") || status.includes("waiting")) return "parts";
  if (status.includes("maint") || status.includes("ซ่อม") || status.includes("repair")) return "maintenance";
  if (
    status.includes("mission ready") ||
    status === "ready" ||
    status === "available" ||
    status.includes("ใช้งานได้") ||
    status.includes("พร้อม")
  ) return "ready";
  return "unknown";
}

export function normalizeFlightHours(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export const fleetReadinessSeed: FleetReadinessSnapshot = {
  site: "T10",
  generatedAt: "2024-05-20T09:00:00+07:00",
  totalAircraft: 31,
  statusCounts: {
    ready: 20,
    maintenance: 7,
    parts: 2,
    grounded: 2,
    unknown: 0,
  },
  availabilityTrend: [
    { label: "Dec", value: 58.1 },
    { label: "Jan", value: 62.3 },
    { label: "Feb", value: 66.0 },
    { label: "Mar", value: 63.7 },
    { label: "Apr", value: 61.2 },
    { label: "May", value: 64.5 },
  ],
  byType: [
    { type: "Helicopter", total: 24, ready: 15, maintenance: 5, parts: 2, grounded: 2, unknown: 0 },
    { type: "Fixed Wing", total: 7, ready: 5, maintenance: 2, parts: 0, grounded: 0, unknown: 0 },
  ],
  kpis: {
    mtbf: 320.5,
    mtbfDelta: 8.2,
    mttr: 48.7,
    mttrDelta: -6.1,
    grounded: 4,
    groundedDelta: 2,
    daysSinceLastFlight: 12.4,
    daysSinceLastFlightDelta: 3.2,
    flightHours: 8542,
    flightHoursDelta: 12.5,
    utilization: 41.8,
    utilizationDelta: 4.7,
  },
  aircraft: [
    { rank: 1, aircraft: "POL-1101", groupId: "AW139", model: "AW139", type: "Helicopter", flightHours: 2845, status: "ready", event: "Mission Flight" },
    { rank: 2, aircraft: "POL-1102", groupId: "AW139", model: "AW139", type: "Helicopter", flightHours: 2650, status: "ready", event: "Training Flight" },
    { rank: 3, aircraft: "POL-1201", groupId: "EC145", model: "EC145", type: "Helicopter", flightHours: 1920, status: "maintenance", event: "100-Hour Inspection" },
    { rank: 4, aircraft: "POL-1202", groupId: "EC145", model: "EC145", type: "Helicopter", flightHours: 1875, status: "parts", event: "Waiting for Parts" },
    { rank: 5, aircraft: "POL-1301", groupId: "BELL429", model: "Bell 429", type: "Helicopter", flightHours: 1450, status: "ready", event: "Mission Flight" },
    { rank: 6, aircraft: "POL-2101", groupId: "CESSNA208", model: "Cessna 208", type: "Fixed Wing", flightHours: 1120, status: "ready", event: "Surveillance Flight" },
    { rank: 7, aircraft: "POL-2102", groupId: "DA42", model: "DA42", type: "Fixed Wing", flightHours: 980, status: "grounded", event: "Aircraft on Ground" },
    { rank: 8, aircraft: "POL-1103", groupId: "AW139", model: "AW139", type: "Helicopter", flightHours: 990, status: "maintenance", event: "Phase Inspection" },
    { rank: 9, aircraft: "POL-1203", groupId: "EC145", model: "EC145", type: "Helicopter", flightHours: 1560, status: "maintenance", event: "Training Flight" },
    { rank: 10, aircraft: "POL-1302", groupId: "BELL429", model: "Bell 429", type: "Helicopter", flightHours: 1305, status: "parts", event: "Waiting for Parts" },
  ],
  unitAvailability: [
    { unit: "กองบังคับการตำรวจ (ส่วนกลาง)", available: 14, total: 19, rate: 72.1 },
    { unit: "หน่วยบินภาคเหนือ (เชียงใหม่)", available: 7, total: 12, rate: 58.3 },
    { unit: "หน่วยบินภาคตะวันออก (ชลบุรี)", available: 4, total: 6, rate: 66.7 },
    { unit: "หน่วยบินภาคใต้ (ภูเก็ต)", available: 2, total: 4, rate: 50.0 },
  ],
};

export function snapshotForSite(site: string) {
  return { ...fleetReadinessSeed, site };
}
