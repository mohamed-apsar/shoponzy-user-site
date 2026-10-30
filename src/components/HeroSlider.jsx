import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import Art from "./Art";
import { reduceMotion } from "../utils/shop";

/* Scroll-snap hero slider with dots and autoplay (paused on hover / hidden tab). */
export default function HeroSlider({ slides }) {
  const track = useRef(null);
  const hover = useRef(false);
  const [current, setCurrent] = useState(0);

  const slideIndex = () => {
    const t = track.current, first = t?.children[0];
    return first ? Math.round(t.scrollLeft / (first.offsetWidth + 12)) : 0;
  };
  const goTo = (i) => {
    const t = track.current, slide = t.children[i];
    t.scrollTo({ left: slide.offsetLeft - t.offsetLeft - (parseFloat(getComputedStyle(t).paddingLeft) || 0), behavior: "smooth" });
  };

  useEffect(() => {
    if (reduceMotion()) return;
    const timer = setInterval(() => {
      if (hover.current || document.hidden) return;
      goTo((slideIndex() + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="hero" aria-label="Featured collections"
      onPointerEnter={() => { hover.current = true; }} onPointerLeave={() => { hover.current = false; }}>
      <div className="hero-track" ref={track} onScroll={() => requestAnimationFrame(() => setCurrent(slideIndex()))}>
        {slides.map((s) => (
          <div className={`banner${s.image ? " has-photo" : ""}`} aria-roledescription="slide" key={s.title}>
            <div className="bg" style={{ background: s.bg }} />
            {s.image && <picture className="banner-photo">
              {s.mobileImage && <source media="(max-width: 767px)" srcSet={s.mobileImage} />}
              <img src={s.image} alt="" loading="eager" />
            </picture>}
            <span className="ring" style={{ width: 520, height: 520, right: -120, top: -120 }} />
            <span className="ring" style={{ width: 300, height: 300, right: "16%", bottom: -140 }} />
            <div className="art"><Art kind={s.art[0]} color={s.art[1]} category={s.art[2]} /></div>
            <div className="txt"><span className="kick">{s.kick}</span><h2>{s.title}</h2><p>{s.text}</p>
              <Link className="btn" to={s.href}>{s.cta} <Icon name="i-arrow" /></Link></div>
          </div>
        ))}
      </div>
      <div className="dots">
        {slides.map((s, i) => <button type="button" key={s.title} aria-label={`Slide ${i + 1}`} className={i === current ? "on" : ""} onClick={() => goTo(i)} />)}
      </div>
    </section>
  );
}
