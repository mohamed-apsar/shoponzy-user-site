import { money } from "../utils/shop";

const STAGES = [
  ["placed", "Order Placed"],
  ["confirmed", "Order Confirmed"],
  ["packed", "Processing"],
  ["shipped", "Shipped"],
  ["out_for_delivery", "Out for Delivery"],
  ["delivered", "Delivered"],
];

const RETURN_LABELS = {
  requested: "Return Requested",
  approved: "Return Approved",
  pickup_scheduled: "Pickup Scheduled",
  in_transit: "Return Picked Up",
  received: "Return Received",
  inspected: "Return Inspected",
  completed: "Return Completed",
  rejected: "Return Rejected",
  cancelled: "Return Cancelled",
};

const statusText = (status) => status?.replaceAll("_", " ");
const timestamp = (value) => new Date(value).toLocaleString("en-IN", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
});
export const deliveryDate = (value) => new Date(value).toLocaleDateString("en-IN", {
  dateStyle: "medium", timeZone: "Asia/Kolkata",
});

export default function OrderTracking({ order }) {
  const { fulfilment = {}, history = [], returns = [], refunds = [] } = order;
  const dates = new Map();
  for (const { status, at } of history) {
    if (status && at && !dates.has(status)) dates.set(status, at);
  }
  if (order.placedAt && !dates.has("placed")) dates.set("placed", order.placedAt);
  if (fulfilment.shippedAt) dates.set("shipped", fulfilment.shippedAt);
  if (fulfilment.deliveredAt) dates.set("delivered", fulfilment.deliveredAt);
  const current = STAGES.findIndex(([status]) => status === order.status);
  const cancelled = order.status === "cancelled";
  const returned = order.status === "returned";
  const trackingUrl = /^https?:\/\//i.test(fulfilment.trackingUrl || "") ? fulfilment.trackingUrl : null;
  const status = STAGES[current]?.[1] || (cancelled ? "Order Cancelled" : returned ? "Order Returned" : "Awaiting payment");

  return (
    <div className="order-tracking-view">
      <section className="box" aria-label="Delivery progress">
        <h2>Delivery progress</h2>
        <p className="tracking-current">{status}</p>
        {cancelled && (
          <p className="tax">{dates.has("cancelled") && <time dateTime={dates.get("cancelled")}>{timestamp(dates.get("cancelled"))}</time>}
            {order.cancelReason && <><br />{order.cancelReason}</>}</p>
        )}
        {!cancelled && <ol className="tracking-timeline">
          {STAGES.map(([key, label], index) => {
            const at = dates.get(key);
            const active = index === current;
            const complete = !!at && !active && (current < 0 || index < current);
            const state = active ? "current" : complete ? "complete" : "pending";
            const detail = active ? "Current status" : complete ? "Completed" : returned || index < current ? "No update recorded" : "Pending";
            return (
              <li key={key} className={state} aria-current={active ? "step" : undefined}>
                <span className="tracking-marker" aria-hidden="true">{complete ? "✓" : ""}</span>
                <div><strong>{label}</strong><p className="tax">{detail}{at && (active || complete) && <> · <time dateTime={at}>{timestamp(at)}</time></>}</p></div>
              </li>
            );
          })}
        </ol>}
      </section>
      <section className="box" aria-label="Shipment details">
        <h2>Shipment details</h2>
        <dl className="tracking-facts">
          <div><dt>Current status</dt><dd>{status}</dd></div>
          {fulfilment.courier && <div><dt>Courier company</dt><dd>{fulfilment.courier}</dd></div>}
          {fulfilment.trackingNumber && <div><dt>Tracking ID / AWB</dt><dd>{fulfilment.trackingNumber}</dd></div>}
          {dates.has("shipped") && <div><dt>Shipping date</dt><dd>{deliveryDate(dates.get("shipped"))}</dd></div>}
          {!cancelled && !returned && fulfilment.estimatedDeliveryDate && <div><dt>Estimated delivery</dt><dd>{deliveryDate(fulfilment.estimatedDeliveryDate)}</dd></div>}
        </dl>
        {trackingUrl && <a className="btn btn-ghost" href={trackingUrl} target="_blank" rel="noopener noreferrer">Track with Courier</a>}
      </section>
      {(returned || returns.length > 0 || refunds.length > 0 || order.refundRequired || order.refundedAmount > 0) && (
        <section className="box tracking-exceptions" aria-label="Returns and refunds">
          <h2>Returns and refunds</h2>
          {returned && !returns.length && <p>Order Returned</p>}
          {returns.map((request) => (
            <p key={request.returnNumber}><strong>{RETURN_LABELS[request.status] || statusText(request.status)}</strong> · {request.returnNumber}
              {request.updatedAt && <><br /><time className="tax" dateTime={request.updatedAt}>{timestamp(request.updatedAt)}</time></>}
              {request.refundStatus && request.refundStatus !== "not_applicable" && <><br />Refund {statusText(request.refundStatus)}{request.refundAmount > 0 && <> · {money(request.refundAmount)}</>}</>}
            </p>
          ))}
          {refunds.map((refund, index) => (
            <p key={index}>Refund {statusText(refund.status)} · {money(refund.amount)}
              {refund.at && <><br /><time className="tax" dateTime={refund.at}>{timestamp(refund.at)}</time></>}
            </p>
          ))}
          {order.refundedAmount > 0 && <p>{order.paymentStatus === "refunded" ? "Refunded" : "Amount refunded"} · {money(order.refundedAmount)}</p>}
          {order.refundRequired && <p>Refund pending</p>}
        </section>
      )}
    </div>
  );
}
