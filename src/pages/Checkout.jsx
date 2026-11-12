import { useEffect, useRef, useState } from "react";
import { useCustomer } from "../context/CustomerContext";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import ProductMedia from "../components/ProductMedia";
import FormField, { EMAIL_RE, PHONE_RE } from "../components/FormField";
import { useStore } from "../context/StoreContext";
import { ApiError, storeRequest } from "../api/storeApi";
import { byId, linePrice, money, totals } from "../utils/shop";
import { confetti } from "../fx/fx";
import usePageMeta from "../hooks/usePageMeta";
import { useCatalog } from "../context/CatalogContext";
import CouponForm from "../components/CouponForm";

const STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana", "Puducherry", "Maharashtra", "Delhi", "Gujarat", "West Bengal", "Other"];
const FIELDS = ["name", "phone", "email", "address", "city", "pincode", "state"];

function validate(v) {
  const er = {};
  if ((v.name || "").trim().length < 2) er.name = "Enter your full name.";
  if (!PHONE_RE.test(v.phone || "")) er.phone = "Enter a valid 10-digit mobile number using digits only.";
  if (v.email && !EMAIL_RE.test(v.email)) er.email = "Check the email address.";
  if ((v.address || "").trim().length < 8) er.address = "Enter house no., street and area.";
  if ((v.city || "").trim().length < 2) er.city = "Enter your city.";
  if (!/^\d{6}$/.test(v.pincode || "")) er.pincode = "Enter a 6-digit PIN code.";
  if (!v.state) er.state = "Choose your state.";
  return er;
}

function Summary({ cart, coupon, pay, products, store: STORE, submitting, formError }) {
  const t = totals(cart, coupon, pay, products, STORE);
  return (
    <aside className="summary" id="coSum"><h2>Your order</h2>
      {cart.map((l) => {
        const p = byId(l.id, products);
        return (
          <div className="dline" key={`${l.id}|${l.c}|${l.s}`}><ProductMedia className="mini" product={p} ci={l.c} />
            <div><h4>{p.name}</h4><p className="meta">{p.colors[l.c][1]} · {l.s} · Qty {l.qty}</p><b style={{ fontSize: ".88rem" }}>{money(linePrice(p, l) * l.qty)}</b></div></div>
        );
      })}
      <div style={{ marginTop: 10 }}>
        <div className="srow"><span>Subtotal</span><span>{money(t.sub)}</span></div>
        {t.disc > 0 && <div className="srow"><span>Coupon {coupon.code}</span><span className="save">−{money(t.disc)}</span></div>}
        {t.prepaid > 0 && <div className="srow"><span>Prepaid discount ({STORE.prepaidOffPct}%)</span><span className="save">−{money(t.prepaid)}</span></div>}
        <div className="srow"><span>Shipping</span><span>{t.ship ? money(t.ship) : <span className="save">Free</span>}</span></div>
        <CouponForm />
        <div className="srow"><span>Tax ({STORE.taxRate}%)</span><span>{money(t.tax)}</span></div>
        <div className="srow total"><span>Total</span><span>{money(t.total)}</span></div>
      </div>
      {formError && <p className="err-t" role="alert">{formError}</p>}
      <button className="btn btn-dark btn-block" type="submit" form="coForm" style={{ marginTop: 16, minHeight: 54 }} disabled={submitting}>
        {submitting ? "Placing your order…" : pay === "upi" ? "Pay & place order" : "Place order"}
      </button>
      <p className="tax" style={{ textAlign: "center", marginTop: 8 }}>Final prices, stock and discounts are confirmed when you place the order.</p>
    </aside>
  );
}

/* Finds the backend variant for a bag line (colour index + size label). Products without
   options are shown as "Default" / "One size" but stored with null colour/size. */
function variantFor(product, line) {
  const color = product.colors[line.c]?.[1];
  return product.variants.find((v) => (v.color ?? "Default") === color && (v.size ?? "One size") === line.s);
}

/* Replaces the server-side guest bag with the bag shown in the browser, so the order is
   priced from the database. Returns the names of lines that could not be added. */
