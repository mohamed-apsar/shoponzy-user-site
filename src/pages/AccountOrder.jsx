import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { storeRequest } from "../api/storeApi";
import { money } from "../utils/shop";
import usePageMeta from "../hooks/usePageMeta";
import { STATUS_LABELS } from "./Account";
import OrderReturns from "../components/OrderReturns";

const CANCELLABLE = ["placed", "confirmed"];

export default function AccountOrder() {
  const { orderNumber } = useParams();
  usePageMeta(`Order ${orderNumber} | Shoponzy`);
  const [order, setOrder] = useState(null);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => storeRequest(`/orders/${encodeURIComponent(orderNumber)}`)
    .then((r) => setOrder(r.data.order)).catch((e) => setFailure(e.message)), [orderNumber]);
  useEffect(() => { load(); }, [load]);

  async function cancel() {
    if (!window.confirm("Cancel this order?")) return;
    setBusy(true);
    setFailure("");
    try {
      setOrder((await storeRequest(`/orders/${encodeURIComponent(orderNumber)}/cancel`, { method: "POST", body: {} })).data);
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }

  const a = order?.shippingAddress || {};
  const f = order?.fulfilment || {};
  return (
    <>
      <div className="container page-title"><h1>Order {orderNumber}</h1>
        <p><Link to="/account" style={{ textDecoration: "underline" }}>← Back to my account</Link></p></div>
      <section className="section" style={{ paddingTop: 12 }}><div className="container">
        {failure && <p className="err-t" role="alert">{failure}</p>}
        {!order ? !failure && <p className="tax">Loading…</p> : (
          <div className="cart-l">
            <div className="box" id="orderDetail">
              <h2>{STATUS_LABELS[order.status] || order.status}</h2>
              <p className="tax">Placed {new Date(order.placedAt || order.createdAt).toLocaleString("en-IN")} · {order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online"} ({order.paymentStatus.replace("_", " ")})</p>
              {f.trackingNumber && <p className="tax">Courier: {f.courier || "—"} · Tracking no. {f.trackingNumber}
                {f.trackingUrl && <> · <a href={f.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>Track parcel</a></>}</p>}
              {order.items.map((item, i) => (
                <div className="line" key={i}>
                  <div className="mini">{item.image ? <img src={item.image} alt="" /> : null}</div>
                  <div><h3>{item.name}</h3><p className="meta">{[item.color, item.size].filter(Boolean).join(" · ")} · Qty {item.qty}</p>
                    <div className="row"><span /><b>{money(item.lineTotal)}</b></div></div>
                </div>
              ))}
              <h2 style={{ marginTop: 18 }}>Deliver to</h2>
              <p className="tax">{a.name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}</p>
              <OrderReturns orderNumber={order.orderNumber} deliveredOrder={["delivered", "returned"].includes(order.status)} />
              <h2 style={{ marginTop: 18 }}>History</h2>
              <ul className="tax">{order.history.map((h, i) => <li key={i}>{STATUS_LABELS[h.status] || h.status} — {new Date(h.at).toLocaleString("en-IN")}{h.note ? ` · ${h.note}` : ""}</li>)}</ul>
            </div>
            <aside className="summary"><h2>Summary</h2>
              <div className="srow"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
              {order.couponDiscount > 0 && <div className="srow"><span>Coupon {order.couponCode}</span><span className="save">−{money(order.couponDiscount)}</span></div>}
              {order.prepaidDiscount > 0 && <div className="srow"><span>Prepaid discount</span><span className="save">−{money(order.prepaidDiscount)}</span></div>}
              <div className="srow"><span>Delivery</span><span>{order.shippingFee ? money(order.shippingFee) : <span className="save">Free</span>}</span></div>
              <div className="srow total"><span>Total</span><span>{money(order.total)}</span></div>
              {order.refundedAmount > 0 && <div className="srow"><span>Refunded</span><span>{money(order.refundedAmount)}</span></div>}
              {CANCELLABLE.includes(order.status) && (
                <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 14 }} disabled={busy} onClick={cancel}>{busy ? "Cancelling…" : "Cancel order"}</button>
              )}
            </aside>
          </div>
        )}
      </div></section>
    </>
  );
}
