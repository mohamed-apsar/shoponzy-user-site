/* ==========================================================
   Store state: bag, wishlist, coupon, recently viewed, sheets, toasts.
   Guest bags are kept locally and moved into the customer's server-side bag at sign-in.
   ========================================================== */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { storage } from "../utils/storage";
import { byId, reduceMotion } from "../utils/shop";
import { productArt } from "../components/ProductMedia";
import { useCatalog } from "./CatalogContext";
import { useCustomer } from "./CustomerContext";
import { storeRequest } from "../api/storeApi";

const StoreContext = createContext(null);
const MAX_QTY = 10;
const lineKey = (l) => [l.id, l.c, l.s].join("|");

function usePersisted(key, fallback) {
  const [value, setValue] = useState(() => storage.get(key, fallback));
  useEffect(() => storage.set(key, value), [key, value]);
  return [value, setValue];
}

/* Flies a thumbnail from the clicked element to the visible bag icon. */
function fly(from, product, ci, categories) {
  const targets = [...document.querySelectorAll("[data-open-cart]")];
  const target = targets.find((e) => e.offsetParent !== null);
  const bump = () => targets.forEach((t) => { t.classList.remove("bump"); void t.offsetWidth; t.classList.add("bump"); });
  if (!from || !target || reduceMotion()) return bump();
  const a = from.getBoundingClientRect(), b = target.getBoundingClientRect(), f = document.createElement("div");
  f.className = "flyer";
  const src = product.colorImages?.[ci]?.[0] || product.images?.[0];
  if (src) { const im = document.createElement("img"); im.src = src; im.alt = ""; f.appendChild(im); }
  else f.innerHTML = productArt(product, ci, 0, categories);
  f.style.left = a.left + a.width / 2 - 35 + "px";
  f.style.top = a.top + a.height / 2 - 35 + "px";
  document.body.appendChild(f);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  f.animate([
    { transform: "translate(0,0) scale(1)", opacity: 1 },
    { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 90}px) scale(.8) rotate(-10deg)`, offset: 0.5 },
    { transform: `translate(${dx}px,${dy}px) scale(.15)`, opacity: 0.4 },
  ], { duration: 750, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = () => { f.remove(); bump(); };
}

export function StoreProvider({ children }) {
  const { products, categories, status } = useCatalog();
  const { signedIn, user, status: customerStatus } = useCustomer();
  // Keep only guest items in local storage. A signed-in cart is hydrated from the API.
  const [guestCart, setGuestCart] = usePersisted("cart", []);
  const [accountCart, setAccountCart] = useState([]);
  const [cartReady, setCartReady] = useState(false);
  const cart = signedIn ? accountCart : guestCart;
  const [wish, setWish] = usePersisted("wish", []);
  const [storedCoupon, setCoupon] = usePersisted("coupon", null);
  // Older versions stored just the code; those must be re-applied so their rules come from the server.
  const coupon = storedCoupon && typeof storedCoupon === "object" ? storedCoupon : null;
  const [recent, setRecent] = usePersisted("recent", []);
  const [address, setAddress] = usePersisted("addr", null);
  const [openSheets, setOpenSheets] = useState([]);
  const [quickViewId, setQuickViewId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const lastFocus = useRef(null);
  const toastId = useRef(0);
  const accountSync = useRef(Promise.resolve());
  const activeAccount = useRef(null);

  const toast = useCallback((content) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, content, fading: false }]);
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, fading: true } : x))), 2600);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  const variantFor = useCallback((product, line) => {
    const color = product?.colors?.[line.c]?.[1];
    return product?.variants?.find((v) => (v.color ?? "Default") === color && (v.size ?? "One size") === line.s);
  }, []);

  const mapServerCart = useCallback((lines) => (lines || []).flatMap((line) => {
    const product = products.find((p) => String(p.apiId) === String(line.productId));
    if (!product) return [];
    const colorIndex = Math.max(0, product.colors.findIndex((color) => color[1] === line.color));
    return [{ id: product.id, c: colorIndex, s: line.size || "One size", qty: line.qty }];
  }), [products]);

  // Reconcile the visible account bag with its persistent server copy. Queue requests so
  // rapid quantity clicks cannot race and overwrite a newer bag state.
  const syncAccountCart = useCallback((desired) => {
    accountSync.current = accountSync.current.catch(() => {}).then(async () => {
      const current = await storeRequest("/cart");
      const remaining = [...(current.data.lines || [])];
      const wanted = [];
      for (const line of desired) {
        const product = byId(line.id, products);
        const variant = variantFor(product, line);
        if (product?.apiId && variant?.id) wanted.push({ line, product, variant });
      }
      for (const item of wanted) {
        const found = remaining.find((entry) => String(entry.productId) === String(item.product.apiId) && String(entry.variantId) === String(item.variant.id));
        if (!found) {
          await storeRequest("/cart/items", { method: "POST", body: { productId: item.product.apiId, variantId: item.variant.id, qty: item.line.qty } });
        } else {
          remaining.splice(remaining.indexOf(found), 1);
          if (found.qty !== item.line.qty) await storeRequest(`/cart/items/${found.itemId}`, { method: "PATCH", body: { qty: item.line.qty } });
        }
      }
      for (const extra of remaining) await storeRequest(`/cart/items/${extra.itemId}`, { method: "DELETE" });
    });
    return accountSync.current;
  }, [products, variantFor]);

  // A guest bag is copied into the signed-in account once, then the browser copy is cleared.
  // Matching lines use the larger quantity to avoid duplicating legacy browser copies that
  // may already have been synced by an older checkout flow.
  const accountKey = user?._id || user?.id || user?.email || "account";
  useEffect(() => {
    if (customerStatus === "loading" || status !== "ready") return;
    if (!signedIn) {
      activeAccount.current = null;
      setAccountCart([]);
      setCartReady(true);
      return;
    }
    if (activeAccount.current === accountKey) return;
    activeAccount.current = accountKey;
    setCartReady(false);
    (async () => {
      const response = await storeRequest("/cart");
      const remote = response.data.lines || [];
      const guest = guestCart.filter((line) => byId(line.id, products));
      const pending = [...remote];
      for (const line of guest) {
        const product = byId(line.id, products);
        const variant = variantFor(product, line);
        if (!product?.apiId || !variant?.id) continue;
        const existing = pending.find((entry) => String(entry.productId) === String(product.apiId) && String(entry.variantId) === String(variant.id));
        if (existing) {
          if (line.qty > existing.qty) await storeRequest(`/cart/items/${existing.itemId}`, { method: "PATCH", body: { qty: line.qty } });
        } else {
          await storeRequest("/cart/items", { method: "POST", body: { productId: product.apiId, variantId: variant.id, qty: line.qty } });
        }
      }
      const latest = await storeRequest("/cart");
      setAccountCart(mapServerCart(latest.data.lines));
      setGuestCart([]);
      setCartReady(true);
    })().catch(() => {
      // Keep the shopper's local bag visible if the API is temporarily unavailable.
      setAccountCart(guestCart);
      setGuestCart([]);
      setCartReady(true);
      toast("Your bag could not sync. Please try again shortly.");
    });
  // guestCart is deliberately captured for this sign-in transition; later edits go through syncAccountCart.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, customerStatus, status, accountKey, products, mapServerCart, guestCart, setGuestCart, toast]);

  const updateCart = useCallback((updater) => {
    if (signedIn) {
      setAccountCart((current) => {
        const next = typeof updater === "function" ? updater(current) : updater;
        if (cartReady) syncAccountCart(next).catch(() => toast("Couldn’t save your bag. Please try again."));
        return next;
      });
    } else setGuestCart(updater);
  }, [signedIn, cartReady, syncAccountCart, toast, setGuestCart]);

  // Drop lines whose product no longer exists (e.g. removed from the catalogue).
  const validCart = useMemo(() => status === "ready" ? cart.filter((l) => byId(l.id, products)) : [], [cart, products, status]);

  const openSheet = useCallback((id) => {
    lastFocus.current = document.activeElement;
    setOpenSheets((s) => (s.includes(id) ? s : [...s, id]));
  }, []);
  const closeSheet = useCallback((id) => {
    setOpenSheets((s) => {
      const next = id ? s.filter((x) => x !== id) : s.slice(0, -1);
      return next;
    });
    lastFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    document.body.style.overflow = openSheets.length ? "hidden" : "";
  }, [openSheets]);

  const addToCart = useCallback((id, c, s, qty = 1, from) => {
    updateCart((current) => {
      const line = { id, c, s, qty }, k = lineKey(line);
      const existing = current.find((x) => lineKey(x) === k);
      return existing
        ? current.map((x) => (lineKey(x) === k ? { ...x, qty: Math.min(MAX_QTY, x.qty + qty) } : x))
        : [...current, line];
    });
    fly(from, byId(id, products) || byId(id), c, categories);
    toast(<>Added to bag. <a href="#" data-open-cart>View</a></>);
  }, [categories, products, updateCart, toast]);

  const setQty = useCallback((index, delta) => {
    updateCart((current) => current.map((l, i) => (i === index ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, l.qty + delta)) } : l)));
  }, [updateCart]);
  const removeLine = useCallback((index) => updateCart((current) => current.filter((_, i) => i !== index)), [updateCart]);
  const clearCart = useCallback(() => { updateCart([]); setCoupon(null); }, [updateCart, setCoupon]);

  // Signed-in shoppers keep their wishlist on their account: the browser list is merged in at
  // sign-in, then every change is saved to the server. Signing out clears the browser copy.
  const localId = (p) => p.legacyId || p.id;
  const wishlistWasSignedIn = useRef(false);
  useEffect(() => {
    if (customerStatus === "loading" || status !== "ready") return;
    if (!signedIn) {
      if (wishlistWasSignedIn.current) setWish([]);
      wishlistWasSignedIn.current = false;
      return;
    }
    if (wishlistWasSignedIn.current) return;
    wishlistWasSignedIn.current = true;
    const productIds = wish.map((id) => byId(id, products)?.apiId).filter(Boolean);
    storeRequest("/account/wishlist/merge", { method: "POST", body: { productIds } })
      .then((result) => setWish(result.data.map(localId)))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, customerStatus, status]);

  const toggleWish = useCallback((id) => {
    const on = wish.includes(id);
    setWish(on ? wish.filter((x) => x !== id) : [...wish, id]);
    toast(on ? "Removed from wishlist" : <>Saved to wishlist. <Link to="/wishlist">View</Link></>);
    const apiId = byId(id, products)?.apiId;
    if (!signedIn || !apiId) return;
    const request = on
      ? storeRequest(`/account/wishlist/${apiId}`, { method: "DELETE" })
      : storeRequest("/account/wishlist", { method: "POST", body: { productId: apiId } });
    request.then((result) => setWish(result.data.map(localId))).catch(() => {
      setWish((current) => (on ? [...current, id] : current.filter((x) => x !== id)));
      toast("Couldn’t update your wishlist. Please try again.");
    });
  }, [wish, setWish, toast, products, signedIn]);

  const viewed = useCallback((id) => setRecent((rv) => [id, ...rv.filter((x) => x !== id)].slice(0, 10)), [setRecent]);

  const quickView = useCallback((id) => { setQuickViewId(id); openSheet("qvSheet"); }, [openSheet]);

  const value = {
    cart: validCart, wish, coupon, recent, address, toasts, openSheets, quickViewId,
    setCoupon, setAddress, addToCart, setQty, removeLine, clearCart, toggleWish, viewed,
    toast, openSheet, closeSheet, quickView,
    cartCount: validCart.reduce((s, l) => s + l.qty, 0),
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
