/**
 * E2E-STYLE JOURNEY TEST
 *
 * Your spec asked for a real browser E2E: Open Tropikit -> choose destination -> create trip
 * -> review health info -> create malaria plan -> complete checklist -> listen to a story ->
 * view reminders -> download calendar -> view emergency info.
 *
 * HONEST LIMITATION: a real browser-driven E2E (Playwright) is not possible in this sandbox -
 * confirmed directly this phase by attempting `npx playwright install chromium`, which fails
 * with "Host not in allowlist: cdn.playwright.dev" (the same network restriction that has
 * blocked MongoDB in every previous phase of this project). This is not skipped silently;
 * it's substituted with the closest honest equivalent available: every step of the same
 * journey, exercised via real HTTP requests through the actual Express app and real
 * service/controller code - not reimplemented, not mocked at the business-logic level, only
 * the Mongoose model layer is stubbed (see tests/helpers/FakeCollection.ts).
 *
 * What this test DOES verify: the entire journey is reachable end-to-end without a single
 * broken link in the chain - each step's output is real input to the next step, exactly as a
 * user clicking through the real UI would experience it.
 * What this test does NOT verify: actual rendering, CSS, real user clicks, or real network
 * behavior - that gap is the acknowledged cost of the sandbox's browser restriction.
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { User } from "../src/models/User";
import { RefreshToken } from "../src/models/RefreshToken";
import { Destination } from "../src/models/Destination";
import { Trip } from "../src/models/Trip";
import { TripChecklistProgress } from "../src/models/TripChecklistProgress";
import { MalariaPlan } from "../src/models/MalariaPlan";
import { Reminder } from "../src/models/Reminder";
import { Story } from "../src/models/Story";
import { FakeCollection, nextId } from "./helpers/FakeCollection";

const users = new FakeCollection();
const refreshTokens = new FakeCollection();
const destinations = new FakeCollection();
const trips = new FakeCollection();
const checklistProgress = new FakeCollection();
const malariaPlans = new FakeCollection();
const reminders = new FakeCollection();
const stories = new FakeCollection();

vi.spyOn(User, "findOne").mockImplementation(users.findOne as never);
vi.spyOn(User, "findById").mockImplementation(users.findById as never);
vi.spyOn(User, "create").mockImplementation(users.create as never);
vi.spyOn(RefreshToken, "create").mockImplementation(refreshTokens.create as never);
vi.spyOn(RefreshToken, "findOne").mockImplementation(refreshTokens.findOne as never);
vi.spyOn(Destination, "find").mockImplementation(destinations.find as never);
vi.spyOn(Destination, "findOne").mockImplementation(destinations.findOne as never);
vi.spyOn(Destination, "findById").mockImplementation(destinations.findById as never);
vi.spyOn(Trip, "findById").mockImplementation(trips.findById as never);
vi.spyOn(Trip, "create").mockImplementation(trips.create as never);
vi.spyOn(TripChecklistProgress, "findOne").mockImplementation(checklistProgress.findOne as never);
vi.spyOn(TripChecklistProgress, "findOneAndUpdate").mockImplementation(checklistProgress.findOneAndUpdate as never);
vi.spyOn(MalariaPlan, "findOne").mockImplementation(malariaPlans.findOne as never);
vi.spyOn(MalariaPlan, "findOneAndUpdate").mockImplementation(malariaPlans.findOneAndUpdate as never);
vi.spyOn(Reminder, "deleteMany").mockImplementation(reminders.deleteMany as never);
vi.spyOn(Reminder, "insertMany").mockImplementation(reminders.insertMany as never);
vi.spyOn(Reminder, "find").mockImplementation(reminders.find as never);
vi.spyOn(Story, "find").mockImplementation(stories.find as never);

const app = createApp();
const destId = nextId();

beforeAll(() => {
  destinations.docs = [
    {
      _id: destId,
      name: "Brazil",
      slug: "brazil",
      region: "South America",
      isActive: true,
      malariaRisk: { level: "high", description: "High malaria risk" },
      advice: ["Drink only bottled or filtered water.", "Use DEET repellent day and night."],
      vaccines: [{ name: "Yellow Fever", status: "required", note: "Certificate required" }],
      malaria: { abcd: { awareness: "a", bitePrevention: "b", chemoprophylaxis: "c", diagnosis: "d" } },
      emergencyContacts: [{ label: "Police", number: "190", category: "police" }],
      sources: [{ publisher: "CDC", title: "CDC Brazil", url: "https://cdc.gov/brazil", contentType: "malaria" }],
    },
  ] as never;
  stories.docs = [
    { _id: nextId(), destinationId: destId, category: "before-you-go", title: "Getting ready for Brazil", description: "d", transcript: "Full transcript here.", isPublished: true, audio: { url: null } },
  ] as never;
});

describe("Full user journey (E2E-style, via real HTTP requests)", () => {
  let accessToken: string;
  let tripId: string;

  it("Step 1: Open Tropikit - the destination list loads", async () => {
    const res = await request(app).get("/api/v1/destinations");
    expect(res.status).toBe(200);
    expect(res.body.data.some((d: { slug: string }) => d.slug === "brazil")).toBe(true);
  });

  it("Step 2: Choose destination - user reviews Brazil's health information", async () => {
    const res = await request(app).get("/api/v1/destinations/brazil");
    expect(res.status).toBe(200);
    expect(res.body.data.advice.length).toBeGreaterThan(0);
    expect(res.body.data.vaccines[0].status).toBe("required");
  });

  it("Step 3: Register and log in", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "journey-user@example.com",
      password: "a-real-strong-password",
      name: "Journey User",
    });
    expect(res.status).toBe(201);
    accessToken = res.body.data.accessToken;
    expect(accessToken).toBeTypeOf("string");
  });

  it("Step 4: Create a trip to Brazil", async () => {
    const res = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ destinationId: destId, departureDate: "2026-09-18", returnDate: "2026-10-02" });
    expect(res.status).toBe(201);
    tripId = res.body.data._id;
    expect(tripId).toBeTypeOf("string");
  });

  it("Step 5: Review health information via the trip dashboard", async () => {
    const res = await request(app).get(`/api/v1/trips/${tripId}/dashboard`).set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.destination.name).toBe("Brazil");
    expect(res.body.data.malariaApplicable).toBe(true);
  });

  it("Step 6: Create a malaria plan for the trip", async () => {
    const res = await request(app)
      .put(`/api/v1/trips/${tripId}/malaria-plan`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ medication: "atovaquone-proguanil", timezone: "America/Sao_Paulo" });
    expect(res.status).toBe(200);
    expect(res.body.data.drug.key).toBe("atovaquone-proguanil");
    expect(res.body.data.totalDoseDays).toBe(24);
  });

  it("Step 7: Complete the travel-health checklist", async () => {
    const template = await request(app).get("/api/v1/checklist");
    const allKeys = template.body.data.flatMap((g: { category: string; items: string[] }) =>
      g.items.map((item: string) => `${g.category}::${item}`),
    );
    const res = await request(app)
      .put(`/api/v1/trips/${tripId}/checklist`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ checkedItemKeys: allKeys });
    expect(res.status).toBe(200);
    expect(res.body.data.completed).toBe(res.body.data.total);
  });

  it("Step 8: Listen to a story for the destination", async () => {
    const res = await request(app).get("/api/v1/destinations/brazil/stories");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].title).toBe("Getting ready for Brazil");
  });

  it("Step 9: View reminders for the trip", async () => {
    const res = await request(app).get(`/api/v1/trips/${tripId}/reminders`).set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("Step 10: Download the trip calendar (.ics)", async () => {
    const res = await request(app).get(`/api/v1/trips/${tripId}/calendar.ics`).set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/calendar");
    expect(res.text).toContain("BEGIN:VCALENDAR");
    expect(res.text).toContain("END:VCALENDAR");
  });

  it("Step 11: View emergency information for the destination", async () => {
    const res = await request(app).get("/api/v1/destinations/brazil/emergency");
    expect(res.status).toBe(200);
    expect(res.body.data.emergencyContacts[0].label).toBe("Police");
  });

  it("Sanity check: every step used the SAME trip end-to-end, not a fresh/disconnected one", async () => {
    const res = await request(app).get(`/api/v1/trips/${tripId}`).set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.destinationId).toBe(destId);
  });
});
