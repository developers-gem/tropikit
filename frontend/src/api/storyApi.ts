import { apiRequest } from "./client";
import type { Story } from "@/types/api";

export function fetchStories(destinationSlug?: string) {
  const qs = destinationSlug ? `?destinationSlug=${encodeURIComponent(destinationSlug)}` : "";
  return apiRequest<Story[]>(`/stories${qs}`);
}

export function fetchStoryById(id: string) {
  return apiRequest<Story>(`/stories/${id}`);
}

/** "Your Tropikit Story" for a destination page — returns [] (not an error) when no story
 *  exists yet for that destination, which the UI renders as "Story coming soon." */
export function fetchDestinationStories(slug: string) {
  return apiRequest<Story[]>(`/destinations/${slug}/stories`);
}
