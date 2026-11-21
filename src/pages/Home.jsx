import { Fragment, useCallback, useState } from "react";
import HeroParticles from "../effects/HeroParticles.jsx";
import ScrollStory from "../effects/ScrollStory.jsx";
import { Link } from "react-router-dom";
import { industries, pad, processSteps, projects, services } from "../data.js";
import { ArrowRight, ArrowUpRight, Code, Heart, Shield, Waves } from "../components/Icons.jsx";
import { Eyebrow, usePageMeta } from "../components/shared.jsx";
import ProjectCard from "../components/ProjectCard.jsx";
import Process from "../components/Process.jsx";

/** Headline whose words rise into place one after another. */
function RiseWords({ text, accent }) {
  const words = text.split(" ").map((w) => [w, false]);
  if (accent) words.push([accent, true]);
  return words.map(([w, isAccent], i) => (
    <Fragment key={i}>
      <span className="rise" style={{ "--i": i }}>
        <span className={isAccent ? "grad" : undefined}>{w}</span>
      </span>{" "}
    </Fragment>
  ));
}

/** WebGL is used unless the visitor prefers reduced motion. */
const wantsMotion = () => typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Tabbed explorer: pick a service on the left, see the detail on the right. */
function ServiceExplorer() {
  const [sel, setSel] = useState(0);
  const cur = services[sel];

  // Arrow keys move between tabs (WAI-ARIA tabs pattern)
  const onKey = (e) => {
    const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const next = (sel + delta + services.length) % services.length;
    setSel(next);
    document.getElementById(`svc-tab-${next}`)?.focus();
  };

  return (
    <div className="explorer rv">
      <div className="svc-tabs" role="tablist" aria-label="Services" aria-orientation="vertical" onKeyDown={onKey}>
        {services.map((s, i) => (
          <button
            key={s.slug}
            id={`svc-tab-${i}`}
            role="tab"
            type="button"
            className="svc-tab"
            aria-selected={i === sel}
            aria-controls="svc-panel"
            tabIndex={i === sel ? 0 : -1}
            onClick={() => setSel(i)}
          >
            <span className="n">{pad(i)}</span>
            <span className="name">{s.title}</span>
            <span className="dot" aria-hidden="true" />
          </button>
        ))}
      </div>
      <div className="svc-panel" id="svc-panel" role="tabpanel" aria-labelledby={`svc-tab-${sel}`}>
        <div className="fade" key={cur.slug}>
          <div className="svc-panel-top">
            <span>SERVICE {pad(sel)} / {services.length}</span>
            <span>{cur.short}</span>
          </div>
          <h3>{cur.title}</h3>
          <p className="body-l" style={{ marginTop: 20, maxWidth: 620 }}>
            {cur.intro}
          </p>
        </div>
        <div className="svc-panel-grid fade" key={cur.slug + "-b"}>
          <div>
            <div className="label-mono">How we can help</div>
            <ul className="dot-list" style={{ marginTop: 18 }}>
              {cur.capabilities.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 24 }}>
            <div>
              <div className="label-mono">Typical stack</div>
              <ul className="pill-row">
                {cur.technologies.map((t) => (
                  <li key={t} className="pill">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <Link to={`/services/${cur.slug}`} className="btn btn-ghost" style={{ alignSelf: "flex-start" }}>
              Explore {cur.title} <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  usePageMeta(
    "",
    "GLEITS is a Sri Lankan technology company building thoughtful software, websites, mobile applications and digital experiences for business growth.",
  );
  const [fx, setFx] = useState(wantsMotion);
  const onFxFail = useCallback(() => setFx(false), []);

  return (
    <>
      {/* ============ HERO: one screen, centred; the ribbon flows behind everything ============ */}
      <section className="hero" aria-labelledby="hero-title">
        {fx ? <HeroParticles onFail={onFxFail} /> : <Waves className="hero-waves" />}
        <div className="orb" aria-hidden="true" />
        <div className="grid-bg" aria-hidden="true" />
        <svg className="grain" aria-hidden="true">
          <filter id="grain-f">
            <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-f)" />
        </svg>
        <div className="hero-shade" aria-hidden="true" />

        <div className="wrap hero-center">
          <h1 id="hero-title">
            <RiseWords text="Technology that moves your business" accent="forward." />
          </h1>
          <p className="lead">
            Thoughtful software. Connected experiences. A technology partner who sees the bigger picture and helps you
            build it.
          </p>
          <div className="btn-row">
            <Link to="/contact" className="btn btn-primary">
              Discuss your project <ArrowUpRight />
            </Link>
            <Link to="/services" className="btn btn-ghost">
              Explore our services <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ PILLARS (just below the first screen) ============ */}
      <section className="pillars" aria-label="Why GLEITS">
        <ul className="wrap">
          <li>
            <Code size={24} strokeWidth={1.6} style={{ color: "var(--sky)", flex: "none" }} />
            <div>
              <strong>Purpose-built solutions</strong>
              <span>Technology that fits your business</span>
            </div>
          </li>
          <li>
            <Shield size={24} strokeWidth={1.6} style={{ color: "var(--sky)", flex: "none" }} />
            <div>
              <strong>Quality at every step</strong>
              <span>Thoughtful design. Dependable delivery.</span>
            </div>
          </li>
          <li>
            <Heart size={24} strokeWidth={1.6} style={{ color: "var(--sky)", flex: "none" }} />
            <div>
              <strong>A partner, from day one</strong>
              <span>Your goals guide everything we build</span>
            </div>
          </li>
        </ul>
      </section>

      {/* ============ PINNED SCROLL STORY ============ */}
      <ScrollStory />

      {/* ============ SERVICES ============ */}
      <section className="section" aria-labelledby="svc-title">
        <div className="wrap">
          <div className="section-head rv">
            <div>
              <Eyebrow>01 · What we do</Eyebrow>
              <h2 id="svc-title" className="title">
                What would you like to build next?
              </h2>
              <p className="lead">Start with your goal. Explore the expertise that can help you get there.</p>
            </div>
            <Link to="/services" className="text-link">
              Discover our expertise <ArrowUpRight size={16} />
            </Link>
          </div>
          <ServiceExplorer />
        </div>
      </section>

      {/* ============ ABOUT ============ */}
      <section aria-labelledby="about-title" style={{ paddingBottom: "var(--section)" }}>
        <div className="wrap split">
          <figure className="media media-tall media-shade rv">
            <img
              src="/images/team.webp"
              alt="A collaborative team discussing a digital project in a modern office"
              data-parallax="0.12"
              loading="lazy"
              width="1000"
              height="1100"
            />
            <figcaption>
              <strong>
                Local roots.
                <br />
                <span className="grad">Global possibilities.</span>
              </strong>
              <span>
                COLLABORATION IS WHERE
                <br />
                INNOVATION BEGINS
              </span>
            </figcaption>
          </figure>
          <div className="rv">
            <Eyebrow>02 · The people behind the possibilities</Eyebrow>
            <h2 id="about-title" className="title-s">
              Your technology partner for digital growth.
            </h2>
            <p className="body-l" style={{ marginTop: 28 }}>
              Great technology starts with understanding your business. At GLEITS, we bring ideas, engineering and
              thoughtful design together to build digital solutions with purpose.
            </p>
            <p className="body-l">
              Based in Sri Lanka, we work with startups, SMEs and organizations ready to take their next step, with a
              collaborative approach that puts your goals first.
            </p>
            <ul className="chips">
              <li>Innovation with purpose</li>
              <li>Quality without compromise</li>
              <li>People at the heart of it</li>
            </ul>
            <Link to="/about" className="btn btn-primary" style={{ marginTop: 40 }}>
              Meet your technology partner <ArrowUpRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ WORK ============ */}
      <section className="section section-alt" aria-labelledby="work-title">
        <div className="wrap">
          <div className="section-head rv">
            <div>
              <Eyebrow>03 · Ideas in action</Eyebrow>
              <h2 id="work-title" className="title">
                Digital solutions. Real possibilities.
              </h2>
              <p className="lead">Explore the projects and solution ideas in our growing collection.</p>
            </div>
            <Link to="/portfolio" className="text-link">
              View our portfolio <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="grid-2" style={{ marginTop: 56 }}>
            {projects.slice(0, 2).map((p) => (
              <ProjectCard key={p.slug} project={p} className="rv" headingLevel="h3" />
            ))}
          </div>
        </div>
      </section>

      {/* ============ INDUSTRIES ============ */}
      <section className="section" aria-labelledby="ind-title">
        <div className="wrap two-col">
          <div className="rv">
            <Eyebrow>04 · Different industries. Shared ambition.</Eyebrow>
            <h2 id="ind-title" className="title">
              Your industry. Our next challenge.
            </h2>
            <p className="lead">
              Every business has its own challenges. We take the time to understand yours and shape technology around
              what matters.
            </p>
            <Link to="/industries" className="btn btn-ghost" style={{ marginTop: 36 }}>
              Explore all industries <ArrowUpRight size={16} />
            </Link>
          </div>
          <ul className="row-list rv">
            {industries.map((x, i) => (
              <li key={x.slug}>
                <Link to={`/industries#${x.slug}`} className="row-link">
                  <span className="n">{pad(i)}</span>
                  <span className="name">{x.name}</span>
                  <ArrowUpRight className="arrow-icon" size={20} strokeWidth={1.8} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============ TECHNOLOGIES ============ */}
      <section aria-labelledby="tech-title" style={{ paddingBottom: "var(--section)" }}>
        <div className="wrap section-head rv">
          <div>
            <Eyebrow>05 · The right tools. The right foundation.</Eyebrow>
            <h2 id="tech-title" className="title-s">
              Built with modern technologies.
            </h2>
            <p className="lead">A thoughtful technology choice starts with your project requirements.</p>
          </div>
          <Link to="/technologies" className="text-link">
            Explore the ecosystem <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      <Process steps={processSteps} />
    </>
  );
}
