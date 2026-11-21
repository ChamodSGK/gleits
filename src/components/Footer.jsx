import { Link, useLocation } from "react-router-dom";
import { company } from "../data.js";
import { ArrowUpRight, Waves } from "./Icons.jsx";

/** "Have an idea?" band shown above the footer on every page except Contact. */
function CtaBand() {
  return (
    <section className="cta-band" aria-labelledby="cta-title">
      <div className="cta-card">
        <Waves className="waves" color="#6FD0F7" />
        <span className="eyebrow">Let’s create what’s next</span>
        <h2 id="cta-title">
          Have an idea?
          <br />
          Let’s build it together.
        </h2>
        <p>Let’s discuss your business requirements and explore how technology can help you grow.</p>
        <Link to="/contact" className="btn btn-light">
          Contact GLEITS <ArrowUpRight />
        </Link>
      </div>
    </section>
  );
}

export default function Footer() {
  const { pathname } = useLocation();
  return (
    <>
      {pathname !== "/contact" && <CtaBand />}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" aria-label="GLEITS home" style={{ display: "inline-flex" }}>
                <img src="/logos/gleits-on-dark.png" alt="GLEITS" width="101" height="40" loading="lazy" />
              </Link>
              <p>
                Thoughtful technology.
                <br />
                Meaningful possibilities.
              </p>
              <p>{company.tagline}</p>
            </div>
            <nav aria-labelledby="f-explore">
              <h2 id="f-explore">EXPLORE</h2>
              <div className="footer-links">
                <Link to="/about">About GLEITS</Link>
                <Link to="/portfolio">Our work</Link>
                <Link to="/industries">Industries</Link>
                <Link to="/technologies">Technologies</Link>
                <Link to="/careers">Careers ↗</Link>
              </div>
            </nav>
            <nav aria-labelledby="f-do">
              <h2 id="f-do">WHAT WE DO</h2>
              <div className="footer-links">
                <Link to="/services/software-development">Software Development</Link>
                <Link to="/services/web-development">Web Development</Link>
                <Link to="/services/mobile-applications">Mobile Applications</Link>
                <Link to="/services/ui-ux-design">UI/UX Design</Link>
                <Link to="/services">All services ↗</Link>
              </div>
            </nav>
            <div>
              <h2>LET’S CONNECT</h2>
              <div className="footer-links">
                <a href={company.phoneHref}>{company.phone}</a>
                <a href={`mailto:${company.email}`}>{company.email}</a>
                <a href={company.website}>gleits.net</a>
                <address>
                  41/2/C East Lane,
                  <br />
                  Kadawatha, Sri Lanka.
                </address>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              © {new Date().getFullYear()} {company.name}. All rights reserved. · Based in Sri Lanka. Building for the world.
            </p>
            <nav aria-label="Legal">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms-and-conditions">Terms &amp; Conditions</Link>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
