import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";

export default function ComingSoon({ category }) {
  usePageMeta(`${category.name} is coming soon | Shoponzy`);
  return (
    <main className="coming-soon-page">
      <div className="coming-soon-card">
        <span className="coming-soon-kicker">SHOPONZY · {category.name.toUpperCase()}</span>
        <div className="coming-soon-icon" aria-hidden="true">✦</div>
        <h1>Coming soon</h1>
        <p>We’re getting {category.name} ready for you. Check back soon for the latest collection.</p>
        <Link className="btn btn-dark" to="/">Back to home</Link>
      </div>
    </main>
  );
}
