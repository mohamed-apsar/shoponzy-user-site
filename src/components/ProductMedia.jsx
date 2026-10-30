import { artSvg } from "./Art";
import { subOf } from "../utils/shop";
import { useCatalog } from "../context/CatalogContext";

/* Photo k of a product, or its colour-matched illustration when no photo exists. */
export function mediaCount(p) {
  return p.images ? p.images.length : Math.min(3, p.colors.length + 1);
}

export function productArt(p, ci = 0, k = 0, categories) {
  const kind = subOf(p, categories)[2];
  if (k === 1) return artSvg(kind, p.colors[(ci + 1) % p.colors.length][0], p.cat);
  if (k === 2) return artSvg(kind, (p.colors[ci] || p.colors[0])[0], p.cat, "80 110 240 240");
  return artSvg(kind, (p.colors[ci] || p.colors[0])[0], p.cat);
}

function markBroken(event) {
  event.currentTarget.classList.add("broken");
}

function markLoaded(event) {
  event.currentTarget.classList.remove("broken");
}

/* Renders the container element itself so the DOM matches the original (svg/img directly inside). */
export default function ProductMedia({ product: p, ci = 0, k = 0, as: Tag = "span", className, ...rest }) {
  const { categories } = useCatalog();
  const src = p.images?.[k];
  if (src) {
    return (
      <Tag className={className} {...rest}>
        <img key={src} src={src} alt={`${p.name}${k ? ` view ${k + 1}` : ""}`} loading="lazy" decoding="async" onLoad={markLoaded} onError={markBroken} />
      </Tag>
    );
  }
  return <Tag className={className} {...rest} dangerouslySetInnerHTML={{ __html: productArt(p, ci, k, categories) }} />;
}
