import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE } from "../api/config";
import { popupCanShow, popupDestination, popupIsActive, popupKey } from "../utils/popups";
import "./PromotionalPopup.css";

const fallback = new Map();
function browserStore(name) {
  return {
    getItem(key) { try { return window[name].getItem(key) ?? fallback.get(key); } catch { return fallback.get(key); } },
    setItem(key, value) { fallback.set(key, value); try { window[name].setItem(key, value); } catch { /* In-memory fallback. */ } },
  };
}
const stores = { session: browserStore("sessionStorage"), persistent: browserStore("localStorage") };

/* Promotional content is optional: an unavailable popup API must not block shopping. */
export default function PromotionalPopup() {
  const [popups, setPopups] = useState([]);
  const [popup, setPopup] = useState(null);
  const [closed, setClosed] = useState(false);
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef(null);
  const shown = useRef(new Set());
  const { pathname } = useLocation();

  useEffect(() => {
    let active = true;
    let sequence = 0;
    async function refresh() {
      const request = ++sequence;
      try {
        const response = await fetch(`${API_BASE}/popups`, { cache: "no-store" });
        const result = await response.json();
        if (response.ok && result.success && active && request === sequence) setPopups(result.data || []);
      } catch { /* Try again on focus or the next refresh. */ }
    }
    refresh();
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => { setClosed(false); setVisible(false); }, [pathname]);
  useEffect(() => {
    if (closed) return;
    if (visible) {
      if (!popups.some((item) => popupKey(item) === popupKey(popup) && popupIsActive(item))) { setClosed(true); setVisible(false); }
      return;
    }
    setPopup(popups.find((item) => popupCanShow(item, stores) && (item.frequency === "always" || !shown.current.has(popupKey(item)))) || null);
  }, [popups, pathname, visible, closed, popup]);
  const id = popup ? popupKey(popup) : "";
  const trigger = popup?.trigger;
  const delay = popup?.delaySeconds ?? 5;
  const startsAt = popup?.startsAt;
  const endsAt = popup?.endsAt;

  useEffect(() => {
    if (!id || closed) return;
    let triggered = false;
    const show = () => {
      triggered = true;
      if (document.visibilityState === "hidden" || !popupIsActive({ status: "active", startsAt, endsAt })) return;
      setVisible(true);
    };
    const onVisible = () => { if (triggered && document.visibilityState === "visible") show(); };
    document.addEventListener("visibilitychange", onVisible);
    let timer;
    const scroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height > 0 && window.scrollY / height >= .5) show();
    };
    const exit = (event) => { if (!event.relatedTarget && event.clientY <= 0) show(); };
    if (trigger === "scroll") { window.addEventListener("scroll", scroll, { passive: true }); scroll(); }
    else if (trigger === "exit") document.addEventListener("mouseout", exit);
    else timer = window.setTimeout(show, trigger === "immediate" ? 0 : delay * 1000);
    return () => { clearTimeout(timer); window.removeEventListener("scroll", scroll); document.removeEventListener("mouseout", exit); document.removeEventListener("visibilitychange", onVisible); };
  }, [id, trigger, delay, startsAt, endsAt, closed, pathname]);

  useEffect(() => {
    if (!visible || !popup || closed) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    shown.current.add(popupKey(popup));
    const store = popup.frequency === "session" ? stores.session : stores.persistent;
    if (popup.frequency !== "always") store.setItem(popupKey(popup), String(Date.now()));
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, [visible, popup, closed]);

  if (!popup || closed || !visible) return null;
  const destination = popupDestination(popup.url);
  const close = () => { setClosed(true); setVisible(false); };
  return <dialog className={`store-promo${popup.image?.url ? " store-promo-with-image" : ""}`} ref={dialogRef} aria-labelledby="store-promo-title" aria-describedby={popup.description ? "store-promo-description" : undefined} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.target === event.currentTarget && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) close();
  }}>
    <button className="store-promo-close" type="button" onClick={close} aria-label="Close promotion" autoFocus>×</button>
    {popup.image?.url && <img className="store-promo-image" src={popup.image.url} alt={popup.image.alt || ""} />}
    <div className="store-promo-content"><span className="store-promo-eyebrow">FROM SHOPONZY</span><h2 id="store-promo-title">{popup.title}</h2>{popup.description && <p id="store-promo-description">{popup.description}</p>}{destination && popup.buttonText && <a className="store-promo-button" href={destination} onClick={close}>{popup.buttonText}<span aria-hidden="true"> →</span></a>}<button className="store-promo-dismiss" type="button" onClick={close}>Continue shopping</button></div>
  </dialog>;
}
