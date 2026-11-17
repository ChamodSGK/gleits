import { useState } from "react";
import { ArrowUpRight } from "../components/Icons.jsx";
import { Eyebrow, PageHero, isEmail, submitForm, usePageMeta } from "../components/shared.jsx";
import { Consent, Field, Honeypot, Success } from "../components/FormBits.jsx";

const empty = { name: "", email: "", phone: "", role: "", message: "", website: "" };

/** Careers form: text details only (no CV upload). Saved to data/applications.json. */
function CareersForm() {
  const [form, setForm] = useState(empty);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [message, setMessage] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!isEmail(form.email)) next.email = "Please enter a valid email address.";
    if (!form.role.trim()) next.role = "Let us know the kind of role you’re interested in.";
    if (form.message.trim().length < 20) next.message = "Please tell us a little more (at least 20 characters).";
    if (!consent) next.consent = "Please agree to the Privacy Policy to continue.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`c-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      await submitForm("/api/applications", form);
      setStatus("sent");
      setForm(empty);
      setConsent(false);
      requestAnimationFrame(() => document.getElementById("apply-form")?.scrollIntoView({ block: "start" }));
    } catch (err) {
      setMessage(err.message);
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="card form-card" id="apply-form">
        <Success
          title="Thank you for applying."
          text="Your details have been received. We’ll keep them on file and reach out when a relevant opportunity opens up."
          onReset={() => setStatus("idle")}
          resetLabel="Submit another"
        />
      </div>
    );
  }

  return (
    <form className="card form-card" id="apply-form" aria-labelledby="apply-title" onSubmit={onSubmit} noValidate>
      <h2 id="apply-title">Introduce yourself.</h2>
      <p className="hint">
        Share your details and what you are looking for. We will keep them on file and reach out when a relevant
        opportunity opens up. Fields marked <span className="req">*</span> are required.
      </p>
      <Honeypot value={form.website} onChange={set("website")} />
      <div className="fields">
        <Field id="c-name" label="Full name" required placeholder="Your full name" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} />
        <Field id="c-email" label="Email" type="email" required placeholder="you@example.com" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
        <Field id="c-phone" label="Phone" type="tel" placeholder="+94 7X XXX XXXX" autoComplete="tel" value={form.phone} onChange={set("phone")} />
        <Field id="c-role" label="Role of interest" required placeholder="e.g. Frontend Developer, UI/UX Designer" value={form.role} onChange={set("role")} error={errors.role} />
      </div>
      <div style={{ marginTop: 20 }}>
        <Field
          id="c-message"
          label="About you"
          textarea
          required
          placeholder="Tell us about your interests, experience, and what you’re looking for…"
          value={form.message}
          onChange={set("message")}
          error={errors.message}
        />
      </div>
      <Consent checked={consent} onChange={(e) => setConsent(e.target.checked)} error={errors.consent} purpose="for recruitment purposes" />
      {status === "error" && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Submit details"} <ArrowUpRight />
      </button>
    </form>
  );
}

export default function Careers() {
  usePageMeta("Careers", "Explore working with GLEITS and our approach to collaboration, continuous learning and thoughtful technology.");

  return (
    <>
      <PageHero
        crumb="Careers"
        title="Bring your curiosity."
        accent="Build what’s next."
        description="Great digital experiences start with people who care about the work and the people it serves."
      />

      <section className="section" aria-labelledby="grow-title" style={{ paddingBottom: "clamp(64px, 8vw, 112px)" }}>
        <div className="wrap split">
          <div className="rv">
            <Eyebrow>Grow with purpose</Eyebrow>
            <h2 id="grow-title" className="title-s">
              Good ideas come from working together.
            </h2>
            <p className="body-l" style={{ marginTop: 28 }}>
              We value clear communication, continuous learning and thoughtful problem solving. Our work brings design and
              engineering together around real business needs.
            </p>
            <p className="body-l">If that sounds like your way of working, we’d be glad to hear about your interests and experience.</p>
          </div>
          <figure className="media media-wide rv">
            <img src="/images/team.webp" alt="Colleagues sharing ideas in a collaborative office" data-parallax="0.1" loading="lazy" width="900" height="650" />
          </figure>
        </div>
      </section>

      <section aria-label="Apply" style={{ paddingBottom: "var(--section)" }}>
        <div className="wrap form-layout">
          <div className="card card-blue statement" style={{ flex: "1 1 340px", alignSelf: "flex-start" }}>
            <div className="label-mono" style={{ color: "var(--sky-pale)" }}>
              Current opportunities
            </div>
            <h2 style={{ marginTop: 20, fontSize: 34, lineHeight: 1.1, letterSpacing: "-0.03em" }}>Let’s start a conversation.</h2>
            <p style={{ marginTop: 16, font: "400 16.5px/1.65 var(--f-body)", letterSpacing: 0, color: "#d5e6f7" }}>
              There are no confirmed vacancies published at the moment. Send us your details and we will keep them on
              file. Role requirements, work arrangements and recruitment details will be shared when a vacancy is
              confirmed.
            </p>
          </div>
          <CareersForm />
        </div>
      </section>
    </>
  );
}
