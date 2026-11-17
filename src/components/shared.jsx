import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Waves } from "./Icons.jsx";

const SITE = "GLEITS";

/** Sets the document title, meta description and Open Graph tags for a page. */
export function usePageMeta(title, description) {
  useEffect(() => {
    const full = title ? `${title} | ${SITE}` : `${SITE} — Software Development & Technology Solutions`;
    document.title = full;
    const set = (selector, attr, value) => {
      const el = document.head.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };
    set('meta[name="description"]', "content", description);
    set('meta[property="og:title"]', "content", full);
    set('meta[property="og:description"]', "content", description);
    set('meta[property="og:url"]', "content", `https://gleits.net${window.location.pathname}`);
  }, [title, description]);
}

/** Section label with the short leading rule, e.g. "— 01 · WHAT WE DO". */
export function Eyebrow({ children }) {
  return <span className="eyebrow">{children}</span>;
}

/**
 * Inner-page hero: breadcrumb, oversized title and intro.
 * `accent` is the trailing part of the title that gets the brand gradient.
 */
export function PageHero({ crumb, parent, title, accent, description, children }) {
  return (
    <section className="page-hero" aria-labelledby="page-title">
      <div className="orb" aria-hidden="true" />
      <Waves className="waves" />
      <div className="wrap">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link> <span aria-hidden="true">/</span>{" "}
          {parent && (
            <>
              <Link to={parent.href}>{parent.label}</Link> <span aria-hidden="true">/</span>{" "}
            </>
          )}
          <span aria-current="page">{crumb}</span>
        </nav>
        <h1 id="page-title">
          {title} {accent && <span className="grad">{accent}</span>}
        </h1>
        {description && <p className="lead">{description}</p>}
        {children}
      </div>
    </section>
  );
}

/**
 * Scroll-reveal: adds `.in` to every `.rv` element as it enters the viewport.
 * Re-runs when `key` (the route) changes so new pages are picked up.
 */
export function useReveal(key) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".rv:not(.in)"));
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);
}

/** Sends a form submission to the JSON-file endpoint defined in vite.config.js. */
export async function submitForm(endpoint, payload) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let body = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON response, e.g. a static host without the endpoint */
  }
  if (!res.ok || !body.ok) {
    throw new Error(body.error || "We couldn’t send your message right now. Please email or call us instead.");
  }
}

export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v.trim());
