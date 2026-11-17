import { useEffect, useRef } from "react";

/**
 * Small fixed read-out in the bottom-right corner: "SCROLL ▬▬▬── 042%".
 * Updated directly in the DOM (no React re-renders) once per animation frame while scrolling.
 */
export default function ScrollHud() {
  const hudRef = useRef(null);
  const fillRef = useRef(null);
  const pctRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      fillRef.current.style.transform = `scaleX(${p})`;
      pctRef.current.textContent = String(Math.round(p * 100)).padStart(3, "0");
      // Step aside while a pinned scroll story is on screen (it has its own progress bar)
      const story = document.querySelector(".story");
      const r = story?.getBoundingClientRect();
      const pinned = r && r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5;
      hudRef.current.classList.toggle("hud-hidden", p > 0.97 || !!pinned);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="hud" ref={hudRef} aria-hidden="true">
      <span>SCROLL</span>
      <span className="hud-track">
        <span className="hud-fill" ref={fillRef} />
      </span>
      <span>
        <span ref={pctRef}>000</span>%
      </span>
    </div>
  );
}