async function syncServerCart(cart, coupon, products) {
  const current = await storeRequest("/cart");
  for (const line of current.data.lines) {
    await storeRequest(`/cart/items/${line.itemId}`, { method: "DELETE" });
  }
  const problems = [];
  for (const line of cart) {
    const p = byId(line.id, products);
    const variant = p && variantFor(p, line);
    if (!variant) { problems.push(`${p?.name || "An item"} is no longer available in this option.`); continue; }
    try {
      await storeRequest("/cart/items", { method: "POST", body: { productId: p.apiId, variantId: variant.id, qty: line.qty } });
    } catch (error) {
      problems.push(`${p.name} (${p.colors[line.c][1]}, ${line.s}): ${error.message}`);
    }
  }
  if (!problems.length) {
    try {
      await storeRequest("/cart/coupon", { method: "PUT", body: { code: coupon?.code || null } });
    } catch {
      // An expired or unknown coupon shouldn't block the order; it's simply not applied.
      await storeRequest("/cart/coupon", { method: "PUT", body: { code: null } });
    }
  }
  return problems;
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Online payment is unavailable.")));
    script.onerror = () => reject(new Error("Couldn't load the payment window. Check your connection and try again."));
    document.body.appendChild(script);
  });
}

/* Opens Razorpay Checkout; resolves with the verified order, or null if the shopper closes it. */
async function payOnline(order, payment, store) {
  const Razorpay = await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: payment.keyId, order_id: payment.razorpayOrderId, amount: payment.amount, currency: payment.currency,
      name: store.name || payment.name, description: payment.description, prefill: payment.prefill,
      theme: { color: "#FF4D2E" },
      handler: (result) => {
        storeRequest("/payments/razorpay/verify", {
          method: "POST",
          body: { orderNumber: order.orderNumber, razorpayOrderId: result.razorpay_order_id, razorpayPaymentId: result.razorpay_payment_id, razorpaySignature: result.razorpay_signature },
        }).then((r) => resolve(r.data.order), reject);
      },
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.on("payment.failed", (r) => reject(new Error(r?.error?.description || "Payment failed. Please try again.")));
    rzp.open();
  });
}

const newKey = () => (crypto.randomUUID?.() || `${Date.now()}${Math.random()}`).replace(/[^A-Za-z0-9]/g, "").slice(0, 40).padEnd(16, "0");

