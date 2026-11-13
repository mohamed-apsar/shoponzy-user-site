import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import Art from "../components/Art";
import HeroSlider from "../components/HeroSlider";
import SectionHead from "../components/SectionHead";
import { ProductList } from "../components/ProductCard";
import { categoryUrl, off } from "../utils/shop";
import { storeRequest } from "../api/storeApi";
import { usePageFx } from "../fx/usePageFx";
import usePageMeta from "../hooks/usePageMeta";
import { useCatalog } from "../context/CatalogContext";

const TRUST = [
  ["/return-policy", "i-refresh", <>7-day easy returns<br />&amp; exchange</>],
  ["/shipping-policy", "i-cash", <>Cash on delivery<br />available</>],
  ["/shipping-policy", "i-truck", <>Free delivery<br />above ₹999</>],
  ["/faqs", "i-tag", <>Extra 5% off<br />on prepaid orders</>],
];

function Newsletter() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setMsg("Please enter a valid email."); event.target.querySelector("input").focus(); return; }
    setBusy(true);
    try {
      await storeRequest("/newsletter", { method: "POST", body: { email: v, source: "homepage" } });
      setMsg("You’re subscribed! Watch your inbox for offers and new arrivals.");
      setEmail("");
    } catch (error) {
      setMsg(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <form style={{ display: "flex" }} onSubmit={submit}>
        <input type="email" placeholder="Your email address" aria-label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn btn-accent" disabled={busy}>{busy ? "…" : "Subscribe"}</button>
      </form>
      <p className="ok" style={{ marginTop: 8, fontSize: ".85rem" }} aria-live="polite">{msg}</p>
    </div>
  );
}

export default function Home() {
  const { categories: CATS, slides: HERO_SLIDES, products: PRODUCTS, sections, store } = useCatalog();
  usePageMeta(
    store.seo?.title || "Shoponzy | Shoes, Sunglasses, Perfumes, Clothing & Watches Online",
    store.seo?.description,
    {
      canonical: store.seo?.canonical,
      keywords: store.seo?.keywords,
      ogTitle: store.seo?.ogTitle,
      ogDescription: store.seo?.ogDescription,
      shareImage: store.seo?.shareImage?.url,
    },
  );
  usePageFx();

  const newSection = sections.find((section) => section.source === "new");
  const bestSection = sections.find((section) => section.source === "bestseller");
  const categorySection = sections.find((section) => section.source === "category");
  const dealsSection = sections.find((section) => section.source === "deals");
  const newIn = newSection?.products || [];
  const best = bestSection?.products || [];
  const shoes = categorySection?.products || [];
  const deals = dealsSection?.products || [...PRODUCTS].sort((a, b) => off(b) - off(a)).slice(0, 8);
  const marquee = Array.from({ length: 4 }, () => CATS.map((c) => c.name)).flat();
  const stripSettings = store.homeCategories;
  const stripCategories = stripSettings.showAllCategories
    ? CATS
    : stripSettings.categories.map((slug) => CATS.find((category) => category.id === slug)).filter(Boolean);

  return (
    <>
      <nav className="stories" aria-label="Shop categories">
        {stripSettings.showNewIn && <Link className="story" to="/products"><span className="ring"><span>{stripSettings.newInImage
          ? <img src={stripSettings.newInImage} alt="" loading="lazy" />
          : <Art kind="sneaker" color="#FF4D2E" category="shoes" />}</span></span>Shop all</Link>}
        {stripCategories.map((c) => (
          <Link className="story" key={c.id} to={categoryUrl(c.id)}><span className="ring"><span>{c.image
            ? <img src={c.image} alt="" loading="lazy" />
            : <Art kind={c.icon[0]} color={c.icon[1]} category={c.id} />}</span></span>{c.name}</Link>
        ))}
      </nav>

      {HERO_SLIDES.length > 0 && <HeroSlider slides={HERO_SLIDES} />}

      <section className="section" style={{ paddingBottom: 10 }}><div className="container">
        <div className="trust" data-stagger>
          {TRUST.map(([to, icon, text], i) => <Link key={i} to={to}><span className="ic"><Icon name={icon} /></span><span>{text}</span></Link>)}
        </div>
      </div></section>

      <section className="section"><div className="container">
        <SectionHead title={newSection?.title || "New arrivals"} subtitle={newSection?.subtitle} railId="newRail" viewAll={newSection?.url || "/products?sort=new"} />
        <ProductList id="newRail" items={newIn} />
      </div></section>

      <section className="section"><div className="container">
        <SectionHead title={bestSection?.title || "Bestsellers"} subtitle={bestSection?.subtitle} railId="bestRail" viewAll={bestSection?.url || "/products"} />
        <ProductList id="bestRail" items={best} />
      </div></section>

      <div className="mq" aria-hidden="true"><div className="mq-track">{marquee.map((n, i) => <span key={i}>{n}</span>)}</div></div>

      <section className="section soft"><div className="container">
        <SectionHead title={categorySection?.title || "Shoponzy shoes"} subtitle={categorySection?.subtitle} railId="shoeRail" viewAll={categorySection?.url || categoryUrl("shoes")} />
        <ProductList id="shoeRail" items={shoes} />
      </div></section>

      <section className="section"><div className="container">
        <SectionHead title={dealsSection?.title || "Biggest deals"} subtitle={dealsSection?.subtitle} viewAll={dealsSection?.url || "/products?sale=1"} />
        <ProductList id="dealGrid" className="grid g4" items={deals} />
      </div></section>

      <section className="section" style={{ paddingTop: 0 }}><div className="container">
        <div className="news" data-reveal>
          <div><h2>Get offers before anyone else</h2><p>New arrivals, restocks and member-only deals.</p></div>
          <Newsletter />
        </div>
      </div></section>
    </>
  );
}
