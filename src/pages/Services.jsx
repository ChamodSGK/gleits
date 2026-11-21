import { Link } from "react-router-dom";
import { pad, services } from "../data.js";
import { ArrowUpRight } from "../components/Icons.jsx";
import { PageHero, usePageMeta } from "../components/shared.jsx";

function ServiceCard({ service, index, big }) {
  return (
    <Link to={`/services/${service.slug}`} className={`card svc-card rv${big ? " big" : ""}`}>
      <div className="card-top">
        <span className="n">{pad(index)}</span>
        <ArrowUpRight className="arrow-icon" size={big ? 28 : 22} strokeWidth={1.6} />
      </div>
      <div>
        <h3>{service.title}</h3>
        <p style={big ? { fontSize: 17, maxWidth: 460 } : undefined}>{service.short}</p>
        {big && (
          <ul className="pill-row" style={{ marginTop: 28 }}>
            {service.capabilities.map((c) => (
              <li key={c} className="pill pill-sans">
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}

export default function Services() {
  usePageMeta(
    "Services",
    "Software, web, mobile, enterprise, UI/UX, cloud, QA, SEO and design services from GLEITS, connected by one goal: helping your business move forward.",
  );

  return (
    <>
      <PageHero
        crumb="Our Services"
        title="The expertise to build"
        accent="what’s next."
        description="Comprehensive technology services, connected by one goal: helping your business move forward."
      />

      <section aria-labelledby="core-title" style={{ paddingTop: "clamp(80px, 10vw, 140px)" }}>
        <div className="wrap">
          <div className="section-head rv" style={{ gap: 16 }}>
            <h2 id="core-title" className="eyebrow">
              Core development · 01 to 04
            </h2>
            <span className="count">10 SERVICES · ONE TEAM</span>
          </div>
          <div className="grid-core">
            {services.slice(0, 4).map((s, i) => (
              <ServiceCard key={s.slug} service={s} index={i} big />
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="sup-title" style={{ padding: "clamp(64px, 8vw, 104px) 0 var(--section)" }}>
        <div className="wrap">
          <h2 id="sup-title" className="eyebrow rv">
            Design, infrastructure &amp; growth · 05 to 10
          </h2>
          <div className="grid-support">
            {services.slice(4).map((s, i) => (
              <ServiceCard key={s.slug} service={s} index={i + 4} />
            ))}
          </div>

          <div className="callout rv" style={{ marginTop: "clamp(64px, 8vw, 104px)" }}>
            <div>
              <h2>Not sure where to start?</h2>
              <p>Tell us about the problem you’re solving. We’ll help you find the right combination of services for your goals.</p>
            </div>
            <Link to="/contact" className="btn btn-primary">
              Talk to our team <ArrowUpRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
