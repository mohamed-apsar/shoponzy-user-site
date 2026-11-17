// Run after setting POPUP_TEST_BROWSER to a Chromium executable (defaults to Edge on Windows).
import { build } from "esbuild";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

let published = false;
let faqItems = [{ id: 'faq-one', question: 'Managed question', answer: 'Managed answer' }];
let faqRequests = 0;
const bundle = await build({
  stdin: { contents: 'import React from "react"; import {createRoot} from "react-dom/client"; import {BrowserRouter} from "react-router-dom"; import {PublishedPagesProvider} from "./src/context/PublishedPagesContext.jsx"; import Help from "./src/pages/Help.jsx"; import Footer from "./src/components/layout/Footer.jsx"; createRoot(document.getElementById("root")).render(<BrowserRouter><PublishedPagesProvider><Help section={location.pathname === "/faqs" ? "faqs" : undefined} /><Footer /></PublishedPagesProvider></BrowserRouter>);', resolveDir: process.cwd(), loader: 'jsx' },
  bundle: true, write: false, outfile: 'smoke.js', jsx: 'automatic',
  plugins: [{ name: 'catalog-fixture', setup(builder) { builder.onLoad({ filter: /CatalogContext\.jsx$/ }, () => ({ contents: 'export function useCatalog() { return {store: {}, categories: []}; }', loader: 'js' })); } }],
  define: { 'import.meta.env.DEV': 'false', 'import.meta.env.VITE_API_BASE_URL': '"/api/v1"' },
});
const assets = new Map(bundle.outputFiles.map((file) => [file.path.endsWith('.css') ? '/smoke.css' : '/smoke.js', file.text]));
const server = createServer((req, res) => {
  if (req.url.startsWith('/api/v1/')) {
    res.setHeader('Content-Type', 'application/json');
    let data = {};
    if (req.url === '/api/v1/pages') data = published ? [{ slug: 'faqs', title: 'FAQs' }] : [];
    if (req.url === '/api/v1/faqs') { faqRequests++; data = faqItems; }
    if (req.url === '/api/v1/csrf') data = { csrfToken: 'test' };
    res.end(JSON.stringify({success: true, data}));
  } else if (assets.has(req.url)) { res.setHeader('Content-Type', req.url.endsWith('.css') ? 'text/css' : 'text/javascript'); res.end(assets.get(req.url)); }
  else { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><div id="root"></div><script type="module" src="/smoke.js"></script>'); }
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
  await command("Page.enable");
  const navigate = async (path) => { await command('Page.navigate', { url: 'http://127.0.0.1:' + server.address().port + path }); };
  const waitFor = async (expression) => { for (let i = 0; i < 80; i++) { if (await evaluate('Boolean(' + expression + ')')) return; await sleep(100); } throw Error('Timed out: ' + expression); };
  const faqLink = `document.querySelector('footer a[href="/faqs"]')`;
  await navigate('/faqs');
  await waitFor('document.querySelector(".empty h2")');
  assert.equal(await evaluate(faqLink), null);
  assert.equal(faqRequests, 0);
  console.log('PASS: disabled FAQ page shows not-found, hides footer link and never fetches questions');
  await navigate('/help');
  await waitFor('document.querySelector(".help-grid")');
  assert.equal(await evaluate('document.querySelector("#faq")'), null);
  assert.equal(faqRequests, 0);
  console.log('PASS: disabled FAQs are absent from the Help center');
  published = true;
  await navigate('/faqs');
  await waitFor('document.querySelector("details summary")');
  assert.equal(await evaluate('document.querySelector("details summary").textContent'), 'Managed question');
  assert.ok(await evaluate('Boolean(' + faqLink + ')'));
  console.log('PASS: enabling FAQs restores the page, managed questions and footer link');
  faqItems = [];
  await navigate('/faqs');
  await waitFor('document.querySelector("h1")?.textContent === "FAQs"');
  await sleep(250);
  assert.equal(await evaluate('document.querySelectorAll("details").length'), 0);
  assert.equal(await evaluate('document.body.textContent.includes("How do I place an order?")'), false);
  console.log('PASS: empty FAQ response does not show fallback questions');
  published = false;
  await evaluate('window.dispatchEvent(new Event("focus"))');
  await waitFor('document.querySelector(".empty h2")');
  assert.equal(await evaluate(faqLink), null);
  console.log('PASS: disabling FAQs takes effect in an already open tab on focus');
} finally {
  clearTimeout(watchdog);
  socket?.close();
  browser.kill();
  server.closeAllConnections();
  server.close();
}
