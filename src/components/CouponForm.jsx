import { useState } from "react";
import { useStore } from "../context/StoreContext";
import { storeRequest } from "../api/storeApi";
import { totals } from "../utils/shop";
import { useCatalog } from "../context/CatalogContext";

export default function CouponForm({ lines }) {
  const { store, products } = useCatalog();
  const { coupon, setCoupon, cart } = useStore();
  const [code, setCode] = useState(coupon?.code || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const t = totals(lines || cart, coupon, "cod", products, store);

  function removeCoupon() {
    setCoupon(null);
    setCode("");
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (busy || coupon) return;
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
      <input placeholder="Coupon code" aria-label="Coupon code" value={coupon?.code || code} readOnly={Boolean(coupon)} onChange={(event) => setCode(event.target.value)} />
      {coupon ? (
        <button type="button" disabled={busy} onClick={removeCoupon} aria-label={`Remove coupon ${coupon.code}`}>Remove</button>
      ) : (
        <button type="submit" disabled={busy}>{busy ? "Applying…" : "Apply"}</button>
      )}
    </form>
    {message && <p className={`cmsg ${!error && t.disc ? "ok" : "bad"}`} role={error ? "alert" : "status"}>{message}</p>}
  </div>;
}
