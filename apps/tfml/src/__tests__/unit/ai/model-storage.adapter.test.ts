import { beforeAll, describe, expect, it } from "bun:test";
import path from "node:path";
import { getModelStorageAdapter } from "../../../features/ai/services/model-storage.adapter";

describe("ModelStorageAdapter", () => {
  beforeAll(() => {
    process.env.MODEL_STORAGE = "local";
    process.env.MODEL_DIR = ".models-test";
  });

  it("returns local URIs and dirs for local backend", () => {
    const adapter = getModelStorageAdapter();
    const uri = adapter.getUri("model123", "1.0.0");
    const dir = adapter.getLocalDir("model123", "1.0.0");

    expect(uri.startsWith("file://")).toBe(true);
    expect(path.normalize(dir)).toContain(path.normalize(".models-test"));
  });
});
