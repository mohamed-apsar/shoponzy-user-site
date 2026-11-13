import { Link } from "react-router-dom";
import { categoryUrl } from "../utils/shop";

/* Banner a subcategory page shows when the admin uploaded one (no parent/product fallbacks). */

export function SubcategoryBanner({ category, name, banner, q }) {
  return (
    <section className="sub-hero">
      <img className="sub-hero-img" src={banner.url} alt={banner.alt || name} width="1920" height="600" decoding="async" />
      <div className="sub-hero-text">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span>/</span><Link to={categoryUrl(category.id)}>{category.name}</Link><span>/</span><span>{name}</span>
          </nav>
          <h1>{q ? `“${q}”` : name}</h1>
        </div>
      </div>
    </section>
  );
}
