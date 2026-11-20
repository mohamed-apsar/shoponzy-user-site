import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { storeRequest } from "../api/storeApi";
import OrderTracking from "../components/OrderTracking";
import Icon from "../components/Icon";
import { useCustomer } from "../context/CustomerContext";
import usePageMeta from "../hooks/usePageMeta";

export default function AccountTracking() {
  const { orderNumber } = useParams();
  const { status } = useCustomer();
  const [result, setResult] = useState(null);
  const [failure, setFailure] = useState("");
  const id = encodeURIComponent(orderNumber);
  usePageMeta(`Track order ${orderNumber} | Shoponzy`);

  useEffect(() => {
    if (status === "loading") return;
    let active = true;
    let loading = false;
    setResult(null);
    setFailure("");
    async function load() {
      if (loading || document.visibilityState !== "visible") return;
      loading = true;
      try {
        const { data } = await storeRequest(`/orders/${id}`);
        if (active) { setResult(data.tracking || data.order); setFailure(""); }
      } catch (error) {
        if (active) { setResult(null); setFailure(error.message); }
      } finally {
        loading = false;
      }
    }
    load();
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", load);
    const timer = window.setInterval(load, 30_000);
    return () => {
      active = false;
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", load);
      window.clearInterval(timer);
    };
  }, [id, status]);

  return (
    <>
      <div className="container page-title order-page-heading">
        <Link className="btn order-back" to="/my-orders"><span className="order-back-icon"><Icon name="i-arrow" /></span>Back to My Orders</Link>
        <h1>Track your order</h1>
        <p>{orderNumber}</p>
      </div>
      <section className="section"><div className="container">
        {failure && <p className="err-t" role="alert">{failure}</p>}

        {result?.orderNumber === orderNumber.toUpperCase() ? <OrderTracking order={result} /> : !failure && <p role="status">Loading tracking…</p>}
      </div></section>
    </>
  );
}
