import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import Art from "../components/Art";
import ProductMedia from "../components/ProductMedia";
import { FreeDeliveryMeter, QtyControl } from "../components/sheets/CartSheet";
import { useStore } from "../context/StoreContext";
import { byId, linePrice, money, productUrl, totals } from "../utils/shop";
import { storeRequest } from "../api/storeApi";
import usePageMeta from "../hooks/usePageMeta";
import { useCatalog } from "../context/CatalogContext";

function CouponForm() {
  const { store: STORE, products } = useCatalog();
  const { coupon, setCoupon, cart } = useStore();
  const [code, setCode] = useState(coupon?.code || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const t = totals(cart, coupon, "cod", products, STORE);

  async function submit(event) {
    event.preventDefault();
    const c = code.trim().toUpperCase();
    setError("");
    if (!c) return setCoupon(null);
    if (!/^[A-Z0-9_-]{3,30}$/.test(c)) return setError(`“${c}” isn’t a valid code.`);
    setBusy(true);
    try {
      setCoupon((await storeRequest(`/coupons/${encodeURIComponent(c)}`)).data);
    } catch (requestError) {
      setError(requestError.status === 429 ? "Too many attempts. Please wait a minute." : requestError.message);
    } finally {
      setBusy(false);
    }
  }
  const msg = error || (t.disc ? `${coupon.code} applied` : t.cmsg);
  return (
    <>
      <form className="coupon" onSubmit={submit}><input placeholder="Coupon code" aria-label="Coupon code" value={code} onChange={(e) => setCode(e.target.value)} /><button disabled={busy}>{coupon ? "Change" : "Apply"}</button></form>
      <p className={`cmsg ${!error && t.disc ? "ok" : msg ? "bad" : ""}`}>{msg}</p>
    </>
  );
}

export function EmptyBag({ heading = "Your bag is empty", text = "Explore new arrivals and bestsellers." }) {
  return (
    <div className="empty"><div className="art"><Art kind="bag" color="#D5D5D5" category="essentials" /></div>
      <h2>{heading}</h2><p>{text}</p><Link className="btn btn-dark" to="/products">Shop now</Link></div>
  );
}

export default function Cart() {
  usePageMeta("Your Bag | Shoponzy");
  const { products, store: STORE } = useCatalog();
  const { cart, coupon, setQty, removeLine } = useStore();
  const t = totals(cart, coupon, "cod", products, STORE);

  return (
    <>
      <div className="container page-title"><h1>Your bag</h1></div>
      <section className="section" style={{ paddingTop: 10 }}><div className="container" id="cartWrap">
        {!cart.length ? <EmptyBag /> : (
          <div className="cart-l">
            <div>{cart.map((l, i) => {
              const p = byId(l.id, products);
              return (
                <div className="line" key={`${l.id}|${l.c}|${l.s}`}>
                  <ProductMedia as={Link} to={productUrl(p)} className="mini" product={p} ci={l.c} />
                  <div><h3><Link to={productUrl(p)}>{p.name}</Link></h3><p className="meta">{p.colors[l.c][1]} · Size {l.s}</p>
                    <div className="row"><QtyControl qty={l.qty} onChange={(d) => setQty(i, d)} onRemove={() => removeLine(i)} /><b>{money(linePrice(p, l) * l.qty)}</b></div>
                    <button type="button" className="rm" onClick={() => removeLine(i)}>Remove</button></div>
                </div>
              );
            })}</div>
            <aside className="summary"><h2>Order summary</h2>
              <FreeDeliveryMeter t={t} short />
              <div className="srow"><span>MRP total</span><span>{money(t.mrp)}</span></div>
              {t.mrp > t.sub && <div className="srow"><span>Discount on MRP</span><span className="save">−{money(t.mrp - t.sub)}</span></div>}
              {t.disc > 0 && <div className="srow"><span>Coupon {coupon.code}</span><span className="save">−{money(t.disc)}</span></div>}
              <div className="srow"><span>Delivery</span><span>{t.ship ? money(t.ship) : <span className="save">Free</span>}</span></div>
              {t.tax > 0 && <div className="srow"><span>Tax ({STORE.taxRate}%)</span><span>{money(t.tax)}</span></div>}
              <div className="srow total"><span>Total</span><span>{money(t.total)}</span></div>
              <p className="tax">Pay by UPI at checkout for an extra {STORE.prepaidOffPct}% off.</p>
              <CouponForm />
              <Link className="btn btn-dark btn-block" to="/checkout" style={{ marginTop: 12 }}>Checkout <Icon name="i-arrow" /></Link>
            </aside>
          </div>
        )}
      </div></section>
    </>
  );
}
