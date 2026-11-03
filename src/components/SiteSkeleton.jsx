function SkeletonCard() {
  return (
    <div className="site-skeleton-card" aria-hidden="true">
      <div className="site-skeleton-block site-skeleton-image" />
      <div className="site-skeleton-block site-skeleton-line site-skeleton-brand" />
      <div className="site-skeleton-block site-skeleton-line site-skeleton-name" />
      <div className="site-skeleton-block site-skeleton-line site-skeleton-price" />
    </div>
  );
}

export default function SiteSkeleton() {
  return (
    <div className="site-skeleton" role="status" aria-label="Loading storefront">
      <span className="sr-only">Loading products and store data…</span>
      <div className="site-skeleton-stories" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <div className="site-skeleton-story" key={index}>
            <div className="site-skeleton-block site-skeleton-circle" />
            <div className="site-skeleton-block site-skeleton-line" />
          </div>
        ))}
      </div>

      <div className="container">
        <div className="site-skeleton-block site-skeleton-hero" aria-hidden="true">
          <div className="site-skeleton-hero-copy">
            <div className="site-skeleton-block site-skeleton-line" />
            <div className="site-skeleton-block site-skeleton-line" />
            <div className="site-skeleton-block site-skeleton-line" />
          </div>
        </div>

        <section className="site-skeleton-section" aria-hidden="true">
          <div className="site-skeleton-block site-skeleton-heading" />
          <div className="site-skeleton-products">
            {Array.from({ length: 4 }, (_, index) => <SkeletonCard key={index} />)}
          </div>
        </section>

        <section className="site-skeleton-section site-skeleton-secondary" aria-hidden="true">
          <div className="site-skeleton-block site-skeleton-heading" />
          <div className="site-skeleton-products">
            {Array.from({ length: 4 }, (_, index) => <SkeletonCard key={index} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
