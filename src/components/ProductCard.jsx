import { useRef } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import ProductMedia, { mediaCount } from "./ProductMedia";
import { useStore } from "../context/StoreContext";
import { money, off, productUrl, subOf } from "../utils/shop";
import { itemEffects, useGsap } from "../fx/fx";
import { useCatalog } from "../context/CatalogContext";

export function Price({ p, colorIndex, size }) {
  if (colorIndex !== undefined && p.variants?.length) {
    const color = p.colors[colorIndex]?.[1] || "Default";
    const matching = p.variants.filter((variant) => (variant.color ?? "Default") === color && (!size || variant.size === size));
    if (matching.length) {
      const price = Math.min(...matching.map((variant) => variant.price));
      const priceTo = Math.max(...matching.map((variant) => variant.price));
      const mrp = Math.max(...matching.map((variant) => variant.mrp || 0));
      return <><b>{money(price)}</b>{priceTo > price && <s style={{ textDecoration: "none" }}>– {money(priceTo)}</s>}{mrp > price && <><s>{money(mrp)}</s><em>{off({ price, mrp })}% OFF</em></>}</>;
    }
  }
  if (p.from) return <><b>{money(p.price)}</b><s style={{ textDecoration: "none" }}>– {money(p.priceTo)}</s></>;
  return <><b>{money(p.price)}</b>{p.mrp > p.price && <><s>{money(p.mrp)}</s><em>{off(p)}% OFF</em></>}</>;
}

export function WishButton({ id, className = "heart", style, label }) {
  const { wish, toggleWish } = useStore();
  return (
    <button type="button" className={className} style={style} aria-pressed={wish.includes(id)} aria-label={label}
      onClick={(e) => { e.preventDefault(); toggleWish(id); }}>
      <Icon name="i-heart" />
    </button>
  );
}

export default function ProductCard({ p }) {
  const { categories } = useCatalog();
  const { addToCart, quickView } = useStore();
  const media = useRef(null);
  const url = productUrl(p);

  function onAdd(event) {
    event.preventDefault();
    if (p.sizes.length === 1 && p.colors.length === 1) addToCart(p.id, 0, p.sizes[0], 1, media.current);
    else quickView(p.id);
  }

  return (
    <article className="card" data-item>
      <div className="media" ref={media}>
        <Link to={url} aria-label={p.name}>
          <ProductMedia product={p} className="im" />
          {mediaCount(p) > 1 && <ProductMedia product={p} k={1} className="im alt" />}
        </Link>
        <div className="tags">
          {p.isNew && <span className="tagx new">New</span>}
          {p.badge && p.badge !== "New Drop" && <span className="tagx hot">{p.badge}</span>}
          {p.badge === "New Drop" && !p.isNew && <span className="tagx new">New drop</span>}
        </div>
        <WishButton id={p.id} label={`Save ${p.name} to wishlist`} />
        <button type="button" className="addq tap" aria-label={`Add ${p.name} to bag`} onClick={onAdd}><Icon name="i-plus" />Add</button>
      </div>
      <div className="info">
        <p className="brand">{p.brand || subOf(p, categories)[1]}</p>
        <h3><Link to={url}>{p.name}</Link></h3>
        <div className="price"><Price p={p} /></div>
        {p.colors.length > 1 && (
          <div className="swatch-row" aria-label={`${p.colors.length} colours`}>
            {p.colors.map((c) => c[2]
              ? <span className="swatch-image" key={c[1]} title={c[1]}><img src={c[2]} alt="" loading="lazy" /></span>
              : <i key={c[1]} title={c[1]} style={{ background: c[0] }} />)}
          </div>
        )}
      </div>
    </article>
  );
}

/* A rail or grid of cards with the original entrance + tilt effects. */
export function ProductList({ items, id, className = "rail" }) {
  const ref = useRef(null);
  // Keyed on ids, not the array: parents rebuild the array on every render.
  useGsap(ref, itemEffects, [items.map((p) => p.id).join(",")]);
  return <div className={className} id={id} ref={ref}>{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}
