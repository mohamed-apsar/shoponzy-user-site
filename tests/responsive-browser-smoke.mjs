// Run from user-site: node tests/responsive-browser-smoke.mjs (Edge or POPUP_TEST_BROWSER).
import { build } from "esbuild";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import { PRODUCTS } from "../src/data/catalog.js";

const fixture = `import {PRODUCTS,CATS,STORE} from './src/data/catalog.js';
export const products=PRODUCTS.slice(0,12).map((p,i)=>({...p,apiId:'product-'+i,name:i===0?'Comfortable footwear with a very long product name for everyday use':p.name,variants:[{id:'variant-'+i,color:p.colors[0][1],size:p.sizes[0],price:p.price,stock:10}]}));
export const cart=[{id:products[0].id,c:0,s:products[0].sizes[0],qty:2}];
export const catalog={products,categories:CATS.map(c=>({...c,icon:c.heroArt[0],...(c.id==='watches'?{comingSoon:true,bannerImage:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="500"><rect width="1600" height="500" fill="#171423"/><text x="100" y="270" fill="white" font-size="100">WATCHES</text></svg>')}:c.id==='sunglass'?{comingSoon:true,image:'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000"><rect width="800" height="1000" fill="#ded7c9"/><path d="M0 200Q400 0 800 200M0 800Q400 1000 800 800" stroke="#eae4d8" stroke-width="120" fill="none"/><g fill="#722c2c" stroke="#b99c6a" stroke-width="8"><rect x="120" y="450" width="240" height="160" rx="30"/><rect x="440" y="450" width="240" height="160" rx="30"/><path d="M360 490Q400 470 440 490" fill="none"/></g></svg>')}:c.id==='perfumes'?{comingSoon:true}:{})})),store:{...STORE,homeCategories:{showAllCategories:true}},status:'ready',sections:[{id:'new',source:'new',title:'New arrivals',products}],slides:[],retry:()=>{}};
const noop=()=>{};
export const store={cart,coupon:null,address:{},checkoutDraft:{mode:'cart',lines:cart},cartReady:true,cartCount:2,wish:[],recent:[],openSheets:[],toasts:[],quickViewId:null,flushCart:async()=>{},openSheet:noop,closeSheet:noop,addToCart:noop,viewed:noop,startCheckout:noop,setQty:noop,removeLine:noop,setCoupon:noop,setAddress:noop,completeCheckout:noop,toggleWish:noop,toast:noop};`;
const bundle = await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {BrowserRouter} from 'react-router-dom'; import App from './src/App.jsx'; import ConfirmDialog from './src/components/ConfirmDialog.jsx'; import './src/styles/style.css'; createRoot(document.getElementById('root')).render(<BrowserRouter><App/><ConfirmDialog open={location.search.includes('audit-modal')} title="Submit return request?" message="You are requesting a return for 2 items from order SZ100001. Reason: Product not as described. Our team will review your request and update you." confirmLabel="Yes, submit request" variant="return" onCancel={()=>{}} onConfirm={()=>{}}/></BrowserRouter>);`, resolveDir: process.cwd(), loader: "jsx" },
  bundle: true, write: false, outfile: "smoke.js", jsx: "automatic",
  define: { "import.meta.env.DEV": "false", "import.meta.env.VITE_API_BASE_URL": '"/api/v1"' },
  plugins: [{ name: "fixtures", setup(b) {
    b.onResolve({ filter: /^responsive-fixture$/ }, () => ({ path: "fixture", namespace: "responsive" }));
    b.onLoad({ filter: /.*/, namespace: "responsive" }, () => ({ contents: fixture, resolveDir: process.cwd(), loader: "js" }));
    b.onLoad({ filter: /CatalogContext\.jsx$/ }, () => ({ contents: `import {catalog} from 'responsive-fixture'; export const useCatalog=()=>catalog;`, loader: "js" }));
    b.onLoad({ filter: /StoreContext\.jsx$/ }, () => ({ contents: `import {store} from 'responsive-fixture'; export const useStore=()=>store;`, loader: "js" }));
    b.onLoad({ filter: /CustomerContext\.jsx$/ }, () => ({ contents: `const noop=()=>{}; export const useCustomer=()=>({signedIn:true,status:'ready',user:{id:'user',name:'Asha Kumar',email:'customer.with.a.long.email.address@example.com',phone:'9876543210'},signOut:noop,setUser:noop});`, loader: "js" }));
  } }],
});
const assets = new Map(bundle.outputFiles.map((f) => [f.path.endsWith(".css") ? "/smoke.css" : "/smoke.js", f.text]));
const server = createServer((req, res) => {
  if (req.url.startsWith('/api/v1/')) {
    let data = [];
    if (/\/orders\/SZ100001$/.test(req.url)) data = { order: {orderNumber:'SZ100001',status:'delivered',paymentMethod:'razorpay',paymentStatus:'paid',subtotal:1000,total:1000,shippingFee:0,items:[{name:'Comfortable footwear with a very long product name for everyday use',color:'Lavender',size:'8',qty:2,lineTotal:1000}],shippingAddress:{name:'Asha Kumar',line1:'12 Long Street',city:'Chennai',state:'Tamil Nadu',pincode:'600040'},history:[],createdAt:new Date().toISOString()} };
    if (/\/returns$/.test(req.url)) data = {eligibility:{eligible:false,reason:'No eligible items',items:[]},requests:[],returns:[]};
    if (/\/orders\?/.test(req.url)) data=[];
    if (/\/csrf$/.test(req.url)) data={csrfToken:'test'};
    res.setHeader('Content-Type','application/json'); res.end(JSON.stringify({success:true,data,meta:{total:0}}));
  } else if (assets.has(req.url)) {res.setHeader('Content-Type',req.url.endsWith('.css')?'text/css':'text/javascript');res.end(assets.get(req.url));}
  else {res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/smoke.css"><div id="root"></div><script type="module" src="/smoke.js"></script>');}
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const profile = await mkdtemp(join(tmpdir(), "shoponzy-responsive-"));
const browser = spawn(process.env.POPUP_TEST_BROWSER || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: ["ignore", "ignore", "pipe"], windowsHide: true });
let socket;
const watchdog = setTimeout(() => { browser.kill(); console.error('Responsive audit timed out'); process.exit(1); }, 180000);
try {
  let endpoint, launchError;
  browser.on('error', (e) => {launchError=e;});
  for(let i=0;i<100&&!endpoint;i++) {
    if(launchError) throw launchError;
    try {const [port,path]=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).trim().split(/\r?\n/);if(port&&path)endpoint=`ws://127.0.0.1:${port}${path}`;}catch{}
    if(!endpoint)await new Promise(r=>setTimeout(r,100));
  }
  if(!endpoint)throw Error('Browser did not start');
  const target=await(await fetch(`http://127.0.0.1:${new URL(endpoint).port}/json/new?about:blank`,{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r=>socket.addEventListener('open',r,{once:true}));
  let sequence=0;const pending=new Map();const errors=[];
  socket.addEventListener('message',e=>{const msg=JSON.parse(e.data);if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.exception?.description||msg.params.exceptionDetails.text);if(msg.id){const task=pending.get(msg.id);pending.delete(msg.id);msg.error?task.reject(Error(msg.error.message)):task.resolve(msg.result);}});
  const command=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async(expression)=>{const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await command('Page.enable');
  await command('Runtime.enable');
  const modalPath='/account/orders/SZ100001?audit-modal=1';
  const phoneOnly=process.argv.includes('--phone-only');
  const paths=process.argv.includes('--banner-only') ? ['/categories/watches','/categories/sunglass','/categories/perfumes'] : phoneOnly ? ['/checkout?mode=cart'] : process.argv.includes('--modal-only') ? [modalPath] : ['/','/products',`/products/${PRODUCTS[0].slug}`,'/categories/shoes','/categories/watches','/cart','/checkout?mode=cart','/account','/account?section=support','/account/orders/SZ100001','/help',modalPath];
  const sizes=phoneOnly ? [[375,812],[1366,768]] : [[320,640],[375,812],[768,1024],[1024,768],[1366,768],[1920,1080],[812,375]];
  const failures=[];
  for(const [width,height] of sizes) {
    await command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
    for(const path of paths) {
      await command('Page.navigate',{url:`http://127.0.0.1:${server.address().port}${path}`});
      let ready=false;
      for(let i=0;i<70;i++){ready=await evaluate('Boolean(document.querySelector("main h1, main h2"))');if(ready)break;await new Promise(r=>setTimeout(r,100));}
      assert.ok(ready,`Page did not render: ${path}: ${errors.join('; ')}`);
      await new Promise(r=>setTimeout(r,180));
      const issue=await evaluate(`(()=>{const w=document.documentElement.clientWidth;const nodes=[...document.querySelectorAll('main input,main select,main textarea,main .box,main .summary,main .line,main .dline,header,footer')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden');return nodes.filter(e=>{const r=e.getBoundingClientRect();return r.left < -1 || r.right > w+1;}).slice(0,6).map(e=>({tag:e.tagName,class:e.className,width:Math.round(e.getBoundingClientRect().width)}));})()`);
      if(issue.length)failures.push({width,height,path,issue});
      if(['/categories/watches','/categories/sunglass','/categories/perfumes'].includes(path)) {
        if(path!=='/categories/sunglass') {
          assert.ok(await evaluate('document.querySelector("#coming-soon-title").textContent.includes("Coming soon.")'),'Perfumes and Watches must clearly say Coming soon');
          assert.ok(await evaluate('document.querySelector(".coming-soon-copy p").textContent.includes("Shoponzy")'),'Collection launch description must be visible');
        }
        assert.equal(await evaluate('document.querySelectorAll(".coming-soon-card a, .coming-soon-card button").length'),0,'No Explore button inside collection banners');
        if(path==='/categories/perfumes') {
          const layout=await evaluate('(()=>{const card=document.querySelector(".coming-soon-card");const art=document.querySelector(".coming-soon-art");const visual=art.parentElement.getBoundingClientRect();const copy=document.querySelector(".coming-soon-copy").getBoundingClientRect();return {split:card.classList.contains("is-product-preview"),copyLeft:copy.left,visualLeft:visual.left,copyTop:copy.top,visualBottom:visual.bottom,artWidth:art.getBoundingClientRect().width};})()');
          assert.ok(layout.split&&layout.artWidth>0,'Perfumes must use the image-and-text layout even with category artwork');
          assert.ok(width>760 ? layout.copyLeft<layout.visualLeft : layout.copyTop>=layout.visualBottom-1,'Perfumes must split on desktop and stack on mobile');
        } else if(path==='/categories/sunglass') {
          const preview=await evaluate(`(()=>{const img=document.querySelector('.coming-soon-product');const image=img.getBoundingClientRect();const visual=img.parentElement.getBoundingClientRect();const copy=document.querySelector('.coming-soon-copy').getBoundingClientRect();return {loaded:img.complete&&img.naturalWidth>0,imageWidth:image.width,visualWidth:visual.width,imageHeight:image.height,visualHeight:visual.height,copyLeft:copy.left,visualLeft:visual.left,copyTop:copy.top,visualBottom:visual.bottom};})()`);
          assert.ok(preview.loaded,'Portrait category image must load');
          assert.ok(Math.abs(preview.imageWidth-preview.visualWidth)<1&&Math.abs(preview.imageHeight-preview.visualHeight)<1,'Category image must fill the visual panel');
          assert.ok(width>760 ? preview.copyLeft<preview.visualLeft : preview.copyTop>=preview.visualBottom-1,'Portrait layout must split on desktop and stack on mobile');
        } else {
        const banner=await evaluate(`(()=>{const img=document.querySelector('.coming-soon-banner');const visual=img.parentElement.getBoundingClientRect();const rect=img.getBoundingClientRect();const card=document.querySelector('.coming-soon-card').getBoundingClientRect();return {loaded:img.complete&&img.naturalWidth>0,ratio:rect.width/rect.height,width:rect.width,cardWidth:card.width,height:rect.height,visualHeight:visual.height};})()`);
        assert.ok(banner.loaded,'Coming-soon banner must load');
        assert.equal(await evaluate('document.querySelectorAll(".coming-soon-card a, .coming-soon-card button").length'),0,'No Explore button inside collection banners');
        assert.ok(Math.abs(banner.ratio-3.2)<0.02,'Banner must retain its original proportions');
        assert.ok(Math.abs(banner.width-banner.cardWidth)<3,'Banner must fill the card width');
        assert.ok(Math.abs(banner.height-banner.visualHeight)<=2.1,'No empty bands above or below banner (except the 1px borders)');
        }
        if(process.argv.includes('--screenshots')&&[375,1366].includes(width)) {
          const screenshot=await command('Page.captureScreenshot',{format:'png'});
          const file=join(tmpdir(),`shoponzy-${path.split('/').pop()}-${width}.png`);
          await writeFile(file,Buffer.from(screenshot.data,'base64'));
          console.log(`Screenshot: ${file}`);
        }
      }
      if(path.startsWith('/checkout')) {
        await evaluate('document.querySelector("input[name=phone]").focus(); document.querySelector("input[name=phone]").select()');
        await command('Input.insertText',{text:'9876543210'});
        assert.equal(await evaluate('document.querySelector("input[name=phone]").value'),'9876543210');
        await command('Input.insertText',{text:'abc!@# '});
        assert.equal(await evaluate('document.querySelector("input[name=phone]").value'),'9876543210','Phone field must reject letters, symbols and spaces');
        await evaluate('document.querySelector("input[name=phone]").select()');
        await command('Input.insertText',{text:'(987) 654-3210'});
        assert.equal(await evaluate('document.querySelector("input[name=phone]").value'),'9876543210','Pasted phone numbers retain only digits');
      }
      if(path===modalPath) {
        const modal=await evaluate('(()=>{const e=document.querySelector(".confirm-dialog");const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:innerHeight,width:innerWidth,scrollable:e.scrollHeight>=e.clientHeight};})()');
        assert.ok(modal.top>=0&&modal.bottom<=modal.height+1&&modal.left>=0&&modal.right<=modal.width+1,`Confirmation popup clipped at ${width}×${height}: ${JSON.stringify(modal)}`);
      }
    }
    console.log(`Audited ${width}×${height}`);
  }
  console.log(JSON.stringify(failures,null,2));
  assert.equal(failures.length,0,'Responsive elements extend outside the viewport');
  console.log(`PASS: ${paths.length*sizes.length} representative page/viewport checks`);
} finally {clearTimeout(watchdog);socket?.close();browser.kill();server.close();}
