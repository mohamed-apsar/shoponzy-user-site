import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Icon from "../Icon";
import { useStore } from "../../context/StoreContext";
import { categoryUrl, reduceMotion } from "../../utils/shop";
import { headerEffects } from "../../fx/fx";
import { useCatalog } from "../../context/CatalogContext";

export function AnnouncementBar() {
  const { store } = useCatalog();
  const offers = store.offers;
  const [state, setState] = useState({ on: 0, out: -1 });
  useEffect(() => {
    if (offers.length < 2 || reduceMotion()) return;
    const timer = setInterval(() => setState((s) => ({ on: (s.on + 1) % offers.length, out: s.on })), 3500);
    return () => clearInterval(timer);
  }, [offers.length]);
  useEffect(() => {
    if (state.out < 0) return;
    const t = setTimeout(() => setState((s) => ({ ...s, out: -1 })), 600);
    return () => clearTimeout(t);
  }, [state.out]);
  return (
    <div className="ann" aria-label="Offers">
      {offers.map((o, i) => <span key={o} className={i === state.on ? "on" : i === state.out ? "out" : ""}>{o}</span>)}
    </div>
  );
}

export function Logo({ image }) {
  const { store } = useCatalog();
  const logo = image || store.logo || store.headerLogo;
  return <Link to="/" className="logo" aria-label={`${store.name || "Shoponzy"} home`}>
    {logo && <img src={logo} alt="" onError={(event) => event.currentTarget.classList.add("broken")} />}
    <span className="word">{store.name || "Shoponzy"}</span>
  </Link>;
}

export const Badge = ({ n }) => <span className={`badge-n${n > 0 ? " show" : ""}`}>{n}</span>;

/* Closes the category dropdown after a client-side navigation. */
const blur = () => document.activeElement?.blur?.();

function CategoryMenu({ category }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    blur();
  }, [location.pathname, location.search]);

  if (!category) return null;

  return (
    <div className={`dd category-dropdown${open ? " is-open" : ""}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <NavLink to={categoryUrl(category.id)} onClick={blur}>{category.name}</NavLink>
      {category.id !== "shoes" && <>
        <button type="button" className="category-toggle" aria-label={`Show ${category.name} subcategories`} aria-expanded={open}
          aria-controls={`category-menu-${category.id}`} onClick={() => setOpen((value) => !value)}>
          <Icon name="i-down" />
        </button>
        <div className="category-menu" id={`category-menu-${category.id}`}>
          <Link to={categoryUrl(category.id)} onClick={() => { setOpen(false); blur(); }}>Shop all {category.name}</Link>
          {category.subs.map(([id, name]) => (
            <Link key={id} to={categoryUrl(category.id, id)} onClick={() => { setOpen(false); blur(); }}>{name}</Link>
          ))}
        </div>
      </>}
    </div>
  );
}

export default function Header() {
  const { categories: CATS } = useCatalog();
  const { wish, cartCount, openSheet } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 10);
    addEventListener("scroll", onScroll, { passive: true });
    const stop = headerEffects(ref.current);
    return () => { removeEventListener("scroll", onScroll); stop(); };
  }, []);

  return (
    <header className={`header${scrolled ? " scrolled" : ""}`} ref={ref}>
      <div className="container header-in">
        <button type="button" className="tool burger" aria-label="Open menu" onClick={() => openSheet("menuSheet")}><Icon name="i-menu" /></button>
        <Logo />
        <nav className="nav" aria-label="Main navigation">
          {CATS.map((category) => <CategoryMenu key={category.id} category={category} />)}
        </nav>
        <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); navigate(`/products?q=${encodeURIComponent(q)}`); }}>
          <Icon name="i-search" style={{ color: "var(--muted)" }} />
          <input type="search" placeholder="Search shoes, sunglasses, perfumes…" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        <div className="tools">
          <button type="button" className="tool show-m" aria-label="Search" onClick={() => openSheet("searchSheet")}><Icon name="i-search" /></button>
          <Link className="tool hide-m" to="/wishlist" aria-label="Wishlist"><Icon name="i-heart" /><Badge n={wish.length} /></Link>
          <Link className="tool hide-m" to="/account" aria-label="My account"><Icon name="i-user" /></Link>
          <a className="tool" href="/cart" data-open-cart aria-label="Bag"><Icon name="i-bag" /><Badge n={cartCount} /></a>
        </div>
      </div>
    </header>
  );
}
