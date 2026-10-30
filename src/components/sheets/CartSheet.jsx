import { Link } from "react-router-dom";
import Sheet from "../Sheet";
import Icon from "../Icon";
import Art from "../Art";
import ProductMedia from "../ProductMedia";
import { useStore } from "../../context/StoreContext";
import { byId, linePrice, money, productUrl, totals } from "../../utils/shop";
import { useCatalog } from "../../context/CatalogContext";

export function FreeDeliveryMeter({ t, short = false }) {
  const { store } = useCatalog();
  const net = t.sub - t.disc, left = store.freeShippingAbove - net;
  const width = `${Math.min(100, (net / store.freeShippingAbove) * 100)}%`;
  return (
    <div className="meter">
      {left > 0
        ? short ? <>Add <b>{money(left)}</b> for <b>free delivery</b></> : <>You’re <b>{money(left)}</b> away from <b>free delivery</b></>
        : short ? <>🎉 <b>Free delivery</b> unlocked</> : <>🎉 You’ve unlocked <b>free delivery</b></>}
      <div className="bar"><i style={{ width }} /></div>
    </div>
  );
}

export function QtyControl({ qty, onChange }) {
  return (
    <div className="qty">
      <button type="button" aria-label="Decrease" onClick={() => onChange(-1)}>−</button><span>{qty}</span>
      <button type="button" aria-label="Increase" onClick={() => onChange(1)}>+</button>
    </div>
  );
}

export default function CartSheet() {
  const { products, store } = useCatalog();
  const { cart, coupon, setQty, removeLine } = useStore();
  const t = totals(cart, coupon, "cod", products, store);
  return (
    <Sheet id="cartSheet" variant="side" label="Bag">
      <div className="ph"><h2>Your bag</h2><button type="button" className="tool" data-close aria-label="Close"><Icon name="i-x" /></button></div>
      <div className="pb">
        {!cart.length ? (
          <div className="empty" style={{ background: "none" }}>
            <div className="art"><Art kind="bag" color="#DADADA" category="essentials" /></div>
            <b>Your bag is empty</b><p>Let’s fill it up.</p><Link className="btn btn-dark" to="/products" data-close>Start shopping</Link>
          </div>
        ) : (
          <>
            <FreeDeliveryMeter t={t} />
            {cart.map((l, i) => {
              const p = byId(l.id, products);
              return (
                <div className="dline" key={`${l.id}|${l.c}|${l.s}`}>
                  <ProductMedia as={Link} to={productUrl(p)} className="mini" product={p} ci={l.c} data-close />
                  <div><h4>{p.name}</h4><p className="meta">{p.colors[l.c][1]} · {l.s}</p>
                    <div className="row"><QtyControl qty={l.qty} onChange={(d) => setQty(i, d)} /><b>{money(linePrice(p, l) * l.qty)}</b></div>
                    <button type="button" className="rm" onClick={() => removeLine(i)}>Remove</button></div>
                </div>
              );
            })}
          </>
        )}
      </div>
      <div className="pf" hidden={!cart.length}>
        <div className="srow total" style={{ margin: 0, border: 0, padding: 0 }}><span>Subtotal</span><span>{money(t.sub - t.disc)}</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 10 }}>
          <Link className="btn btn-ghost" to="/cart" data-close>View bag</Link><Link className="btn btn-dark" to="/checkout" data-close>Checkout</Link>
        </div>
      </div>
    </Sheet>
  );
}
