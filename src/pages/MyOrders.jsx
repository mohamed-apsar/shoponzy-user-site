import { Link, Navigate } from "react-router-dom";
import { useCustomer } from "../context/CustomerContext";
import usePageMeta from "../hooks/usePageMeta";
import { Orders } from "./Account";

export default function MyOrders() {
  const { status, signedIn } = useCustomer();
  usePageMeta("My Orders | Shoponzy");
  if (signedIn) return <Navigate to="/account?section=orders" replace />;
  return (
    <>
      <div className="container page-title">
        <h1>My Orders</h1>
        <p>View guest orders placed in this browser.</p>
      </div>
      <section className="section"><div className="container">
        {status === "loading" ? <p role="status">Loading orders…</p> : <Orders guest />}
        <p style={{ marginTop: 16 }}><Link className="view-all" to="/track-order">Find orders from another browser</Link></p>
      </div></section>
    </>
  );
}
