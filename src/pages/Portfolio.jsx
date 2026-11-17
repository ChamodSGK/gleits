import { useState } from "react";
import { projectCategories, projects } from "../data.js";
import { PageHero, usePageMeta } from "../components/shared.jsx";
import ProjectCard from "../components/ProjectCard.jsx";

export default function Portfolio() {
  usePageMeta("Portfolio", "Explore GLEITS digital work, project collection and the solution ideas we are thinking about next.");
  const [cat, setCat] = useState("All");
  const shown = projects.filter((p) => cat === "All" || p.category === cat);

  return (
    <>
      <PageHero
        crumb="Our Portfolio"
        title="Ideas transformed into"
        accent="digital solutions."
        description="Explore our digital work, project collection and the possibilities we are thinking about next."
      />

      <section aria-label="Projects" style={{ padding: "clamp(48px, 6vw, 80px) 0 var(--section)" }}>
        <div className="wrap">
          <div className="filter-bar">
            <div role="group" aria-label="Filter by category">
              {projectCategories.map((c) => (
                <button key={c} type="button" className="choice" aria-pressed={c === cat} onClick={() => setCat(c)}>
                  {c}
                </button>
              ))}
            </div>
            <span className="count" aria-live="polite">
              {String(shown.length).padStart(2, "0")} / {String(projects.length).padStart(2, "0")} PROJECTS
            </span>
          </div>
          <div className="grid-3" style={{ marginTop: 40 }}>
            {shown.map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
          <p style={{ marginTop: 32, fontSize: 14, color: "var(--dim)" }}>
            Image labels show whether a visual is a stock photo, an industry illustration or a concept. Project scope and
            delivery details are shared on request.
          </p>
        </div>
      </section>
    </>
  );
}
