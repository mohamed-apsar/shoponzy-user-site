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
export default function usePageMeta(title, description = DEFAULT_DESCRIPTION, metadata = {}) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", metadata.ogTitle || title);
    setMeta('meta[property="og:description"]', "property", "og:description", metadata.ogDescription || description);
    setMeta('meta[property="og:url"]', "property", "og:url", location.origin + location.pathname);
    if (metadata.keywords) setMeta('meta[name="keywords"]', "name", "keywords", metadata.keywords);
    else document.head.querySelector('meta[name="keywords"]')?.remove();
    const image = document.head.querySelector('meta[property="og:image"]');
    if (metadata.shareImage) setMeta('meta[property="og:image"]', "property", "og:image", metadata.shareImage);
    else image?.remove();
    setCanonical(metadata.canonical || location.origin + location.pathname + location.search);
    if (!metadata.robots) return undefined;
    const robotsSelector = 'meta[name="robots"]';
    const previousRobots = document.head.querySelector(robotsSelector);
    const previousContent = previousRobots?.getAttribute("content");
    setMeta(robotsSelector, "name", "robots", metadata.robots);
    return () => {
      const currentRobots = document.head.querySelector(robotsSelector);
      if (currentRobots?.getAttribute("content") !== metadata.robots) return;
      if (previousContent !== null && previousContent !== undefined) currentRobots.setAttribute("content", previousContent);
      else currentRobots.remove();
    };
  }, [title, description, metadata.canonical, metadata.keywords, metadata.ogTitle, metadata.ogDescription, metadata.shareImage, metadata.robots]);
}
