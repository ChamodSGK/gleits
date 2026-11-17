import { useEffect } from "react";

/**
 * Depth parallax for images: any element with data-parallax="0.12" drifts
 * against the scroll inside its (overflow-hidden) parent. The image is
 * scaled up slightly so the drift never shows an edge.
 */
export function useParallax(key) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll("[data-parallax]"));
    if (!els.length) return;

    let raf = 0;
    const tick = () => {
      const vh = window.innerHeight;
      for (const el of els) {
        const frame = el.parentElement.getBoundingClientRect();
        if (frame.bottom < -100 || frame.top > vh + 100) continue;
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const offset = (frame.top + frame.height / 2 - vh / 2) * -speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.18)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key]);
}
