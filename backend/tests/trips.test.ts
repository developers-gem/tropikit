import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app";
import { Trip } from "../src/models/Trip";
import { Destination } from "../src/models/Destination";
import { Reminder } from "../src/models/Reminder";
import { MalariaPlan } from "../src/models/MalariaPlan";
import { FakeCollection, nextId } from "./helpers/FakeCollection";

const trips = new FakeCollection();
const destinations = new FakeCollection();
const reminders = new FakeCollection();
const malariaPlans = new FakeCollection();

vi.spyOn(Trip, "findById").mockImplementation(trips.findById as never);
vi.spyOn(Trip, "find").mockImplementation(trips.find as never);
vi.spyOn(Trip, "create").mockImplementation(trips.create as never);
vi.spyOn(Destination, "findById").mockImplementation(destinations.findById as never);
vi.spyOn(Reminder, "deleteMany").mockImplementation(reminders.deleteMany as never);
vi.spyOn(Reminder, "insertMany").mockImplementation(reminders.insertMany as never);
vi.spyOn(Reminder, "find").mockImplementation(reminders.find as never);
// createTrip always syncs reminders immediately (see trip.controller.ts), which reads any
// existing malaria plan for the trip — this must be mocked too, or the (real, unreachable)
// MalariaPlan model will try to hit the actual MongoDB connection string and hang until the
// test timeout, exactly the failure this fixes.
vi.spyOn(MalariaPlan, "findOne").mockImplementation(malariaPlans.findOne as never);

const app = createApp();

function tokenFor(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!);
}

const destId = nextId();

describe("Trips", () => {
  beforeEach(() => {
    trips.reset();
    reminders.reset();
    malariaPlans.reset();
    destinations.reset();
    destinations.docs = [{ _id: destId, name: "Brazil", slug: "brazil" }] as never;
  });

  it("creates a trip for the authenticated user", async () => {
    const token = tokenFor("owner-1");
    const res = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${token}`)
      .send({ destinationId: destId, departureDate: "2026-09-18", returnDate: "2026-10-02" });
    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBe("owner-1");
  });

  it("rejects trip creation with a nonexistent destination", async () => {
    const token = tokenFor("owner-1");
    const res = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${token}`)
      .send({ destinationId: nextId(), departureDate: "2026-09-18", returnDate: "2026-10-02" });
    expect(res.status).toBe(404);
  });

  it("reads back a created trip by its owner", async () => {
    const token = tokenFor("owner-2");
    const created = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${token}`)
      .send({ destinationId: destId, departureDate: "2026-09-18", returnDate: "2026-10-02" });

    const res = await request(app).get(`/api/v1/trips/${created.body.data._id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(created.body.data._id);
  });

  it("updates a trip's dates", async () => {
    const token = tokenFor("owner-3");
    const created = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${token}`)
      .send({ destinationId: destId, departureDate: "2026-09-18", returnDate: "2026-10-02" });

    const res = await request(app)
      .put(`/api/v1/trips/${created.body.data._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ returnDate: "2026-10-10" });
    expect(res.status).toBe(200);
  });

  it("deletes a trip", async () => {
    const token = tokenFor("owner-4");
    const created = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${token}`)
      .send({ destinationId: destId, departureDate: "2026-09-18", returnDate: "2026-10-02" });

    const res = await request(app).delete(`/api/v1/trips/${created.body.data._id}`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const getAfterDelete = await request(app)
      .get(`/api/v1/trips/${created.body.data._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(getAfterDelete.status).toBe(404);
  });

  describe("ownership", () => {
    it("prevents user B from reading user A's trip by guessing its ID", async () => {
      const tokenA = tokenFor("user-A");
      const tokenB = tokenFor("user-B");
      const created = await request(app)
        .post("/api/v1/trips")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ destinationId: destId, departureDate: "2026-09-18", returnDate: "2026-10-02" });

      const res = await request(app).get(`/api/v1/trips/${created.body.data._id}`).set("Authorization", `Bearer ${tokenB}`);
      expect(res.status).toBe(403);
    });

    it("prevents user B from updating user A's trip", async () => {
      const tokenA = tokenFor("user-A2");
      const tokenB = tokenFor("user-B2");
      const created = await request(app)
        .post("/api/v1/trips")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ destinationId: destId, departureDate: "2026-09-18", returnDate: "2026-10-02" });

      const res = await request(app)
        .put(`/api/v1/trips/${created.body.data._id}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ tripType: "Leisure" });
      expect(res.status).toBe(403);
    });

    it("prevents user B from deleting user A's trip", async () => {
      const tokenA = tokenFor("user-A3");
      const tokenB = tokenFor("user-B3");
      const created = await request(app)
        .post("/api/v1/trips")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ destinationId: destId, departureDate: "2026-09-18", returnDate: "2026-10-02" });

      const res = await request(app).delete(`/api/v1/trips/${created.body.data._id}`).set("Authorization", `Bearer ${tokenB}`);
      expect(res.status).toBe(403);

      const stillThere = await request(app)
        .get(`/api/v1/trips/${created.body.data._id}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(stillThere.status).toBe(200);
    });

    it("lists only the authenticated user's own trips, never another user's", async () => {
      const tokenA = tokenFor("user-A4");
      const tokenB = tokenFor("user-B4");
      await request(app).post("/api/v1/trips").set("Authorization", `Bearer ${tokenA}`).send({ destinationId: destId, departureDate: "2026-09-18", returnDate: "2026-10-02" });
      await request(app).post("/api/v1/trips").set("Authorization", `Bearer ${tokenB}`).send({ destinationId: destId, departureDate: "2026-11-01", returnDate: "2026-11-10" });

      const res = await request(app).get("/api/v1/trips").set("Authorization", `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
      expect(res.body.data.every((t: { userId: string }) => t.userId === "user-A4")).toBe(true);
    });
  });
});
