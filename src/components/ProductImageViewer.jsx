import ProductMedia from "./ProductMedia";
import "./ProductImageViewer.css";

export default function ProductImageViewer({ product, colorIndex, index, zoomed, onToggle }) {
  return (
    <div>
      <button type="button" className="gallery-zoom-trigger" aria-pressed={zoomed}
        aria-label={`Zoom ${product.name}, image ${index + 1}`} onClick={onToggle}>
        <ProductMedia className="gallery-image" product={product} ci={colorIndex} k={index} />
        <span className="gallery-zoom-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="m16 16 5 5M7.5 10.5h6" />
            {!zoomed && <path d="M10.5 7.5v6" />}
          </svg>
        </span>
      </button>
    </div>
  );
}
