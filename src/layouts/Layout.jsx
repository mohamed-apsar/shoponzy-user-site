import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { IconSprite } from "../components/Icon";
import Icon from "../components/Icon";
import Header, { AnnouncementBar } from "../components/layout/Header";
import Footer, { TabBar } from "../components/layout/Footer";
import CartSheet from "../components/sheets/CartSheet";
import QuickAddSheet from "../components/sheets/QuickAddSheet";
import SearchSheet from "../components/sheets/SearchSheet";
import { CategorySheet, MenuSheet, SizeGuideSheet } from "../components/sheets/NavSheets";
import { useStore } from "../context/StoreContext";
import { MainRefContext } from "../fx/usePageFx";
import { useCatalog } from "../context/CatalogContext";

function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast" role="status" style={t.fading ? { transition: ".3s", opacity: 0 } : undefined}>
          <Icon name="i-check" />{t.content}
        </div>
      ))}
    </div>
  );
}

export default function Layout() {
  const { status, error, retry, store } = useCatalog();
  const { openSheet, closeSheet, openSheets } = useStore();
  const { pathname, hash, search } = useLocation();
  const main = useRef(null);

  useEffect(() => {
    let icon = document.head.querySelector('link[rel~="icon"]');
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.href = store.favicon || "/favicon.svg";
  }, [store.favicon]);

  // Scroll to the top on navigation, or to the #anchor when one is given.
  useEffect(() => {
    if (!hash) {
      // Not `return scrollTo(...)`: newer browsers return a Promise, which React would call as a cleanup.
      scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 50);
    return () => clearTimeout(t);
  }, [pathname, hash, search]);

  // Any [data-open-cart] element (header bag, tab bar, toast link) opens the drawer instead of navigating.
  useEffect(() => {
    function onClick(event) {
      if (!event.target.closest("[data-open-cart]")) return;
      event.preventDefault();
      if (pathname !== "/cart") openSheet("cartSheet");
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [pathname, openSheet]);

  useEffect(() => {
    function onKey(event) { if (event.key === "Escape" && openSheets.length) closeSheet(); }
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [openSheets, closeSheet]);

  return (
    <MainRefContext.Provider value={main}>
      <IconSprite />
      <a href="#main" className="sr-only">Skip to content</a>
      <AnnouncementBar />
      <Header />
      {status === "loading" && <div className="container" role="status" style={{ padding: "12px 0" }}>Loading products and store data…</div>}
      {status === "error" && <div className="container" role="alert" style={{ padding: "12px 0", color: "var(--accent-d)" }}>
        Could not load store data: {error} <button type="button" className="view-all" onClick={retry}>Try again</button>
      </div>}
      <main id="main" ref={main}>{status === "ready" ? <Outlet /> : null}</main>
      <Footer />
      <TabBar />
      <Toasts />
      <CartSheet />
      <QuickAddSheet />
      <SearchSheet />
      <CategorySheet />
      <MenuSheet />
      <SizeGuideSheet />
    </MainRefContext.Provider>
  );
}
