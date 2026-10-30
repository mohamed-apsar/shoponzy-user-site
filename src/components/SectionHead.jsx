import { Link } from "react-router-dom";
import Icon from "./Icon";

/* Section heading with optional rail arrows and a "View all" link. */
export default function SectionHead({ title, subtitle, railId, viewAll }) {
  const scroll = (dir) => {
    const r = document.getElementById(railId);
    r?.scrollBy({ left: dir * r.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div className="sec-head">
      <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      <div className="tools">
        {railId && <>
          <button type="button" className="arrow-btn" aria-label="Scroll left" onClick={() => scroll(-1)}><Icon name="i-left" /></button>
          <button type="button" className="arrow-btn" aria-label="Scroll right" onClick={() => scroll(1)}><Icon name="i-right" /></button>
        </>}
        {viewAll && <Link className="view-all" to={viewAll}>View all <Icon name="i-arrow" /></Link>}
      </div>
    </div>
  );
}
