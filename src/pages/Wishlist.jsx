import { Link } from "react-router-dom";
import Art from "../components/Art";
import { ProductList } from "../components/ProductCard";
import { useStore } from "../context/StoreContext";
import { byId } from "../utils/shop";
import usePageMeta from "../hooks/usePageMeta";
import { useCatalog } from "../context/CatalogContext";

export default function Wishlist() {
  const { products } = useCatalog();
  usePageMeta("Wishlist | Shoponzy");
  const { wish } = useStore();
  const list = wish.map((id) => byId(id, products)).filter(Boolean);
  return (
    <>
      <div className="container page-title"><h1>Wishlist</h1><p>{list.length} saved item{list.length === 1 ? "" : "s"}</p></div>
      <section className="section" style={{ paddingTop: 10 }}><div className="container">
        {list.length ? <ProductList id="wishGrid" className="grid g4" items={list} /> : (
          <div className="grid g4" id="wishGrid"><div className="empty">
            <div className="art"><Art kind="sneaker" color="#E0E0E0" category="shoes" /></div>
            <b>No favourites yet</b><p>Tap the heart on any product to save it here.</p><Link className="btn btn-dark" to="/products">Browse products</Link>
          </div></div>
        )}
      </div></section>
    </>
  );
}
