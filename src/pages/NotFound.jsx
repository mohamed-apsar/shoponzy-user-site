import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Art from "../components/Art";
import usePageMeta from "../hooks/usePageMeta";
import { storeRequest } from "../api/storeApi";

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  usePageMeta("Page not found | Shoponzy");
  useEffect(() => {
    let active = true;
    storeRequest("/seo/404", { method: "POST", body: { path: location.pathname } })
      .then(({ data }) => {
        if (!active || !data.redirectTo || data.redirectTo === location.pathname) return;
        if (data.redirectTo.startsWith("/")) navigate(data.redirectTo, { replace: true });
        else window.location.assign(data.redirectTo);
      })
      .catch((error) => console.error("Could not record this not-found page.", error));
    return () => { active = false; };
  }, [location.pathname, navigate]);
  return (
    <section className="section"><div className="container">
      <div className="empty"><div className="art"><Art kind="bag" color="#D5D5D5" category="essentials" /></div>
        <h2>We couldn’t find that page</h2><p>It may have moved, or the link may be out of date.</p>
        <Link className="btn btn-dark" to="/products">Shop all products</Link></div>
    </div></section>
  );
}
