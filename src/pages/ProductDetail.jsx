import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon";
import ProductMedia, { mediaCount } from "../components/ProductMedia";
import OptionPicker from "../components/OptionPicker";
import SectionHead from "../components/SectionHead";
import { ProductList, WishButton } from "../components/ProductCard";
import NotFound from "./NotFound";
import { useStore } from "../context/StoreContext";
import { byId, bySlug, cat, categoryUrl, money, off, subOf, wa } from "../utils/shop";
import { usePageFx } from "../fx/usePageFx";
import usePageMeta from "../hooks/usePageMeta";
import { useCatalog } from "../context/CatalogContext";

const hoverDevice = () => matchMedia("(hover: hover)").matches;

function Gallery({ p, ci }) {
  const [k, setK] = useState(0);
  const [zoom, setZoom] = useState(-1);
  const main = useRef(null);
  const views = Array.from({ length: mediaCount(p) }, (_, i) => i);

  useEffect(() => { setK(0); main.current?.scrollTo({ left: 0 }); }, [ci]);

  function onScroll() {
    const g = main.current, next = Math.round(g.scrollLeft / g.clientWidth);
    if (next !== k) setK(next);
  }
  function show(i) {
    setK(i);
    main.current.scrollTo({ left: i * main.current.clientWidth, behavior: "smooth" });
  }
  function onMove(event) {
    const d = event.currentTarget, r = d.getBoundingClientRect();
    d.style.setProperty("--zx", ((event.clientX - r.left) / r.width) * 100 + "%");
    d.style.setProperty("--zy", ((event.clientY - r.top) / r.height) * 100 + "%");
  }

  return (
    <div className="gallery">
      <div className="g-thumbs" role="group" aria-label="Images">
        {views.map((i) => <ProductMedia as="button" type="button" key={i} product={p} ci={ci} k={i} aria-pressed={i === k} aria-label={`Image ${i + 1}`} onClick={() => show(i)} />)}
      </div>
      <div>
        <div className="g-main" tabIndex={0} aria-label="Product images, swipe to see more" ref={main} onScroll={onScroll}>
          {views.map((i) => (
            <ProductMedia as="div" key={i} product={p} ci={ci} k={i} className={zoom === i ? "zoom" : undefined}
              onMouseMove={onMove} onMouseLeave={() => setZoom(-1)} onClick={() => hoverDevice() && setZoom(zoom === i ? -1 : i)} />
          ))}
        </div>
        <div className="g-dots">{views.map((i) => <i key={i} className={i === k ? "on" : ""} />)}</div>
      </div>
    </div>
  );
}

function PinCheck({ deliveryText }) {
  const [msg, setMsg] = useState(null);
  function submit(event) {
    event.preventDefault();
    const v = event.target.querySelector("input").value.trim(), ok = /^\d{6}$/.test(v);
    setMsg({ ok, text: ok ? `✓ ${deliveryText}. Exact date is confirmed after your order.` : "Please enter a valid 6-digit PIN code." });
  }
  return (
    <>
      <form className="pin" onSubmit={submit}><input inputMode="numeric" maxLength={6} placeholder="Enter PIN code" aria-label="PIN code" /><button className="btn btn-ghost" style={{ minHeight: 46 }}>Check</button></form>
      <p className="pin-msg" style={msg ? { color: msg.ok ? "var(--ok)" : "var(--accent-d)" } : undefined}>{msg?.text}</p>
    </>
  );
}

