import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cartLineKey } from "../utils/checkout";
import Icon from "../components/Icon";
import Art from "../components/Art";
import ProductMedia from "../components/ProductMedia";
import { FreeDeliveryMeter, QtyControl } from "../components/sheets/CartSheet";
import { useStore } from "../context/StoreContext";
import { byId, linePrice, money, productUrl, totals } from "../utils/shop";
import usePageMeta from "../hooks/usePageMeta";
import { useCatalog } from "../context/CatalogContext";

export function EmptyBag({ heading = "Your bag is empty", text = "Explore new arrivals and bestsellers." }) {
  return (
    <div className="empty"><div className="art"><Art kind="bag" color="#D5D5D5" category="essentials" /></div>
      <h2>{heading}</h2><p>{text}</p><Link className="btn btn-dark" to="/products">Shop now</Link></div>
  );
}

export default function Cart() {
  usePageMeta("Your Bag | Shoponzy");
  const { products, store: STORE } = useCatalog();
  const { cart, coupon, setQty, removeLine, startCheckout } = useStore();
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState([]);
  const selected = cart.filter((line) => selectedKeys.includes(cartLineKey(line)));
  const t = totals(selected, coupon, "cod", products, STORE);

  return (
    <>
      <div className="container page-title"><h1>Your bag</h1></div>
      <section className="section" style={{ paddingTop: 10 }}><div className="container" id="cartWrap">
        {!cart.length ? <EmptyBag /> : (
          <div className="cart-l">
            <div><label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}><input type="checkbox" checked={selected.length === cart.length} onChange={(event) => setSelectedKeys(event.target.checked ? cart.map(cartLineKey) : [])} />Select all ({selected.length} of {cart.length})</label>{cart.map((l, i) => {
              const p = byId(l.id, products);
              return (
                <div className="line" key={`${l.id}|${l.c}|${l.s}`}>
                  <ProductMedia as={Link} to={productUrl(p)} className="mini" product={p} ci={l.c} />
                  <div><label style={{ display: "flex", alignItems: "center", gap: 10 }}><input type="checkbox" aria-label={`Select ${p.name}, ${p.colors[l.c][1]}, size ${l.s}`} checked={selectedKeys.includes(cartLineKey(l))} onChange={(event) => setSelectedKeys((current) => event.target.checked ? [...current, cartLineKey(l)] : current.filter((key) => key !== cartLineKey(l)))} /><h3><Link to={productUrl(p)}>{p.name}</Link></h3></label><p className="meta">{p.colors[l.c][1]} · Size {l.s}</p>
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
              {!selected.length && <p role="status">Select at least one item to check out.</p>}
              <button type="button" className="btn btn-dark btn-block" disabled={!selected.length} onClick={() => { startCheckout("cart", selected); navigate("/checkout?mode=cart"); }} style={{ marginTop: 12 }}>Checkout ({selected.length}) <Icon name="i-arrow" /></button>
            </aside>
          </div>
        )}
      </div></section>
    </>
  );
}
