import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ProductMedia from "./ProductMedia";
import "./ProductImageViewer.css";

export function ZoomIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5M7.5 10.5h6M10.5 7.5v6" /></svg>;
}

export default function ProductImageViewer({ product, colorIndex, index, count, onIndexChange, onClose }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const transform = useRef(view);
  const stage = useRef(null);
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  const titleId = useId();

  function update(next) {
    const scale = Math.max(1, Math.min(5, next.scale));
    const bounds = stage.current?.getBoundingClientRect();
    const image = stage.current?.querySelector("img");
    let width = bounds?.width || 0, height = bounds?.height || 0;
    if (image?.naturalWidth && image?.naturalHeight) {
      const ratio = image.naturalWidth / image.naturalHeight;
      width = Math.min(width, height * ratio);
      height = width / ratio;
    }
    const maxX = Math.max(0, (width * scale - (bounds?.width || 0)) / 2);
    const maxY = Math.max(0, (height * scale - (bounds?.height || 0)) / 2);
    const nextView = { scale, x: Math.max(-maxX, Math.min(maxX, next.x)), y: Math.max(-maxY, Math.min(maxY, next.y)) };
    transform.current = nextView;
    setView(nextView);
  }

  useEffect(() => {
    const next = { scale: 1, x: 0, y: 0 };
    transform.current = next;
    setView(next);
    pointers.current.clear();
    gesture.current = null;
  }, [index, colorIndex]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (event) => {
      if (event.key === "Escape") { event.preventDefault(); close.current(); }
      if (event.key !== "Tab") return;
      const buttons = [...dialog.current.querySelectorAll("button:not(:disabled)")];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  function startGesture() {
    const points = [...pointers.current.values()];
    const rect = stage.current.getBoundingClientRect();
    if (points.length >= 2) {
      const [a, b] = points;
      gesture.current = { type: "pinch", ...transform.current,
        distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
        midX: (a.x + b.x) / 2 - rect.left - rect.width / 2,
        midY: (a.y + b.y) / 2 - rect.top - rect.height / 2,
      };
    } else if (points.length === 1) gesture.current = { type: "pan", ...transform.current, point: points[0] };
    else gesture.current = null;
  }

  function pointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    startGesture();
  }
  function pointerMove(event) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()], initial = gesture.current;
    if (!initial) return;
    if (initial.type === "pinch" && points.length >= 2) {
      const [a, b] = points, rect = stage.current.getBoundingClientRect();
      const scale = Math.max(1, Math.min(5, initial.scale * Math.hypot(a.x - b.x, a.y - b.y) / initial.distance));
      update({ scale,
        x: (a.x + b.x) / 2 - rect.left - rect.width / 2 - (initial.midX - initial.x) * scale / initial.scale,
        y: (a.y + b.y) / 2 - rect.top - rect.height / 2 - (initial.midY - initial.y) * scale / initial.scale,
      });
    } else if (initial.type === "pan") update({ scale: initial.scale, x: initial.x + event.clientX - initial.point.x, y: initial.y + event.clientY - initial.point.y });
  }
  function pointerUp(event) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.delete(event.pointerId);
    startGesture();
  }

  return createPortal(<div className="product-viewer-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="product-viewer" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialog}>
      <div className="product-viewer-toolbar">
        <div className="product-viewer-title"><h2 id={titleId}>{product.name}</h2><span>Image {index + 1} of {count}</span></div>
        <div className="product-viewer-controls">
          <button type="button" aria-label="Zoom out" disabled={view.scale <= 1} onClick={() => update({ ...transform.current, scale: view.scale - .5 })}>−</button>
          <button type="button" className="product-viewer-reset" aria-label="Reset image zoom" onClick={() => update({ scale: 1, x: 0, y: 0 })}>{Math.round(view.scale * 100)}%</button>
          <button type="button" aria-label="Zoom in" disabled={view.scale >= 5} onClick={() => update({ ...transform.current, scale: view.scale + .5 })}>+</button>
          <button ref={closeButton} type="button" aria-label="Close image viewer" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="product-viewer-stage" ref={stage} data-zoom={view.scale.toFixed(2)} style={{ cursor: view.scale > 1 ? "grab" : "zoom-in" }}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onLostPointerCapture={pointerUp}
        onDragStart={(event) => event.preventDefault()} onDoubleClick={() => update({ scale: view.scale === 1 ? 2 : 1, x: 0, y: 0 })}>
        <ProductMedia className="product-viewer-media" product={product} ci={colorIndex} k={index} style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }} />
      </div>
      <div className="product-viewer-footer">
        <button type="button" aria-label="Previous image" disabled={index === 0} onClick={() => onIndexChange(index - 1)}>←</button>
        <p><span className="zoom-hint-desktop">Use + / − to zoom · Drag to move</span><span className="zoom-hint-touch">Pinch to zoom · Drag to move</span></p>
        <button type="button" aria-label="Next image" disabled={index === count - 1} onClick={() => onIndexChange(index + 1)}>→</button>
      </div>
    </section>
  </div>, document.body);
}
