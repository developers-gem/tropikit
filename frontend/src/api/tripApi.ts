import { apiRequest, API_URL, getAccessToken } from "./client";
import type {
  Trip,
  ChecklistGroup,
  TripDashboard,
  VaccineStatus,
  MalariaPlanStatus,
  PersistedMalariaPlan,
  ReminderItem,
  DrugKey,
} from "@/types/api";

export interface CreateTripInput {
  destinationId: string;
  departureDate: string;
  returnDate: string;
  tripType?: string;
  accommodationType?: string;
  activities?: string[];
  selectedAntimalarial?: string;
}

export interface UpdateTripPreparationInput {
  vaccineStatus?: VaccineStatus;
  malariaPlanStatus?: MalariaPlanStatus;
  emergencyAcknowledged?: boolean;
}

export function fetchTrips() {
  return apiRequest<Trip[]>("/trips", { auth: true });
}

export function fetchTrip(id: string) {
  return apiRequest<Trip>(`/trips/${id}`, { auth: true });
}

export function createTrip(input: CreateTripInput) {
  return apiRequest<Trip>("/trips", { method: "POST", body: input, auth: true });
}

export function updateTrip(id: string, input: Partial<CreateTripInput>) {
  return apiRequest<Trip>(`/trips/${id}`, { method: "PUT", body: input, auth: true });
}

export function deleteTrip(id: string) {
  return apiRequest<null>(`/trips/${id}`, { method: "DELETE", auth: true });
}

/** The trip dashboard: destination + checklist + malaria plan + reminders + stories +
 *  readiness, aggregated server-side into one call. */
export function fetchTripDashboard(tripId: string) {
  return apiRequest<TripDashboard>(`/trips/${tripId}/dashboard`, { auth: true });
}

export function updateTripPreparation(tripId: string, input: UpdateTripPreparationInput) {
  return apiRequest<Trip>(`/trips/${tripId}/preparation`, {
    method: "PUT",
    body: input,
    auth: true,
  });
}

export function fetchChecklistTemplate() {
  return apiRequest<ChecklistGroup[]>("/checklist");
}

/** The personalized template for a specific trip: base 23 items + any matched categories
 *  (e.g. Safari, Jungle travel, Beach) based on that trip's type/activities. */
export function fetchTripChecklistTemplate(tripId: string) {
  return apiRequest<ChecklistGroup[]>(`/trips/${tripId}/checklist/template`, { auth: true });
}

export interface ChecklistProgress {
  checkedItemKeys: string[];
  total: number;
  completed: number;
}

export function fetchTripChecklist(tripId: string) {
  return apiRequest<ChecklistProgress>(`/trips/${tripId}/checklist`, { auth: true });
}

export function saveTripChecklist(tripId: string, checkedItemKeys: string[]) {
  return apiRequest<ChecklistProgress>(`/trips/${tripId}/checklist`, {
    method: "PUT",
    body: { checkedItemKeys },
    auth: true,
  });
}

/**
 * The malaria plan belongs to the trip (Trip → Malaria Plan). GET returns null (not an
 * error) when no plan exists yet — that's a normal trip state, not a failure.
 */
export function fetchTripMalariaPlan(tripId: string) {
  return apiRequest<PersistedMalariaPlan | null>(`/trips/${tripId}/malaria-plan`, { auth: true });
}

export function saveTripMalariaPlan(tripId: string, medication: DrugKey, timezone: string) {
  return apiRequest<PersistedMalariaPlan>(`/trips/${tripId}/malaria-plan`, {
    method: "PUT",
    body: { medication, timezone },
    auth: true,
  });
}

export function deleteTripMalariaPlan(tripId: string) {
  return apiRequest<null>(`/trips/${tripId}/malaria-plan`, { method: "DELETE", auth: true });
}

export function fetchTripReminders(tripId: string, upcomingOnly = true) {
  return apiRequest<ReminderItem[]>(
    `/trips/${tripId}/reminders${upcomingOnly ? "" : "?upcoming=false"}`,
    { auth: true },
  );
}

/**
 * Downloads the server-generated .ics file bundling every reminder for the trip. This isn't
 * a plain <a href> link because the endpoint requires an Authorization header — instead we
 * fetch with the token attached and trigger a client-side blob download, same pattern as the
 * existing per-plan .ics export.
 */
export async function downloadTripCalendar(tripId: string, filenameHint: string): Promise<void> {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}/api/v1/trips/${tripId}/calendar.ics`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Couldn't download the trip calendar. Please try again.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tropikit-${filenameHint}-trip.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
