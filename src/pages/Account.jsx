import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FormField, { EMAIL_RE, PHONE_RE, normalisePhone } from "../components/FormField";
import Icon from "../components/Icon";
import { useCustomer } from "../context/CustomerContext";
import { storeRequest, storeUpload } from "../api/storeApi";
import { money } from "../utils/shop";
import usePageMeta from "../hooks/usePageMeta";
import OrderProductImage from "../components/OrderProductImage";

export const STATES = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana", "Puducherry", "Maharashtra", "Delhi", "Gujarat", "West Bengal", "Other"];
export const STATUS_LABELS = {
  pending_payment: "Awaiting payment", placed: "Order placed", confirmed: "Confirmed", packed: "Packed",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", returned: "Returned",
};
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
function SignIn({ onDone, onMode }) {
  const { signIn } = useCustomer();
  const f = useForm({ email: "", password: "" });
  const field = f.field("si");
  const submit = (e) => {
    e.preventDefault();
    f.run((v) => ({ ...(!EMAIL_RE.test(v.email) && { email: "Enter your email address." }), ...(!v.password && { password: "Enter your password." }) }),
      async (v) => { await signIn(v.email.trim(), v.password); onDone(); });
  };
  return (
    <form className="box form auth-card auth-signin" id="signInForm" noValidate onSubmit={submit}>
      <span className="auth-avatar" aria-hidden="true"><Icon name="i-user" /></span>
      <h2>Sign in</h2>
      <FormField label="Email" type="email" autoComplete="email" required {...field("email")} />
      <FormField label="Password" type="password" autoComplete="current-password" required {...field("password")} />
      {f.failure && <p className="err-t" role="alert">{f.failure}</p>}
      <button className="btn btn-dark btn-block" disabled={f.busy}>{f.busy ? "Signing in…" : "Sign in"}</button>
      <p className="tax"><Link to="/forgot-password" style={{ textDecoration: "underline" }}>Forgot your password?</Link></p>
      <p className="auth-switch">New to Shoponzy? <button type="button" onClick={() => onMode("signup")}>Create an account</button></p>
    </form>
  );
}

