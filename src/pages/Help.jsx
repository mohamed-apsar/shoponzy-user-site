import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import FormField, { PHONE_RE, normalisePhone } from "../components/FormField";
import { money } from "../utils/shop";
import { storeRequest } from "../api/storeApi";
import { usePageFx } from "../fx/usePageFx";
import usePageMeta from "../hooks/usePageMeta";
import { useCatalog } from "../context/CatalogContext";

/* Policy routes (/about, /shipping-policy, …) render this page scrolled to their section.
   Phase 6 moves the text into Manage Site → Pages & Policies. */
export const HELP_SECTIONS = {
  "track-order": ["track", "Order Tracking"], contact: ["contact", "Contact Us"], about: ["about", "About Us"],
  "order-cancellation": ["cancel", "Order Cancellation"],
  "shipping-policy": ["shipping", "Shipping Policy"], "return-policy": ["returns", "Return & Refund Policy"],
  "privacy-policy": ["privacy", "Privacy Policy"], terms: ["terms", "Terms & Conditions"], faqs: ["faq", "FAQs"],
};

const STATUS_LABELS = {
  placed: "Order placed", confirmed: "Confirmed", packed: "Packed", shipped: "Shipped",
  delivered: "Delivered", cancelled: "Cancelled", returned: "Returned",
};
const ORDER_ID_RE = /^SZ\d{6,9}$/;

/* FAQs are managed in the admin panel (FAQ Management); these show until any are added there. */
const FALLBACK_FAQS = [
  { id: "f1", question: "How do I place an order?", answer: "Add items to your bag, check out, and pay online or choose cash on delivery. You get an order ID straight away." },
  { id: "f2", question: "Is cash on delivery available?", answer: "Yes, on most PIN codes. Paying online gets you an extra 5% off." },
  { id: "f3", question: "How do I find my size?", answer: "Tap “Size guide” on any product page. If you’re between sizes, pick the larger one or ask us on WhatsApp." },
];
function Faqs() {
  const [faqs, setFaqs] = useState(FALLBACK_FAQS);
  useEffect(() => {
    let live = true;
    storeRequest("/faqs").then((r) => { if (live && r.data?.length) setFaqs(r.data); }).catch(() => {});
    return () => { live = false; };
  }, []);
  const groups = [...new Set(faqs.map((f) => f.category || ""))];
  return groups.map((g) => (
    <div key={g || "all"} className="acc" style={{ maxWidth: 860 }}>
      {groups.length > 1 && g && <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: "14px 0 6px" }}>{g}</h3>}
      {faqs.filter((f) => (f.category || "") === g).map((f) => (
        <details key={f.id}><summary>{f.question}</summary><div className="body" style={{ whiteSpace: "pre-line" }}>{f.answer}</div></details>
      ))}
    </div>
  ));
}

