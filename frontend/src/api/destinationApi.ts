import { apiRequest } from "./client";
import type { Destination, DrugRegimen, MalariaPlan, DrugKey, EmergencyContact } from "@/types/api";

export interface DestinationFilters {
  search?: string;
  region?: string;
  malariaRisk?: string;
}

export function fetchDestinations(filters: DestinationFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.region) params.set("region", filters.region);
  if (filters.malariaRisk) params.set("malariaRisk", filters.malariaRisk);
  const qs = params.toString();
  return apiRequest<Destination[]>(`/destinations${qs ? `?${qs}` : ""}`);
}

export function fetchDestinationBySlug(slug: string) {
  return apiRequest<Destination>(`/destinations/${slug}`);
}

export function fetchMalariaInfo(slug: string) {
  return apiRequest<{
    malariaRisk: Destination["malariaRisk"];
    malaria: Destination["malaria"];
    sources: Destination["sources"];
    drugRegimens: DrugRegimen[];
  }>(`/destinations/${slug}/malaria`);
}

export function calculateMalariaPlan(input: { drug: DrugKey; tripStart: string; tripEnd: string }) {
  return apiRequest<MalariaPlan>("/destinations/malaria/calculate", {
    method: "POST",
    body: input,
  });
}

export function fetchGlobalEmergencyContacts() {
  return apiRequest<EmergencyContact[]>("/emergency/global");
}
