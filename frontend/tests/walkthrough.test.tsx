import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "@/App";
import { AuthProvider } from "@/contexts/AuthContext";
import * as client from "@/api/client";

const BRAZIL = {
  _id: "dest-brazil",
  name: "Brazil",
  slug: "brazil",
  region: "South America",
  malariaRisk: {
    level: "high",
    description: "High malaria risk",
    hasSubnationalVariation: true,
    regionalSourceText: "Malaria risk exists mainly in the Amazon basin and parts of the Pantanal.",
    namedRegions: ["Amazon", "Pantanal"],
  },
  advice: [
    "Malaria risk exists mainly in the Amazon basin and parts of the Pantanal.",
    "Dengue, Zika and chikungunya circulate nationwide. Use DEET repellent day and night.",
    "Avoid tap water outside major hotels.",
  ],
  vaccines: [
    { name: "Yellow Fever", status: "conditional", note: "Certificate required if arriving from a yellow-fever country", regionSpecific: true, region: "Amazon" },
    { name: "Hepatitis A", status: "recommended", note: "Recommended for all travellers", regionSpecific: false, region: null },
  ],
  malaria: {
    abcd: {
      awareness: "High malaria risk in Brazil.",
      bitePrevention: "DEET 30-50%, cover skin at dusk, sleep under a treated net.",
      chemoprophylaxis: "Discuss atovaquone-proguanil, doxycycline, mefloquine or chloroquine with your clinician.",
      diagnosis: "Any fever within 3 months of return needs urgent testing.",
    },
  },
  emergencyContacts: [
    { label: "Police", number: "190", category: "police", source: null, lastVerifiedAt: null },
    { label: "Ambulance (SAMU)", number: "192", category: "ambulance", source: null, lastVerifiedAt: null },
  ],
  sources: [
    { publisher: "CDC", title: "CDC Travelers Health - Brazil", url: "https://cdc.gov/brazil", contentType: "destination-advice", sourceType: "cdc", needsReview: true, lastReviewedAt: null },
  ],
  isActive: true,
};

let currentUser: { id: string; email: string; name: string; role: string } | null = null;
let currentTrip: Record<string, unknown> | null = null;
let checklistChecked: string[] = [];
const CHECKLIST_TEMPLATE = [
  { category: "6-8 weeks before", items: ["Book a travel health consultation", "Get required and recommended vaccinations"] },
  { category: "Medical kit", items: ["Thermometer", "Paracetamol / ibuprofen"] },
];

function route(method: string, url: string) {
  const u = new URL(url);
  return `${method} ${u.pathname}${u.search}`;
}

