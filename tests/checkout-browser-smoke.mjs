// Run after setting POPUP_TEST_BROWSER to a Chromium executable (defaults to Edge on Windows).
import { build } from "esbuild";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

const products = [{"id":"a","apiId":"aaaaaaaaaaaaaaaaaaaaaaaa","slug":"a","name":"Bag product","price":500,"mrp":500,"colors":[["#000","Black"]],"sizes":["8"],"images":["data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\"/>"],"variants":[{"id":"cccccccccccccccccccccccc","color":"Black","size":"8","price":500}],"cat":"shoes"},{"id":"b","apiId":"bbbbbbbbbbbbbbbbbbbbbbbb","slug":"b","name":"Buy now product","price":700,"mrp":700,"colors":[["#000","Black"]],"sizes":["8"],"images":["data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\"/>"],"variants":[{"id":"dddddddddddddddddddddddd","color":"Black","size":"8","price":700}],"cat":"shoes"}];
const orders = [];
const bundle = await build({stdin:{contents:"import React from 'react'; import {createRoot} from 'react-dom/client'; import {BrowserRouter, Routes, Route, useNavigate} from 'react-router-dom'; import {StoreProvider,useStore} from './src/context/StoreContext.jsx'; import Cart from './src/pages/Cart.jsx'; import Checkout from './src/pages/Checkout.jsx'; function Probe(){const store=useStore(); window.bag=store.cart; const nav=useNavigate(); return <><button id=\"buy\" onClick={()=>{store.startCheckout('buy-now',[{id:'b',c:0,s:'8',qty:1}]);nav('/checkout?mode=buy-now')}}>Buy now</button><button id=\"bag\" onClick={()=>nav('/cart')}>Bag</button></>;} createRoot(document.getElementById('root')).render(<BrowserRouter><StoreProvider><Probe/><Routes><Route path=\"/cart\" element={<Cart/>}/><Route path=\"/checkout\" element={<Checkout/>}/></Routes></StoreProvider></BrowserRouter>);",resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,outfile:'smoke.js',jsx:'automatic',define:{'import.meta.env.DEV':'false','import.meta.env.VITE_API_BASE_URL':'"/api/v1"'},plugins:[{name:'fixtures',setup(b){b.onLoad({filter:/CatalogContext\.jsx$/},()=>({contents:'export const useCatalog=()=>({products:'+JSON.stringify(products)+',categories:[],status:"ready",store:{taxRate:0,shippingFee:59,freeShippingAbove:999,prepaidOffPct:5}});',loader:'js'}));b.onLoad({filter:/CustomerContext\.jsx$/},()=>({contents:'export const useCustomer=()=>({signedIn:false,status:"ready",user:{}});',loader:'js'}));}}]});
const assets=new Map(bundle.outputFiles.map(f=>[f.path.endsWith('.css')?'/smoke.css':'/smoke.js',f.text]));
const server=createServer(async(req,res)=>{if(req.url.startsWith('/api/v1/')){let data={};if(req.url.endsWith('/csrf'))data={csrfToken:'test'};if(req.url.endsWith('/orders')){let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw);orders.push(body);data={order:{orderNumber:'SZ100001',total:759,paymentMethod:'cod'}};}res.setHeader('Content-Type','application/json');res.end(JSON.stringify({success:true,data}));}else if(assets.has(req.url)){res.setHeader('Content-Type',req.url.endsWith('.css')?'text/css':'text/javascript');res.end(assets.get(req.url));}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><div id="root"></div><script type="module" src="/smoke.js"></script>');}});
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

  await command('Page.addScriptToEvaluateOnNewDocument',{source:'if (!localStorage.getItem("seeded")) {localStorage.setItem("snz:cart",JSON.stringify([{id:"a",c:0,s:"8",qty:1},{id:"b",c:0,s:"8",qty:2}]));localStorage.setItem("snz:addr",JSON.stringify({name:"Asha Kumar",phone:"9876543210",email:"asha@example.com",address:"12 Test Street",city:"Chennai",pincode:"600040",state:"Tamil Nadu"}));localStorage.setItem("seeded","1");}'});
  await navigate('/cart');
  await waitFor('document.querySelectorAll(".line").length===2');
  assert.equal(await evaluate('document.querySelectorAll("#cartWrap input[type=checkbox]:checked").length'), 0);
  assert.equal(await evaluate('document.querySelector(".summary button").disabled'), true);
  await evaluate('document.querySelector("#cartWrap input[type=checkbox]").click()');
  assert.equal(await evaluate('document.querySelectorAll(".line input[type=checkbox]:checked").length'), 2);
  await evaluate('document.querySelector("#cartWrap input[type=checkbox]").click()');
  assert.equal(await evaluate('document.querySelectorAll(".line input[type=checkbox]:checked").length'), 0);
  console.log('PASS: bag opens with no selection; only an explicit Select all selects every item');
  await evaluate('document.querySelectorAll(".line input[type=checkbox]")[1].click()');
  await evaluate('document.querySelector(".summary button").click()');
  await waitFor('document.querySelectorAll("#coSum .dline").length===1');
  assert.equal(await evaluate('document.querySelector("#coSum h4").textContent'),'Buy now product');
  assert.ok(await evaluate('document.querySelector("#coSum .meta").textContent.includes("Qty 2")'));
  await command('Page.reload');
  await waitFor('document.querySelectorAll("#coSum .dline").length===1');
  console.log('PASS: bag selection and checkout refresh include only selected items');
  await evaluate('document.querySelector("#buy").click()');
  await waitFor('document.querySelector("#coSum .meta")?.textContent.includes("Qty 1")');
  assert.deepEqual(await evaluate('window.bag.map(l=>[l.id,l.qty])'),[['a',1],['b',2]]);
  await command('Page.reload');
  await waitFor('document.querySelector("#coSum .meta")?.textContent.includes("Qty 1")');
  await evaluate('document.querySelector("input[value=cod]").click()');
  await evaluate('document.querySelector("#coSum button[type=submit]").click()');
  await waitFor('document.querySelector(".oid")');
  assert.equal(orders.length,1);
  assert.equal(orders[0].checkoutMode,'buy-now');
  assert.deepEqual(orders[0].items,[{productId:'b'.repeat(24),variantId:'d'.repeat(24),qty:1}]);
  assert.deepEqual(await evaluate('window.bag.map(l=>[l.id,l.qty])'),[['a',1],['b',2]]);
  console.log('PASS: Buy Now survives refresh, orders one unit, and keeps existing bag quantities');
  await evaluate('document.querySelector("#bag").click()');
  await waitFor('document.querySelectorAll(".line").length===2');
  await evaluate('document.querySelectorAll(".line input[type=checkbox]")[1].click()');
  await evaluate('document.querySelector(".summary button").click()');
  await waitFor('document.querySelector("#coSum .meta")?.textContent.includes("Qty 2")');
  await evaluate('document.querySelector("input[value=cod]").click()');
  await evaluate('document.querySelector("#coSum button[type=submit]").click()');
  await waitFor('document.querySelector(".oid")');
  assert.equal(orders[1].checkoutMode,'cart');
  assert.equal(orders[1].items.length,1);
  assert.equal(orders[1].items[0].qty,2);
  assert.deepEqual(await evaluate('window.bag.map(l=>[l.id,l.qty])'),[['a',1]]);
  console.log('PASS: completing selected bag checkout preserves the unselected product');
} finally {
  clearTimeout(watchdog);
  socket?.close();
  browser.kill();
  server.closeAllConnections();
  server.close();
}
