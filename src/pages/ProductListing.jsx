import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Icon from "../components/Icon";
import Art from "../components/Art";
import Sheet from "../components/Sheet";
import ProductMedia from "../components/ProductMedia";
import { ProductList } from "../components/ProductCard";
import NotFound from "./NotFound";
import { useStore } from "../context/StoreContext";
import { cat, matches, money, off } from "../utils/shop";
import { productMatchesCategory } from "../utils/categoryProducts";
import { usePageFx } from "../fx/usePageFx";
import usePageMeta from "../hooks/usePageMeta";
import { useCatalog } from "../context/CatalogContext";

const SORTS = [["featured", "Featured"], ["new", "Newest first"], ["low", "Price: low to high"], ["high", "Price: high to low"], ["off", "Biggest discount"]];
const SORTERS = { low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, new: (a, b) => b.isNew - a.isNew, off: (a, b) => off(b) - off(a) };
const EMPTY = { subs: [], sizes: [], colors: [], max: "", sale: false, q: "", cats: [] };

function Filters({ st, base, subsAll, sizes, colors, sliderMax, pageCat, toggle, set, categories, products }) {
  return (
    <>
      {!pageCat && <div className="fg"><h3>Category</h3>{categories.map((c) => (
        <label className="fopt" key={c.id}><input type="checkbox" checked={st.cats.includes(c.id)} onChange={() => toggle("cats", c.id)} />{c.name}<small>{products.filter((p) => p.cat === c.id).length}</small></label>
      ))}</div>}
      {subsAll.length > 0 && <div className="fg"><h3>Type</h3>{subsAll.map((sub) => {
        const [slug, name, , , , categoryId, pathName, depth] = sub;
        const key = categoryId || slug;
        return <label className="fopt" key={key} title={pathName || name}>
          <input type="checkbox" checked={st.subs.includes(key)} onChange={() => toggle("subs", key)} />
          <span>{name}{depth > 2 && pathName && <small className="fopt-path">{pathName}</small>}</span>
          <small>{base.filter((p) => productMatchesCategory(p, sub)).length}</small>
        </label>;
      })}</div>}
      <div className="fg"><h3>Size</h3><div className="chips">{sizes.map((s) => (
        <label key={s}><input type="checkbox" checked={st.sizes.includes(s)} onChange={() => toggle("sizes", s)} /><span>{s}</span></label>
      ))}</div></div>
      <div className="fg"><h3>Colour</h3><div className="chips">{colors.map(([hex, name]) => (
        <label key={name}><input type="checkbox" checked={st.colors.includes(name)} onChange={() => toggle("colors", name)} /><span className="sw"><i style={{ background: hex }} />{name}</span></label>
      ))}</div></div>
      <div className="fg"><h3>Max price <span style={{ fontWeight: 600, color: "var(--muted)" }}>{st.max ? "Up to " + money(st.max) : "Any"}</span></h3>
        <input type="range" min="200" max={sliderMax} step="100" value={st.max || sliderMax} style={{ width: "100%", accentColor: "var(--ink)" }} aria-label="Maximum price"
          onChange={(e) => set({ max: +e.target.value >= sliderMax ? "" : +e.target.value })} /></div>
      <div className="fg"><label className="fopt"><input type="checkbox" checked={st.sale} onChange={(e) => set({ sale: e.target.checked })} />On sale only</label></div>
    </>
  );
}

function Hero({ c, q }) {
  if (!c) {
    return (
      <section className="cat-hero"><div className="bg" style={{ background: "linear-gradient(120deg,#111318,#3A3D48)" }} />
        <span className="float" data-depth="1.2" style={{ right: "5%", top: "16%", width: 170 }}><span style={{ display: "block" }}><Art kind="sneaker" color="#FF4D2E" category="shoes" /></span></span>
        <span className="float" data-depth=".8" style={{ right: "24%", bottom: -20, width: 120 }}><span style={{ display: "block" }}><Art kind="analog" color="#5E35B1" category="watches" /></span></span>
        <div className="container in"><nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>Shop</span></nav>
          <h1>{q ? `“${q}”` : "Shop all"}</h1><p>Everything in one place. Filter by category, size, colour and price.</p></div>
      </section>
    );
  }
  const floats = [
    { depth: "1.2", style: { right: "4%", top: "14%", width: 190 } },
    { depth: "0.7", style: { right: "24%", bottom: -30, width: 120 } },
    { depth: "1.6", style: { right: -30, bottom: "10%", width: 140 } },
  ];
  return (
    <section className="cat-hero"><div className="bg" style={c.bannerImage
      ? { backgroundImage: `linear-gradient(90deg,rgba(0,0,0,.62),rgba(0,0,0,.12)),url("${c.bannerImage}")`, backgroundSize: "cover", backgroundPosition: "center" }
      : { background: `linear-gradient(135deg,${c.gradient[0]},${c.gradient[1]})` }} />
      {!c.bannerImage && floats.map((f, i) => (
        <span className="float" key={i} data-depth={f.depth} style={f.style}><span style={{ display: "block" }}><Art kind={c.heroArt[i][0]} color={c.heroArt[i][1]} category={c.id} /></span></span>
      ))}
      <div className="container in"><nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link><span>/</span><span>{c.name}</span></nav>
        <h1>{q ? `“${q}”` : c.name}</h1><p>{c.tag}. Free delivery above ₹999, COD and 7-day returns.</p></div>
    </section>
  );
}

