import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { storeRequest } from "../api/storeApi";
import { totals } from "../utils/shop";
import { useCatalog } from "../context/CatalogContext";

export default function CouponForm() {
  const { store, products } = useCatalog();
  const { coupon, setCoupon, cart } = useStore();
  const [code, setCode] = useState(coupon?.code || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const t = totals(cart, coupon, "cod", products, store);

  async function submit(event) {
    event.preventDefault();
    const value = code.trim().toUpperCase();
    setError("");
    if (!value) return setCoupon(null);
    if (!/^[A-Z0-9_-]{3,30}$/.test(value)) return setError(`“${value}” isn’t a valid code.`);
    setBusy(true);
    try {
      setCoupon((await storeRequest(`/coupons/${encodeURIComponent(value)}`)).data);
    } catch (requestError) {
      setError(requestError.status === 429 ? "Too many attempts. Please wait a minute." : requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const message = error || (t.disc ? `${coupon.code} applied` : t.cmsg);
  return <div>
    <form className="coupon" onSubmit={submit}>
      <input placeholder="Coupon code" aria-label="Coupon code" value={code} onChange={(event) => setCode(event.target.value)} />
      <button disabled={busy}>{coupon ? "Change" : "Apply"}</button>
    </form>
    {message && <p className={`cmsg ${!error && t.disc ? "ok" : "bad"}`} role={error ? "alert" : "status"}>{message}</p>}
  </div>;
}
