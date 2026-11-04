import { CATS, PRODUCTS, STORE } from "../data/catalog";

export const money = (n) => STORE.currency + Number(n).toLocaleString("en-IN");
export const off = (p) => (p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0);
export const wa = (text, store = STORE) => `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}`;
export const reduceMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export const byId = (id, products = PRODUCTS) => products.find((p) => p.id === id);
export const bySlug = (slug, products = PRODUCTS) => products.find((p) => p.slug === slug);
export const cat = (id, categories = CATS) => categories.find((c) => c.id === id);
export const subOf = (p, categories = CATS) => {
  const category = cat(p.cat, categories);
  const subs = category?.descendants?.length ? category.descendants : category?.subs || [];
  const leafId = p.categoryIds?.[p.categoryIds.length - 1];
  return (leafId && subs.find((s) => s[5] === leafId)) || subs.find((s) => s[0] === p.sub) || subs[0] || ["", "Products", "bag", "#999999"];
};
export const productUrl = (p) => `/products/${p.slug}`;
export const categoryUrl = (id, sub) => `/categories/${id}${sub ? `?sub=${sub}` : ""}`;

export const matches = (p, q, categories = CATS) =>
  `${p.name} ${cat(p.cat, categories)?.name || ""} ${subOf(p, categories)[1]} ${p.brand || ""} ${p.colors.map((c) => c[1]).join(" ")}`.toLowerCase().includes(q);

export function sizeIsAvailable(p, colorIndex, size) {
  if (!p.variants?.length) return true;
  const color = p.colors[colorIndex]?.[1] || "Default";
  return p.variants.some((variant) => (variant.color ?? "Default") === color &&
    (variant.size === size || (!variant.size && size === "One size")) && variant.inStock !== false);
}

/* Price of a bag line: the chosen variant's price when it has its own, else the product's "from" price. */
export function linePrice(p, l) {
  const color = p.colors[l.c]?.[1];
  const v = p.variants?.find((x) => (x.color ?? "Default") === color && (x.size ?? "One size") === l.s);
  return v?.price ?? p.price;
}

/* Display totals only — the backend recalculates every amount at checkout.
   `coupon` is the applied coupon's rules ({ code, type, value, minSubtotal, maxDiscount }), as the API returns them. */
export function totals(cart, coupon, pay = "cod", products = PRODUCTS, store = STORE) {
  const lines = cart.map((l) => ({ l, p: byId(l.id, products) })).filter((x) => x.p);
  const sub = lines.reduce((s, { l, p }) => s + linePrice(p, l) * l.qty, 0);
  const mrp = lines.reduce((s, { l, p }) => s + Math.max(p.mrp, linePrice(p, l)) * l.qty, 0);
  let disc = 0, cmsg = "";
  const c = coupon && typeof coupon === "object" ? coupon : null;
  if (c) {
    if (sub >= c.minSubtotal) {
      disc = c.type === "percent" ? Math.round((sub * c.value) / 100) : c.value;
      if (c.maxDiscount) disc = Math.min(disc, c.maxDiscount);
      disc = Math.min(disc, sub);
    } else cmsg = `Add ${money(c.minSubtotal - sub)} more to use ${c.code}`;
  }
  const prepaid = pay === "upi" ? Math.round(((sub - disc) * store.prepaidOffPct) / 100) : 0;
  const ship = sub === 0 || sub - disc >= store.freeShippingAbove ? 0 : store.shippingFee;
  return { sub, mrp, disc, prepaid, ship, total: sub - disc - prepaid + ship, cmsg };
}
