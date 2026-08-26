import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app";
import { User } from "../src/models/User";
import { RefreshToken } from "../src/models/RefreshToken";
import { FakeCollection } from "./helpers/FakeCollection";

const users = new FakeCollection();
const refreshTokens = new FakeCollection();

vi.spyOn(User, "findOne").mockImplementation(users.findOne as never);
vi.spyOn(User, "findById").mockImplementation(users.findById as never);
vi.spyOn(User, "create").mockImplementation(users.create as never);
vi.spyOn(RefreshToken, "create").mockImplementation(refreshTokens.create as never);
vi.spyOn(RefreshToken, "findOne").mockImplementation(refreshTokens.findOne as never);
vi.spyOn(RefreshToken, "updateMany").mockImplementation(refreshTokens.updateMany as never);

const app = createApp();

describe("Authentication", () => {
  beforeEach(() => {
    users.reset();
    refreshTokens.reset();
  });

  describe("register", () => {
    it("creates a new account and returns an access token + user", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "new@example.com",
        password: "a-strong-password",
        name: "New User",
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeTypeOf("string");
      expect(res.body.data.user.email).toBe("new@example.com");
      expect(res.body.data.user.role).toBe("user");
    });

    it("rejects a password shorter than 8 characters", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "short@example.com",
        password: "short",
      });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects duplicate email registration", async () => {
      await request(app).post("/api/v1/auth/register").send({
        email: "dupe@example.com",
        password: "a-strong-password",
      });
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "dupe@example.com",
        password: "another-strong-password",
      });
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("rejects an invalid email format", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        email: "not-an-email",
        password: "a-strong-password",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      await request(app).post("/api/v1/auth/register").send({
        email: "loginuser@example.com",
        password: "correct-password-123",
      });
    });

    it("logs in with correct credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "loginuser@example.com",
        password: "correct-password-123",
      });
      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTypeOf("string");
    });

    it("rejects an invalid password with 401, not 404 or 400 (no user enumeration via status)", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "loginuser@example.com",
        password: "totally-wrong-password",
      });
      expect(res.status).toBe(401);
    });

    it("rejects login for a nonexistent email with the SAME error as a wrong password", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: "nobody-registered@example.com",
        password: "whatever-123",
      });
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe("Invalid email or password");
    });
  });

  describe("expired / invalid token", () => {
    it("rejects a token signed with the wrong secret", async () => {
      const badToken = jwt.sign({ userId: "someone" }, "wrong-secret-entirely");
      const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${badToken}`);
      expect(res.status).toBe(401);
    });

    it("rejects a genuinely expired token", async () => {
      const expiredToken = jwt.sign({ userId: "someone" }, process.env.JWT_SECRET!, { expiresIn: "-10s" });
      const res = await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
    });

    it("rejects a malformed Authorization header", async () => {
      const res = await request(app).get("/api/v1/auth/me").set("Authorization", "NotBearer sometoken");
      expect(res.status).toBe(401);
    });
  });

  describe("unauthorized endpoint access", () => {
    it("rejects /auth/me with no token at all", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });

    it("rejects protected trip endpoints with no token", async () => {
      const res = await request(app).get("/api/v1/trips");
      expect(res.status).toBe(401);
    });

    it("allows public destination endpoints with no token", async () => {
      const res = await request(app).get("/api/v1/checklist");
      expect(res.status).toBe(200);
    });
  });
});
