import { useEffect, useId, useRef } from "react";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", busy = false, variant = "danger", onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const messageId = useId();
  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
      if (event.key === "Tab") {
        const buttons = dialogRef.current?.querySelectorAll("button:not(:disabled)");
        if (!buttons?.length) { event.preventDefault(); return; }
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return <div className="confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section ref={dialogRef} tabIndex={-1} className={`confirm-dialog${variant === "return" ? " confirm-dialog-return" : ""}`} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={messageId}>
      <div className="confirm-dialog-icon" aria-hidden="true">{variant === "return" ? "↩" : "!"}</div>
      <h2 id={titleId}>{title}</h2>
      <p id={messageId}>{message}</p>
      <div className="confirm-dialog-actions">
        <button type="button" className="confirm-cancel" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className="confirm-accept" onClick={onConfirm} disabled={busy}>{busy ? "Please wait…" : confirmLabel}</button>
      </div>
    </section>
  </div>;
}
