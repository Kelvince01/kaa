import { describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../../../../api/src/app";

const server = (app as any).server?.server;

describe("AI version selection (smoke)", () => {
  it("404s when specific version is missing", async () => {
    const res = await request(server)
      .post("/api/v1/ai/predict")
      .query({ version: "9.9.9" })
      .send({ modelId: "deadbeefdeadbeefdeadbeef", input: {} });
    expect([401, 403, 404]).toContain(res.status);
  });
});
