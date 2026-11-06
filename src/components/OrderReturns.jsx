import { useCallback, useEffect, useState } from "react";
import { storeRequest, storeUpload } from "../api/storeApi";
import { money } from "../utils/shop";

/* Return requests for one order: what can still be returned, the request form, and existing requests. */
const RETURN_REASONS = [
  ["damaged", "Damaged product"], ["wrong_item", "Wrong product delivered"], ["defective", "Defective product"],
  ["size_fit", "Size or fit issue"], ["not_as_described", "Product not as described"], ["missing_items", "Missing items"],
  ["changed_mind", "Changed mind"], ["other", "Other"],
];
const REASON_LABEL = Object.fromEntries(RETURN_REASONS);
const RETURN_STATUS = {
  requested: "Requested — under review", approved: "Approved", rejected: "Rejected", pickup_scheduled: "Pickup scheduled",
  in_transit: "On its way back", received: "Received by us", inspected: "Inspected", completed: "Completed", cancelled: "Cancelled",
};
const REFUND_STATUS = { pending: "Refund due after inspection", processing: "Refund processing", completed: "Refunded", failed: "Refund delayed — we're on it" };
const MAX_PHOTOS = 5;

function ReturnForm({ orderNumber, items, onDone, onCancel }) {
  const [qty, setQty] = useState(() => Object.fromEntries(items.map((i) => [i.variant, 0])));
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const chosen = items.filter((i) => qty[i.variant] > 0);

  async function addPhotos(event) {
    const files = [...(event.target.files || [])].slice(0, MAX_PHOTOS - photos.length);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} is larger than 5 MB.`);
        const up = (await storeUpload("/returns/uploads", file)).data;
        setPhotos((p) => [...p, up]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!chosen.length) return setError("Choose at least one item and how many to return.");
    if (!reason) return setError("Choose a reason for the return.");
    if (reason === "other" && comments.trim().length < 5) return setError("Tell us a little about the reason for the return.");
    if (!window.confirm(`Request a return for ${chosen.reduce((s, i) => s + qty[i.variant], 0)} item(s)?`)) return;
    setBusy(true);
    setError("");
    try {
      await storeRequest(`/orders/${encodeURIComponent(orderNumber)}/returns`, {
        method: "POST",
        body: { items: chosen.map((i) => ({ variantId: i.variant, qty: qty[i.variant] })), reason, comments: comments.trim() || undefined, evidence: photos.map((p) => ({ publicId: p.publicId })) },
      });
      onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 10 }}>
      <p className="tax">Choose the items to return. Refunds are issued after we receive and check the items.</p>
      {items.map((i) => (
        <div className="line" key={i.variant}>
          <div className="mini">{i.image ? <img src={i.image} alt="" /> : null}</div>
          <div><h3>{i.name}</h3><p className="meta">{[i.color, i.size].filter(Boolean).join(" · ")}{i.returnable < i.ordered ? ` · ${i.ordered - i.returnable} already in a return` : ""}</p>
            <div className="row" style={{ alignItems: "center", gap: 10 }}>
              <label htmlFor={`rq-${i.variant}`} className="tax">Quantity to return</label>
              <select id={`rq-${i.variant}`} value={qty[i.variant]} disabled={!i.returnable} onChange={(e) => setQty((q) => ({ ...q, [i.variant]: Number(e.target.value) }))} style={{ height: 38, borderRadius: 10, border: "1.5px solid var(--line)", padding: "0 10px" }}>
                {Array.from({ length: i.returnable + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div></div>
        </div>
      ))}
      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="rq-reason">Reason <em>*</em></label>
        <select id="rq-reason" value={reason} onChange={(e) => setReason(e.target.value)} required>
          <option value="">Choose a reason</option>{RETURN_REASONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="rq-comments">Comments {reason === "other" && <em>*</em>}</label>
        <textarea id="rq-comments" value={comments} maxLength={1000} onChange={(e) => setComments(e.target.value)} placeholder="Anything that helps us — what's wrong, which part is damaged…" />
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor="rq-photos">Photos (optional, up to {MAX_PHOTOS})</label>
        {photos.length < MAX_PHOTOS && <input id="rq-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={addPhotos} style={{ height: "auto", padding: 10 }} />}
        {uploading && <p className="tax">Uploading…</p>}
        {!!photos.length && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
          {photos.map((p) => (
            <div key={p.publicId} style={{ position: "relative" }}>
              <img src={p.url} alt="Return photo" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10 }} />
              <button type="button" aria-label="Remove photo" onClick={() => setPhotos((all) => all.filter((x) => x.publicId !== p.publicId))} style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: "var(--ink)", color: "#fff", fontSize: 13 }}>×</button>
            </div>
          ))}
        </div>}
      </div>
      {error && <p className="err-t" role="alert">{error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button type="submit" className="btn btn-dark" disabled={busy || uploading}>{busy ? "Sending…" : "Submit return request"}</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  );
}

export default function OrderReturns({ orderNumber, deliveredOrder }) {
  const [data, setData] = useState(null);
  const [failure, setFailure] = useState("");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const load = useCallback(() => storeRequest(`/orders/${encodeURIComponent(orderNumber)}/returns`)
    .then((r) => setData(r.data)).catch((e) => setFailure(e.message)), [orderNumber]);
  useEffect(() => { if (deliveredOrder) load(); }, [load, deliveredOrder]);

  async function cancel(returnNumber) {
    if (!window.confirm("Cancel this return request?")) return;
    try {
      await storeRequest(`/returns/${encodeURIComponent(returnNumber)}/cancel`, { method: "POST", body: {} });
      setNotice("Return request cancelled.");
      load();
    } catch (e) {
      setFailure(e.message);
    }
  }

  if (!deliveredOrder && !data) return null;
  const e = data?.eligibility;
  return (
    <div style={{ marginTop: 18 }}>
      <h2>Returns</h2>
      {failure && <p className="err-t" role="alert">{failure}</p>}
      {notice && <p className="tax" role="status">{notice}</p>}
      {data?.returns.map((r) => (
        <div key={r.id} className="line" style={{ gridTemplateColumns: "1fr" }}>
          <div>
            <h3>{r.returnNumber} · {RETURN_STATUS[r.status] || r.status}</h3>
            <p className="meta">{r.items.map((i) => `${i.name} × ${i.qty}`).join(", ")} · {REASON_LABEL[r.reason] || r.reason} · {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
            {r.refund.status !== "not_applicable" && <p className="tax">{REFUND_STATUS[r.refund.status] || r.refund.status}{r.refund.amount ? ` · ${money(r.refund.amount)}` : ""}</p>}
            {r.rejectionReason && <p className="tax">Reason: {r.rejectionReason}</p>}
            {r.status === "requested" && <button type="button" className="btn btn-ghost" style={{ minHeight: 38, padding: "6px 14px", marginTop: 8 }} onClick={() => cancel(r.returnNumber)}>Cancel request</button>}
          </div>
        </div>
      ))}
      {e && !open && (e.eligible
        ? <>
          <p className="tax">You can return items until {new Date(e.returnBy).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ({e.returnDays}-day returns).</p>
          <button type="button" className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => { setOpen(true); setNotice(""); }}>Request a return</button>
        </>
        : !data.returns.length && <p className="tax">{e.reason}</p>)}
      {open && e && <ReturnForm orderNumber={orderNumber} items={e.items.filter((i) => i.returnable > 0)} onCancel={() => setOpen(false)}
        onDone={() => { setOpen(false); setNotice("Return requested. We'll review it and update you here."); load(); }} />}
    </div>
  );
}
