import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sheet from "../Sheet";
import Icon from "../Icon";
import ProductMedia from "../ProductMedia";
import OptionPicker from "../OptionPicker";
import { Price } from "../ProductCard";
import { useStore } from "../../context/StoreContext";
import { byId, productUrl, sizeIsAvailable, subOf } from "../../utils/shop";
import { useCatalog } from "../../context/CatalogContext";

export default function QuickAddSheet() {
  const { products, categories } = useCatalog();
  const { quickViewId, addToCart, closeSheet } = useStore();
  const navigate = useNavigate();
  const p = quickViewId ? byId(quickViewId, products) : null;
  const [opt, setOpt] = useState({ c: 0, s: "" });
  const picker = useRef(null);

  useEffect(() => {
    if (p) setOpt({ c: 0, s: p.sizes.length === 1 && sizeIsAvailable(p, 0, p.sizes[0]) ? p.sizes[0] : "" });
  }, [p]);

  function add() {
    if (picker.current.requireSize()) return;
    addToCart(p.id, opt.c, opt.s, 1, document.querySelector("#qvSheet .qv .media"));
    closeSheet("qvSheet");
    setTimeout(() => navigate("/cart"), 350);
  }

  return (
    <Sheet id="qvSheet" variant="center" label="Quick add">
      <div className="ph"><h2>Quick add</h2><button type="button" className="tool" data-close aria-label="Close"><Icon name="i-x" /></button></div>
      <div className="pb">
        {p && (
          <div className="qv">
            <ProductMedia as="div" className="media" product={p} ci={opt.c} />
            <div>
              <p className="brand" style={{ fontSize: ".75rem", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase" }}>{p.brand || subOf(p, categories)[1]}</p>
              <h3>{p.name}</h3>
              <div className="price" style={{ marginTop: 6 }}><Price p={p} colorIndex={opt.c} size={opt.s} /></div>
              <OptionPicker ref={picker} product={p} value={opt} onChange={setOpt} />
              <div className="buy">
                <button type="button" className="btn btn-dark" onClick={add}><Icon name="i-bag" />Add to bag</button>
                <Link className="btn btn-ghost" to={productUrl(p)} data-close>Details</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