beforeEach(() => {
  client.setAccessToken(null);
  currentUser = null;
  currentTrip = null;
  checklistChecked = [];

  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method ?? "GET";
    const key = route(method, url);
    const body = init?.body ? JSON.parse(init.body as string) : undefined;

    const json = (data: unknown, status = 200) =>
      Promise.resolve({
        ok: status < 400,
        status,
        json: async () => ({ success: status < 400, data, error: status >= 400 ? { code: "ERR", message: "error" } : undefined }),
      } as Response);

    if (key === "POST /api/v1/auth/refresh") return json(null, 401);
    if (key === "GET /api/v1/destinations") return json([BRAZIL]);
    if (key === "GET /api/v1/destinations/brazil") return json(BRAZIL);
    if (key.startsWith("GET /api/v1/destinations/brazil/stories")) return json([]);
    if (key === "GET /api/v1/destinations/brazil/malaria")
      return json({
        malariaRisk: BRAZIL.malariaRisk,
        malaria: BRAZIL.malaria,
        sources: BRAZIL.sources,
        drugRegimens: [
          { key: "atovaquone-proguanil", label: "Atovaquone / proguanil (Malarone)", startBefore: 2, continueAfter: 7, frequency: "Daily, with food", notes: "Shortest post-trip course.", isWeekly: false },
        ],
      });
    if (key === "POST /api/v1/auth/register") {
      currentUser = { id: "u1", email: body.email, name: body.name ?? "", role: "user" };
      return json({ accessToken: "fake-token", user: currentUser }, 201);
    }
    if (key === "GET /api/v1/auth/me") return currentUser ? json(currentUser) : json(null, 401);
    if (key === "GET /api/v1/checklist") return json(CHECKLIST_TEMPLATE);
    if (key === "GET /api/v1/trips") return json(currentTrip ? [currentTrip] : []);
    if (key === "POST /api/v1/trips") {
      currentTrip = { _id: "trip1", userId: "u1", destinationId: "dest-brazil", departureDate: body.departureDate, returnDate: body.returnDate, vaccineStatus: "not-reviewed", malariaPlanStatus: "not-planned", malariaPlanConfirmedAt: null, emergencyAcknowledged: false };
      return json(currentTrip, 201);
    }
    if (key === "GET /api/v1/trips/trip1") return currentTrip ? json(currentTrip) : json(null, 404);
    if (key === "GET /api/v1/trips/trip1/dashboard") {
      const total = 4;
      return json({
        trip: { ...currentTrip, daysUntilDeparture: 30, durationDays: 15 },
        destination: BRAZIL,
        readiness: { completed: checklistChecked.length, total: total + 3, percentage: Math.round((checklistChecked.length / (total + 3)) * 100) },
        checklist: { checkedItemKeys: checklistChecked, total, completed: checklistChecked.length, template: CHECKLIST_TEMPLATE },
        malariaPlan: null,
        malariaApplicable: true,
        drugRegimens: [{ key: "atovaquone-proguanil", label: "Atovaquone / proguanil (Malarone)", startBefore: 2, continueAfter: 7, frequency: "Daily, with food", notes: "x", isWeekly: false }],
        timeline: [
          { label: "Health consultation", weeksBefore: 8, date: "2026-07-24T00:00:00.000Z", status: "passed" },
          { label: "Final preparation", weeksBefore: 0, date: "2026-09-18T00:00:00.000Z", status: "upcoming" },
        ],
        reminders: [{ type: "travel-preparation", label: "Final preparation", date: "2026-09-18T00:00:00.000Z" }],
        stories: [
          { key: "before-you-go", label: "Before You Go", stories: [] },
          { key: "mosquito", label: "Mosquito Protection", stories: [] },
          { key: "food-water", label: "Food & Water", stories: [] },
          { key: "safety", label: "Staying Safe", stories: [] },
        ],
        duringTrip: {
          reminders: [{ key: "mosquito", label: "Mosquito protection", detail: "DEET 30-50%, cover skin at dusk, sleep under a treated net." }],
          whenToSeekHelp: "If you develop a fever, persistent vomiting or diarrhea, contact a local clinic or your travel insurer's assistance line promptly.",
        },
        afterTrip: {
          topics: [
            { key: "tell-your-provider", title: "Tell your healthcare provider you travelled", content: "Mention where you went if you feel unwell.", sources: [{ publisher: "CDC", title: "After Travel Tips", url: "https://cdc.gov/after-trip", lastReviewedAt: null }] },
            { key: "malaria-follow-up", title: "Malaria follow-up", content: "Any fever within three months needs urgent testing.", sources: [{ publisher: "CDC", title: "CDC Yellow Book - Malaria", url: "https://cdc.gov/malaria", lastReviewedAt: null }] },
          ],
        },
      });
    }
    if (key === "GET /api/v1/trips/trip1/checklist") return json({ checkedItemKeys: checklistChecked, total: 4, completed: checklistChecked.length });
    if (key === "PUT /api/v1/trips/trip1/checklist") {
      checklistChecked = body.checkedItemKeys;
      return json({ checkedItemKeys: checklistChecked, total: 4, completed: checklistChecked.length });
    }
    if (key === "GET /api/v1/trips/trip1/malaria-plan") return json(null);
    if (key === "PUT /api/v1/trips/trip1/malaria-plan") {
      return json({
        id: "plan1", tripId: "trip1", destinationId: "dest-brazil",
        drug: { key: body.medication, label: "Atovaquone / proguanil (Malarone)", startBefore: 2, continueAfter: 7, frequency: "Daily, with food", notes: "Shortest post-trip course.", isWeekly: false },
        beginMeds: "2026-09-16T00:00:00.000Z", tripStart: "2026-09-18T00:00:00.000Z", tripEnd: "2026-10-02T00:00:00.000Z", stopMeds: "2026-10-09T00:00:00.000Z",
        totalDoseDays: 24, disclaimer: "This planner provides general guidance only. Medication choice and regimen must be confirmed with a qualified travel-health clinician before departure.",
        startDateInPast: false, timezone: body.timezone, sources: [],
      });
    }
    if (key === "GET /api/v1/emergency/global") return json([{ label: "International SOS", number: "+44 20 8762 8008", note: "24/7 line", category: "assistance-provider", source: null, lastVerifiedAt: null }]);
    if (key.startsWith("GET /api/v1/destinations/brazil/emergency")) return json({ emergencyContacts: BRAZIL.emergencyContacts });
    if (key === "GET /api/v1/stories") return json([]);

    console.error("UNMOCKED REQUEST:", key);
    return json({ error: "unmocked: " + key }, 500);
  }) as never;
});

