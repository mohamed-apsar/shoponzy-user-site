/* Labelled input with the original .field / .err markup. */
export default function FormField({ id, name, label, required, error, full, as = "input", children, ...props }) {
  const Tag = as;
  const phoneInput = Tag === "input" && name === "phone" && (props.inputMode === "tel" || props.type === "tel");
  const inputProps = phoneInput ? {
    ...props,
    type: "tel",
    inputMode: "numeric",
    pattern: "[0-9]*",
    ...(props.value !== undefined ? { value: String(props.value ?? "").replace(/\D/g, "") } : {}),
    onBeforeInput(event) {
      if (event.data?.length === 1 && /\D/.test(event.data)) event.preventDefault();
      props.onBeforeInput?.(event);
    },
    onChange(event) {
      event.target.value = event.target.value.replace(/\D/g, "");
      props.onChange?.(event);
    },
  } : props;
  return (
    <div className={`field${full ? " full" : ""}`}>
      <label htmlFor={id}>{label} {required && <em>*</em>}</label>
      <Tag id={id} name={name} aria-invalid={error ? "true" : undefined} {...inputProps}>{children}</Tag>
      <span className={`err${error ? " show" : ""}`} id={`e-${name}`}>{error}</span>
    </div>
  );
}

export const PHONE_RE = /^[6-9]\d{9}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const normalisePhone = (v = "") => v.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
