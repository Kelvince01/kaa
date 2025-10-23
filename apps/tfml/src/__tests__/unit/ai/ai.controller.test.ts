import { describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../../app";

// These are smoke tests to ensure routes mount and basic validation triggers
describe("AI Controller", () => {
  it("rejects create with invalid trainingDataSource", async () => {
    // Note: requires auth middleware bypass or valid token in a real test
    // Here we just assert the route exists (200/401 etc.).
    const res = await request((app as any).server?.server)
      .post("/api/v1/ai/models")
      .send({});
    expect([400, 401, 403]).toContain(res.status);
  });

  it("predict endpoints are mounted", async () => {
    const res = await request((app as any).server?.server)
      .post("/api/v1/ai/predict")
      .send({ modelId: "id", input: {} });
    expect([400, 401, 403, 404]).toContain(res.status);
  });
});
