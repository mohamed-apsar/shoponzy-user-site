// Run after setting POPUP_TEST_BROWSER to a Chromium executable (defaults to Edge on Windows).
import { build } from "esbuild";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

const fixture = { id: "smoke-popup", title: "New Arrival", description: "New products available", buttonText: "Shop now", url: "/products", status: "active", trigger: "delay", delaySeconds: 1, frequency: "session", updatedAt: "smoke-version" };
fixture.image = { url: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="white"/><rect x="250" y="100" width="300" height="800" rx="100" fill="#ddd"/></svg>') };
const bundle = await build({
  stdin: { contents: 'import React from "react"; import {createRoot} from "react-dom/client"; import {BrowserRouter} from "react-router-dom"; import Popup from "./src/components/PromotionalPopup.jsx"; createRoot(document.getElementById("root")).render(<React.StrictMode><BrowserRouter><Popup /></BrowserRouter></React.StrictMode>);', resolveDir: process.cwd(), loader: "jsx" },
  bundle: true, write: false, outfile: "smoke.js", jsx: "automatic",
  define: { "import.meta.env.DEV": "false", "import.meta.env.VITE_API_BASE_URL": '"/api/v1"' },
});
const assets = new Map(bundle.outputFiles.map((file) => [file.path.endsWith(".css") ? "/smoke.css" : "/smoke.js", file.text]));
let failedRequests = 0;
let successfulRequests = 0;
const server = createServer((req, res) => {
  if (req.url === "/api/v1/popups") {
    res.setHeader("Content-Type", "application/json");
    if (!failedRequests) { failedRequests++; res.writeHead(503); res.end(JSON.stringify({ success: false })); }
    else { successfulRequests++; res.end(JSON.stringify({ success: true, data: [fixture] })); }
  }
  else if (assets.has(req.url)) { res.setHeader("Content-Type", req.url.endsWith(".css") ? "text/css" : "text/javascript"); res.end(assets.get(req.url)); }
  else { res.setHeader("Content-Type", "text/html"); res.end('<!doctype html><link rel="stylesheet" href="/smoke.css"><button id="prior">Shop</button><div id="root"></div><script type="module" src="/smoke.js"></script>'); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const profile = await mkdtemp(join(tmpdir(), "shoponzy-popup-smoke-"));
const browser = spawn(process.env.POPUP_TEST_BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"], windowsHide: true });
let socket;
const watchdog = setTimeout(() => { console.error("Popup browser smoke test timed out"); browser.kill(); process.exit(1); }, 35000);
try {
  let endpoint;
  let launchError;
  browser.on("error", (error) => { launchError = error; });
  for (let attempt = 0; attempt < 100 && !endpoint; attempt++) {
    if (launchError) throw launchError;
    try {
      const [port, path] = (await readFile(join(profile, "DevToolsActivePort"), "utf8")).trim().split(/\r?\n/);
      if (port && path) endpoint = `ws://127.0.0.1:${port}${path}`;
    } catch { /* Browser is still starting. */ }
    if (!endpoint) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!endpoint) throw new Error("Browser did not expose its debugging endpoint");
  const port = new URL(endpoint).port;
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => { const response = JSON.parse(event.data); if (response.id) { const task = pending.get(response.id); pending.delete(response.id); if (response.error) task.reject(new Error(response.error.message)); else task.resolve(response.result); } });
  const command = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => { const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const waitForPopup = async () => { for (let i = 0; i < 100; i++) { if (await evaluate('Boolean(document.querySelector("dialog[open]"))')) return; await sleep(100); } throw new Error("Popup did not become visible"); };
  await command("Page.enable");
  await command("Page.addScriptToEvaluateOnNewDocument", { source: 'sessionStorage.setItem("snz:popup:smoke-popup:smoke-version", String(Date.now()))' });
  await command("Page.navigate", { url: `http://127.0.0.1:${server.address().port}/` });
  await waitForPopup();
  assert.equal(failedRequests, 1);
  assert.ok(successfulRequests > 0);
  console.log("PASS: popup recovers promptly after an initial API failure");
  await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  assert.ok(await evaluate('(() => { const box = document.querySelector("dialog[open]").getBoundingClientRect(); return box.width > 0 && box.left >= 0 && box.right <= innerWidth && box.bottom <= innerHeight; })()'));
  await command("Emulation.clearDeviceMetricsOverride");
  assert.equal(await evaluate('sessionStorage.getItem("snz:popup:v2:smoke-popup:smoke-version")'), null);
  console.log("PASS: old history does not suppress the popup; showing it does not consume the session limit");
  await command("Page.reload");
  await sleep(200);
  await waitForPopup();
  await evaluate('document.querySelector(".store-promo-close").click()');
  assert.equal(await evaluate('Boolean(document.querySelector("dialog[open]"))'), false);
  assert.ok(await evaluate('sessionStorage.getItem("snz:popup:v2:smoke-popup:smoke-version")'));
  await command("Page.reload");
  await sleep(2200);
  assert.equal(await evaluate('Boolean(document.querySelector("dialog[open]"))'), false);
  console.log("PASS: reload before dismissal displays again; dismissal respects once-per-session frequency");
  if (process.env.POPUP_LIVE_URL) {
    await command("Page.navigate", { url: process.env.POPUP_LIVE_URL });
    await waitForPopup();
    assert.ok(await evaluate('document.querySelector("#store-promo-title").textContent.trim()'));
    console.log("PASS: deployed storefront displays an active popup in a fresh browser session");
  }
} finally {
  clearTimeout(watchdog);
  socket?.close();
  browser.kill();
  server.closeAllConnections();
  server.close();
}
