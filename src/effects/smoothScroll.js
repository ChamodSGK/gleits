import Lenis from "lenis";

/**
 * Inertial "buttery" scrolling via Lenis. It still moves the real page scroll,
 * so position: sticky, getBoundingClientRect and IntersectionObserver all keep working.
 * Touch devices keep native scrolling; reduced-motion users get none of this.
 */
let lenis = null;

export function startSmoothScroll() {
  if (lenis || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return lenis;
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.085, // lower = floatier
    smoothWheel: true,
    anchors: { offset: -96 }, // in-page #links glide and clear the sticky header
  });
  return lenis;
}

export function stopSmoothScroll() {
  lenis?.destroy();
  lenis = null;
}

export const getLenis = () => lenis;

/** Scroll to the top (instantly) or to an element (smoothly), with or without Lenis. */
export function scrollToTarget(target) {
  if (!target) {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  if (lenis) lenis.scrollTo(target, { offset: -96, force: true });
  else target.scrollIntoView();
}
