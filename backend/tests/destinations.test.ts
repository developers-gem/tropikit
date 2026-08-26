import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { Destination } from "../src/models/Destination";
import { FakeCollection } from "./helpers/FakeCollection";

const destinations = new FakeCollection();
destinations.docs = [
  {
    _id: "d1",
    name: "Thailand",
    slug: "thailand",
    region: "Southeast Asia",
    isActive: true,
    malariaRisk: { level: "low", description: "Low malaria risk" },
    advice: ["Drink bottled water"],
    vaccines: [{ name: "Hepatitis A", status: "recommended", note: "For all travellers" }],
    malaria: { abcd: { awareness: "a", bitePrevention: "b", chemoprophylaxis: "c", diagnosis: "d" } },
    emergencyContacts: [{ label: "Police", number: "191", category: "police" }],
    sources: [],
  },
  {
    _id: "d2",
    name: "Brazil",
    slug: "brazil",
    region: "South America",
    isActive: true,
    malariaRisk: { level: "high", description: "High malaria risk" },
    advice: [],
    vaccines: [],
    malaria: null,
    emergencyContacts: [],
    sources: [],
  },
] as never;

vi.spyOn(Destination, "find").mockImplementation(destinations.find as never);
vi.spyOn(Destination, "findOne").mockImplementation(destinations.findOne as never);

const app = createApp();

describe("Destinations", () => {
  it("lists all destinations", async () => {
    const res = await request(app).get("/api/v1/destinations");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  it("searches destinations by partial name match", async () => {
    const res = await request(app).get("/api/v1/destinations?search=thai");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe("Thailand");
  });

  it("filters destinations by malaria risk level", async () => {
    const res = await request(app).get("/api/v1/destinations?malariaRisk=high");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe("Brazil");
  });

  it("rejects an invalid malariaRisk filter value", async () => {
    const res = await request(app).get("/api/v1/destinations?malariaRisk=extreme");
    expect(res.status).toBe(400);
  });

  it("returns a single destination's detail by slug", async () => {
    const res = await request(app).get("/api/v1/destinations/thailand");
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Thailand");
    expect(res.body.data.vaccines[0].status).toBe("recommended");
  });

  it("returns 404 for a nonexistent destination slug", async () => {
    const res = await request(app).get("/api/v1/destinations/atlantis");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns destination-specific vaccines sub-resource", async () => {
    const res = await request(app).get("/api/v1/destinations/thailand/vaccines");
    expect(res.status).toBe(200);
    expect(res.body.data.vaccines.length).toBe(1);
  });

  it("returns destination-specific emergency contacts sub-resource", async () => {
    const res = await request(app).get("/api/v1/destinations/thailand/emergency");
    expect(res.status).toBe(200);
    expect(res.body.data.emergencyContacts[0].label).toBe("Police");
  });

  it("404s a sub-resource request for a nonexistent destination", async () => {
    const res = await request(app).get("/api/v1/destinations/atlantis/vaccines");
    expect(res.status).toBe(404);
  });
});
