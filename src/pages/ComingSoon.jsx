import { Link } from "react-router-dom";
import Art from "../components/Art";
import usePageMeta from "../hooks/usePageMeta";

export default function ComingSoon({ category }) {
  usePageMeta(`${category.name} is coming soon | Shoponzy`);
  const artwork = category.icon || category.heroArt?.[0] || ["bag", "#333333"];
  const productPreview = !category.bannerImage;
  const collectionType = `${category.id || ""} ${category.name || ""}`.toLowerCase();
  const launchDescription = /perfume|fragrance/.test(collectionType)
    ? "Your next signature scent is on its way. Discover a new collection of fragrances, coming soon to Shoponzy."
    : /watch/.test(collectionType)
      ? "A little more style for every moment. Our new watch collection is coming soon to Shoponzy."
      : "";
  return (
    <section className="coming-soon-page">
      <div className="container coming-soon-shell">
        <Link className="coming-soon-back" to="/"><span aria-hidden="true">&larr;</span> Back to Shoponzy</Link>
        <article className={`coming-soon-card${productPreview ? " is-product-preview" : ""}${launchDescription ? " is-launch-preview" : ""}`} aria-labelledby="coming-soon-title">
          <header className="coming-soon-copy">
            <div>
              <span className="coming-soon-kicker">{launchDescription ? "SHOPONZY / THE NEXT COLLECTION" : "THE NEXT COLLECTION"}</span>
              <h1 id="coming-soon-title">{category.name}{launchDescription && <span className="coming-soon-launch-title">Coming soon.</span>}</h1>
              <p>{launchDescription || category.tag || "A fresh perspective. A new collection. Coming your way soon."}</p>
            </div>
            <span className="coming-soon-pill"><i aria-hidden="true" /> Coming soon</span>
          </header>
          <div className={`coming-soon-visual${category.bannerImage ? " has-banner" : ""}`}>
            {category.bannerImage ? (
              <img className="coming-soon-banner" src={category.bannerImage} alt={`${category.name} collection preview`} fetchPriority="high" />
            ) : category.image ? (
              <img className="coming-soon-product" src={category.image} alt={`${category.name} collection preview`} />
            ) : (
              <div className="coming-soon-art" aria-hidden="true"><Art kind={artwork[0]} color={artwork[1]} category={category.id} /></div>
            )}
          </div>
          <div className="coming-soon-caption"><span>Something worth waiting for.</span><span>SHOPONZY</span></div>
        </article>
      </div>
    </section>
  );
}
