import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import { categoryUrl } from "../utils/shop";

/* Banner + three-image gallery that a subcategory page shows when the admin uploaded them.
   Anything not uploaded is simply not rendered (no placeholders, no parent/product fallbacks). */

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

export function SubcategoryGallery({ name, images }) {
  const [open, setOpen] = useState(-1);
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open >= 0 && !dialog.open) dialog.showModal();
    if (open < 0 && dialog.open) dialog.close();
  }, [open]);

  if (!images.length) return null;
  const step = (delta) => setOpen((i) => (i + delta + images.length) % images.length);

  return (
    <section className="sub-gallery" aria-label={`${name} gallery`}>
      <div className="container">
        <ul className={`sub-gallery-row n${images.length}`}>
          {images.map((image, index) => (
            <li key={image.url}>
              <button type="button" onClick={() => setOpen(index)} aria-label={`View larger: ${image.alt}`}>
                <img src={image.url} alt={image.alt} width="800" height="1200" loading="lazy" decoding="async" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <dialog
        ref={dialogRef}
        className="sub-lightbox"
        aria-label={`${name} image ${open + 1} of ${images.length}`}
        onClose={() => setOpen(-1)}
        onClick={(event) => { if (event.target === event.currentTarget) setOpen(-1); }}
        onKeyDown={(event) => {
          if (images.length > 1 && event.key === "ArrowRight") step(1);
          if (images.length > 1 && event.key === "ArrowLeft") step(-1);
        }}
      >
        {open >= 0 && <>
          <img src={images[open].url} alt={images[open].alt} />
          <button type="button" className="sub-lightbox-close" onClick={() => setOpen(-1)} aria-label="Close"><Icon name="i-x" /></button>
          {images.length > 1 && <>
            <button type="button" className="sub-lightbox-nav prev" onClick={() => step(-1)} aria-label="Previous image">‹</button>
            <button type="button" className="sub-lightbox-nav next" onClick={() => step(1)} aria-label="Next image">›</button>
          </>}
        </>}
      </dialog>
    </section>
  );
}
