import { z } from "zod";
import type { DashboardFilters } from "./types";

export const dashboardFiltersSchema = z.object({
  site: z.enum(["T10", "T101"]).default("T10"),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  fiscalYear: z.string().trim().max(20).optional(),
  locationGroup: z.string().trim().max(40).optional(),
  locationSearch: z.string().trim().max(80).optional(),
  projectId: z.string().trim().max(40).optional(),
  buyer: z.string().trim().max(40).optional(),
  supplier: z.string().trim().max(80).optional(),
});

export function parseFilters(input: URLSearchParams | Record<string, unknown>): DashboardFilters {
  const source = input instanceof URLSearchParams ? Object.fromEntries(input.entries()) : input;
  const normalized = Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, value === "" ? undefined : value]),
  );
  return dashboardFiltersSchema.parse(normalized);
}
