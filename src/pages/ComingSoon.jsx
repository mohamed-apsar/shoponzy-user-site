import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";

export default function ComingSoon({ category }) {
  usePageMeta(`${category.name} is coming soon | Shoponzy`);
  return (
    <main className="coming-soon-page">
      <div className="container coming-soon-shell">
        <Link className="coming-soon-back" to="/">← Back to Shoponzy</Link>
        <section className="coming-soon-card" style={{ "--coming-accent": category.color || "#ff4d2e", "--coming-gradient": `linear-gradient(135deg, ${category.gradient?.[0] || "#17191f"}, ${category.gradient?.[1] || category.color || "#ff4d2e"})` }}>
          <div className="coming-soon-copy">
            <span className="coming-soon-kicker">SHOPONZY · {category.name.toUpperCase()}</span>
            <span className="coming-soon-pill"><i /> Coming soon</span>
            <h1>Something good<br />is on its way.</h1>
            <p>{category.tag || `We’re getting our ${category.name} collection ready for you. Check back soon.`}</p>
            <Link className="coming-soon-button" to="/products">Explore what’s available <span aria-hidden="true">→</span></Link>
          </div>
          <div className="coming-soon-visual" aria-hidden="true">
            {category.bannerImage
              ? <img className="coming-soon-banner" src={category.bannerImage} alt="" />
              : category.image
                ? <img className="coming-soon-product" src={category.image} alt="" />
                : <div className="coming-soon-orbit"><span>{category.name}</span><b>SOON</b></div>}
            <span className="coming-soon-stamp">A NEW<br />COLLECTION</span>
          </div>
        </section>
      </div>
    </main>
  );
}
