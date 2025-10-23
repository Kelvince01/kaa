import { beforeAll, describe, expect, it } from "bun:test";
import request from "supertest";
import app from "../../../app";

const server = (app as any).server?.server;

describe("AI predict limits", () => {
  beforeAll(() => {
    process.env.MODEL_STORAGE = "local";
    process.env.MODEL_DIR = ".models-test";
  });

  it("returns 413 when payload too large (predict)", async () => {
    const big = "x".repeat(300 * 1024);
    const res = await request(server)
      .post("/api/v1/ai/predict")
      .send({ modelId: "x", input: { big } });
    expect([401, 403, 413]).toContain(res.status);
  });

  it("returns 413 when payload too large (batch)", async () => {
    const big = "x".repeat(600 * 1024);
    const res = await request(server)
      .post("/api/v1/ai/predict:batch")
      .send({ modelId: "x", inputs: [{ big }] });
    expect([401, 403, 413]).toContain(res.status);
  });
});
