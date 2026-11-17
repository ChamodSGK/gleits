import { useEffect, useRef } from "react";

/**
 * Technology ticker that reacts to scrolling: it speeds up with scroll speed,
 * follows the scroll direction, and leans (skews) while you scroll fast.
 * Falls back to a static row for reduced motion.
 */
export default function VelocityMarquee({ items }) {
  const boxRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = boxRef.current;
    const track = trackRef.current;

    let x = 0, vel = 0, dir = 1, hover = false, visible = true;
    let lastY = window.scrollY, last = performance.now(), raf = 0;

    const loop = (now) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (Math.abs(dy) > 0.5) dir = dy > 0 ? 1 : -1;
      vel += ((dt > 0 ? dy / dt : 0) - vel) * (1 - Math.pow(0.002, dt)); // smoothed px/s

      const speed = (hover ? 18 : 55) + Math.min(Math.abs(vel) * 0.55, 1400);
      x -= speed * dt * dir;
      const half = track.scrollWidth / 2; // list is doubled, so wrap at half
      if (half > 0) {
        if (x <= -half) x += half;
        if (x > 0) x -= half;
      }
      const skew = Math.max(-10, Math.min(10, -vel * 0.006));
      track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        lastY = window.scrollY;
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(box);
    const enter = () => (hover = true);
    const leave = () => (hover = false);
    box.addEventListener("pointerenter", enter);
    box.addEventListener("pointerleave", leave);
    track.classList.add("is-js");

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      box.removeEventListener("pointerenter", enter);
      box.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div className="marquee-box" ref={boxRef}>
      <p className="sr-only">Featured technologies: {items.join(", ")}.</p>
      {/* Doubled for a seamless loop; hidden from screen readers (see sentence above) */}
      <ul className="marquee" ref={trackRef} aria-hidden="true">
        {[...items, ...items].map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
