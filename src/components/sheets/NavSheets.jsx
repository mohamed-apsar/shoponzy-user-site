import { useState } from "react";
import { Link } from "react-router-dom";
import Sheet from "../Sheet";
import Icon from "../Icon";
import Art from "../Art";
import { Logo } from "../layout/Header";
import { categoryUrl, wa } from "../../utils/shop";
import { useCatalog } from "../../context/CatalogContext";

export function CategorySheet() {
  const { categories: CATS } = useCatalog();
  return (
    <Sheet id="catSheet" label="Categories">
      <div className="ph"><h2>Shop by category</h2><button type="button" className="tool" data-close aria-label="Close"><Icon name="i-x" /></button></div>
      <div className="pb">
        <div className="cats-sheet">
          {CATS.map((c) => {
            const [kind, color] = c.icon;
            return <Link key={c.id} to={categoryUrl(c.id)} data-close><span className="im"><Art kind={kind} color={color} category={c.id} /></span>{c.name}</Link>;
          })}
        </div>
        <Link className="btn btn-dark btn-block" style={{ marginTop: 16 }} to="/products" data-close>Shop everything</Link>
      </div>
    </Sheet>
  );
}

export function MenuSheet() {
  const { categories: CATS, store } = useCatalog();
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATS[0]?.id || "");
  return (
    <Sheet id="menuSheet" variant="side" label="Menu">
      <div className="ph"><span data-close><Logo /></span><button type="button" className="tool" data-close aria-label="Close"><Icon name="i-x" /></button></div>
      <div className="pb mnav-links">
        <Link to="/" data-close>Home<Icon name="i-right" /></Link>
        <div className="mnav-category">
          <button type="button" onClick={() => { setCategoriesOpen((open) => !open); if (!selectedCategory) setSelectedCategory(CATS[0]?.id || ""); }} aria-expanded={categoriesOpen}>
            Category<Icon name="i-down" />
          </button>
          {categoriesOpen && <div className="mnav-category-list">
            {CATS.map((category) => <div key={category.id}>
              <button type="button" className="mnav-category-name" onClick={() => setSelectedCategory(category.id)} aria-expanded={selectedCategory === category.id}>
                {category.name}<Icon name="i-down" />
              </button>
              {selectedCategory === category.id && <div className="mnav-subcategories">
                <Link to={categoryUrl(category.id)} data-close>Shop all {category.name}</Link>
                {(category.descendants?.length ? category.descendants : category.subs).map(([slug, name, , , , categoryId, pathName, depth]) => {
                  const key = categoryId || slug;
                  return <Link key={key} to={categoryUrl(category.id, key)} data-close>
                    <span>{name}{depth > 2 && pathName && <small className="category-menu-path">{pathName}</small>}</span><Icon name="i-right" />
                  </Link>;
                })}
              </div>}
            </div>)}
          </div>}
        </div>
        <Link to="/about" data-close>About us<Icon name="i-right" /></Link>
        <Link to="/contact" data-close>Contact us<Icon name="i-right" /></Link>
        <Link to="/products?sale=1" data-close>Deals<Icon name="i-right" /></Link>
        <Link to="/wishlist" data-close>Wishlist<Icon name="i-right" /></Link>
        <Link to="/account" data-close>My account & orders<Icon name="i-right" /></Link>
        <Link to="/help" data-close>Help<Icon name="i-right" /></Link>
      </div>
      <div className="pf"><a className="btn btn-wa" href={wa("Hello Shoponzy, I have a question.", store)} target="_blank" rel="noopener"><Icon name="i-wa" />Chat on WhatsApp</a></div>
    </Sheet>
  );
}

export function SizeGuideSheet() {
  const shoes = [["Size 6", "24.5 cm"], ["Size 7", "25.4 cm"], ["Size 8", "26.2 cm"], ["Size 9", "27.1 cm"], ["Size 10", "27.9 cm"]];
  const clothes = [["S", "36–38"], ["M", "38–40"], ["L", "40–42"], ["XL", "42–44"], ["XXL", "44–46"]];
  const table = (rows) => <table className="spec"><tbody>{rows.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}</tbody></table>;
  return (
    <Sheet id="sizeSheet" variant="center" label="Size guide">
      <div className="ph"><h2>Size guide</h2><button type="button" className="tool" data-close aria-label="Close"><Icon name="i-x" /></button></div>
      <div className="pb">
        <p className="tax" style={{ marginBottom: 10 }}>Footwear (UK/India sizes). Measure your foot length heel to toe.</p>{table(shoes)}
        <p className="tax" style={{ margin: "14px 0 8px" }}>Clothing (chest, inches)</p>{table(clothes)}
        <p className="tax" style={{ marginTop: 12 }}>Between sizes? Choose the larger size or chat with us.</p>
      </div>
    </Sheet>
  );
}