function TrackOrder() {
  const [values, setValues] = useState({ order: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (e) => { const { name, value } = e.target; setValues((v) => ({ ...v, [name]: value })); };
  const field = (name) => ({ name, id: `t-${name}`, value: values[name], onChange: update, error: errors[name] });

  async function submit(event) {
    event.preventDefault();
    const orderNumber = values.order.trim().toUpperCase(), er = {};
    if (!ORDER_ID_RE.test(orderNumber)) er.order = "Enter your order ID, e.g. SZ100001.";
    if (!PHONE_RE.test(normalisePhone(values.phone))) er.phone = "Enter the mobile number used at checkout.";
    setErrors(er);
    setFailure("");
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const response = await storeRequest("/orders/track", { method: "POST", body: { orderNumber, phone: values.phone } });
      setResult(response.data);
    } catch (error) {
      setResult(null);
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form two box" id="trackForm" noValidate onSubmit={submit} style={{ marginTop: 12 }}>
      <FormField label="Order ID" placeholder="e.g. SZ100001" {...field("order")} />
      <FormField label="Mobile number" inputMode="tel" {...field("phone")} />
      <div className="full"><button className="btn btn-dark btn-block" disabled={busy}>{busy ? "Checking…" : "Track order"}</button></div>
      {failure && <p className="err-t full" role="alert">{failure}</p>}
      {result && (
        <div className="full" role="status">
          <p><b>Order {result.orderNumber}</b> · {STATUS_LABELS[result.status] || result.status} · {money(result.total)} · {result.itemCount} item(s)</p>
          {result.fulfilment?.trackingNumber && <p className="tax">Courier: {result.fulfilment.courier || "—"} · Tracking no. {result.fulfilment.trackingNumber}
            {result.fulfilment.trackingUrl && <> · <a href={result.fulfilment.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>Track parcel</a></>}</p>}
          <ul className="tax">{result.history.map((h) => <li key={`${h.status}-${h.at}`}>{STATUS_LABELS[h.status] || h.status} — {new Date(h.at).toLocaleString("en-IN")}</li>)}</ul>
        </div>
      )}
    </form>
  );
}

function ContactForm() {
  const [values, setValues] = useState({ name: "", phone: "", topic: "Order question", order: "", msg: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (e) => { const { name, value } = e.target; setValues((v) => ({ ...v, [name]: value })); };
  const field = (name) => ({ name, id: `f-${name}`, value: values[name], onChange: update, error: errors[name] });

  async function submit(event) {
    event.preventDefault();
    const v = values, er = {};
    const orderNumber = v.order.trim().toUpperCase();
    if (v.name.trim().length < 2) er.name = "Enter your name.";
    if (!PHONE_RE.test(normalisePhone(v.phone))) er.phone = "Enter a valid 10-digit mobile number.";
    if (orderNumber && !ORDER_ID_RE.test(orderNumber)) er.order = "Check the order ID (e.g. SZ100001).";
    if (v.msg.trim().length < 5) er.msg = "Tell us a little more.";
    setErrors(er);
    setFailure("");
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await storeRequest("/contact", { method: "POST", body: { name: v.name.trim(), phone: v.phone, topic: v.topic, orderNumber, message: v.msg.trim() } });
      setSent(true);
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form two box" id="contactForm" noValidate onSubmit={submit}>
      {sent ? (
        <div className="success full" role="status"><div className="tick"><Icon name="i-check" /></div><b>Message sent</b>
          <p className="tax">Thanks! Our team will get back to you shortly.</p></div>
      ) : (
        <>
          <FormField label="Your name" required autoComplete="name" {...field("name")} />
          <FormField label="Mobile number" required inputMode="tel" {...field("phone")} />
          <FormField as="select" label="Topic" {...field("topic")}>
            {["Order question", "Return / exchange", "Product question", "Something else"].map((t) => <option key={t}>{t}</option>)}
          </FormField>
          <FormField label="Order ID" placeholder="e.g. SZ100001" {...field("order")} />
          <FormField as="textarea" label="Message" required full {...field("msg")} />
          {failure && <p className="err-t full" role="alert">{failure}</p>}
          <div className="full"><button className="btn btn-dark btn-block" disabled={busy}>{busy ? "Sending…" : "Send message"}</button></div>
        </>
      )}
    </form>
  );
}

export default function Help({ section }) {
  const { store: STORE } = useCatalog();
  const [anchor, title] = HELP_SECTIONS[section] || [];
  usePageMeta(title ? `${title} | Shoponzy` : "Help, Policies & Contact | Shoponzy");
  usePageFx([]);

  useEffect(() => {
    if (!anchor) return;
    // After Layout's scroll-to-top on navigation.
    const t = setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" }), 80);
    return () => clearTimeout(t);
  }, [anchor]);

  if (section) {
    let content;
    switch (section) {
      case "track-order": content = <><p>Enter your order ID and the mobile number used at checkout to see the latest status and courier tracking.</p><TrackOrder /></>; break;
      case "contact": content = <><p>Contact our team and we’ll get back to you shortly.</p><ContactForm /><p className="tax" style={{ marginTop: 12 }}>Email <a href={`mailto:${STORE.email}`} style={{ textDecoration: "underline" }}>{STORE.email}</a> · Call <a href={`tel:${STORE.phoneTel}`} style={{ textDecoration: "underline" }}>{STORE.phoneDisplay}</a></p></>; break;
      case "about": content = <p>Shoponzy brings shoes, sunglasses, perfumes, clothing, watches and everyday essentials together in one easy store, with honest prices and quick delivery.</p>; break;
      case "order-cancellation": content = <p>Orders can be cancelled before they are shipped. Contact us with your order ID to request a cancellation.</p>; break;
      case "shipping-policy": content = <ul><li>Orders are dispatched within 1–2 working days.</li><li>{STORE.deliveryText}.</li><li>Free delivery on orders above ₹999; a flat ₹59 applies below that.</li><li>Cash on delivery is available on most PIN codes.</li></ul>; break;
      case "return-policy": content = <ul><li>Return or exchange within 7 days of delivery, for unused items with original tags and packaging.</li><li>Perfumes, innerwear and items marked non-returnable can’t be returned once opened, for hygiene reasons.</li><li>Refunds for prepaid orders go back to the original payment method within 5–7 working days after the return is received.</li></ul>; break;
      case "privacy-policy": content = <p>We collect only the details needed to process and deliver your order (name, phone, address, email). We don’t sell your data. Your wishlist is stored in your own browser.</p>; break;
      case "terms": content = <p>Prices and offers can change without notice. Prices, stock and discounts are confirmed when the order is placed. Product colours may vary slightly from screen to screen.</p>; break;
      case "faqs": content = <Faqs />; break;
      default: content = <p>Find answers and contact options in our <a href="/help" style={{ textDecoration: "underline" }}>Help center</a>.</p>;
    }
    return <><div className="container page-title"><h1>{title}</h1><p>{section === "faqs" ? "Answers to common questions about shopping with Shoponzy." : "Shoponzy help and information."}</p></div><section className="section" style={{ paddingTop: 14 }}><div className="container prose" style={{ maxWidth: 860 }}>{content}</div></section></>;
  }

  return (
    <>
      <div className="container page-title"><h1>Help center</h1><p>Orders, returns, delivery and everything else.</p></div>
      {/* DRAFT POLICY TEXT: confirm every line with the store owner before launch (needed for payment gateway approval) */}
      <section className="section" style={{ paddingTop: 14 }}><div className="container">
        <div className="help-grid" data-stagger>
          <a className="help-card" href="#track"><Icon name="i-box" /><b>Track an order</b><span>Order ID + mobile number</span></a>
          <a className="help-card" href="#returns"><Icon name="i-refresh" /><b>Returns &amp; exchange</b><span>7 days, unused with tags</span></a>
          <a className="help-card" href="#contact"><Icon name="i-wa" /><b>Talk to us</b><span>{STORE.phoneDisplay}</span></a>
        </div>
        <div className="prose" style={{ maxWidth: 860, marginTop: 20 }}>
          <h2 id="track">Order tracking</h2><p>Enter your order ID and the mobile number you used at checkout to see the latest status and courier tracking.</p>
        </div>
        <div style={{ maxWidth: 860 }}><TrackOrder /></div>
        <div className="prose" style={{ maxWidth: 860, marginTop: 20 }}>
          <h2 id="cancel">Order cancellation</h2><p>Orders can be cancelled before they are shipped. Contact us with your order ID.</p>
          <h2 id="shipping">Shipping policy</h2><ul><li>Orders are dispatched within 1–2 working days.</li><li>{STORE.deliveryText}.</li><li>Free delivery on orders above ₹999; a flat ₹59 applies below that.</li><li>Cash on delivery is available on most PIN codes.</li></ul>
          <h2 id="returns">Return &amp; refund policy</h2><ul><li>Return or exchange within 7 days of delivery, for unused items with original tags and packaging.</li><li>Perfumes, innerwear and items marked non-returnable can’t be returned once opened, for hygiene reasons.</li><li>Refunds for prepaid orders go back to the original payment method within 5–7 working days after the return is received.</li></ul>
          <h2 id="privacy">Privacy policy</h2><p>We collect only the details needed to process and deliver your order (name, phone, address, email). We don’t sell your data. Your wishlist is stored in your own browser.</p>
          <h2 id="terms">Terms &amp; conditions</h2><p>Prices and offers can change without notice. Prices, stock and discounts are confirmed when the order is placed. Product colours may vary slightly from screen to screen.</p>
          <h2 id="about">About Shoponzy</h2><p>Shoponzy brings shoes, sunglasses, perfumes, clothing, watches and everyday essentials together in one easy store, with honest prices and quick delivery.</p>
          <h2 id="faq">FAQs</h2>
        </div>
        <Faqs />
        <div style={{ maxWidth: 860, marginTop: 30 }} id="contact"><h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: 12 }}>Contact us</h2>
          <ContactForm />
          <p className="tax" style={{ marginTop: 12 }}>Email <a href={`mailto:${STORE.email}`} style={{ textDecoration: "underline" }}>{STORE.email}</a> · Call <a href={`tel:${STORE.phoneTel}`} style={{ textDecoration: "underline" }}>{STORE.phoneDisplay}</a></p>
        </div>
      </div></section>
    </>
  );
}
