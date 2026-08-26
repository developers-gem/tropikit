import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../renderWithProviders";
import EmergencyPage from "@/pages/EmergencyPage";
import { fetchGlobalEmergencyContacts } from "@/api/destinationApi";

vi.mock("@/api/destinationApi", () => ({
  fetchGlobalEmergencyContacts: vi.fn(),
}));

const CONTACTS = [
  { label: "International SOS", number: "+44 20 8762 8008", note: "24/7 line", category: "assistance-provider", source: null, lastVerifiedAt: null },
  { label: "WHO Global Outbreak", number: "who.int/emergencies", note: "Live alerts", category: "health-authority", source: "https://who.int", lastVerifiedAt: null },
];

describe("EmergencyPage", () => {
  beforeEach(() => {
    vi.mocked(fetchGlobalEmergencyContacts).mockResolvedValue(CONTACTS as never);
  });

  it("renders a working tel: link for a phone-shaped contact", async () => {
    renderWithProviders(<EmergencyPage />);
    const link = await screen.findByRole("link", { name: /\+44 20 8762 8008/ });
    expect(link).toHaveAttribute("href", "tel:+442087628008");
  });

  it("does not render a tel: link for a non-phone-shaped value", async () => {
    renderWithProviders(<EmergencyPage />);
    await screen.findByText("who.int/emergencies");
    expect(screen.queryByRole("link", { name: /who\.int\/emergencies/ })).not.toBeInTheDocument();
  });

  it("shows the medical disclaimer", async () => {
    renderWithProviders(<EmergencyPage />);
    await screen.findByText("International SOS");
    expect(screen.getByText(/not a substitute for professional medical advice/i)).toBeInTheDocument();
  });
});
