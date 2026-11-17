import { Link } from "react-router-dom";
import { ArrowUpRight } from "./Icons.jsx";

/** Project tile used on Home and Portfolio. Links to Contact, since project details are "on request". */
export default function ProjectCard({ project: p, className = "", headingLevel = "h2" }) {
  const Heading = headingLevel;
  return (
    <Link
      to={`/contact?project=${p.slug}`}
      className={`card project-card ${className}`}
      data-cursor="Ask us"
      aria-label={`${p.name} — ${p.status}. Ask us about this project`}
    >
      <div className="project-media">
        <img src={p.image} alt="" loading="lazy" width="800" height="600" />
        <span className="tag">{p.category}</span>
      </div>
      <div className="project-body">
        <div className="project-top">
          <span className="project-industry">{p.industry}</span>
          <ArrowUpRight className="arrow-icon" size={22} strokeWidth={1.7} />
        </div>
        <Heading>{p.name}</Heading>
        <p>{p.description}</p>
        <div className="project-meta">
          <span>{p.status}</span>
          <span>{p.preview}</span>
        </div>
      </div>
    </Link>
  );
}
