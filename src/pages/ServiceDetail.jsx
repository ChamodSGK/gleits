import { Link, NavLink, useParams } from "react-router-dom";
import { industries, pad, services } from "../data.js";
import { ArrowLeft, ArrowUpRight } from "../components/Icons.jsx";
import { Eyebrow, usePageMeta } from "../components/shared.jsx";
import NotFound from "./NotFound.jsx";

export default function ServiceDetail() {
  const { slug } = useParams();
  const index = services.findIndex((s) => s.slug === slug);
  const s = services[index];
  usePageMeta(s ? s.title : "Service not found", s ? s.intro : "This service could not be found.");
  if (!s) return <NotFound />;

  const industrySlug = (name) => industries.find((x) => x.name === name)?.slug;

  return (
    <>
      {/* Quick switcher between all service pages */}
      <div className="switcher">
        <nav className="wrap" aria-label="All services">
          {services.map((x) => (
            <NavLink key={x.slug} to={`/services/${x.slug}`} className={({ isActive }) => "choice" + (isActive ? " active" : "")}>
              {x.title}
            </NavLink>
          ))}
        </nav>
      </div>

      <section className="page-hero" aria-labelledby="page-title" style={{ borderBottom: 0 }}>
        <div className="orb" aria-hidden="true" />
        <div className="wrap split" style={{ alignItems: "end", gap: 48 }}>
          <div>
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link> <span aria-hidden="true">/</span> <Link to="/services">Services</Link>{" "}
              <span aria-hidden="true">/</span> <span aria-current="page">{s.title}</span>
            </nav>
            <div style={{ marginTop: 32, font: "600 15px/1 var(--f-mono)", color: "var(--sky-soft)" }}>SERVICE {pad(index)}</div>
            <h1 id="page-title" style={{ marginTop: 16 }}>
              {s.title}
            </h1>
            <p className="lead">{s.intro}</p>
            <div className="btn-row" style={{ marginTop: 36 }}>
              <Link to={`/contact?service=${s.slug}`} className="btn btn-primary">
                Discuss your project <ArrowUpRight />
              </Link>
            </div>
          </div>
          <div className="card card-blue statement">
            <div className="label-mono" style={{ color: "var(--sky-pale)" }}>
              Designed around your business
            </div>
            <p style={{ marginTop: 20 }}>{s.short}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="help-title" style={{ padding: "clamp(64px, 8vw, 112px) 0", borderTop: "1px solid rgba(148,170,210,.1)" }}>
        <div className="wrap">
          <Eyebrow>Capabilities</Eyebrow>
          <h2 id="help-title" className="title-s">
            How we can help
          </h2>
          <ul className="cap-grid">
            {s.capabilities.map((c, i) => (
              <li key={c} className="card hover">
                <span aria-hidden="true">{pad(i)}</span>
                <h3>{c}</h3>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-label="Business value, technology and industries" style={{ paddingBottom: "var(--section)" }}>
        <div className="wrap">
          <div className="facts">
            <div>
              <h2>What this means for your business</h2>
              <p className="big-text">{s.benefit}</p>
            </div>
            <div>
              <h2>Technology considerations</h2>
              <ul className="pill-row" style={{ marginTop: 20 }}>
                {s.technologies.map((t) => (
                  <li key={t} className="pill">
                    {t}
                  </li>
                ))}
              </ul>
              <p style={{ marginTop: 20, fontSize: 14, color: "var(--dim)" }}>Final choices are made around your requirements.</p>
            </div>
            <div>
              <h2>Relevant industries</h2>
              <ul style={{ marginTop: 20 }}>
                {s.industries.map((d) => (
                  <li key={d}>
                    <Link
                      to={`/industries#${industrySlug(d) ?? ""}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 40, font: "500 18px/1.3 var(--f-display)", color: "var(--text)", textDecoration: "none" }}
                    >
                      {d} <span aria-hidden="true" style={{ color: "var(--sky)" }}>↗</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Link to="/services" className="btn btn-ghost" style={{ marginTop: 40 }}>
            <ArrowLeft size={16} /> Explore all services
          </Link>
        </div>
      </section>
    </>
  );
}