function Listing({ pageCat }) {
  const { categories: CATS, products: PRODUCTS, status } = useCatalog();
  const [params] = useSearchParams();
  const { openSheet, closeSheet } = useStore();
  const c = pageCat ? cat(pageCat, CATS) : null;
  const [st, setSt] = useState(() => ({
    ...EMPTY, subs: params.get("sub") ? [
      (() => {
        const selected = c?.descendants?.find(([slug, , , , , id]) => id === params.get("sub") || slug === params.get("sub"));
        return selected?.[8]?.[1] || selected?.[5] || params.get("sub");
      })(),
    ] : [], sale: params.get("sale") === "1", q: params.get("q") || "",
    sort: params.get("sort") || "featured",
  }));
  usePageMeta(c ? `${c.name} Online | Shoponzy` : st.q ? `Search: ${st.q} | Shoponzy` : "Shop All | Shoponzy",
    c ? `Shop ${c.name.toLowerCase()} online at Shoponzy. ${c.tag}. Free delivery above ₹999, COD and 7-day returns.` : undefined);
  usePageFx([pageCat]);

  const base = useMemo(() => (pageCat ? PRODUCTS.filter((p) => p.cat === pageCat) : PRODUCTS), [pageCat, PRODUCTS]);
  const subsAll = useMemo(() => c?.subs || [], [c]);
  const sizes = useMemo(() => [...new Set(base.flatMap((p) => p.sizes))], [base]);
  const colors = useMemo(() => [...new Map(base.flatMap((p) => p.colors).map((x) => [x[1], x])).values()].slice(0, 14), [base]);
  const sliderMax = base.length ? Math.ceil(Math.max(...base.map((p) => p.price)) / 100) * 100 : 1000;

  const set = (patch) => setSt((s) => ({ ...s, ...patch }));
  const toggle = (key, v) => setSt((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }));
  const clear = () => setSt((s) => ({ ...s, ...EMPTY }));
  const unset = (key, v) => setSt((s) => ({ ...s, [key]: Array.isArray(s[key]) ? s[key].filter((x) => x !== v) : key === "sale" ? false : "" }));

  const list = useMemo(() => {
    const q = st.q.toLowerCase();
    let out = base.filter((p) => (!st.subs.length || st.subs.some((selected) => {
      const sub = subsAll.find((item) => (item[5] || item[0]) === selected);
      return sub ? productMatchesCategory(p, sub) : p.sub === selected;
    })) && (!st.cats.length || st.cats.includes(p.cat))
      && (!st.sizes.length || p.sizes.some((s) => st.sizes.includes(s))) && (!st.colors.length || p.colors.some((x) => st.colors.includes(x[1])))
      && (!st.max || p.price <= st.max) && (!st.sale || off(p) > 0) && (!q || matches(p, q, CATS)));
    if (SORTERS[st.sort]) out = [...out].sort(SORTERS[st.sort]);
    return out;
  }, [base, st, CATS, subsAll]);

  const chips = [
    ...st.cats.map((v) => ["cats", v, cat(v, CATS)?.name || v]),
    ...st.subs.map((v) => ["subs", v, subsAll.find((x) => (x[5] || x[0]) === v)?.[1] || v]),
    ...st.sizes.map((v) => ["sizes", v, "Size " + v]), ...st.colors.map((v) => ["colors", v, v]),
    ...(st.max ? [["max", "", "Up to " + money(st.max)]] : []), ...(st.sale ? [["sale", "", "On sale"]] : []), ...(st.q ? [["q", "", `“${st.q}”`]] : []),
  ];
  const filterProps = { st, base, subsAll, sizes, colors, sliderMax, pageCat, toggle, set, categories: CATS, products: PRODUCTS };
  if (status !== "ready") return null;

  return (
    <>
      <Hero c={c} q={st.q} />
      {c && subsAll.length > 0 && (
        <nav className="subs" id="subs" aria-label={`${c.name} types`}>
          <button type="button" className="sub" aria-pressed={!st.subs.length} onClick={() => set({ subs: [] })}>
            <span className="im">{c.image
              ? <img src={c.image} alt="" loading="lazy" decoding="async" />
              : <Art kind={subsAll[0][2]} color={c.color} category={c.id} />}</span>All</button>
          {subsAll.map((sub) => {
            const [slug, name, kind, , image, categoryId, pathName, depth] = sub;
            const key = categoryId || slug;
            const example = base.find((p) => productMatchesCategory(p, sub));
            return (
              <button type="button" className={`sub${depth > 2 ? " sub-nested" : ""}`} key={key} aria-pressed={st.subs.includes(key)} onClick={() => set({ subs: [key] })}>
                {image
                  ? <span className="im"><img src={image} alt="" loading="lazy" decoding="async" /></span>
                  : example ? <ProductMedia className="im" product={example} /> : <span className="im"><Art kind={kind} color="#999999" category={c.id} /></span>}
                <span>{name}</span>{depth > 2 && pathName && <small>{pathName}</small>}
              </button>
            );
          })}
        </nav>
      )}
      <section className="section" style={{ paddingTop: 18 }}><div className="container plp">
        <aside className="filters" id="filters" aria-label="Filters">
          <Filters {...filterProps} />
          <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={clear}>Clear all</button>
        </aside>
        <div>
          <div className="toolbar"><p id="count" aria-live="polite">{list.length} item{list.length === 1 ? "" : "s"}</p>
            <label className="sr-only" htmlFor="sortSel">Sort by</label>
            <select className="select" id="sortSel" value={st.sort} onChange={(e) => set({ sort: e.target.value })}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>
          <div className="active-f" id="activeF">
            {chips.map(([k, v, l]) => <button type="button" key={`${k}|${v}`} onClick={() => unset(k, v)}>{l}<Icon name="i-x" /></button>)}
          </div>
          {list.length ? <ProductList id="plpGrid" className="grid" items={list} /> : (
            <div className="grid" id="plpGrid"><div className="empty">
              <div className="art"><Art kind={c ? c.icon[0] : "bag"} color="#D5D5D5" category={pageCat || "essentials"} /></div>
              <b>Nothing matches these filters</b><p>Try removing a filter, or ask us on WhatsApp. We may have it in store.</p>
              <button type="button" className="btn btn-dark" onClick={clear}>Clear filters</button>
            </div></div>
          )}
        </div>
      </div></section>

      <div className="plp-bar">
        <button type="button" onClick={() => openSheet("sortSheet")}><Icon name="i-sort" />Sort</button>
        <button type="button" onClick={() => openSheet("filterSheet")}><Icon name="i-filter" />Filter <i className={`dot${chips.length ? " on" : ""}`} /></button>
      </div>
      <Sheet id="sortSheet" label="Sort">
        <div className="ph"><h2>Sort by</h2><button type="button" className="tool" data-close aria-label="Close"><Icon name="i-x" /></button></div>
        <div className="pb sort-list">
          {SORTS.map(([v, l]) => <button type="button" key={v} aria-pressed={st.sort === v} onClick={() => { set({ sort: v }); closeSheet("sortSheet"); }}>{l}</button>)}
        </div>
      </Sheet>
      <Sheet id="filterSheet" label="Filters">
        <div className="ph"><h2>Filters</h2><button type="button" className="tool" data-close aria-label="Close"><Icon name="i-x" /></button></div>
        <div className="pb"><Filters {...filterProps} /></div>
        <div className="pf" style={{ gridTemplateColumns: "1fr 1.5fr" }}>
          <button type="button" className="btn btn-ghost" onClick={clear}>Clear</button>
          <button type="button" className="btn btn-dark" data-close>Show {list.length} items</button>
        </div>
      </Sheet>
    </>
  );
}

/* Remounts on every URL change so ?sub=, ?q=, ?sale= and ?sort= re-initialise the filters (as a full page load did). */
export function CategoryPage() {
  const { categories, status } = useCatalog();
  const { slug } = useParams();
  const [params] = useSearchParams();
  if (status !== "ready") return null;
  if (!cat(slug, categories)) return <NotFound />;
  return <Listing key={slug + params.toString()} pageCat={slug} />;
}

export function ShopPage() {
  const [params] = useSearchParams();
  return <Listing key={params.toString()} pageCat="" />;
}
