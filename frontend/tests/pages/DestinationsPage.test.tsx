import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../renderWithProviders";
import DestinationsPage from "@/pages/DestinationsPage";
import { fetchDestinations } from "@/api/destinationApi";

vi.mock("@/api/destinationApi", () => ({
  fetchDestinations: vi.fn(),
}));

const ALL_DESTINATIONS = [
  { _id: "1", name: "Thailand", slug: "thailand", region: "Southeast Asia" },
  { _id: "2", name: "Brazil", slug: "brazil", region: "South America" },
];

describe("DestinationsPage", () => {
  beforeEach(() => {
    vi.mocked(fetchDestinations).mockImplementation(async (filters = {}) => {
      let results = ALL_DESTINATIONS;
      if (filters.search) {
        results = results.filter((d) => d.name.toLowerCase().includes(filters.search!.toLowerCase()));
      }
      return results as never;
    });
  });

  it("lists all destinations on load", async () => {
    renderWithProviders(<DestinationsPage />);
    expect(await screen.findByText("Thailand")).toBeInTheDocument();
    expect(await screen.findByText("Brazil")).toBeInTheDocument();
  });

  it("filters destinations as the user types in the search box", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DestinationsPage />);
    await screen.findByText("Thailand");

    const searchInput = screen.getByPlaceholderText(/search destinations/i);
    await user.type(searchInput, "thai");

    await waitFor(() => {
      expect(screen.getByText("Thailand")).toBeInTheDocument();
      expect(screen.queryByText("Brazil")).not.toBeInTheDocument();
    });
  });

  it("each destination card is a real link/button a keyboard user can activate", async () => {
    renderWithProviders(<DestinationsPage />);
    const card = await screen.findByRole("button", { name: /Thailand/i });
    expect(card).toBeInTheDocument();
    card.focus();
    expect(card).toHaveFocus();
  });

  it("shows an empty state when no destinations match the filters", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DestinationsPage />);
    await screen.findByText("Thailand");

    await user.type(screen.getByPlaceholderText(/search destinations/i), "zzzznomatch");
    expect(await screen.findByText(/no destinations match/i)).toBeInTheDocument();
  });
});
