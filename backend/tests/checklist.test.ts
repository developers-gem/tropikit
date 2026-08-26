import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app";
import { Trip } from "../src/models/Trip";
import { TripChecklistProgress } from "../src/models/TripChecklistProgress";
import { FakeCollection, nextId } from "./helpers/FakeCollection";

const trips = new FakeCollection();
const progress = new FakeCollection();

vi.spyOn(Trip, "findById").mockImplementation(trips.findById as never);
vi.spyOn(TripChecklistProgress, "findOne").mockImplementation(progress.findOne as never);
vi.spyOn(TripChecklistProgress, "findOneAndUpdate").mockImplementation(progress.findOneAndUpdate as never);

const app = createApp();
const tripId = nextId();

function tokenFor(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!);
}

describe("Checklist", () => {
  beforeEach(() => {
    progress.reset();
    trips.reset();
    trips.docs = [
      { _id: tripId, userId: "owner-1", tripType: "Leisure", activities: [] },
    ] as never;
  });

  it("retrieves the base checklist template publicly (no auth)", async () => {
    const res = await request(app).get("/api/v1/checklist");
    expect(res.status).toBe(200);
    const total = res.body.data.reduce((n: number, g: { items: string[] }) => n + g.items.length, 0);
    expect(total).toBe(23);
  });

  it("retrieves empty progress for a trip that has never been touched", async () => {
    const token = tokenFor("owner-1");
    const res = await request(app).get(`/api/v1/trips/${tripId}/checklist`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.completed).toBe(0);
    expect(res.body.data.total).toBe(23);
  });

  it("updates checklist progress by checking items", async () => {
    const token = tokenFor("owner-1");
    const res = await request(app)
      .put(`/api/v1/trips/${tripId}/checklist`)
      .set("Authorization", `Bearer ${token}`)
      .send({ checkedItemKeys: ["Medical kit::Thermometer", "Documents::Yellow fever certificate (if required)"] });
    expect(res.status).toBe(200);
    expect(res.body.data.completed).toBe(2);
  });

  it("silently drops keys that don't match any real checklist item", async () => {
    const token = tokenFor("owner-1");
    const res = await request(app)
      .put(`/api/v1/trips/${tripId}/checklist`)
      .set("Authorization", `Bearer ${token}`)
      .send({ checkedItemKeys: ["Not A Real Category::not a real item"] });
    expect(res.status).toBe(200);
    expect(res.body.data.completed).toBe(0);
  });

  it("completes all items when every valid key is submitted", async () => {
    const token = tokenFor("owner-1");
    const template = await request(app).get("/api/v1/checklist");
    const allKeys = template.body.data.flatMap((g: { category: string; items: string[] }) =>
      g.items.map((item: string) => `${g.category}::${item}`),
    );

    const res = await request(app)
      .put(`/api/v1/trips/${tripId}/checklist`)
      .set("Authorization", `Bearer ${token}`)
      .send({ checkedItemKeys: allKeys });
    expect(res.status).toBe(200);
    expect(res.body.data.completed).toBe(23);
    expect(res.body.data.completed).toBe(res.body.data.total);
  });

  it("resets checklist progress back to empty", async () => {
    const token = tokenFor("owner-1");
    await request(app)
      .put(`/api/v1/trips/${tripId}/checklist`)
      .set("Authorization", `Bearer ${token}`)
      .send({ checkedItemKeys: ["Medical kit::Thermometer"] });

    const res = await request(app)
      .put(`/api/v1/trips/${tripId}/checklist`)
      .set("Authorization", `Bearer ${token}`)
      .send({ checkedItemKeys: [] });
    expect(res.status).toBe(200);
    expect(res.body.data.completed).toBe(0);
  });

  it("rejects checklist access from a non-owner", async () => {
    const attackerToken = tokenFor("attacker");
    const res = await request(app).get(`/api/v1/trips/${tripId}/checklist`).set("Authorization", `Bearer ${attackerToken}`);
    expect(res.status).toBe(403);
  });
});
