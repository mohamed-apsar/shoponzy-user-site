import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";

const POLICIES = [
  ["/shipping-policy", "Shipping policy", "Delivery timelines, charges and shipping options."],
  ["/return-policy", "Return & refund policy", "Eligibility, exchanges and refund timelines."],
  ["/privacy-policy", "Privacy policy", "How Shoponzy handles customer information."],
  ["/terms", "Terms & conditions", "Terms that apply when shopping with Shoponzy."],
];

export default function Policy() {
  usePageMeta("Policies | Shoponzy");

  return <>
    <div className="container page-title">
      <h1>Shoponzy policies</h1>
      <p>Select a policy to view its details.</p>
    </div>
    <section className="section" style={{ paddingTop: 12 }}>
      <div className="container" style={{ maxWidth: 900, display: "grid", gap: 14 }}>
        {POLICIES.map(([to, title, description]) => <Link key={to} to={to} className="box" style={{ display: "block", padding: 20 }}>
          <h2 style={{ margin: "0 0 6px", fontSize: "1.1rem" }}>{title}</h2>
          <p className="tax" style={{ margin: 0 }}>{description}</p>
        </Link>)}
      </div>
    </section>
  </>;
}
