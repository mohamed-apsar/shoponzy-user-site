/* Storefront API client. Cookies carry the guest bag and (later) the customer session;
   state-changing requests send the double-submit CSRF token the backend requires. */
import { API_BASE, useSameOriginApi } from "./config";
const csrfTokens = new Map();

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

function csrfTokenFor(base) {
  if (!csrfTokens.has(base)) {
    const request = fetch(`${base}/csrf`, { credentials: "include", cache: "no-store" })
      .then(decode)
      .then(({ data }) => data.csrfToken)
      .catch((error) => {
        if (csrfTokens.get(base) === request) csrfTokens.delete(base);
        throw error;
      });
    csrfTokens.set(base, request);
  }
  return csrfTokens.get(base);
}

async function csrfRejected(response) {
  if (response.status !== 403) return false;
  const body = await response.clone().json().catch(() => null);
  return body?.error?.code === "CSRF_INVALID";
}

async function withCsrf(send, retry = true) {
  const base = API_BASE;
  const firstToken = csrfTokenFor(base);
  const first = await send(base, await firstToken);
  if (!retry || !(await csrfRejected(first))) return first;

  if (csrfTokens.get(base) === firstToken) csrfTokens.delete(base);
  const retryBase = API_BASE;
  const fresh = await send(retryBase, await csrfTokenFor(retryBase));
  // A browser that blocks third-party cookies can get a fresh token but still
  // cannot send the matching cookie. Switch only after an explicit rejection.
  if (!(await csrfRejected(fresh)) || !useSameOriginApi(retryBase)) return fresh;
  return send(API_BASE, await csrfTokenFor(API_BASE));
}

/* The access cookie is short-lived; one refresh is shared by concurrent requests that hit a 401. */
let refreshing = null;
function refreshSession() {
  refreshing ||= storeRequest("/auth/refresh", { method: "POST", retryAuth: false }).then(() => true, () => false).finally(() => { refreshing = null; });
  return refreshing;
}

/* Multipart upload (return-request photos). Same CSRF/session handling as storeRequest. */
export async function storeUpload(path, file, { retryCsrf = true } = {}) {
  const body = new FormData();
  body.append("file", file);
  return decode(await withCsrf((base, token) => fetch(`${base}${path}`, {
    method: "POST", headers: { "X-CSRF-Token": token }, credentials: "include", body,
  }), retryCsrf));
}

export async function storeRequest(path, { method = "GET", body, retryCsrf = true, retryAuth = true } = {}) {
  const headers = {};
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const send = (base, token) => fetch(`${base}${path}`, {
    method, headers: token ? { ...headers, "X-CSRF-Token": token } : headers,
    credentials: "include", cache: "no-store", body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await (mutating ? withCsrf(send, retryCsrf) : send(API_BASE));
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
