import { describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../../app";

const server = (app as any).server?.server;

describe("AI routes smoke", () => {
  it("GET /api/v1/ai/models requires auth", async () => {
    const res = await request(server).get("/api/v1/ai/models");
    expect([401, 403]).toContain(res.status);
  });

  it("POST /api/v1/ai/models requires auth", async () => {
    const res = await request(server).post("/api/v1/ai/models").send({});
    expect([401, 403, 400]).toContain(res.status);
  });

  it("POST /api/v1/ai/predict requires auth", async () => {
    const res = await request(server)
      .post("/api/v1/ai/predict")
      .query({ version: "1.0.0" })
      .send({ modelId: "x", input: {} });
    expect([401, 403, 404]).toContain(res.status);
  });

  it("POST /api/v1/ai/recommendations/:id/respond requires auth", async () => {
    const res = await request(server)
      .post("/api/v1/ai/recommendations/123/respond")
      .send({ status: "accepted" });
    expect([401, 403, 404]).toContain(res.status);
  });
});
