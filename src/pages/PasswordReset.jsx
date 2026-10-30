import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FormField, { EMAIL_RE } from "../components/FormField";
import { storeRequest } from "../api/storeApi";
import usePageMeta from "../hooks/usePageMeta";

function Shell({ title, text, children }) {
  return (
    <>
      <div className="container page-title"><h1>{title}</h1><p>{text}</p></div>
      <section className="section" style={{ paddingTop: 12 }}><div className="container" style={{ maxWidth: 460 }}>{children}</div></section>
    </>
  );
}

export function ForgotPassword() {
  usePageMeta("Forgot password | Shoponzy");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setError("Enter a valid email address.");
    setError("");
    setBusy(true);
    try {
      setSent((await storeRequest("/auth/forgot-password", { method: "POST", body: { email: email.trim() } })).data.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell title="Forgot password" text="We’ll email you a link to set a new password.">
      {sent ? <div className="box" role="status"><p>{sent}</p><p className="tax" style={{ marginTop: 8 }}><Link to="/account" style={{ textDecoration: "underline" }}>Back to sign in</Link></p></div> : (
        <form className="box form" noValidate onSubmit={submit}>
          <FormField label="Email" type="email" id="fp-email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <button className="btn btn-dark btn-block" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
        </form>
      )}
    </Shell>
  );
}

export function ResetPassword() {
  usePageMeta("Set a new password | Shoponzy");
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    setError("");
    setBusy(true);
    try {
      await storeRequest("/auth/reset-password", { method: "POST", body: { token, password } });
      setDone(true);
    } catch (requestError) {
      setError(requestError.details?.length ? requestError.details.map((d) => d.message).join(" ") : requestError.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell title="Set a new password" text="Choose a password with at least 8 characters.">
      {done ? <div className="box" role="status"><p>Your password has been changed.</p><p style={{ marginTop: 10 }}><Link className="btn btn-dark" to="/account">Sign in</Link></p></div> : (
        <form className="box form" noValidate onSubmit={submit}>
          {!token && <p className="err-t">This reset link is incomplete. Please use the link from your email.</p>}
          <FormField label="New password" type="password" id="rp-password" name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
          <button className="btn btn-dark btn-block" disabled={busy || !token}>{busy ? "Saving…" : "Set password"}</button>
        </form>
      )}
    </Shell>
  );
}
