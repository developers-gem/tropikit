import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app";
import { User } from "../src/models/User";
import { Destination } from "../src/models/Destination";
import { Story } from "../src/models/Story";
import { FakeCollection, nextId } from "./helpers/FakeCollection";

const users = new FakeCollection();
users.docs = [
  { _id: "normal-1", role: "user" },
  { _id: "admin-1", role: "admin" },
  { _id: "editor-1", role: "content-editor" },
  { _id: "reviewer-1", role: "reviewer" },
] as never;

const validId = nextId();
const destinations = new FakeCollection();
destinations.docs = [
  { _id: validId, name: "Brazil", slug: "brazil", advice: [], vaccines: [], sources: [], contentVersion: 1, reviewStatus: "needs-review", isActive: true },
] as never;
const stories = new FakeCollection();

vi.spyOn(User, "findById").mockImplementation(users.findById as never);
vi.spyOn(Destination, "findById").mockImplementation(destinations.findById as never);
vi.spyOn(Destination, "find").mockImplementation(destinations.find as never);
vi.spyOn(Destination, "countDocuments").mockImplementation(destinations.countDocuments as never);
vi.spyOn(Destination, "findByIdAndUpdate").mockImplementation(
  (async (id: string, update: { $set?: Record<string, unknown> }) => {
    const doc = destinations.docs.find((d) => String((d as { _id: unknown })._id) === String(id));
    if (doc && update.$set) Object.assign(doc, update.$set);
    return doc ?? null;
  }) as never,
);
vi.spyOn(Story, "findById").mockImplementation(stories.findById as never);
vi.spyOn(Story, "find").mockImplementation(stories.find as never);
vi.spyOn(Story, "countDocuments").mockImplementation(stories.countDocuments as never);
vi.spyOn(Story, "create").mockImplementation(stories.create as never);
vi.spyOn(Story, "deleteOne").mockImplementation(stories.deleteOne as never);

function tokenFor(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!);
}

const app = createApp();

describe("Admin authorization", () => {
  it("denies a normal user from the admin dashboard", async () => {
    const res = await request(app).get("/api/v1/admin/dashboard").set("Authorization", `Bearer ${tokenFor("normal-1")}`);
    expect(res.status).toBe(403);
  });

  it("denies a normal user from every admin endpoint", async () => {
    const checks = [
      () => request(app).get("/api/v1/admin/destinations"),
      () => request(app).get(`/api/v1/admin/destinations/${validId}`),
      () => request(app).put(`/api/v1/admin/destinations/${validId}/content`),
      () => request(app).put(`/api/v1/admin/destinations/${validId}/active`),
      () => request(app).put(`/api/v1/admin/destinations/${validId}/review`),
      () => request(app).get("/api/v1/admin/stories"),
      () => request(app).post("/api/v1/admin/stories"),
      () => request(app).put(`/api/v1/admin/stories/${validId}`),
      () => request(app).delete(`/api/v1/admin/stories/${validId}`),
      () => request(app).get("/api/v1/admin/sources"),
    ];
    for (const makeRequest of checks) {
      const res = await makeRequest().set("Authorization", `Bearer ${tokenFor("normal-1")}`);
      expect(res.status).toBe(403);
    }
  });

  it("allows content-editor to edit destination content but not activate/deactivate", async () => {
    const editContent = await request(app)
      .put(`/api/v1/admin/destinations/${validId}/content`)
      .set("Authorization", `Bearer ${tokenFor("editor-1")}`)
      .send({ advice: ["updated advice"] });
    expect(editContent.status).not.toBe(403);

    const activate = await request(app)
      .put(`/api/v1/admin/destinations/${validId}/active`)
      .set("Authorization", `Bearer ${tokenFor("editor-1")}`)
      .send({ isActive: false });
    expect(activate.status).toBe(403);
  });

  it("allows content-editor to create/edit/publish stories but not delete them", async () => {
    const create = await request(app)
      .post("/api/v1/admin/stories")
      .set("Authorization", `Bearer ${tokenFor("editor-1")}`)
      .send({ destinationId: validId, category: "before-you-go", title: "t", description: "d", transcript: "t", sources: [] });
    expect(create.status).not.toBe(403);

    const del = await request(app).delete(`/api/v1/admin/stories/${validId}`).set("Authorization", `Bearer ${tokenFor("editor-1")}`);
    expect(del.status).toBe(403);
  });

  it("allows reviewer to change review status but not edit content", async () => {
    const review = await request(app)
      .put(`/api/v1/admin/destinations/${validId}/review`)
      .set("Authorization", `Bearer ${tokenFor("reviewer-1")}`)
      .send({ reviewStatus: "reviewed" });
    expect(review.status).not.toBe(403);

    const edit = await request(app)
      .put(`/api/v1/admin/destinations/${validId}/content`)
      .set("Authorization", `Bearer ${tokenFor("reviewer-1")}`)
      .send({ advice: ["x"] });
    expect(edit.status).toBe(403);
  });

  it("allows admin to reach every boundary", async () => {
    const dashboard = await request(app).get("/api/v1/admin/dashboard").set("Authorization", `Bearer ${tokenFor("admin-1")}`);
    expect(dashboard.status).not.toBe(403);

    const activate = await request(app)
      .put(`/api/v1/admin/destinations/${validId}/active`)
      .set("Authorization", `Bearer ${tokenFor("admin-1")}`)
      .send({ isActive: true });
    expect(activate.status).not.toBe(403);

    const del = await request(app).delete(`/api/v1/admin/stories/${validId}`).set("Authorization", `Bearer ${tokenFor("admin-1")}`);
    expect(del.status).not.toBe(403);
  });

  it("rejects admin routes entirely with no token", async () => {
    const res = await request(app).get("/api/v1/admin/dashboard");
    expect(res.status).toBe(401);
  });
});
