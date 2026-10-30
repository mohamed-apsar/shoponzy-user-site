import { useEffect, useRef } from "react";
import { useStore } from "../context/StoreContext";

/* Bottom sheet / side drawer / centred dialog, matching the original .sheet markup.
   Any element with data-close inside it closes the sheet; so does the scrim, Escape
   (handled in Layout) and a swipe down on the grab handle or header (mobile). */
export default function Sheet({ id, variant = "", label, panelStyle, children }) {
  const { openSheets, closeSheet } = useStore();
  const open = openSheets.includes(id);
  const panelRef = useRef(null);
  const swipe = useRef({ y0: null, dy: 0 });

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => panelRef.current?.querySelector(".ph button, .pb input, .pb button, .pb a")?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  function onClick(event) {
    if (event.target.classList.contains("scrim") || event.target.closest("[data-close]")) closeSheet(id);
  }
  function onTouchStart(event) {
    if (!event.target.closest(".grab, .ph")) return;
    swipe.current.y0 = event.touches[0].clientY;
    panelRef.current.style.transition = "none";
  }
  function onTouchMove(event) {
    const s = swipe.current;
    if (s.y0 === null) return;
    s.dy = Math.max(0, event.touches[0].clientY - s.y0);
    panelRef.current.style.transform = `translateY(${s.dy}px)`;
  }
  function onTouchEnd() {
    const s = swipe.current, panel = panelRef.current;
    if (s.y0 === null) return;
    panel.style.transition = "";
    panel.style.transform = "";
    if (s.dy > 90) closeSheet(id);
    s.y0 = null;
    s.dy = 0;
  }

  return (
    <div className={`sheet${variant ? " " + variant : ""}${open ? " open" : ""}`} id={id} role="dialog" aria-modal="true" aria-label={label} aria-hidden={!open} onClick={onClick}>
      <div className="scrim" />
      <div className="panel" ref={panelRef} style={panelStyle} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <span className="grab" />
        {children}
      </div>
    </div>
  );
}
