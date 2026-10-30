import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sheet from "../Sheet";
import Icon from "../Icon";
import Art from "../Art";
import ProductMedia from "../ProductMedia";
import { useStore } from "../../context/StoreContext";
import { categoryUrl, matches, money, productUrl } from "../../utils/shop";
import { useCatalog } from "../../context/CatalogContext";

export default function SearchSheet() {
  const { categories: CATS, products: PRODUCTS } = useCatalog();
  const { openSheets, closeSheet } = useStore();
  const open = openSheets.includes("searchSheet");
  const [q, setQ] = useState("");
  const input = useRef(null);
  const navigate = useNavigate();
  const term = q.trim().toLowerCase();
  const hits = term ? PRODUCTS.filter((p) => matches(p, term, CATS)).slice(0, 8) : [];

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  function submit(event) {
    event.preventDefault();
    closeSheet("searchSheet");
    navigate(`/products?q=${encodeURIComponent(q)}`);
  }

  return (
    <Sheet id="searchSheet" variant="side" label="Search" panelStyle={{ maxHeight: "92vh" }}>
      <div className="ph" style={{ gap: 10 }}>
        <form className="sfield" role="search" style={{ flex: 1 }} onSubmit={submit}>
          <Icon name="i-search" /><input ref={input} type="search" placeholder="Search products" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <button type="button" className="tool" data-close aria-label="Close"><Icon name="i-x" /></button>
      </div>
      <div className="pb">
        {!term ? (
          <>
            <p style={{ fontWeight: 800, margin: "6px 0 10px" }}>Popular categories</p>
            <div className="cats-sheet">
              {CATS.map((c) => <Link key={c.id} to={categoryUrl(c.id)} data-close><span className="im"><Art kind={c.icon[0]} color={c.color} category={c.id} /></span>{c.name}</Link>)}
            </div>
          </>
        ) : hits.length ? (
          <>
            {hits.map((p) => (
              <Link className="sr-item" key={p.id} to={productUrl(p)} data-close>
                <ProductMedia className="mini" product={p} /><div><b>{p.name}</b><span>{money(p.price)}</span></div>
              </Link>
            ))}
            <Link className="view-all" style={{ margin: "12px 8px" }} to={`/products?q=${encodeURIComponent(term)}`} data-close>See all results <Icon name="i-arrow" /></Link>
          </>
        ) : (
          <p style={{ color: "var(--muted)", padding: "10px 4px" }}>No results for “{term}”. Try “sandal”, “watch” or “black”.</p>
        )}
      </div>
    </Sheet>
  );
}
