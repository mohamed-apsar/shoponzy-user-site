import { useEffect } from "react";

const DEFAULT_DESCRIPTION = "Shop shoes, sunglasses, perfumes, clothing, watches and essentials online at Shoponzy. Free delivery above ₹999, COD and 7-day returns.";

function setMeta(selector, attr, key, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

/* Sets title, description, Open Graph tags and the canonical URL for the current page. */
export default function usePageMeta(title, description = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", location.origin + location.pathname);
    setCanonical(location.origin + location.pathname + location.search);
  }, [title, description]);
}
