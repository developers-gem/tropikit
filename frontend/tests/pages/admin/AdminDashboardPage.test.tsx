import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../renderWithProviders";
import App from "@/App";
import { useAuth } from "@/contexts/AuthContext";
import * as adminApi from "@/api/adminApi";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/api/adminApi", () => ({
  fetchAdminDashboard: vi.fn(),
}));

const mockStats: adminApi.AdminDashboardStats = {
  destinationCount: 15,
  storyCount: 24,
  unpublishedStoryCount: 3,
  destinationsNeedingReview: 4,
  destinationsWithSourceWarnings: 2,
  recentUpdates: [
    {
      type: "destination",
      id: "dest-1",
      label: "Thailand",
      slug: "thailand",
      updatedAt: "2026-08-25T10:00:00Z",
      status: "reviewed",
    },
    {
      type: "story",
      id: "story-1",
      label: "Mosquito Protection Basics",
      updatedAt: "2026-08-24T12:00:00Z",
      status: "published",
    },
  ],
};

describe("Admin Console & Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies access to normal 'user' role and displays Forbidden state", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "authenticated",
      user: { id: "u1", email: "regular@example.com", name: "Regular User", role: "user" },
    });

    renderWithProviders(<App />, { route: "/admin" });

    expect(await screen.findByText(/access forbidden/i)).toBeInTheDocument();
    expect(screen.getByText(/regular@example.com/i)).toBeInTheDocument();
    expect(adminApi.fetchAdminDashboard).not.toHaveBeenCalled();
  });

  it("renders Admin Dashboard metrics and layout for 'admin' user", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "authenticated",
      user: { id: "admin-1", email: "admin@tropikit.local", name: "Admin User", role: "admin" },
    });
    (adminApi.fetchAdminDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockStats);

    renderWithProviders(<App />, { route: "/admin" });

    expect(await screen.findByText(/admin dashboard/i)).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument(); // Total Destinations
    expect(screen.getByText("24")).toBeInTheDocument(); // Total Stories
    expect(screen.getAllByText("4").length).toBeGreaterThan(0); // Needing Review
    expect(screen.getAllByText("2").length).toBeGreaterThan(0); // Source Warnings
    expect(screen.getByText("Thailand")).toBeInTheDocument();
    expect(screen.getByText("Mosquito Protection Basics")).toBeInTheDocument();
  });

  it("allows access to staff 'content-editor' role", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "authenticated",
      user: { id: "editor-1", email: "editor@example.com", name: "Editor", role: "content-editor" },
    });
    (adminApi.fetchAdminDashboard as ReturnType<typeof vi.fn>).mockResolvedValue(mockStats);

    renderWithProviders(<App />, { route: "/admin" });

    expect(await screen.findByText(/admin dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Role: content-editor/i)).toBeInTheDocument();
  });

  it("displays error state when dashboard API call fails", async () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      status: "authenticated",
      user: { id: "admin-1", email: "admin@tropikit.local", name: "Admin User", role: "admin" },
    });
    (adminApi.fetchAdminDashboard as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("API Error"));

    renderWithProviders(<App />, { route: "/admin" });

    expect(await screen.findByText(/could not load admin dashboard statistics/i)).toBeInTheDocument();
  });
});
