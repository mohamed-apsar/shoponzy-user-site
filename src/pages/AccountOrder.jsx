import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { storeRequest } from "../api/storeApi";
import { money } from "../utils/shop";
import usePageMeta from "../hooks/usePageMeta";
import { STATUS_LABELS } from "./Account";
import OrderReturns from "../components/OrderReturns";
import ConfirmDialog from "../components/ConfirmDialog";
import { useStore } from "../context/StoreContext";
import { useCatalog } from "../context/CatalogContext";
import OrderProductImage from "../components/OrderProductImage";

const CANCELLABLE = ["placed", "confirmed"];

export default function AccountOrder() {
  const { orderNumber } = useParams();
  usePageMeta(`Order ${orderNumber} | Shoponzy`);
  const [order, setOrder] = useState(null);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { addToCart, toast } = useStore();
  const { products } = useCatalog();
  const navigate = useNavigate();

  const load = useCallback(() => storeRequest(`/orders/${encodeURIComponent(orderNumber)}`)
    .then((r) => { setOrder(r.data.order); setFailure(""); })
    .catch((e) => setFailure(e.message)), [orderNumber]);
  useEffect(() => {
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") load(); };
    load();
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const timer = window.setInterval(refreshWhenVisible, 30_000);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.clearInterval(timer);
    };
  }, [load]);

  async function cancel() {
    setBusy(true);
    setFailure("");
    try {
      setOrder((await storeRequest(`/orders/${encodeURIComponent(orderNumber)}/cancel`, { method: "POST", body: {} })).data);
      setConfirmCancel(false);
    } catch (error) {
      setFailure(error.message);
      setConfirmCancel(false);
    } finally {
      setBusy(false);
    }
  }

  function reorder() {
    if (!order) return;
    setFailure("");
    let added = 0;
    order.items.forEach((item) => {
      const itemProductId = typeof item.product === "object" ? item.product?.id || item.product?._id : item.product;
      const product = products.find((candidate) => String(candidate.apiId) === String(itemProductId) || candidate.slug === item.slug);
      const itemVariantId = typeof item.variant === "object" ? item.variant?.id || item.variant?._id : item.variant;
      const variant = product?.variants.find((candidate) => String(candidate.id || candidate._id) === String(itemVariantId));
      const colorName = item.color || variant?.color || product?.colors[0]?.[1];
      const colorIndex = product?.colors.findIndex((color) => color[1] === colorName) ?? -1;
      const size = String(item.size || variant?.size || product?.sizes[0] || "");
      if (!product || !variant || colorIndex < 0 || !product.sizes.includes(size)) return;
      addToCart(product.id, colorIndex, size, item.qty);
      added += 1;
    });
    if (added) {
      if (added < order.items.length) toast(`${order.items.length - added} unavailable item(s) were skipped.`);
      navigate("/cart");
    }
    else setFailure("This order's products or variants are no longer available for reorder.");
  }

  const a = order?.shippingAddress || {};
  const f = order?.fulfilment || {};
  return (
    <>
      <div className="container page-title order-page-heading"><h1>Order {orderNumber}</h1>
        <p><Link to="/account?section=orders" style={{ textDecoration: "underline" }}>← Back to my orders</Link></p></div>
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
                  <OrderProductImage item={item} className="mini order-product-thumb" />
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
              <button type="button" className="btn btn-dark btn-block" style={{ marginTop: 14 }} onClick={reorder}>Reorder</button>
              {CANCELLABLE.includes(order.status) && (
                <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 10 }} disabled={busy} onClick={() => setConfirmCancel(true)}>{busy ? "Cancelling…" : "Cancel order"}</button>
              )}
            </aside>
          </div>
        )}
      </div></section>
      <ConfirmDialog open={confirmCancel} title="Cancel this order?" message="This order will be cancelled. Are you sure you want to continue?" confirmLabel="Yes, cancel order" busy={busy} onCancel={() => setConfirmCancel(false)} onConfirm={cancel} />
    </>
  );
}
