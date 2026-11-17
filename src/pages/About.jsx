import { pad, processSteps, values } from "../data.js";
import { Check } from "../components/Icons.jsx";
import { Eyebrow, PageHero, usePageMeta } from "../components/shared.jsx";
import Process from "../components/Process.jsx";

const approach = [
  ["Listen first", "We begin with your users, business priorities and existing ways of working."],
  ["Build together", "Clear milestones and regular conversations keep the work connected to your goals."],
  ["Think beyond launch", "Maintainability and future requirements inform the choices we make today."],
];

const reasons = [
  "Business-focused thinking",
  "User-centered design",
  "Clear project communication",
  "Quality-conscious delivery",
  "Maintainable solutions",
  "Ongoing support planning",
];

export default function About() {
  usePageMeta(
    "About Us",
    "Meet GLEITS, a Sri Lankan software development and technology solutions company built around innovation, quality and collaboration.",
  );

  return (
    <>
      <PageHero
        crumb="About Us"
        title="Good technology starts with a"
        accent="better understanding."
        description="We bring people, ideas and technology together to help businesses take their next step."
      />

      <section className="section" aria-labelledby="intro-title">
        <div className="wrap split">
          <div className="rv">
            <Eyebrow>Hello, we’re GLEITS</Eyebrow>
            <h2 id="intro-title" className="title-s">
              Local roots. A forward-looking mindset.
            </h2>
            <p className="body-l" style={{ marginTop: 28 }}>
              GLEITS (PVT) LTD is a Sri Lankan technology company focused on software development, IT solutions and
              digital transformation services.
            </p>
            <p className="body-l">
              We help startups, SMEs and organizations turn ideas into useful digital experiences. Our work brings
              together business understanding, thoughtful interface design and maintainable engineering.
            </p>
            <p className="body-l">
              From a business website to a connected enterprise platform, our starting point stays the same: understand
              the people and the problem before choosing the technology.
            </p>
          </div>
          <figure className="media media-wide rv">
            <img
              src="/images/team.webp"
              alt="A team collaborating on ideas around a shared workspace"
              data-parallax="0.1"
              loading="lazy"
              width="900"
              height="700"
            />
          </figure>
        </div>

        <div className="wrap grid-2" style={{ marginTop: "clamp(64px, 8vw, 112px)", gap: 24 }}>
          <article className="card card-blue statement rv">
            <h2 className="label-mono" style={{ color: "var(--sky-pale)" }}>
              Our vision
            </h2>
            <p>
              To be a trusted technology partner that helps businesses explore new possibilities and create lasting
              value through digital innovation.
            </p>
          </article>
          <article className="card statement rv">
            <h2 className="label-mono" style={{ color: "var(--sky-pale)" }}>
              Our mission
            </h2>
            <p>
              To turn business challenges into practical digital solutions through thoughtful design, collaborative
              development and a commitment to continuous improvement.
            </p>
          </article>
        </div>
      </section>

      <section className="section section-alt" aria-labelledby="val-title">
        <div className="wrap">
          <div className="rv" style={{ maxWidth: 780 }}>
            <Eyebrow>What guides our work</Eyebrow>
            <h2 id="val-title" className="title">
              Our values, in every decision.
            </h2>
            <p className="lead">The principles behind how we collaborate, solve problems and build.</p>
          </div>
          <div className="values-grid">
            {values.map(([title, text], i) => (
              <article key={title} className="card hover value-card rv">
                <span className="big" aria-hidden="true">
                  {pad(i)}
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="appr-title">
        <div className="wrap two-col">
          <div className="rv" style={{ flex: "1.3 1 480px" }}>
            <Eyebrow>A partnership with purpose</Eyebrow>
            <h2 id="appr-title" className="title-s">
              Your goals shape our approach.
            </h2>
            <p className="body-l" style={{ marginTop: 24, maxWidth: 620 }}>
              We see the best results when business context and technical decisions move together. You stay involved,
              informed and part of the conversation throughout your project.
            </p>
            <ol className="numbered">
              {approach.map(([t, d], i) => (
                <li key={t}>
                  <span aria-hidden="true">{pad(i)}</span>
                  <div>
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <aside className="card rv" aria-labelledby="why-title" style={{ flex: "1 1 360px", alignSelf: "flex-start", padding: "clamp(32px, 4vw, 48px)" }}>
            <div className="label-mono" style={{ color: "var(--sky-pale)" }}>
              Why choose GLEITS
            </div>
            <h3 id="why-title" style={{ marginTop: 20, fontSize: 30, lineHeight: 1.15, letterSpacing: "-0.03em" }}>
              Clarity, care and a shared direction.
            </h3>
            <p style={{ marginTop: 14, color: "var(--muted)" }}>
              A technology partner should make your next step easier to understand.
            </p>
            <ul className="check-list">
              {reasons.map((r) => (
                <li key={r}>
                  <Check size={18} style={{ color: "var(--sky)", flex: "none" }} />
                  {r}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <Process steps={processSteps} />
    </>
  );
}
