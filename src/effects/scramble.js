import { useEffect } from "react";

/**
 * "Decoding" text effect: characters flicker through random glyphs, then lock
 * into place left to right.
 *
 * - Small labels (eyebrows, mono labels, breadcrumbs…) decode when they scroll into view.
 * - Nav and footer links decode on hover.
 *
 * Only touches elements whose content is a single text node, and edits that node's
 * value in place, so React's DOM stays intact.
 */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>_";
const ON_VIEW = ".eyebrow, .hero-chip, .label-mono, .breadcrumb [aria-current], .stage, .project-industry, [data-scramble]";
const ON_HOVER = ".nav-link, .footer-links a, [data-scramble-hover]";

const running = new WeakSet();

function textNodeOf(el) {
  return el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE ? el.firstChild : null;
}

export function scramble(el, duration) {
  const node = textNodeOf(el);
  if (!node || running.has(el)) return;
  const final = node.nodeValue;
  if (!final.trim()) return;
  running.add(el);
  const len = final.length;
  const total = duration ?? Math.min(300 + len * 22, 1000);
  // Each character resolves at its own moment, roughly left to right
  const lockAt = Array.from(final, (_, i) => (i / len) * 0.75 + Math.random() * 0.25);
  const start = performance.now();
  let lastSwap = 0;

  const tick = (now) => {
    const p = (now - start) / total;
    if (p >= 1) {
      node.nodeValue = final;
      running.delete(el);
      return;
    }
    if (now - lastSwap > 40) {
      lastSwap = now;
      let out = "";
      for (let i = 0; i < len; i++) {
        const ch = final[i];
        out += ch === " " || p >= lockAt[i] ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      node.nodeValue = out;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Wires up both triggers; re-scans when `key` (the route) changes. */
export function useScramble(key) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            io.unobserve(e.target);
            scramble(e.target);
          }
        }),
      { threshold: 0.6 },
    );
    document.querySelectorAll(ON_VIEW).forEach((el) => textNodeOf(el) && io.observe(el));

    const onOver = (e) => {
      const el = e.target instanceof Element ? e.target.closest(ON_HOVER) : null;
      if (el && !(e.relatedTarget instanceof Node && el.contains(e.relatedTarget))) scramble(el, 420);
    };
    document.addEventListener("pointerover", onOver, { passive: true });

    return () => {
      io.disconnect();
      document.removeEventListener("pointerover", onOver);
    };
  }, [key]);
}
