import { pad, technologyGroups } from "../data.js";
import { PageHero, usePageMeta } from "../components/shared.jsx";

export default function Technologies() {
  usePageMeta(
    "Technologies",
    "The frontend, backend, mobile, database, cloud, DevOps, testing, design and AI technologies GLEITS works with.",
  );

  return (
    <>
      <PageHero
        crumb="Technologies"
        title="The right technology for"
        accent="what comes next."
        description="An ecosystem of tools and approaches for building modern digital solutions. The best stack starts with your requirements."
      />

      <section className="section" aria-label="Technology groups">
        <div className="wrap grid-3" style={{ gap: 16 }}>
          {technologyGroups.map((g, i) => (
            <article key={g.name} className="card hover tech-group rv">
              <header>
                <h2>{g.name}</h2>
                <span className="count" aria-hidden="true">
                  {pad(i)} · {g.items.length}
                </span>
              </header>
              <p>{g.description}</p>
              <ul>
                {g.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="wrap" style={{ marginTop: "clamp(64px, 8vw, 104px)" }}>
          <div className="card card-blue banner rv">
            <h2>
              Requirements first.
              <br />
              <span>Technology second.</span>
            </h2>
            <p>
              A thoughtful technology choice starts with your project requirements: your users, your information and how
              your business needs to grow.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
