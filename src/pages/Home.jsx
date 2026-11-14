import { useState } from "react";
import { Link } from "react-router-dom";
import Art from "../components/Art";
import HeroSlider from "../components/HeroSlider";
import SectionHead from "../components/SectionHead";
import { ProductList } from "../components/ProductCard";
import { categoryUrl, off } from "../utils/shop";
import { storeRequest } from "../api/storeApi";
import { usePageFx } from "../fx/usePageFx";
import usePageMeta from "../hooks/usePageMeta";
import { useCatalog } from "../context/CatalogContext";

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

function StaticDoodleBanner() {
  return (
    <section className="section doodle-promo">
      <div className="container">
        <Link className="doodle-banner" to="/products" aria-label="Shop all styles">
          <div className="doodle-copy">
            <span className="doodle-kicker">A LITTLE SHOPONZY MAGIC</span>
            <h2>Good finds.<br /><em>Happy vibes.</em></h2>
            <p>Shoes, shades and little everyday favourites — find something that feels like you.</p>
            <span className="doodle-cta">Shop all styles <span aria-hidden="true">↗</span></span>
          </div>
          <div className="doodle-art" aria-hidden="true">
            <svg viewBox="0 0 600 340" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className="doodle-squiggle" d="M30 252c34-37 55 28 91-4 24-22 5-55 40-67" />
              <path className="doodle-shoe" d="M112 206c31-8 57-23 77-51l24-37c10-16 29-19 43-8l76 57c23 17 55 28 89 29 29 1 50 13 58 33l8 23c4 12-5 23-18 23H134c-25 0-39-21-16-43l-6-26Z" />
              <path className="doodle-detail" d="m190 165 57 12m-43 2 57 12m-43 2 57 12m-117 27h309m-217-111 20 17 16-19 21 18 17-17 21 18" />
              <path className="doodle-glasses" d="M390 92c4-13 15-21 29-21h52l9 40c5 23-10 43-34 43h-9c-16 0-29-11-33-27l-4-17h-20l-4 17c-4 16-17 27-33 27h-9c-24 0-39-20-34-43l9-40h52c14 0 25 8 29 21Z" />
              <path className="doodle-detail" d="M382 94h17m-102 1 11-21m169 21-11-21M518 179l12-18m-19 41 22-3M85 99l7-22m-17 57 22 4" />
              <path className="doodle-star" d="m530 66 7 17 17 7-17 7-7 17-7-17-17-7 17-7 7-17Zm-396 76 5 13 13 5-13 5-5 13-5-13-13-5 13-5 5-13Z" />
              <circle className="doodle-dot" cx="545" cy="258" r="7" /><circle className="doodle-dot" cx="120" cy="68" r="6" />
              <g className="doodle-bag" transform="rotate(-9 93 167)"><path d="M48 144h91l-8 93H57l-9-93Z"/><path d="M72 148v-16c0-12 9-21 21-21s21 9 21 21v16"/><path d="m82 186 12 12 21-25"/></g>
              <g className="doodle-perfume" transform="rotate(8 493 220)"><path d="M471 197h45v65h-45z"/><path d="M480 183h27v14h-27zM486 172h15v11h-15z"/><path d="M482 220h23"/></g>
              <path className="doodle-sparkle" d="m286 43 5 13 13 5-13 5-5 13-5-13-13-5 13-5 5-13Zm-222 92 3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9Zm376 169 4 11 11 4-11 4-4 11-4-11-11-4 11-4 4-11Z" />
            </svg>
          </div>
          <span className="doodle-stamp" aria-hidden="true"><span>✦</span> STYLE<br />YOUR<br />EVERYDAY</span>
        </Link>
      </div>
    </section>
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

      <section className="section"><div className="container">
        <SectionHead title={newSection?.title || "New arrivals"} subtitle={newSection?.subtitle} railId="newRail" viewAll={newSection?.url || "/products?sort=new"} />
        <ProductList id="newRail" items={newIn} />
      </div></section>

      <StaticDoodleBanner />

      <section className="section"><div className="container">
        <SectionHead title={bestSection?.title || "Bestsellers"} subtitle={bestSection?.subtitle} railId="bestRail" viewAll={bestSection?.url || "/products"} />
        <ProductList id="bestRail" items={best} />
      </div></section>

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
