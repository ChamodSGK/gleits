import { pad } from "../data.js";
import { Eyebrow } from "./shared.jsx";

/** Seven-step delivery process, shown on Home and About. */
export default function Process({ steps }) {
  return (
    <section className="section process-section" aria-labelledby="proc-title" id="our-process">
      <div className="wrap">
        <div className="section-head rv">
          <div>
            <Eyebrow>A clear path forward</Eyebrow>
            <h2 id="proc-title" className="title">
              From the first conversation to what’s next.
            </h2>
          </div>
          <p style={{ fontSize: 17, color: "var(--muted)" }}>
            A collaborative process.
            <br />
            Care in every step.
          </p>
        </div>
        <ol className="process rv">
          {steps.map(([name, stage, text], i) => (
            <li key={name}>
              <div className="step-head" aria-hidden="true">
                <span>{pad(i)}</span>
                <span />
              </div>
              <h3>
                <span className="sr-only">Step {i + 1}: </span>
                {name}
              </h3>
              <div className="stage">{stage}</div>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
