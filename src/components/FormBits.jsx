import { Link } from "react-router-dom";
import { Check } from "./Icons.jsx";

/** Labelled text input / textarea with an inline error message. */
export function Field({ id, label, required, error, textarea, ...input }) {
  const Tag = textarea ? "textarea" : "input";
  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {label} {required && <span className="req" aria-hidden="true">*</span>}
      </label>
      <Tag
        id={id}
        className="input"
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        rows={textarea ? 5 : undefined}
        {...input}
      />
      {error && (
        <p id={`${id}-err`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** Hidden field bots tend to fill in; the server ignores submissions where it has a value. */
export function Honeypot({ value, onChange }) {
  return (
    <div className="honeypot" aria-hidden="true">
      <label htmlFor="website">Leave this field empty</label>
      <input id="website" name="website" tabIndex={-1} autoComplete="off" value={value} onChange={onChange} />
    </div>
  );
}

export function Consent({ checked, onChange, error, purpose }) {
  return (
    <>
      <label className="consent">
        <input type="checkbox" checked={checked} onChange={onChange} aria-invalid={error ? "true" : undefined} />
        <span>
          I agree to the <Link to="/privacy-policy">Privacy Policy</Link> and consent to GLEITS using these details {purpose}.
        </span>
      </label>
      {error && <p className="field-error">{error}</p>}
    </>
  );
}

export function Success({ title, text, onReset, resetLabel }) {
  return (
    <div className="success" role="status">
      <span className="tick">
        <Check size={30} strokeWidth={2.4} style={{ color: "#03101F" }} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      <button type="button" className="btn btn-ghost" onClick={onReset}>
        {resetLabel}
      </button>
    </div>
  );
}
