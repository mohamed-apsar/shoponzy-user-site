/* ==========================================================
   Motion layer (GSAP + ScrollTrigger), ported from legacy-site/assets/js/fx.js.
   Same effects on mobile (touch-friendly); hover-only effects on desktop.
   Every effect runs inside a gsap.context scoped to a page, and is reverted
   when the page unmounts, so client-side navigation does not leak tweens.
   ========================================================== */
import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
gsap.config({ nullTargetWarn: false });
gsap.defaults({ ease: "power3.out" });

const mq = (q) => typeof matchMedia === "function" && matchMedia(q).matches;
export const motionOk = () => !mq("(prefers-reduced-motion: reduce)");
export const finePointer = () => mq("(hover: hover) and (pointer: fine)");
const $$ = (s, r) => [...r.querySelectorAll(s)];

/* Runs `setup(root)` in a gsap.context bound to `ref` whenever deps change. */
export function useGsap(ref, setup, deps) {
  useLayoutEffect(() => {
    if (!motionOk() || !ref.current) return;
    const cleanups = [];
    const ctx = gsap.context(() => setup(ref.current, (fn) => cleanups.push(fn)), ref);
    const t = setTimeout(() => ScrollTrigger.refresh(), 100);
    return () => { clearTimeout(t); cleanups.forEach((fn) => fn()); ctx.revert(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/* 1, 2, 3, 4, 5, 6, 9: page-level effects. Each block only finds elements present on the page. */
export function pageEffects(root, onCleanup) {
  const fine = finePointer();
  // 1. Page entrance (app-like)
  gsap.from($$(":scope > *:first-child, :scope > *:nth-child(2)", root), { y: 24, opacity: 0, duration: 0.8, stagger: 0.08 });
  gsap.from($$(".story", root), { y: 20, opacity: 0, scale: 0.8, duration: 0.6, stagger: 0.05, ease: "back.out(1.7)", delay: 0.1 });
  gsap.from($$(".sub", root), { y: 16, opacity: 0, scale: 0.85, duration: 0.55, stagger: 0.04, ease: "back.out(1.7)", delay: 0.2 });

  // 2. Hero banners: product art parallax (scroll + pointer), rings counter-rotate
  $$(".banner", root).forEach((b) => {
    const art = b.querySelector(".art"), txt = b.querySelector(".txt");
    gsap.to(art, { yPercent: 14, rotate: 6, ease: "none", scrollTrigger: { trigger: b, start: "top top", end: "bottom top", scrub: true } });
    gsap.to(txt, { yPercent: -10, opacity: 0.4, ease: "none", scrollTrigger: { trigger: b, start: "top top", end: "bottom top", scrub: true } });
    $$(".ring", b).forEach((r, k) => gsap.to(r, { rotate: k % 2 ? -360 : 360, duration: 40 + k * 10, repeat: -1, ease: "none" }));
    gsap.to(art, { y: "-=12", duration: 2.6, repeat: -1, yoyo: true, ease: "sine.inOut" });
    if (fine) {
      const x = gsap.quickTo(art, "x", { duration: 1 }), r = gsap.quickTo(art, "rotationY", { duration: 1 });
      const move = (e) => { const n = e.clientX / innerWidth - 0.5; x(n * 40); r(n * 16); };
      b.addEventListener("pointermove", move);
      onCleanup(() => b.removeEventListener("pointermove", move));
    }
  });
  // phone tilt → art leans (same effect on mobile)
  if (!fine && window.DeviceOrientationEvent && root.querySelector(".banner .art, .cat-hero .float")) {
    const tilt = (e) => { if (e.gamma == null) return; gsap.to($$(".banner .art, .cat-hero .float", root), { x: e.gamma * 0.8, duration: 0.8, overwrite: "auto" }); };
    addEventListener("deviceorientation", tilt);
    onCleanup(() => removeEventListener("deviceorientation", tilt));
  }

  // 3. Category hero: floating product art at different depths
  $$(".cat-hero", root).forEach((h) => {
    gsap.to(h.querySelector(".bg"), { yPercent: 14, ease: "none", scrollTrigger: { trigger: h, start: "top top", end: "bottom top", scrub: true } });
    $$(".float", h).forEach((f, i) => {
      const d = +f.dataset.depth || 1;
      gsap.from(f, { scale: 0, rotate: -40, opacity: 0, duration: 1, delay: 0.2 + i * 0.1, ease: "back.out(1.6)" });
      gsap.to(f, { y: -120 * d, rotate: 25 * d * (i % 2 ? 1 : -1), ease: "none", scrollTrigger: { trigger: h, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(f.firstElementChild, { y: i % 2 ? 10 : -10, duration: 2.4 + i * 0.3, repeat: -1, yoyo: true, ease: "sine.inOut" });
    });
    gsap.from($$(".crumbs, h1, p", h), { y: 30, opacity: 0, duration: 0.8, stagger: 0.08, delay: 0.1 });
  });

  // 4. Section heads and blocks
  $$(".sec-head", root).forEach((h) => gsap.from(h.children, { y: 24, opacity: 0, duration: 0.7, stagger: 0.08, scrollTrigger: { trigger: h, start: "top 90%", once: true } }));
  $$("[data-reveal]", root).forEach((el) => gsap.from(el, { y: 50, opacity: 0, duration: 0.9, scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
  $$("[data-stagger]", root).forEach((g) => gsap.from(g.children, { y: 40, opacity: 0, scale: 0.96, duration: 0.7, stagger: 0.07, scrollTrigger: { trigger: g, start: "top 90%", once: true } }));

  // 5. Occasion tiles & category banners: inner art parallax
  $$(".occ .art", root).forEach((a) => gsap.fromTo(a, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: a.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));
  $$(".cb .art", root).forEach((a) => gsap.fromTo(a, { y: 30, rotate: -10 }, { y: -30, rotate: 10, ease: "none", scrollTrigger: { trigger: a.parentElement, start: "top bottom", end: "bottom top", scrub: true } }));

  // 6. Marquee reacts to scroll speed and direction
  $$(".mq-track", root).forEach((t) => {
    const loop = gsap.to(t, { xPercent: -50, duration: 24, ease: "none", repeat: -1 });
    ScrollTrigger.create({ onUpdate: (s) => gsap.to(loop, { timeScale: s.direction * Math.min(5, 1 + Math.abs(s.getVelocity()) / 300), duration: 0.3, overwrite: true }) });
  });

  // 7. Rails peek-in: slide from the right as they enter
  $$(".rail", root).forEach((r) => gsap.from(r, { clipPath: "inset(0 0 0 100%)", opacity: 0, duration: 1.1, ease: "power3.inOut", clearProps: "clipPath", scrollTrigger: { trigger: r, start: "top 92%", once: true } }));

  // 9. Gallery images on PDP fade/scale in
  $$(".g-main", root).forEach((g) => gsap.from(g, { scale: 0.96, opacity: 0, duration: 0.8 }));
}

/* Product cards entering a grid or rail (FX.items in the original). */
export function itemEffects(root, onCleanup) {
  const items = $$("[data-item]", root);
  if (!items.length) return;
  gsap.fromTo(items, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.05, ease: "power3.out", overwrite: true,
    scrollTrigger: { trigger: root, start: "top 92%", once: true } });
  if (!finePointer()) return;
  items.forEach((c) => {
    const m = c.querySelector(".media"), rx = gsap.quickTo(m, "rotationX", { duration: 0.5 }), ry = gsap.quickTo(m, "rotationY", { duration: 0.5 });
    gsap.set(m, { transformPerspective: 800 });
    const move = (e) => { const r = m.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 8); rx(-((e.clientY - r.top) / r.height - 0.5) * 8); };
    const leave = () => { rx(0); ry(0); };
    m.addEventListener("pointermove", move);
    m.addEventListener("pointerleave", leave);
    onCleanup(() => { m.removeEventListener("pointermove", move); m.removeEventListener("pointerleave", leave); });
  });
}

/* 8. Header hides on scroll down, returns on scroll up (never while a sheet is open). */
export function headerEffects(header) {
  if (!motionOk() || !header) return () => {};
  const st = ScrollTrigger.create({
    onUpdate: (s) => {
      if (document.querySelector(".sheet.open")) return;
      gsap.to(header, { yPercent: scrollY > 200 && s.direction === 1 ? -100 : 0, duration: 0.35, overwrite: true });
    },
  });
  return () => st.kill();
}

export function confetti() {
  if (!motionOk()) return;
  const cols = ["#FF4D2E", "#F5A623", "#111318", "#12A150", "#1E88E5"];
  for (let i = 0; i < 70; i++) {
    const c = document.createElement("i");
    c.style.cssText = `position:fixed;z-index:700;top:-10px;left:${Math.random() * 100}vw;width:${6 + Math.random() * 6}px;height:${9 + Math.random() * 8}px;background:${cols[i % 5]};border-radius:2px;pointer-events:none`;
    document.body.appendChild(c);
    c.animate([{ transform: "translateY(0) rotate(0)" }, { transform: `translate(${(Math.random() - 0.5) * 200}px,105vh) rotate(${Math.random() * 720}deg)` }],
      { duration: 2000 + Math.random() * 1600, delay: Math.random() * 300, easing: "cubic-bezier(.2,.6,.4,1)" }).onfinish = () => c.remove();
  }
}

export { gsap };
