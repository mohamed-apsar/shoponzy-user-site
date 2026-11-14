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
            <h2>Find your kind<br />of <em>happy.</em></h2>
            <p>Good finds, great feels. Your next favourite is just around the corner.</p>
            <span className="doodle-cta">Shop all styles <span aria-hidden="true">↗</span></span>
          </div>
          <div className="doodle-art" aria-hidden="true">
            <svg viewBox="0 0 540 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className="doodle-squiggle" d="M27 232c25-24 42 17 68-4 20-16 8-39 28-46" />
              <path className="doodle-shoe" d="M124 197c25-7 45-19 60-42l18-28c8-12 22-15 33-7l58 44c18 14 42 22 68 23 23 1 39 10 45 25l7 18c3 9-4 18-14 18H142c-19 0-30-16-18-33l0-18Z" />
              <path className="doodle-detail" d="m185 161 45 9m-34 2 45 9m-34 2 45 9m-94 29h237m-167-85 16 14 12-15 16 15 13-14 17 15" />
              <path className="doodle-glasses" d="M345 93c3-10 12-17 23-17h42l7 33c4 19-8 35-27 35h-7c-13 0-23-9-26-22l-3-14h-16l-3 14c-3 13-13 22-26 22h-7c-19 0-31-16-27-35l7-33h42c11 0 20 7 23 17Z" />
              <path className="doodle-detail" d="M338 94h14m-81-1 8-17m134 17-8-17M440 170l9-14m-15 33 17-2M91 92l5-17m-12 44 18 3" />
              <path className="doodle-star" d="m465 67 5 13 13 5-13 5-5 13-5-13-13-5 13-5 5-13Zm-386 83 4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z" />
              <circle className="doodle-dot" cx="477" cy="222" r="5" />
              <circle className="doodle-dot" cx="105" cy="66" r="4" />
            </svg>
          </div>
          <span className="doodle-stamp" aria-hidden="true">GOOD<br />THINGS<br />INSIDE</span>
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
