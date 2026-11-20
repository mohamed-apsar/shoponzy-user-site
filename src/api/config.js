const PROXY_BASE = "/api/v1";
const PRODUCTION_BASE = "https://shoponzy-backend.vercel.app/api/v1";
const PROXY_PREFERENCE = "shoponzy:use-same-origin-api";
const configured = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? PROXY_BASE : PRODUCTION_BASE)).replace(/\/$/, "");
const canUseProxy = !import.meta.env.DEV && configured === PRODUCTION_BASE;

function initialBase() {
  try {
    if (canUseProxy && localStorage.getItem(PROXY_PREFERENCE) === "1") return PROXY_BASE;
  } catch {
    // A restricted browser can still switch for this page.
  }
  return configured;
}

export let API_BASE = initialBase();

export function useSameOriginApi(failedBase) {
  if (!canUseProxy || failedBase !== PRODUCTION_BASE) return false;
  API_BASE = PROXY_BASE;
  try {
    localStorage.setItem(PROXY_PREFERENCE, "1");
  } catch {
    // Keep using the same-origin API for this page.
  }
  return true;
}
