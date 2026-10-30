import { Link, NavLink, useLocation } from "react-router-dom";
import Icon from "../Icon";
import { Badge, Logo } from "./Header";
import { useStore } from "../../context/StoreContext";
import { categoryUrl, wa } from "../../utils/shop";
import { useCatalog } from "../../context/CatalogContext";

const external = (url) => (url && url !== "#" ? { href: url, target: "_blank", rel: "noopener" } : { href: "#" });

export default function Footer() {
  const { categories: CATS, store: STORE } = useCatalog();
  return (
    <footer className="footer">
      <div className="container f-grid">
        <div><Logo image={STORE.footerLogo || STORE.logo || STORE.headerLogo} /><p>{STORE.footerDescription || "Shoes, sunglasses, perfumes, clothing, watches and everyday essentials, delivered across India."}</p>
          <div className="social">
            <a {...external(STORE.instagram)} aria-label="Instagram"><Icon name="i-ig" /></a>
            <a {...external(STORE.facebook)} aria-label="Facebook"><Icon name="i-fb" /></a>
            <a {...external(STORE.youtube)} aria-label="YouTube"><Icon name="i-yt" /></a>
            <a href={wa("Hello Shoponzy, I have a question.", STORE)} target="_blank" rel="noopener" aria-label="WhatsApp"><Icon name="i-wa" /></a>
          </div></div>
        <div><h4>Help center</h4><ul>
          <li><Link to="/track-order">Order tracking</Link></li><li><Link to="/return-policy">Return / exchange</Link></li>
          <li><Link to="/help#cancel">Order cancellation</Link></li><li><Link to="/faqs">FAQs</Link></li><li><Link to="/contact">Contact us</Link></li>
        </ul></div>
        <div><h4>Information</h4><ul>
          <li><Link to="/about">About us</Link></li><li><Link to="/shipping-policy">Shipping policy</Link></li>
          <li><Link to="/return-policy">Return &amp; refund policy</Link></li><li><Link to="/privacy-policy">Privacy policy</Link></li><li><Link to="/terms">Terms &amp; conditions</Link></li>
        </ul></div>
        <div><h4>Quick shop</h4><ul>
          {CATS.map((c) => <li key={c.id}><Link to={categoryUrl(c.id)}>{c.name}</Link></li>)}<li><Link to="/products?sale=1">Deals</Link></li>
        </ul></div>
        <div><h4>Contact</h4><ul>
          <li><a href={`tel:${STORE.phoneTel}`}><span>{STORE.phoneDisplay}</span></a></li>
          <li><a href={`mailto:${STORE.email}`}><span>{STORE.email}</span></a></li>
          <li><span>{STORE.address}</span></li>
        </ul></div>
      </div>
      <div className="container popular"><p style={{ marginBottom: 6 }}><b>POPULAR SEARCHES</b></p>
        {CATS.map((c) => {
          const suffix = ["shoes", "clothing"].includes(c.id) ? " for men & women" : " ";
          return (
            <p key={c.id}><b>{c.name}:</b> {c.subs.map(([id, name], i) => (
              <span key={id}>{i > 0 && " | "}<Link to={categoryUrl(c.id, id)}>{name}{suffix}</Link></span>
            ))}</p>
          );
        })}
      </div>
      <div className="f-bottom"><div className="container"><p>© {new Date().getFullYear()} Shoponzy. Developed by BHive Technologies.</p>
        <div className="pay-chips"><span>UPI</span><span>GPay</span><span>PhonePe</span><span>COD</span></div></div></div>
    </footer>
  );
}

export function TabBar() {
  const { wish, cartCount, openSheet } = useStore();
  const { pathname } = useLocation();
  const onCategories = pathname.startsWith("/categories");
  return (
    <>
      <div className="tab-space" />
      <nav className="tabbar" aria-label="App navigation">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "on" : "")}><Icon name="i-home" />Home</NavLink>
        <button type="button" className={onCategories ? "on" : ""} onClick={() => openSheet("catSheet")}><Icon name="i-grid" />Categories</button>
        <button type="button" onClick={() => openSheet("searchSheet")}><Icon name="i-search" />Search</button>
        <NavLink to="/wishlist" className={({ isActive }) => (isActive ? "on" : "")}><Icon name="i-heart" />Wishlist<Badge n={wish.length} /></NavLink>
        <a href="/cart" data-open-cart className={pathname === "/cart" ? "on" : ""}><Icon name="i-bag" />Bag<Badge n={cartCount} /></a>
      </nav>
    </>
  );
}