export default function Checkout() {
  const { products, store: STORE } = useCatalog();
  usePageMeta("Checkout | Shoponzy");
  const { cart, coupon, address, setAddress, clearCart } = useStore();
  const [values, setValues] = useState(() => ({ name: "", phone: "", email: "", address: "", city: "", pincode: "", state: "", ...(address || {}), pay: "upi" }));
  const [errors, setErrors] = useState({});
  const [placed, setPlaced] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  // One key per checkout attempt: a double click or retry returns the same order instead of a duplicate.
  const idempotencyKey = useRef(newKey());
  const { user, signedIn } = useCustomer();
  const [saveAddress, setSaveAddress] = useState(true);
  const [hasSavedAddress, setHasSavedAddress] = useState(false);

  // Signed-in shoppers: fill empty fields from the profile and the default saved address.
  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    const fill = (extra) => setValues((v) => {
      const next = { ...v };
      for (const [k, x] of Object.entries({ name: user.name, email: user.email, phone: user.phone, ...extra })) if (x && !next[k]) next[k] = x;
      return next;
    });
    fill({});
    storeRequest("/account/addresses").then((r) => {
      if (!active || !r.data.length) return;
      const a = r.data.find((x) => x.isDefault) || r.data[0];
      setHasSavedAddress(true);
      fill({ address: [a.line1, a.line2].filter(Boolean).join(", "), city: a.city, pincode: a.pincode, state: a.state });
    }).catch(() => {});
    return () => { active = false; };
  }, [signedIn, user]);

  const update = (event) => {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (name === "phone") {
      const phoneError = value.length > 10
          ? "Mobile number must be exactly 10 digits."
          : value && !/^\d+$/.test(value)
            ? "Use digits only for your mobile number."
          : value.length === 10 && !PHONE_RE.test(value)
            ? "Enter a valid 10-digit mobile number."
            : "";
      setErrors((er) => ({ ...er, phone: phoneError }));
    } else if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };
  const field = (name) => ({ name, id: `f-${name}`, value: values[name], onChange: update, error: errors[name] });

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    const er = validate(values);
    setErrors(er);
    setFormError("");
    const first = Object.keys(er)[0];
    if (first) return event.target.elements[first].focus();

    setAddress(Object.fromEntries(FIELDS.map((k) => [k, values[k]])));
    const v = values;
    setSubmitting(true);
    try {
      const problems = await syncServerCart(cart, coupon, products);
      if (problems.length) throw new Error(problems.join(" "));
      const result = await storeRequest("/orders", {
        method: "POST",
        body: {
          contact: { name: v.name.trim(), phone: v.phone, email: v.email.trim() },
          shippingAddress: { name: v.name.trim(), phone: v.phone, line1: v.address.trim(), city: v.city.trim(), state: v.state, pincode: v.pincode },
          paymentMethod: v.pay === "upi" ? "razorpay" : "cod",
          ...(signedIn && saveAddress && !hasSavedAddress ? { saveAddress: true } : {}),
          idempotencyKey: idempotencyKey.current,
        },
      });
      let order = result.data.order;
      if (order.paymentMethod === "razorpay" && order.paymentStatus !== "paid") {
        if (!result.data.payment) throw new Error("Online payment is unavailable right now. Please choose cash on delivery.");
        const paid = await payOnline(order, result.data.payment, STORE);
        if (!paid) {
          setFormError(`Payment was not completed. Your order ${order.orderNumber} is reserved for a short time — press Pay again to finish, or choose cash on delivery.`);
          idempotencyKey.current = newKey();
          return;
        }
        order = paid;
      }
      clearCart();
      idempotencyKey.current = newKey();
      setPlaced({ id: order.orderNumber, total: order.total, method: order.paymentMethod });
      confetti();
      scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const detail = error instanceof ApiError && error.details?.length ? ` ${error.details.map((d) => d.message).join(" ")}` : "";
      setFormError(`${error.message}${detail}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="container page-title"><h1>Checkout</h1><p>Pay online for an extra {STORE.prepaidOffPct}% off, or pay cash on delivery.</p></div>
      <section className="section" style={{ paddingTop: 12 }}><div className="container" id="coWrap">
        {placed ? (
          <div className="success box" role="status"><div className="tick"><Icon name="i-check" /></div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>Order placed!</h1>
            <p className="tax" style={{ fontSize: ".95rem" }}>
              {placed.method === "cod" ? <>Please keep <b>{money(placed.total)}</b> ready for cash on delivery.</> : <>We’ve received your payment of <b>{money(placed.total)}</b>.</>}
              {" "}Keep your order ID to track your order.
            </p>
            <span className="oid">Order {placed.id}</span>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
              <Link className="btn btn-dark" to={signedIn ? `/account/orders/${placed.id}` : "/track-order"}>{signedIn ? "View order" : "Track order"}</Link>
              <Link className="btn btn-ghost" to="/products">Keep shopping</Link>
            </div>
          </div>
        ) : !cart.length ? (
          <div className="empty"><h2>Your bag is empty</h2><p>Add something you love first.</p><Link className="btn btn-dark" to="/products">Shop now</Link></div>
        ) : (
          <div className="cart-l">
            <form id="coForm" noValidate style={{ display: "grid", gap: 16 }} onSubmit={submit}>
              <div className="box"><h2><span className="n">1</span>Contact</h2><div className="form two">
                <FormField label="Full name" required autoComplete="name" {...field("name")} />
                <FormField label="Mobile number" required inputMode="tel" autoComplete="tel" {...field("phone")} />
                <FormField label="Email" full type="email" autoComplete="email" {...field("email")} />
              </div></div>
              <div className="box"><h2><span className="n">2</span>Delivery address</h2><div className="form two">
                <FormField as="textarea" label="House no., street, area" required full rows={2} autoComplete="street-address" {...field("address")} />
                <FormField label="City" required autoComplete="address-level2" {...field("city")} />
                <FormField label="PIN code" required inputMode="numeric" maxLength={6} autoComplete="postal-code" {...field("pincode")} />
                <FormField as="select" label="State" required full {...field("state")}>
                  <option value="">Choose</option>{STATES.map((s) => <option key={s}>{s}</option>)}
                </FormField>
                {signedIn && !hasSavedAddress && (
                  <label className="full" style={{ display: "flex", gap: 8, alignItems: "center", fontSize: ".9rem" }}>
                    <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />Save this address to my account
                  </label>
                )}
              </div>
              {!signedIn && <p className="tax" style={{ marginTop: 10 }}>Have an account? <Link to="/account?next=/checkout" style={{ textDecoration: "underline" }}>Sign in</Link> to use your saved details and see this order later.</p>}
              </div>
              <div className="box"><h2><span className="n">3</span>Payment</h2>
                <div style={{ display: "grid", gap: 10 }}>
                  <label className="pay"><input type="radio" name="pay" value="upi" checked={values.pay === "upi"} onChange={update} /><span><b>Pay online (extra {STORE.prepaidOffPct}% off)</b><small>UPI, cards, netbanking or wallets — secured by Razorpay.</small></span></label>
                  <label className="pay"><input type="radio" name="pay" value="cod" checked={values.pay === "cod"} onChange={update} /><span><b>Cash on delivery</b><small>Pay when your parcel arrives.</small></span></label>
                </div>
              </div>
            </form>
            <Summary cart={cart} coupon={coupon} pay={values.pay} products={products} store={STORE} submitting={submitting} formError={formError} />
          </div>
        )}
      </div></section>
    </>
  );
}
