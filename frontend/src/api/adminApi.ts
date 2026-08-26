import { apiRequest } from "./client";

export interface DashboardUpdateItem {
  type: "destination" | "story";
  id: string;
  label: string;
  slug?: string;
  updatedAt: string;
  status: string;
}

export interface AdminDashboardStats {
  destinationCount: number;
  storyCount: number;
  unpublishedStoryCount: number;
  destinationsNeedingReview: number;
  destinationsWithSourceWarnings: number;
  recentUpdates: DashboardUpdateItem[];
}

export function fetchAdminDashboard() {
  return apiRequest<AdminDashboardStats>("/admin/dashboard", { auth: true });
}
