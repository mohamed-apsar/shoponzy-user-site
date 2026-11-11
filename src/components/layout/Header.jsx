import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import Icon from "../Icon";
import Art from "../Art";
import { useStore } from "../../context/StoreContext";
import { categoryUrl, reduceMotion } from "../../utils/shop";
import { headerEffects } from "../../fx/fx";
import { useCatalog } from "../../context/CatalogContext";
import { useCustomer } from "../../context/CustomerContext";

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
  const [menuPosition, setMenuPosition] = useState(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const menuCategories = category.subs;

  useLayoutEffect(() => {
    if (!open || !menuRef.current) return undefined;

    const updatePosition = () => {
      const trigger = menuRef.current.closest(".category-dropdown");
      if (!trigger) return;
      const bounds = trigger.getBoundingClientRect();
      const menuWidth = menuRef.current.offsetWidth;
      const viewportWidth = document.documentElement.clientWidth;
      const left = Math.max(16, Math.min(bounds.left, viewportWidth - menuWidth - 16));
      setMenuPosition({ left: left - bounds.left, top: bounds.height + 12 });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open, category.id, menuCategories.length]);

  useEffect(() => {
    setOpen(false);
    blur();
  }, [location.pathname, location.search]);

  if (!category) return null;

  return (
    <div className={`dd category-dropdown${open ? " is-open" : ""}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <NavLink to={categoryUrl(category.id)} onClick={blur}>{category.name}</NavLink>
      <button type="button" className="category-toggle" aria-label={`Show ${category.name} subcategories`} aria-expanded={open}
        aria-controls={`category-menu-${category.id}`} onClick={() => setOpen((value) => !value)}>
        <Icon name="i-down" />
      </button>
      <div className="category-menu" id={`category-menu-${category.id}`} ref={menuRef}
        style={menuPosition || undefined}>
        <div className="category-menu-items">
          {menuCategories.map(([slug, name, kind, color, image, categoryId, pathName, depth]) => {
            const key = categoryId || slug;
            return <Link className="category-menu-tile" key={key} to={categoryUrl(category.id, key)} onClick={() => { setOpen(false); blur(); }}>
              <span className="category-menu-art">{image
                ? <img src={image} alt="" loading="lazy" decoding="async" />
                : <Art kind={kind} color={color} category={category.id} />}</span>
              <span>{name}</span>{depth > 2 && pathName && <small className="category-menu-path">{pathName}</small>}
            </Link>;
          })}
        </div>
        <Link className="category-menu-promo" to={categoryUrl(category.id)} onClick={() => { setOpen(false); blur(); }}
          style={{
            backgroundImage: category.exploreImage
              ? `url("${category.exploreImage}")`
              : `linear-gradient(135deg, ${category.gradient?.[0] || category.color}, ${category.gradient?.[1] || category.color})`,
            backgroundSize: category.exploreImage ? "cover" : undefined,
            backgroundPosition: "center",
          }}>
          <span className="category-menu-promo-art" aria-hidden="true">
            <Art kind={category.heroArt?.[0]?.[0] || category.subs[0]?.[2] || "bag"}
              color={category.heroArt?.[0]?.[1] || category.subs[0]?.[3] || category.color} category={category.id} />
          </span>
          <span>{category.tag || "Explore the collection"}</span>
          <strong>Shop all {category.name}</strong>
          <span className="category-menu-explore">Explore <Icon name="i-arrow" /></span>
        </Link>
      </div>
    </div>
  );
}

export default function Header() {
  const { categories: CATS } = useCatalog();
  const { wish, cartCount, openSheet } = useStore();
  const { signedIn, signOut } = useCustomer();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 10);
    addEventListener("scroll", onScroll, { passive: true });
    const stop = headerEffects(ref.current);
    return () => { removeEventListener("scroll", onScroll); stop(); };
  }, []);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!profileOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === "Escape") setProfileOpen(false); };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  const logout = async () => {
    setProfileOpen(false);
    try { await signOut(); }
    finally { navigate("/"); }
  };

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
          {signedIn ? (
            <div className={`profile-dropdown${profileOpen ? " is-open" : ""}`} ref={profileRef}>
              <button type="button" className="tool hide-m" aria-label="Account menu" aria-expanded={profileOpen}
                aria-haspopup="menu" onClick={() => setProfileOpen((open) => !open)}><Icon name="i-user" /></button>
              <div className="profile-menu" role="menu" aria-hidden={!profileOpen}>
                <Link to="/account?section=orders" role="menuitem" tabIndex={profileOpen ? 0 : -1}>My Order</Link>
                <Link to="/account?section=profile" role="menuitem" tabIndex={profileOpen ? 0 : -1}>My Profile</Link>
                <button type="button" role="menuitem" tabIndex={profileOpen ? 0 : -1} onClick={logout}>Logout</button>
              </div>
            </div>
          ) : <Link className="tool hide-m" to="/account" aria-label="My account"><Icon name="i-user" /></Link>}
          <a className="tool" href="/cart" data-open-cart aria-label="Bag"><Icon name="i-bag" /><Badge n={cartCount} /></a>
        </div>
      </div>
    </header>
  );
}
