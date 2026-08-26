import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import ChecklistPage from "@/pages/ChecklistPage";
import { fetchChecklistTemplate, fetchTrips } from "@/api/tripApi";
import { useAuth } from "@/contexts/AuthContext";

vi.mock("@/api/tripApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/tripApi")>();
  return { ...actual, fetchChecklistTemplate: vi.fn(), fetchTrips: vi.fn() };
});
vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }));

const TEMPLATE = [
  { category: "Documents", items: ["Review travel insurance", "Yellow fever certificate"] },
  { category: "Medical kit", items: ["Prepare medical kit"] },
];

// "Review travel insurance" legitimately appears twice by design: once in the "Still to do"
// summary panel, once as the actual checkable item under its category card — so tests target
// the checkable item specifically via its checkbox-button role, not raw text matching.
function getChecklistItemButton(name: string) {
  return screen.getAllByText(name).find((el) => el.closest("button"))!.closest("button")!;
}

describe("ChecklistPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(fetchChecklistTemplate).mockResolvedValue(TEMPLATE);
    vi.mocked(fetchTrips).mockResolvedValue([]);
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ status: "unauthenticated" });
  });

  it("renders the checklist with 0 / N complete initially", async () => {
    renderWithProviders(<ChecklistPage />);
    await waitFor(() => expect(getChecklistItemButton("Review travel insurance")).toBeInTheDocument());
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("shows the 'Still to do' list matching the spec's exact presentation pattern", async () => {
    renderWithProviders(<ChecklistPage />);
    await waitFor(() => expect(getChecklistItemButton("Review travel insurance")).toBeInTheDocument());
    const stillToDoHeading = screen.getByText(/still to do/i);
    const stillToDoPanel = stillToDoHeading.closest("div")!;
    expect(stillToDoPanel).toHaveTextContent("Review travel insurance");
  });

  it("checking an item updates and persists to localStorage", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChecklistPage />);
    await waitFor(() => expect(getChecklistItemButton("Review travel insurance")).toBeInTheDocument());
    await user.click(getChecklistItemButton("Review travel insurance"));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("tropikit_checklist_v1") ?? "{}");
      expect(stored["Documents::Review travel insurance"]).toBe(true);
    });
  });

  it("Complete all checks every item", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ChecklistPage />);
    await waitFor(() => expect(getChecklistItemButton("Review travel insurance")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /complete all/i }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("tropikit_checklist_v1") ?? "{}");
      expect(Object.values(stored).every(Boolean)).toBe(true);
      expect(Object.keys(stored).length).toBe(3);
    });
  });

  it("Reset clears all checked items after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderWithProviders(<ChecklistPage />);
    await waitFor(() => expect(getChecklistItemButton("Review travel insurance")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /complete all/i }));
    await user.click(screen.getByRole("button", { name: /reset checklist/i }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("tropikit_checklist_v1") ?? "{}");
      expect(Object.values(stored).every((v) => !v)).toBe(true);
    });
  });
});
