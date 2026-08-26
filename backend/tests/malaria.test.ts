import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app";
import { calculateMalariaPlan, listDrugRegimens } from "../src/services/malariaService";
import { Trip } from "../src/models/Trip";
import { Destination } from "../src/models/Destination";
import { MalariaPlan } from "../src/models/MalariaPlan";
import { Reminder } from "../src/models/Reminder";
import { FakeCollection, nextId } from "./helpers/FakeCollection";

const app = createApp();

describe("Malaria - calculation service", () => {
  it("computes a valid plan for every supported regimen", () => {
    for (const regimen of listDrugRegimens()) {
      const plan = calculateMalariaPlan({
        drug: regimen.key,
        tripStart: new Date("2026-09-18"),
        tripEnd: new Date("2026-10-02"),
      });
      expect(plan.beginMeds.getTime()).toBeLessThan(plan.tripStart.getTime());
      expect(plan.stopMeds.getTime()).toBeGreaterThan(plan.tripEnd.getTime());
      expect(plan.totalDoseDays).toBeGreaterThan(0);
      expect(plan.disclaimer).toContain("qualified travel-health clinician");
    }
  });

  it("matches the original prototype's known-correct numbers for Malarone", () => {
    const plan = calculateMalariaPlan({
      drug: "atovaquone-proguanil",
      tripStart: new Date("2026-09-18"),
      tripEnd: new Date("2026-10-02"),
    });
    expect(plan.beginMeds.toISOString().slice(0, 10)).toBe("2026-09-16");
    expect(plan.stopMeds.toISOString().slice(0, 10)).toBe("2026-10-09");
    expect(plan.totalDoseDays).toBe(24);
  });

  it("rejects an unsupported medication", () => {
    expect(() =>
      calculateMalariaPlan({ drug: "aspirin" as never, tripStart: new Date(), tripEnd: new Date() }),
    ).toThrow();
  });

  it("rejects tripEnd before tripStart", () => {
    expect(() =>
      calculateMalariaPlan({
        drug: "doxycycline",
        tripStart: new Date("2026-10-02"),
        tripEnd: new Date("2026-09-18"),
      }),
    ).toThrow();
  });

  it("rejects an invalid Date object", () => {
    expect(() =>
      calculateMalariaPlan({ drug: "doxycycline", tripStart: new Date("not-a-date"), tripEnd: new Date() }),
    ).toThrow();
  });

  it("handles a same-day trip without error", () => {
    const plan = calculateMalariaPlan({
      drug: "chloroquine",
      tripStart: new Date("2026-09-18"),
      tripEnd: new Date("2026-09-18"),
    });
    expect(plan.totalDoseDays).toBeGreaterThan(0);
  });

  it("flags startDateInPast when the trip is too close for the drug's lead time", () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 5);
    const soonEnd = new Date(soon);
    soonEnd.setDate(soonEnd.getDate() + 10);
    const plan = calculateMalariaPlan({ drug: "mefloquine", tripStart: soon, tripEnd: soonEnd });
    expect(plan.startDateInPast).toBe(true);
  });
});

describe("Malaria - trip integration (persisted plan)", () => {
  const trips = new FakeCollection();
  const destinations = new FakeCollection();
  const malariaPlans = new FakeCollection();
  const reminders = new FakeCollection();
  const tripId = nextId();
  const destId = nextId();

  vi.spyOn(Trip, "findById").mockImplementation(trips.findById as never);
  vi.spyOn(Destination, "findById").mockImplementation(destinations.findById as never);
  vi.spyOn(MalariaPlan, "findOne").mockImplementation(malariaPlans.findOne as never);
  vi.spyOn(MalariaPlan, "findOneAndUpdate").mockImplementation(malariaPlans.findOneAndUpdate as never);
  vi.spyOn(MalariaPlan, "deleteOne").mockImplementation(malariaPlans.deleteOne as never);
  vi.spyOn(Reminder, "deleteMany").mockImplementation(reminders.deleteMany as never);
  vi.spyOn(Reminder, "insertMany").mockImplementation(reminders.insertMany as never);

  function tokenFor(userId: string) {
    return jwt.sign({ userId }, process.env.JWT_SECRET!);
  }

  beforeEach(() => {
    trips.reset();
    malariaPlans.reset();
    reminders.reset();
    destinations.reset();
    trips.docs = [
      {
        _id: tripId,
        userId: "owner-1",
        destinationId: destId,
        departureDate: new Date("2026-09-18"),
        returnDate: new Date("2026-10-02"),
        malariaPlanStatus: "not-planned",
        malariaPlanConfirmedAt: null,
        save: async function () {
          return this;
        },
      },
    ] as never;
    destinations.docs = [
      { _id: destId, name: "Brazil", slug: "brazil", sources: [{ publisher: "CDC", title: "x", url: "https://cdc.gov/x", contentType: "malaria" }] },
    ] as never;
  });

  it("creates a malaria plan tied to a trip, using the trip's own dates", async () => {
    const token = tokenFor("owner-1");
    const res = await request(app)
      .put(`/api/v1/trips/${tripId}/malaria-plan`)
      .set("Authorization", `Bearer ${token}`)
      .send({ medication: "atovaquone-proguanil", timezone: "Asia/Calcutta" });
    expect(res.status).toBe(200);
    expect(res.body.data.drug.key).toBe("atovaquone-proguanil");
    expect(res.body.data.tripStart).toContain("2026-09-18");
  });

  it("rejects an invalid timezone when creating a plan", async () => {
    const token = tokenFor("owner-1");
    const res = await request(app)
      .put(`/api/v1/trips/${tripId}/malaria-plan`)
      .set("Authorization", `Bearer ${token}`)
      .send({ medication: "atovaquone-proguanil", timezone: "Not/A_Real_Zone" });
    expect(res.status).toBe(400);
  });

  it("returns null (not an error) for a trip with no plan yet", async () => {
    const token = tokenFor("owner-1");
    const res = await request(app).get(`/api/v1/trips/${tripId}/malaria-plan`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it("rejects a non-owner from creating or reading a trip's malaria plan", async () => {
    const attackerToken = tokenFor("attacker");
    const res1 = await request(app)
      .put(`/api/v1/trips/${tripId}/malaria-plan`)
      .set("Authorization", `Bearer ${attackerToken}`)
      .send({ medication: "doxycycline", timezone: "UTC" });
    expect(res1.status).toBe(403);

    const res2 = await request(app).get(`/api/v1/trips/${tripId}/malaria-plan`).set("Authorization", `Bearer ${attackerToken}`);
    expect(res2.status).toBe(403);
  });
});
