import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

const result = await build({
  entryPoints: ["src/api/storeApi.js"],
  write: false,
  bundle: true,
  format: "esm",
  define: { "import.meta.env.DEV": "false", "import.meta.env.VITE_API_BASE_URL": "undefined" },
});
const moduleUrl = "data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64");
const direct = "https://shoponzy-backend.vercel.app/api/v1";
const json = (status, value) => new Response(JSON.stringify(value), { status });
const success = (data) => json(200, { success: true, data });
const rejected = (code = "CSRF_INVALID") => json(403, { success: false, error: { code } });

test("retries blocked cross-site cookies via the storefront without changing the order payload", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push([url, options]);
    if (url.endsWith("/csrf")) return success({ csrfToken: url.startsWith(direct) ? "direct-token" : "proxy-token" });
    if (url.startsWith(direct)) return rejected();
    assert.equal(options.headers["X-CSRF-Token"], "proxy-token");
    assert.equal(options.credentials, "include");
    return success({ orderNumber: "SZ100001" });
  });
  const { storeRequest } = await import(moduleUrl + "#blocked");
  const body = { idempotencyKey: "checkout-attempt-key" };
  assert.equal((await storeRequest("/orders", { method: "POST", body })).data.orderNumber, "SZ100001");
  assert.deepEqual(calls.map(([url]) => url), [
    direct + "/csrf", direct + "/orders", direct + "/csrf", direct + "/orders", "/api/v1/csrf", "/api/v1/orders",
  ]);
  assert.ok(calls.filter(([url]) => url.endsWith("/orders")).every(([, options]) => options.body === JSON.stringify(body)));
});

test("refreshes an expired token and keeps a working direct session", async (t) => {
  let tokenRequests = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.ok(url.startsWith(direct));
    if (url.endsWith("/csrf")) return success({ csrfToken: "token-" + ++tokenRequests });
    return options.headers["X-CSRF-Token"] === "token-1" ? rejected() : success({});
  });
  const { storeRequest } = await import(moduleUrl + "#expired");
  await storeRequest("/orders", { method: "POST" });
  assert.equal(tokenRequests, 2);
});

test("does not repeat a request rejected for a different security reason", async (t) => {
  let writes = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/csrf")) return success({ csrfToken: "token" });
    writes++;
    return rejected("BAD_ORIGIN");
  });
  const { storeRequest } = await import(moduleUrl + "#bad-origin");
  await assert.rejects(storeRequest("/orders", { method: "POST" }), { code: "BAD_ORIGIN" });
  assert.equal(writes, 1);
});
