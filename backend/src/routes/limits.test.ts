import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import express from "express";
import { startLimit } from "./limits.ts";

test("starting rounds is refused once a client spends its allowance for the window", async () => {
  const app = express();
  app.post("/", startLimit, (_req, res) => {
    res.json({ ok: true });
  });

  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;
  const start = () => fetch(`http://127.0.0.1:${port}/`, { method: "POST" });

  try {
    for (let attempt = 1; attempt <= 30; attempt += 1) {
      assert.equal((await start()).status, 200, `attempt ${attempt} should be allowed`);
    }

    const refused = await start();
    const body = (await refused.json()) as { error: string };

    assert.equal(refused.status, 429);
    assert.match(body.error, /Too many rounds started/);
    assert.ok(refused.headers.get("ratelimit"), "standard RateLimit header is sent");
  } finally {
    server.closeAllConnections();
    server.close();
  }
});
