import { useEffect } from "react";

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", busy = false, onCancel, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return <div className="confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message">
      <div className="confirm-dialog-icon" aria-hidden="true">!</div>
      <h2 id="confirm-dialog-title">{title}</h2>
      <p id="confirm-dialog-message">{message}</p>
      <div className="confirm-dialog-actions">
        <button type="button" className="confirm-cancel" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className="confirm-accept" onClick={onConfirm} disabled={busy}>{busy ? "Please wait…" : confirmLabel}</button>
      </div>
    </section>
  </div>;
}
