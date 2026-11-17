const DAY = 24 * 60 * 60 * 1000;
// A redesigned popup must not inherit an impression recorded by the old renderer.
export const popupKey = (popup) => `snz:popup:v2:${popup.id}:${popup.updatedAt || "original"}`;

export function rememberPopupDismissal(popup, stores, now = Date.now()) {
  if (popup.frequency === "always") return;
  const store = popup.frequency === "session" ? stores.session : stores.persistent;
  try { store?.setItem(popupKey(popup), String(now)); } catch { /* Storage can be unavailable. */ }
}

export function popupIsActive(popup, now = Date.now()) {
  return popup.status === "active" && (!popup.startsAt || Date.parse(popup.startsAt) <= now) && (!popup.endsAt || Date.parse(popup.endsAt) >= now);
}

export function popupCanShow(popup, stores, now = Date.now()) {
  if (!popupIsActive(popup, now)) return false;
  if (popup.frequency === "always") return true;
  const store = popup.frequency === "session" ? stores.session : stores.persistent;
  let seen;
  try { seen = store?.getItem(popupKey(popup)); } catch { /* Storage may be blocked. */ }
  if (seen == null) return true;
  if (popup.frequency === "session") return false;
  return !Number.isFinite(Number(seen)) || now - Number(seen) >= (popup.frequency === "week" ? 7 : 1) * DAY;
}

export function popupDestination(raw) {
  const value = String(raw || "").trim();
  if (/^\/(?!\/)/.test(value) || /^https?:\/\//i.test(value)) return value;
  return "";
}
