import { useEffect, useRef } from "react";

/**
 * Custom cursor + pointer micro-interactions. Mouse/trackpad only, and off for reduced motion.
 *
 * - A small dot tracks the pointer exactly; a ring follows with easing.
 * - Over links/buttons the ring grows; elements with data-cursor="View" show that label.
 * - Text inputs get the normal text cursor back.
 * - Magnetic: .btn, .menu-btn and [data-magnetic] lean toward the pointer (via --mx/--my).
 * - Spotlight: .card elements get --sx/--sy so a soft light follows the pointer inside them.
 */
export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;

    const root = document.documentElement;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    root.classList.add("has-cursor");

    const pos = { x: -100, y: -100, rx: -100, ry: -100 };
    let magnet = null;
    let raf = 0;
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const k = 1 - Math.pow(0.0005, dt);
      pos.rx += (pos.x - pos.rx) * k;
      pos.ry += (pos.y - pos.ry) * k;
      ring.style.transform = `translate3d(${pos.rx}px, ${pos.ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const releaseMagnet = () => {
      if (!magnet) return;
      magnet.style.setProperty("--mx", "0px");
      magnet.style.setProperty("--my", "0px");
      magnet = null;
    };

    const onMove = (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      dot.classList.remove("cursor-hidden");
      ring.classList.remove("cursor-hidden");

      const t = e.target instanceof Element ? e.target : null;

      // Magnetic pull, up to ~30% of the distance from the element's centre
      const m = t?.closest(".btn, .menu-btn, [data-magnetic]");
      if (m !== magnet) releaseMagnet();
      if (m) {
        magnet = m;
        const r = m.getBoundingClientRect();
        m.style.setProperty("--mx", `${(e.clientX - (r.left + r.width / 2)) * 0.3}px`);
        m.style.setProperty("--my", `${(e.clientY - (r.top + r.height / 2)) * 0.3}px`);
      }

      // Card spotlight
      const card = t?.closest(".card");
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--sx", `${e.clientX - r.left}px`);
        card.style.setProperty("--sy", `${e.clientY - r.top}px`);
      }
    };

    const onOver = (e) => {
      const t = e.target instanceof Element ? e.target : null;
      const typing = t?.closest("input:not([type=checkbox]):not([type=radio]), textarea, select");
      const labelled = t?.closest("[data-cursor]");
      const interactive = t?.closest("a, button, label, [role=tab], input[type=checkbox]");
      ring.classList.toggle("is-text", !!typing);
      dot.classList.toggle("is-text", !!typing);
      ring.classList.toggle("is-label", !!labelled && !typing);
      ring.classList.toggle("is-link", !!interactive && !labelled && !typing);
      label.textContent = labelled ? labelled.getAttribute("data-cursor") : "";
    };

    const onDown = () => ring.classList.add("is-down");
    const onUp = () => ring.classList.remove("is-down");
    const onLeave = () => {
      dot.classList.add("cursor-hidden");
      ring.classList.add("cursor-hidden");
      releaseMagnet();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring cursor-hidden" aria-hidden="true">
        <span ref={labelRef} />
      </div>
      <div ref={dotRef} className="cursor-dot cursor-hidden" aria-hidden="true" />
    </>
  );
}
