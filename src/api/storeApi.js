/* Storefront API client. Cookies carry the guest bag and (later) the customer session;
   state-changing requests send the double-submit CSRF token the backend requires. */
import { API_BASE } from "./config";
let csrfToken = "";

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function decode(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true) {
    throw new ApiError(body?.error?.message || `Request failed (${response.status}).`, response.status, body?.error?.code, body?.error?.details);
  }
  return body;
}

async function refreshCsrfToken() {
  const body = await decode(await fetch(`${API_BASE}/csrf`, { credentials: "include" }));
  csrfToken = body.data.csrfToken;
  return csrfToken;
}

/* The access cookie is short-lived; one refresh is shared by concurrent requests that hit a 401. */
let refreshing = null;
function refreshSession() {
  refreshing ||= storeRequest("/auth/refresh", { method: "POST", retryAuth: false }).then(() => true, () => false).finally(() => { refreshing = null; });
  return refreshing;
}

export async function storeRequest(path, { method = "GET", body, retryCsrf = true, retryAuth = true } = {}) {
  const headers = {};
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (mutating) {
    if (!csrfToken) await refreshCsrfToken();
    headers["X-CSRF-Token"] = csrfToken;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${API_BASE}${path}`, {
    method, headers, credentials: "include", body: body === undefined ? undefined : JSON.stringify(body),
  });
  // The CSRF cookie can expire while the page stays open: fetch a fresh token once and retry.
  if (response.status === 403 && mutating && retryCsrf) {
    const peek = await response.clone().json().catch(() => null);
    if (peek?.error?.code === "CSRF_INVALID") {
      csrfToken = "";
      return storeRequest(path, { method, body, retryCsrf: false, retryAuth });
    }
  }
  if (response.status === 401 && retryAuth && !path.startsWith("/auth/") && (await refreshSession())) {
    return storeRequest(path, { method, body, retryCsrf, retryAuth: false });
  }
  return decode(response);
}

export async function fetchProductContentBlocks(slug) {
  const { data } = await storeRequest(`/products/${encodeURIComponent(slug)}`);
  return (data.contentBlocks || []).map((block) => ({
    type: block.type,
    image: block.image ? { url: block.image.url, alt: block.image.alt || data.name } : null,
    images: (block.images || []).map((image) => ({ url: image.url, alt: image.alt || data.name })),
  }));
}
