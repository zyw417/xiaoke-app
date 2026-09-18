import { describe, expect, it } from "vitest";
import { createApp } from "../server/src/app.js";

describe("server health", () => {
  it("reports a healthy application", async () => {
    const app = await createApp();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
    await app.close();
  });
});
