import { Link } from "react-router-dom";
import Art from "../components/Art";
import usePageMeta from "../hooks/usePageMeta";

export default function NotFound() {
  usePageMeta("Page not found | Shoponzy");
  return (
    <section className="section"><div className="container">
      <div className="empty"><div className="art"><Art kind="bag" color="#D5D5D5" category="essentials" /></div>
        <h2>We couldn’t find that page</h2><p>It may have moved, or the link may be out of date.</p>
        <Link className="btn btn-dark" to="/products">Shop all products</Link></div>
    </div></section>
  );
}
