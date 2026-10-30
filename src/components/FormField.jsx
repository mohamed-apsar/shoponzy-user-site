/* Labelled input with the original .field / .err markup. */
export default function FormField({ id, name, label, required, error, full, as = "input", children, ...props }) {
  const Tag = as;
  return (
    <div className={`field${full ? " full" : ""}`}>
      <label htmlFor={id}>{label} {required && <em>*</em>}</label>
      <Tag id={id} name={name} aria-invalid={error ? "true" : undefined} {...props}>{children}</Tag>
      <span className={`err${error ? " show" : ""}`} id={`e-${name}`}>{error}</span>
    </div>
  );
}

export const PHONE_RE = /^[6-9]\d{9}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const normalisePhone = (v = "") => v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