function Product({ p, products, categories, store: STORE }) {
  const { addToCart, viewed, recent } = useStore();
  const navigate = useNavigate();
  const c = cat(p.cat, categories), sub = subOf(p, categories), o = off(p);
  const [opt, setOpt] = useState({ c: 0, s: p.sizes.length === 1 ? p.sizes[0] : "" });
  const [stickyShow, setStickyShow] = useState(false);
  const picker = useRef(null);
  const buyRow = useRef(null);

  usePageMeta(`${p.name} | Shoponzy`, `${p.name}${p.brand ? " by " + p.brand : ""} for ${money(p.price)}. Shop ${c.name.toLowerCase()} online at Shoponzy.`);
  usePageFx([p.id]);

  useEffect(() => { viewed(p.id); }, [p.id, viewed]);
  useEffect(() => {
    document.body.classList.add("pdp-page");
    const onScroll = () => setStickyShow(!!buyRow.current && buyRow.current.getBoundingClientRect().bottom < 0);
    addEventListener("scroll", onScroll, { passive: true });
    return () => { document.body.classList.remove("pdp-page"); removeEventListener("scroll", onScroll); };
  }, []);

  function go(buy, from) {
    if (picker.current.requireSize()) {
      picker.current.sizesEl().scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addToCart(p.id, opt.c, opt.s, 1, from || document.querySelector(".g-main"));
    if (buy) setTimeout(() => navigate("/checkout"), 450);
  }

  const related = products.filter((x) => x.cat === p.cat && x.id !== p.id).concat(products.filter((x) => x.cat !== p.cat)).slice(0, 10);
  const recentOthers = recent.filter((id) => id !== p.id).map((id) => byId(id, products)).filter(Boolean);
  const specs = p.specs || [["Type", sub[1]], ["Colours", p.colors.map((x) => x[1]).join(", ")], ["Sizes", p.sizes.join(", ")]];
  const priceLabel = p.from ? money(p.price) + "+" : money(p.price);

  return (
    <>
      <section className="section" style={{ paddingTop: 14 }}><div className="container">
        <nav className="crumbs" aria-label="Breadcrumb" style={{ fontSize: ".8rem", color: "var(--muted)", marginBottom: 14 }}>
          <Link to="/">Home</Link> / <Link to={categoryUrl(c.id)}>{c.name}</Link> / <Link to={categoryUrl(c.id, p.sub)}>{sub[1]}</Link>
        </nav>
        <div className="pdp">
          <Gallery p={p} ci={opt.c} />
          <div className="pinfo">
            <p className="brand">{p.brand || sub[1]}</p><h1>{p.name}</h1>
            <div className="price">{p.from ? <b>{money(p.price)} – {money(p.priceTo)}</b> : <><b>{money(p.price)}</b>{p.mrp > p.price && <><s>MRP {money(p.mrp)}</s><em>{o}% OFF</em></>}</>}</div>
            <p className="tax">Inclusive of all taxes</p>
            <ul className="offer-box">
              <li><Icon name="i-tag" />Extra {STORE.prepaidOffPct}% off when you pay by UPI</li>
              <li><Icon name="i-truck" />Free delivery on orders above {money(STORE.freeShippingAbove)}</li>
              {Object.entries(STORE.coupons).map(([code, cp]) => <li key={code}><Icon name="i-gift" />Use <b>{code}</b>: {cp.label}</li>)}
            </ul>
            <OptionPicker ref={picker} product={p} value={opt} onChange={setOpt} />
            <div className="buy" ref={buyRow}>
              <button type="button" className="btn btn-dark tap" onClick={() => go(false)}><Icon name="i-bag" />Add to bag</button>
              <button type="button" className="btn btn-accent tap" onClick={() => go(true)}>Buy now</button>
              <WishButton id={p.id} className="heart tap" label="Save to wishlist"
                style={{ position: "static", width: 54, height: 54, flex: "none", borderRadius: 14, boxShadow: "0 0 0 1.5px var(--line)" }} />
            </div>
            <PinCheck deliveryText={STORE.deliveryText} />
            <div className="perks"><div><Icon name="i-refresh" />7-day returns</div><div><Icon name="i-cash" />Cash on delivery</div><div><Icon name="i-shield" />Secure checkout</div></div>
            <div className="acc">
              <details open><summary>Product details</summary><div className="body">
                {p.desc && <p style={{ marginBottom: 10 }}>{p.desc}</p>}
                <table className="spec"><tbody>{specs.map((r) => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td></tr>)}<tr><td>Product code</td><td>{p.id}</td></tr></tbody></table>
              </div></details>
              <details><summary>Delivery &amp; returns</summary><div className="body">{STORE.deliveryText}. Easy 7-day returns and exchanges on unused items with tags. <Link className="view-all" to="/return-policy">Read policy</Link></div></details>
            </div>
            <p style={{ marginTop: 14 }}><a className="view-all" target="_blank" rel="noopener" href={wa(`${p.name} ${location.href}`, STORE)}><Icon name="i-wa" />Share on WhatsApp</a></p>
          </div>
        </div>
      </div></section>

      <section className="section soft"><div className="container">
        <SectionHead title="You may also like" railId="related" viewAll="/products" />
        <ProductList id="related" items={related} />
      </div></section>
      {recentOthers.length > 0 && (
        <section className="section" id="recentSec"><div className="container">
          <SectionHead title="Recently viewed" railId="recent" />
          <ProductList id="recent" items={recentOthers} />
        </div></section>
      )}

      <div className={`sticky-buy${stickyShow ? " show" : ""}`}>
        <div className="t"><b>{priceLabel}</b><small>{p.colors[opt.c][1]}{opt.s ? " · " + opt.s : ""}</small></div>
        <button type="button" className="btn btn-dark" style={{ minHeight: 48 }} onClick={(e) => go(false, e.currentTarget.parentElement)}><Icon name="i-bag" />Add to bag</button>
      </div>
    </>
  );
}

export default function ProductDetail() {
  const { products, categories, store, status } = useCatalog();
  const { slug } = useParams();
  const p = bySlug(slug, products);
  if (status !== "ready") return null;
  if (!p) return <NotFound />;
  return <Product key={p.id} p={p} products={products} categories={categories} store={store} />;
}
