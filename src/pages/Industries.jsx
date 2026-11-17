import { industries, pad } from "../data.js";
import { PageHero, usePageMeta } from "../components/shared.jsx";

export default function Industries() {
  usePageMeta(
    "Industries",
    "Technology solutions for retail, education, healthcare, travel, transport, sports, beauty, construction and enterprise organizations.",
  );

  return (
    <>
      <PageHero
        crumb="Industries"
        title="Technology solutions for"
        accent="every industry."
        description="Different businesses. Different challenges. A thoughtful approach to finding where technology can make a difference."
      >
        <nav className="ind-nav" aria-label="Industry sections">
          {industries.map((x) => (
            <a key={x.slug} href={`#${x.slug}`} className="choice">
              {x.name}
            </a>
          ))}
        </nav>
      </PageHero>

      <section aria-label="Industries we serve" style={{ padding: "clamp(40px, 6vw, 80px) 0 var(--section)" }}>
        <div className="wrap">
          {industries.map((x, i) => (
            <article key={x.slug} id={x.slug} className="ind-article rv" aria-labelledby={`h-${x.slug}`}>
              <div>
                <span className="big" aria-hidden="true">
                  {pad(i)}
                </span>
                <h2 id={`h-${x.slug}`}>{x.name}</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div>
                  <h3 className="label-mono">The challenge</h3>
                  <p>{x.challenge}</p>
                </div>
                <div>
                  <h3 className="label-mono blue">The opportunity</h3>
                  <p className="opp">{x.opportunity}</p>
                </div>
              </div>
              <div className="card ind-box">
                <h3 className="label-mono">Potential solutions &amp; applications</h3>
                <ul className="dot-list">
                  {x.solutions.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
