import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { budgets, company, projects, services } from "../data.js";
import { ArrowUpRight, Mail, Phone, Pin } from "../components/Icons.jsx";
import { Eyebrow, PageHero, isEmail, submitForm, usePageMeta } from "../components/shared.jsx";
import { Consent, Field, Honeypot, Success } from "../components/FormBits.jsx";

const serviceOptions = ["Not sure yet", ...services.map((s) => s.title), "Careers / general enquiry"];

/** Project enquiry form. Saved to data/enquiries.json by the Vite plugin. */
function EnquiryForm() {
  const [params] = useSearchParams();
  const fromService = services.find((s) => s.slug === params.get("service"))?.title;
  const fromProject = projects.find((p) => p.slug === params.get("project"))?.name;

  const initial = () => ({
    name: "",
    company: "",
    email: "",
    phone: "",
    service: fromService || "Not sure yet",
    budget: "Not sure yet",
    message: fromProject ? `I’d like to know more about ${fromProject}.` : "",
    website: "",
  });

  const [form, setForm] = useState(initial);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const pick = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!isEmail(form.email)) next.email = "Please enter a valid email address.";
    if (form.message.trim().length < 20) next.message = "Please describe your project (at least 20 characters).";
    if (!consent) next.consent = "Please agree to the Privacy Policy to continue.";
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`f-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      await submitForm("/api/enquiries", form);
      setStatus("sent");
      setForm(initial());
      setConsent(false);
      requestAnimationFrame(() => document.getElementById("enquiry-form")?.scrollIntoView({ block: "start" }));
    } catch (err) {
      setMessage(err.message);
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <div className="card form-card" id="enquiry-form">
        <Success
          title="Thank you for reaching out."
          text="We’ll review your requirements and get in touch to understand your goals."
          onReset={() => setStatus("idle")}
          resetLabel="Send another enquiry"
        />
      </div>
    );
  }

  return (
    <form className="card form-card" id="enquiry-form" aria-labelledby="form-title" onSubmit={onSubmit} noValidate>
      <h2 id="form-title">Tell us about your project.</h2>
      <p className="hint">
        Fields marked <span className="req">*</span> are required.
      </p>
      <Honeypot value={form.website} onChange={set("website")} />
      <div className="fields">
        <Field id="f-name" label="Full name" required placeholder="Your full name" autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} />
        <Field id="f-company" label="Company" placeholder="Your company name" autoComplete="organization" value={form.company} onChange={set("company")} />
        <Field id="f-email" label="Email" type="email" required placeholder="you@company.com" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
        <Field id="f-phone" label="Phone" type="tel" placeholder="+94 7X XXX XXXX" autoComplete="tel" value={form.phone} onChange={set("phone")} />
      </div>

      <fieldset className="field">
        <legend className="label">What can we help with?</legend>
        <div className="choices">
          {serviceOptions.map((o) => (
            <button key={o} type="button" className="choice" aria-pressed={form.service === o} onClick={() => pick("service", o)}>
              {o}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="label">Estimated budget</legend>
        <div className="choices">
          {budgets.map((o) => (
            <button key={o} type="button" className="choice" aria-pressed={form.budget === o} onClick={() => pick("budget", o)}>
              {o}
            </button>
          ))}
        </div>
      </fieldset>

      <div style={{ marginTop: 24 }}>
        <Field
          id="f-message"
          label="Project details"
          textarea
          required
          placeholder="Your goals, users, timeline and anything else we should know…"
          value={form.message}
          onChange={set("message")}
          error={errors.message}
        />
      </div>
      <Consent checked={consent} onChange={(e) => setConsent(e.target.checked)} error={errors.consent} purpose="to respond to my enquiry" />
      {status === "error" && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send enquiry"} <ArrowUpRight />
      </button>
    </form>
  );
}

export default function Contact() {
  usePageMeta(
    "Contact Us",
    "Discuss your next digital project with GLEITS. Call +94 71 554 4490 or send an enquiry to our team in Kadawatha, Sri Lanka.",
  );

  return (
    <>
      <PageHero
        crumb="Contact Us"
        title="Let’s build something"
        accent="great together."
        description="Have an idea, a challenge or a question? We’d love to hear it. Let’s explore what’s possible."
      />

      <section aria-label="Contact details and enquiry form" style={{ padding: "clamp(48px, 6vw, 80px) 0 clamp(80px, 10vw, 140px)" }}>
        <div className="wrap form-layout">
          <div className="form-aside">
            <div style={{ padding: "8px 0 16px" }}>
              <Eyebrow>Let’s start a conversation</Eyebrow>
              <h2 style={{ marginTop: 20, fontSize: "clamp(30px, 3.4vw, 44px)", lineHeight: 1.08, letterSpacing: "-0.035em" }}>
                Your next chapter starts here.
              </h2>
              <p style={{ marginTop: 16, fontSize: 17, color: "var(--muted)" }}>
                Tell us where you want to go. We’ll help you explore the technology that can get you there.
              </p>
            </div>
            <a className="card contact-method" href={company.phoneHref}>
              <span className="ico">
                <Phone size={20} strokeWidth={1.7} style={{ color: "var(--sky)" }} />
              </span>
              <span>
                <small>Give us a call</small>
                <strong>{company.phone}</strong>
              </span>
            </a>
            <a className="card contact-method" href={`mailto:${company.email}`}>
              <span className="ico">
                <Mail size={20} strokeWidth={1.7} style={{ color: "var(--sky)" }} />
              </span>
              <span>
                <small>Drop us a line</small>
                <strong>{company.email}</strong>
              </span>
            </a>
            <div className="card contact-method">
              <span className="ico">
                <Pin size={20} strokeWidth={1.7} style={{ color: "var(--sky)" }} />
              </span>
              <span>
                <small>Find us in Sri Lanka</small>
                <strong style={{ fontSize: 17 }}>{company.address}</strong>
              </span>
            </div>
            <div className="card card-blue next-steps">
              <h3>What happens next?</h3>
              <ol>
                <li>
                  <span>01</span>We review your requirements.
                </li>
                <li>
                  <span>02</span>We get in touch to understand your goals.
                </li>
                <li>
                  <span>03</span>Together, we explore the next step.
                </li>
              </ol>
            </div>
          </div>
          <EnquiryForm />
        </div>
      </section>
    </>
  );
}