function Register({ onDone, onMode }) {
  const { register } = useCustomer();
  const f = useForm({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" });
  const field = f.field("rg");
  const submit = (e) => {
    e.preventDefault();
    f.run((v) => ({
      ...(v.firstName.trim().length < 1 && { firstName: "Enter your first name." }),
      ...(v.lastName.trim().length < 1 && { lastName: "Enter your last name." }),
      ...(!EMAIL_RE.test(v.email) && { email: "Enter a valid email address." }),
      ...(v.phone && !PHONE_RE.test(normalisePhone(v.phone)) && { phone: "Enter a valid 10-digit mobile number." }),
      ...(v.password.length < 8 && { password: "Use at least 8 characters." }),
      ...(v.confirmPassword !== v.password && { confirmPassword: "Passwords do not match." }),
    }), async (v) => {
      await register({ name: `${v.firstName.trim()} ${v.lastName.trim()}`, email: v.email.trim(), password: v.password, ...(v.phone ? { phone: v.phone } : {}) });
      onDone();
    });
  };
  return (
    <form className="box form two auth-card auth-signup" id="registerForm" noValidate onSubmit={submit}>
      <span className="auth-avatar" aria-hidden="true"><Icon name="i-user" /></span>
      <h2 className="full">Create an account</h2>
      <p className="tax full auth-intro">Track orders, save addresses and keep your wishlist on every device.</p>
      <FormField label="First name" autoComplete="given-name" required {...field("firstName")} />
      <FormField label="Last name" autoComplete="family-name" required {...field("lastName")} />
      <FormField label="Email address" type="email" autoComplete="email" required {...field("email")} />
      <FormField label="Mobile number (optional)" inputMode="tel" autoComplete="tel" {...field("phone")} />
      <FormField label="Password (8+ characters)" type="password" autoComplete="new-password" required {...field("password")} />
      <FormField label="Confirm password" type="password" autoComplete="new-password" required {...field("confirmPassword")} />
      {f.failure && <p className="err-t" role="alert">{f.failure}</p>}
      <button className="btn btn-dark btn-block full" disabled={f.busy}>{f.busy ? "Creating…" : "Create account"}</button>
      <p className="auth-switch full">Already have an account? <button type="button" onClick={() => onMode("login")}>Sign in</button></p>
    </form>
  );
}

/* ---------------- Signed in ---------------- */
function Orders() {
  const [orders, setOrders] = useState(null);
  const [failure, setFailure] = useState("");
  const load = useCallback(() => storeRequest("/orders?limit=50")
    .then((r) => { setOrders(r.data); setFailure(""); })
    .catch((e) => setFailure(e.message)), []);
  useEffect(() => {
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") load(); };
    load();
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const timer = window.setInterval(refreshWhenVisible, 30_000);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.clearInterval(timer);
    };
  }, [load]);
  return (
    <div className="box" id="myOrders">
      <h2>My orders</h2>
      <p className="tax">Order status updates refresh automatically.</p>
      {failure && <p className="err-t">{failure}</p>}
      {!orders ? !failure && <p className="tax">Loading…</p> : !orders.length ? (
        <div className="tax"><p>No orders are linked to this account yet.</p><p>If you checked out as a guest, your account email and phone must match the checkout details for those orders to appear.</p><button type="button" className="view-all" onClick={load}>Refresh orders</button> <Link to="/products" style={{ textDecoration: "underline" }}>Start shopping</Link></div>
      ) : orders.map((o) => (
        <Link key={o.orderNumber} to={`/account/orders/${o.orderNumber}`} className="srow account-order-row" style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
          <OrderProductImage item={o.items?.[0]} className="account-order-thumb" />
          <span><b>{o.orderNumber}</b><br /><small className="tax">{new Date(o.placedAt || o.createdAt).toLocaleDateString("en-IN")} · {o.items.reduce((s, i) => s + i.qty, 0)} item(s)</small></span>
          <span style={{ textAlign: "right" }}>{money(o.total)}<br /><small className="tax">{STATUS_LABELS[o.status] || o.status}</small></span>
        </Link>
      ))}
    </div>
  );
}

function Profile() {
  const { user, setUser } = useCustomer();
  const nameParts = (user.name || "").trim().split(/\s+/);
  const f = useForm({ firstName: nameParts[0] || "", lastName: nameParts.slice(1).join(" "), phone: user.phone || "" });
  const [saved, setSaved] = useState(false);
  const field = f.field("pf");
  const submit = (e) => {
    e.preventDefault();
    setSaved(false);
    f.run((v) => ({
      ...(v.firstName.trim().length < 1 && { firstName: "Enter your first name." }),
      ...(v.phone && !PHONE_RE.test(normalisePhone(v.phone)) && { phone: "Enter a valid 10-digit mobile number." }),
    }), async (v) => {
      const r = await storeRequest("/account/profile", { method: "PATCH", body: { name: [v.firstName.trim(), v.lastName.trim()].filter(Boolean).join(" "), phone: v.phone } });
      setUser(r.data.user);
      setSaved(true);
    });
  };
  return (
    <div className="account-profile-stack" id="profileForm">
      <form className="box form two account-profile-form" noValidate onSubmit={submit}>
      <h2 className="full">Profile Info</h2>
      <div className="account-profile-identity full"><span className="account-profile-avatar"><Icon name="i-user" /></span><b>{user.name}</b></div>
      <FormField label="First Name" autoComplete="given-name" required {...field("firstName")} />
      <FormField label="Last Name" autoComplete="family-name" {...field("lastName")} />
      <FormField label="Phone Number" inputMode="tel" autoComplete="tel" {...field("phone")} />
      <FormField id="profile-email" label="Email" type="email" value={user.email || ""} readOnly />
      {f.failure && <p className="err-t" role="alert">{f.failure}</p>}
      {saved && <p className="cmsg ok" role="status">Profile saved.</p>}
      <button className="btn btn-dark account-profile-submit full" disabled={f.busy}>{f.busy ? "Saving…" : "Update"}</button>
      </form>
      <ChangePassword />
      <Addresses />
    </div>
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

const TICKET_TYPES = ["Website problem", "Order issue", "Payment issue", "Delivery issue", "Return / exchange", "Product question", "Other"];
const TICKET_STATUS = { new: "Submitted", read: "In progress", replied: "Replied", closed: "Closed" };

function SupportTickets() {
  const [tickets, setTickets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [values, setValues] = useState({ subject: "", type: "Website problem", priority: "", message: "" });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try { setTickets((await storeRequest("/account/tickets")).data); }
    catch (error) { setFailure(error.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadTickets(); }, [loadTickets]);

  const update = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (values.subject.trim().length < 3) nextErrors.subject = "Enter a subject for your ticket.";
    if (!values.priority) nextErrors.priority = "Choose a priority.";
    if (values.message.trim().length < 10) nextErrors.message = "Describe the issue in at least 10 characters.";
    if (file && file.size > 5 * 1024 * 1024) nextErrors.attachment = "Choose an image smaller than 5 MB.";
    setErrors(nextErrors);
    setFailure("");
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      let attachment;
      if (file) {
        const uploaded = await storeUpload("/account/tickets/attachment", file);
        attachment = { publicId: uploaded.data.publicId, filename: uploaded.data.filename };
      }
      await storeRequest("/account/tickets", { method: "POST", body: { ...values, attachment } });
      setModalOpen(false);
      setValues({ subject: "", type: "Website problem", priority: "", message: "" });
      setFile(null);
      await loadTickets();
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="box account-support">
        <div className="support-ticket-head"><h2>Support ticket</h2><button type="button" className="btn btn-dark" onClick={() => { setFailure(""); setModalOpen(true); }}>Add New Ticket</button></div>
        {failure && !modalOpen && <p className="err-t" role="alert">{failure}</p>}
        {loading ? <p className="tax support-ticket-empty">Loading tickets…</p> : !tickets?.length ? (
          <div className="support-ticket-empty"><span className="support-empty-icon"><Icon name="i-mail" /></span><b>No Ticket Found!</b></div>
        ) : (
          <div className="support-ticket-list">
            {tickets.map((ticket) => (
              <article className="support-ticket-row" key={ticket.id}>
                <div className="support-ticket-row-main"><div><h3>{ticket.subject}</h3><p>{ticket.type} · {new Date(ticket.createdAt).toLocaleDateString("en-IN")}</p></div>
                  <div className="support-ticket-badges"><span className={`ticket-status status-${ticket.status}`}>{TICKET_STATUS[ticket.status] || ticket.status}</span><span className={`ticket-priority priority-${ticket.priority}`}>{ticket.priority}</span></div>
                </div>
                <p className="support-ticket-message">{ticket.message}</p>
                {ticket.attachment?.url && <a className="support-ticket-attachment" href={ticket.attachment.url} target="_blank" rel="noreferrer">{ticket.attachment.filename || "View attachment"}</a>}
                {!!ticket.replies?.length && <div className="support-ticket-replies"><b>Support reply</b><p>{ticket.replies[ticket.replies.length - 1].message}</p></div>}
              </article>
            ))}
          </div>
        )}
      </section>
      {modalOpen && (
        <div className="support-ticket-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setModalOpen(false); }}>
          <section className="support-ticket-modal" role="dialog" aria-modal="true" aria-labelledby="new-ticket-title">
            <header className="support-ticket-modal-head"><div><h2 id="new-ticket-title">Submit new ticket</h2><p>You will get a response.</p></div>
              <button type="button" className="tool" aria-label="Close" disabled={busy} onClick={() => setModalOpen(false)}>×</button>
            </header>
            <form className="form two support-ticket-form" noValidate onSubmit={submit}>
              <div className="full"><FormField label="Subject" required name="subject" id="ticket-subject" value={values.subject} error={errors.subject} onChange={update} /></div>
              <FormField as="select" label="Type" required name="type" id="ticket-type" value={values.type} onChange={update}>
                {TICKET_TYPES.map((type) => <option key={type}>{type}</option>)}
              </FormField>
              <FormField as="select" label="Priority" required name="priority" id="ticket-priority" value={values.priority} error={errors.priority} onChange={update}>
                <option value="">Choose priority</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </FormField>
              <FormField as="textarea" label="Describe your issue" required full rows={5} name="message" id="ticket-message" value={values.message} error={errors.message} onChange={update} />
              <div className="support-attachment-field full"><label htmlFor="ticket-attachment">Attachment <span>(optional image, up to 5 MB)</span></label>
                <label className="support-attachment-picker" htmlFor="ticket-attachment"><Icon name="i-plus" /><span>{file?.name || "Choose an image"}</span><input id="ticket-attachment" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={(event) => { setFile(event.target.files?.[0] || null); setErrors((current) => ({ ...current, attachment: "" })); }} /></label>
                {errors.attachment && <p className="field-error">{errors.attachment}</p>}
              </div>
              {failure && <p className="err-t full" role="alert">{failure}</p>}
              <div className="support-ticket-actions full"><button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setModalOpen(false)}>Close</button><button className="btn btn-dark" disabled={busy}>{busy ? "Submitting…" : "Submit a ticket"}</button></div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

export default function Account() {
  usePageMeta("My Account | Shoponzy");
  const { user, status } = useCustomer();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const next = params.get("next");
  const [authMode, setAuthMode] = useState(() => params.get("mode") === "signup" ? "signup" : "login");
  const accountSections = [
    ["orders", "My Order", "i-box"],
    ["profile", "My Profile", "i-user"],
    ["support", "Support Ticket", "i-wa"],
  ];
  const selectedSection = accountSections.some(([key]) => key === params.get("section")) ? params.get("section") : "profile";
  const selectSection = (section) => {
    const updated = new URLSearchParams(params);
    updated.set("section", section);
    updated.delete("mode");
    setParams(updated);
  };
  const switchAuthMode = (mode) => {
    setAuthMode(mode);
    const updated = new URLSearchParams(params);
    if (mode === "signup") updated.set("mode", "signup");
    else updated.delete("mode");
    setParams(updated, { replace: true });
  };
  const done = () => { if (next && next.startsWith("/") && !next.startsWith("//")) navigate(next); else scrollTo({ top: 0 }); };

  return (
    <>
      {user && <div className="container page-title"><h1>Hi, {user.name.split(" ")[0]}</h1><p>Your orders, addresses and details.</p></div>}
      <section className="section" style={{ paddingTop: 12 }}><div className="container">
        {status === "loading" ? <p className="tax">Loading…</p> : !user ? (
          <div className="auth-layout">
            {authMode === "signup"
              ? <Register onDone={done} onMode={switchAuthMode} />
              : <SignIn onDone={done} onMode={switchAuthMode} />}
          </div>
        ) : (
          <div className="account-dashboard">
            <aside className="account-sidebar" aria-label="Account sections">
              {accountSections.map(([key, label, icon]) => (
                <button type="button" key={key} className={`account-nav-item${selectedSection === key ? " active" : ""}`}
                  aria-current={selectedSection === key ? "page" : undefined} onClick={() => selectSection(key)}>
                  <Icon name={icon} /><span>{label}</span>
                </button>
              ))}
            </aside>
            <main className="account-panel">
              {selectedSection === "profile" && <Profile />}
              {selectedSection === "orders" && <Orders />}
              {selectedSection === "support" && <SupportTickets />}
            </main>
          </div>
        )}
      </div></section>
    </>
  );
}
