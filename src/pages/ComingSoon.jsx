import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";

export default function ComingSoon({ category }) {
  usePageMeta(`${category.name} is coming soon | Shoponzy`);

  return (
    <main className="coming-soon-page">
      <div className="container coming-soon-shell">
        <Link className="coming-soon-back" to="/">
          <span aria-hidden="true">←</span> Back to Shoponzy
        </Link>

        <section
          className="coming-soon-card"
          style={{
            "--coming-accent": category.color || "#ff4d2e",
            "--coming-gradient": `linear-gradient(135deg, ${category.gradient?.[0] || "#17191f"}, ${category.gradient?.[1] || category.color || "#ff4d2e"})`,
          }}
          aria-labelledby="coming-soon-title"
        >
          <div className="coming-soon-copy">
            <span className="coming-soon-kicker">SHOPONZY <i /> THE NEXT DROP</span>
            <span className="coming-soon-pill"><i /> COMING SOON</span>
            <h1 id="coming-soon-title">Something good<br />is <em>on its way.</em></h1>
            <p>{category.tag || `We’re putting the finishing touches on our ${category.name} collection. It won’t be long.`}</p>
            <div className="coming-soon-actions">
              <Link className="coming-soon-button" to="/products">
                Explore the shop <span aria-hidden="true">→</span>
              </Link>
              <span className="coming-soon-note">A fresh collection is in the works</span>
            </div>
          </div>

          <div className="coming-soon-visual" aria-hidden="true">
            {category.bannerImage
              ? <img className="coming-soon-banner" src={category.bannerImage} alt="" />
              : category.image
                ? <img className="coming-soon-product" src={category.image} alt="" />
                : <div className="coming-soon-orbit"><span>CURATED FOR YOU</span><b>SOON</b></div>}
            <div className="coming-soon-visual-shade" />
            <div className="coming-soon-visual-label">
              <span>UP NEXT</span>
              <b>{category.name}</b>
            </div>
            <span className="coming-soon-stamp">NEW<br />ARRIVAL</span>
          </div>
        </section>
      </div>
    </main>
  );
}
