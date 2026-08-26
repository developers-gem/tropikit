import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { Story } from "../src/models/Story";
import { Destination } from "../src/models/Destination";
import { FakeCollection, nextId } from "./helpers/FakeCollection";

const stories = new FakeCollection();
const destinations = new FakeCollection();
const brazilId = nextId();
const thailandId = nextId();

destinations.docs = [
  { _id: brazilId, slug: "brazil", name: "Brazil", isActive: true },
  { _id: thailandId, slug: "thailand", name: "Thailand", isActive: true },
] as never;

stories.docs = [
  { _id: nextId(), destinationId: brazilId, category: "before-you-go", title: "Getting ready for Brazil", description: "d", isPublished: true },
  { _id: nextId(), destinationId: thailandId, category: "mosquito", title: "Mosquitoes in Thailand", description: "d", isPublished: true },
  { _id: nextId(), destinationId: brazilId, category: "arrival", title: "Draft story not yet published", description: "d", isPublished: false },
] as never;

vi.spyOn(Story, "find").mockImplementation(stories.find as never);
vi.spyOn(Story, "findOne").mockImplementation(stories.findOne as never);
vi.spyOn(Destination, "findOne").mockImplementation(destinations.findOne as never);

const app = createApp();

describe("Stories", () => {
  it("lists only published stories", async () => {
    const res = await request(app).get("/api/v1/stories");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data.every((s: { isPublished: boolean }) => s.isPublished)).toBe(true);
  });

  it("returns a single story's detail", async () => {
    const list = await request(app).get("/api/v1/stories");
    const id = list.body.data[0]._id;
    const res = await request(app).get(`/api/v1/stories/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  it("returns 404 for an unpublished story fetched directly", async () => {
    const draft = stories.docs.find((s) => (s as { title: string }).title === "Draft story not yet published");
    const res = await request(app).get(`/api/v1/stories/${(draft as { _id: string })._id}`);
    expect(res.status).toBe(404);
  });

  it("filters stories by destination via the destination-scoped endpoint", async () => {
    const res = await request(app).get("/api/v1/destinations/brazil/stories");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Getting ready for Brazil");
  });

  it("returns an empty array (never fake content) for a destination with no published stories", async () => {
    destinations.docs.push({ _id: nextId(), slug: "atlantis", name: "Atlantis", isActive: true } as never);
    const res = await request(app).get("/api/v1/destinations/atlantis/stories");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});