function renderApp(initialRoute = "/") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  window.history.pushState({}, "", initialRoute);
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Product Owner walkthrough: first-time traveler using Tropikit", () => {
  it("Q1-Q2: destination page answers 'where am I going / what health risks' without hunting", async () => {
    renderApp("/destinations/brazil");
    expect(await screen.findByRole("heading", { name: "Brazil" })).toBeInTheDocument();
    expect(screen.getByText("South America")).toBeInTheDocument();
    expect(screen.getByText(/high malaria risk/i)).toBeInTheDocument();
    expect(screen.getByText(/dengue, zika and chikungunya/i)).toBeInTheDocument();
  });

  it("Q3: vaccines reachable in exactly one click from destination detail", async () => {
    const user = userEvent.setup();
    renderApp("/destinations/brazil");
    await screen.findByRole("heading", { name: "Brazil" });
    await user.click(screen.getByRole("tab", { name: /vaccines/i }));
    expect(await screen.findByText("Yellow Fever")).toBeInTheDocument();
    expect(screen.getByText(/certificate required if arriving/i)).toBeInTheDocument();
  });

  it("Q4: malaria prevention answered directly with a real regional caveat", async () => {
    const user = userEvent.setup();
    renderApp("/destinations/brazil");
    await screen.findByRole("heading", { name: "Brazil" });
    await user.click(screen.getByRole("tab", { name: /malaria/i }));
    expect(await screen.findByText(/malaria prevention/i)).toBeInTheDocument();
    expect(screen.getByText(/risk varies within brazil/i)).toBeInTheDocument();
  });

  it("Full journey: register, create a trip, and land on the Trip Dashboard", async () => {
    const user = userEvent.setup();
    renderApp("/destinations/brazil");
    await screen.findByRole("heading", { name: "Brazil" });

    await user.click(screen.getByRole("link", { name: /log in/i }));
    await screen.findByRole("heading", { name: /log in/i });
    await user.click(screen.getByRole("link", { name: /sign up/i }));
    await screen.findByRole("heading", { name: /create an account/i });

    await user.type(screen.getByLabelText(/email/i), "traveler@example.com");
    await user.type(screen.getByLabelText(/password/i), "a-strong-password");
    // Scoped to the form specifically: both the site nav and this page's own submit button
    // match "Sign up" by text, so an unscoped role query is ambiguous — this isn't a product
    // bug, just a query that needs to be as specific as the DOM actually is.
    const registerForm = screen.getByLabelText(/email/i).closest("form")!;
    await user.click(within(registerForm).getByRole("button", { name: /sign up/i }));

    await screen.findByRole("heading", { name: /my trips/i });
    expect(screen.getByText(/no saved trips yet/i)).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /new trip/i }));
    await screen.findByRole("heading", { name: /new trip/i });

    await user.selectOptions(screen.getByLabelText(/destination/i), "dest-brazil");
    await user.type(screen.getByLabelText(/departure date/i), "2026-09-18");
    await user.type(screen.getByLabelText(/return date/i), "2026-10-02");
    await user.click(screen.getByRole("button", { name: /create trip/i }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Brazil" })).toBeInTheDocument());
    expect(screen.getByText(/ready/i)).toBeInTheDocument();
  });
});
