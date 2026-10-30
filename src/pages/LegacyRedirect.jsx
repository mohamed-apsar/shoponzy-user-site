import { Navigate, useLocation } from "react-router-dom";
import { byId, cat } from "../utils/shop";
import { useCatalog } from "../context/CatalogContext";

const HASH_ROUTES = { track: "/track-order", contact: "/contact", about: "/about", shipping: "/shipping-policy", returns: "/return-policy", privacy: "/privacy-policy", terms: "/terms", faq: "/faqs", cancel: "/help#cancel" };

/* Keeps links to the original static pages working (shared links, search results, bookmarks).
   Mapped in production by the server too, as 301s (see docs/MIGRATION_PLAN.md). */
export function legacyTarget(pathname, search, hash, products, categories) {
  const page = pathname.replace(/^\//, "").replace(/\.html$/, "");
  const params = new URLSearchParams(search);
  if (page === "index") return "/";
  if (page === "shop") return "/products" + search;
  if (page === "product") {
    const p = byId(params.get("id") || "", products);
    return p ? `/products/${p.slug}` : "/products";
  }
  if (["cart", "checkout", "wishlist"].includes(page)) return "/" + page;
  if (page === "help") return HASH_ROUTES[hash.slice(1)] || "/help";
  if (cat(page, categories)) return `/categories/${page}${search}`;
  return null;
}

export default function LegacyRedirect({ fallback }) {
  const { products, categories, status } = useCatalog();
  const { pathname, search, hash } = useLocation();
  if (status !== "ready") return null;
  const to = legacyTarget(pathname, search, hash, products, categories);
  return to ? <Navigate to={to} replace /> : fallback;
}
