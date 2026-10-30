import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FormField, { EMAIL_RE, PHONE_RE, normalisePhone } from "../components/FormField";
import { useCustomer } from "../context/CustomerContext";
import { storeRequest } from "../api/storeApi";
import { money } from "../utils/shop";
import usePageMeta from "../hooks/usePageMeta";

export const STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana", "Puducherry", "Maharashtra", "Delhi", "Gujarat", "West Bengal", "Other"];
export const STATUS_LABELS = {
  pending_payment: "Awaiting payment", placed: "Order placed", confirmed: "Confirmed", packed: "Packed",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", returned: "Returned",
};
const grid = { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", alignItems: "start" };
const errorText = (error) => (error.details?.length ? error.details.map((d) => d.message).join(" ") : error.message);

/* Small helper for the forms on this page: values, per-field errors, a form-level error and busy state. */
function useForm(initial) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (e) => { const { name, value } = e.target; setValues((v) => ({ ...v, [name]: value })); setErrors((er) => ({ ...er, [name]: "" })); };
  const field = (prefix) => (name) => ({ name, id: `${prefix}-${name}`, value: values[name], onChange: update, error: errors[name] });
  async function run(check, action) {
    const er = check(values);
    setErrors(er);
    setFailure("");
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await action(values);
    } catch (error) {
      setFailure(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return { values, setValues, field, failure, setFailure, busy, run };
}

/* ---------------- Signed out ---------------- */
function SignIn({ onDone }) {
  const { signIn } = useCustomer();
  const f = useForm({ email: "", password: "" });
  const field = f.field("si");
  const submit = (e) => {
    e.preventDefault();
    f.run((v) => ({ ...(!EMAIL_RE.test(v.email) && { email: "Enter your email address." }), ...(!v.password && { password: "Enter your password." }) }),
      async (v) => { await signIn(v.email.trim(), v.password); onDone(); });
  };
  return (
    <form className="box form" id="signInForm" noValidate onSubmit={submit}>
      <h2>Sign in</h2>
      <FormField label="Email" type="email" autoComplete="email" required {...field("email")} />
      <FormField label="Password" type="password" autoComplete="current-password" required {...field("password")} />
      {f.failure && <p className="err-t" role="alert">{f.failure}</p>}
      <button className="btn btn-dark btn-block" disabled={f.busy}>{f.busy ? "Signing in…" : "Sign in"}</button>
      <p className="tax"><Link to="/forgot-password" style={{ textDecoration: "underline" }}>Forgot your password?</Link></p>
    </form>
  );
}

function Register({ onDone }) {
  const { register } = useCustomer();
  const f = useForm({ name: "", email: "", phone: "", password: "" });
  const field = f.field("rg");
  const submit = (e) => {
    e.preventDefault();
    f.run((v) => ({
      ...(v.name.trim().length < 2 && { name: "Enter your name." }),
      ...(!EMAIL_RE.test(v.email) && { email: "Enter a valid email address." }),
      ...(v.phone && !PHONE_RE.test(normalisePhone(v.phone)) && { phone: "Enter a valid 10-digit mobile number." }),
      ...(v.password.length < 8 && { password: "Use at least 8 characters." }),
    }), async (v) => {
      await register({ name: v.name.trim(), email: v.email.trim(), password: v.password, ...(v.phone ? { phone: v.phone } : {}) });
      onDone();
    });
  };
  return (
    <form className="box form" id="registerForm" noValidate onSubmit={submit}>
      <h2>Create an account</h2>
      <p className="tax" style={{ marginTop: -8 }}>Track orders, save addresses and keep your wishlist on every device.</p>
      <FormField label="Full name" autoComplete="name" required {...field("name")} />
      <FormField label="Email" type="email" autoComplete="email" required {...field("email")} />
      <FormField label="Mobile number (optional)" inputMode="tel" autoComplete="tel" {...field("phone")} />
      <FormField label="Password (8+ characters)" type="password" autoComplete="new-password" required {...field("password")} />
      {f.failure && <p className="err-t" role="alert">{f.failure}</p>}
      <button className="btn btn-dark btn-block" disabled={f.busy}>{f.busy ? "Creating…" : "Create account"}</button>
    </form>
  );
}

/* ---------------- Signed in ---------------- */
function Orders() {
  const [orders, setOrders] = useState(null);
  const [failure, setFailure] = useState("");
  useEffect(() => {
    storeRequest("/orders?limit=50").then((r) => setOrders(r.data)).catch((e) => setFailure(e.message));
  }, []);
  return (
    <div className="box" id="myOrders">
      <h2>My orders</h2>
      {failure && <p className="err-t">{failure}</p>}
      {!orders ? !failure && <p className="tax">Loading…</p> : !orders.length ? (
        <p className="tax">No orders yet. <Link to="/products" style={{ textDecoration: "underline" }}>Start shopping</Link></p>
      ) : orders.map((o) => (
        <Link key={o.orderNumber} to={`/account/orders/${o.orderNumber}`} className="srow" style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
          <span><b>{o.orderNumber}</b><br /><small className="tax">{new Date(o.placedAt || o.createdAt).toLocaleDateString("en-IN")} · {o.items.reduce((s, i) => s + i.qty, 0)} item(s)</small></span>
          <span style={{ textAlign: "right" }}>{money(o.total)}<br /><small className="tax">{STATUS_LABELS[o.status] || o.status}</small></span>
        </Link>
      ))}
    </div>
  );
}

function Profile() {
  const { user, setUser } = useCustomer();
  const f = useForm({ name: user.name || "", phone: user.phone || "" });
  const [saved, setSaved] = useState(false);
  const field = f.field("pf");
  const submit = (e) => {
    e.preventDefault();
    setSaved(false);
    f.run((v) => ({
      ...(v.name.trim().length < 2 && { name: "Enter your name." }),
      ...(v.phone && !PHONE_RE.test(normalisePhone(v.phone)) && { phone: "Enter a valid 10-digit mobile number." }),
    }), async (v) => {
      const r = await storeRequest("/account/profile", { method: "PATCH", body: { name: v.name.trim(), phone: v.phone } });
      setUser(r.data.user);
      setSaved(true);
    });
  };
  return (
    <form className="box form" id="profileForm" noValidate onSubmit={submit}>
      <h2>Profile</h2>
      <p className="tax" style={{ marginTop: -8 }}>{user.email}</p>
      <FormField label="Full name" autoComplete="name" {...field("name")} />
      <FormField label="Mobile number" inputMode="tel" autoComplete="tel" {...field("phone")} />
      {f.failure && <p className="err-t" role="alert">{f.failure}</p>}
      {saved && <p className="cmsg ok" role="status">Profile saved.</p>}
      <button className="btn btn-dark" disabled={f.busy}>{f.busy ? "Saving…" : "Save profile"}</button>
    </form>
  );
}

const emptyAddress = { label: "Home", name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" };
export function validateAddress(v) {
  const er = {};
  if ((v.name || "").trim().length < 2) er.name = "Enter the recipient's name.";
  if (!PHONE_RE.test(normalisePhone(v.phone || ""))) er.phone = "Enter a valid 10-digit mobile number.";
  if ((v.line1 || "").trim().length < 5) er.line1 = "Enter house no., street and area.";
  if ((v.city || "").trim().length < 2) er.city = "Enter your city.";
  if (!/^\d{6}$/.test(v.pincode || "")) er.pincode = "Enter a 6-digit PIN code.";
  if (!v.state) er.state = "Choose your state.";
  return er;
}

function Addresses() {
  const [list, setList] = useState(null);
  const [adding, setAdding] = useState(false);
  const [failure, setFailure] = useState("");
  const f = useForm(emptyAddress);
  const field = f.field("ad");
  const load = useCallback(() => storeRequest("/account/addresses").then((r) => setList(r.data)).catch((e) => setFailure(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function act(request) {
    setFailure("");
    try {
      setList((await request).data);
    } catch (error) {
      setFailure(errorText(error));
    }
  }
  const submit = (e) => {
    e.preventDefault();
    f.run(validateAddress, async (v) => {
      const body = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === "string" ? x.trim() : x]).filter(([k, x]) => x !== "" || k === "line2"));
      if (!body.line2) delete body.line2;
      setList((await storeRequest("/account/addresses", { method: "POST", body: { ...body, isDefault: !list?.length } })).data);
      f.setValues(emptyAddress);
      setAdding(false);
    });
  };

  return (
    <div className="box" id="myAddresses">
      <h2>Saved addresses</h2>
      {failure && <p className="err-t" role="alert">{failure}</p>}
      {list?.map((a) => (
        <div key={a.id} style={{ borderBottom: "1px solid var(--line)", padding: "10px 0" }}>
          <b>{a.label}</b>{a.isDefault && <span className="tax"> · Default</span>}
          <p className="tax">{a.name}, {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode} · {a.phone}</p>
          <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
            {!a.isDefault && <button type="button" className="view-all" onClick={() => act(storeRequest(`/account/addresses/${a.id}`, { method: "PATCH", body: { isDefault: true } }))}>Make default</button>}
            <button type="button" className="view-all" onClick={() => window.confirm("Delete this address?") && act(storeRequest(`/account/addresses/${a.id}`, { method: "DELETE" }))}>Delete</button>
          </div>
        </div>
      ))}
      {list && !list.length && !adding && <p className="tax">No saved addresses yet. You can also save one at checkout.</p>}
      {adding ? (
        <form className="form two" noValidate onSubmit={submit} style={{ marginTop: 12 }}>
          <FormField label="Label" placeholder="Home, Work…" {...field("label")} />
          <FormField label="Recipient name" required autoComplete="name" {...field("name")} />
          <FormField label="Mobile number" required inputMode="tel" {...field("phone")} />
          <FormField label="PIN code" required inputMode="numeric" maxLength={6} {...field("pincode")} />
          <FormField as="textarea" label="House no., street, area" required full rows={2} {...field("line1")} />
          <FormField label="Landmark (optional)" full {...field("line2")} />
          <FormField label="City" required {...field("city")} />
          <FormField as="select" label="State" required {...field("state")}><option value="">Choose</option>{STATES.map((s) => <option key={s}>{s}</option>)}</FormField>
          {f.failure && <p className="err-t full" role="alert">{f.failure}</p>}
          <div className="full" style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-dark" disabled={f.busy}>{f.busy ? "Saving…" : "Save address"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      ) : list && list.length < 10 && <button type="button" className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setAdding(true)}>+ Add address</button>}
    </div>
  );
}

function ChangePassword() {
  const f = useForm({ currentPassword: "", newPassword: "" });
  const [done, setDone] = useState(false);
  const field = f.field("pw");
  const submit = (e) => {
    e.preventDefault();
    setDone(false);
    f.run((v) => ({ ...(!v.currentPassword && { currentPassword: "Enter your current password." }), ...(v.newPassword.length < 8 && { newPassword: "Use at least 8 characters." }) }),
      async (v) => { await storeRequest("/account/password", { method: "POST", body: v }); f.setValues({ currentPassword: "", newPassword: "" }); setDone(true); });
  };
  return (
    <form className="box form" noValidate onSubmit={submit}>
      <h2>Change password</h2>
      <FormField label="Current password" type="password" autoComplete="current-password" {...field("currentPassword")} />
      <FormField label="New password (8+ characters)" type="password" autoComplete="new-password" {...field("newPassword")} />
      {f.failure && <p className="err-t" role="alert">{f.failure}</p>}
      {done && <p className="cmsg ok" role="status">Password changed. Other devices have been signed out.</p>}
      <button className="btn btn-ghost" disabled={f.busy}>{f.busy ? "Saving…" : "Change password"}</button>
    </form>
  );
}

export default function Account() {
  usePageMeta("My Account | Shoponzy");
  const { user, status, signOut } = useCustomer();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const done = () => { if (next && next.startsWith("/") && !next.startsWith("//")) navigate(next); else scrollTo({ top: 0 }); };

  return (
    <>
      <div className="container page-title">
        <h1>{user ? `Hi, ${user.name.split(" ")[0]}` : "My account"}</h1>
        <p>{user ? "Your orders, addresses and details." : "Sign in or create an account. You can also check out as a guest."}</p>
      </div>
      <section className="section" style={{ paddingTop: 12 }}><div className="container">
        {status === "loading" ? <p className="tax">Loading…</p> : !user ? (
          <div style={grid}><SignIn onDone={done} /><Register onDone={done} /></div>
        ) : (
          <div style={grid}>
            <div style={{ display: "grid", gap: 16 }}><Orders /><Addresses /></div>
            <div style={{ display: "grid", gap: 16 }}>
              <Profile />
              <ChangePassword />
              <button type="button" className="btn btn-ghost btn-block" onClick={async () => { await signOut(); navigate("/"); }}>Sign out</button>
            </div>
          </div>
        )}
      </div></section>
    </>
  );
}
