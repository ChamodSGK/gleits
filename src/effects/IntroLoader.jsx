import { Fragment, useEffect, useRef } from "react";
import { LOGO_RATIO, loadLogoTargets } from "./logoTargets.js";
import { getLenis } from "./smoothScroll.js";

/**
 * Site intro, played automatically when the site first opens on the Home page:
 *
 *  1. Drifting dust builds the real GLEITS logo letter by letter (g → l → e → i → t → s)
 *     while the tagline appears word by word and the letter slots fill.
 *  2. The particles fade away and the clean logo image locks in with a glow.
 *  3. "Landing": the overlay fades and the logo flies into the header logo's exact
 *     spot, revealing the hero underneath.
 *
 * The page doesn't move while the intro is up. Scrolling, swiping, any key or
 * "Skip intro" jumps ahead to the finished logo and the landing. Calls onLand() as
 * the landing starts and onDone() when the overlay can be removed. Without WebGL2
 * it finishes immediately.
 */

const LETTERS = ["G", "L", "E", "I", "T", "S"];
const TAGLINE = "Empowering Innovation Through Technology Excellence!";

/* ---- Timeline, in "build progress" units (played at AUTO_RATE units per second) ---- */
const L0 = 0.1; // first letter starts
const STEP = 0.36; // gap between letters
const DUR = 0.6; // length of one letter's flight
const BUILT = L0 + 5 * STEP + DUR; // 2.5: all six letters in place
const LOCK = BUILT + 0.05; // real logo image takes over; particles fade out by LOCK + 0.3
const LAND = 3.45; // landing begins here
const LAND_DUR = 1.4; // the landing itself, in seconds (the logo's flight in CSS takes 1.3s)
const AUTO_DELAY = 0.35; // seconds of drifting dust before the first letter
const AUTO_RATE = 0.7; // playback speed: letters done ≈3.9s, landing ≈5.3s, finished ≈6.7s (higher = faster)

const VERT = /* glsl */ `#version 300 es
precision highp float;
in vec2 aLogo; in vec3 aLogoCol; in float aLetter;
in vec3 aRand; in float aSeed;
uniform float uLetters[6];
uniform vec2  uLogoCenter;
uniform float uLogoScale;
uniform float uAspect;
uniform float uTime;
uniform float uFade;   // dust fade-in
uniform float uBurst;  // landing: 0..1
uniform float uVis;    // overall particle visibility (0 once the real logo has locked in)
uniform vec2  uMouse;
uniform float uMouseOn;
uniform float uRepel;  // push radius (world units): smaller on narrow screens
uniform float uPx;
uniform float uSize;
out float vAlpha; out float vHeat; out float vSeed; out vec3 vCol; out float vLogo; out float vGate;
const float PI = 3.14159265;
void main() {
  float a = uLetters[int(aLetter + 0.5)];
  float ae = a * a * (3.0 - 2.0 * a);
  vec2 logo = aLogo * uLogoScale + uLogoCenter;
  vec2 dust = uLogoCenter + vec2(aRand.x * uAspect, aRand.y) * (0.55 + aSeed * 0.75);
  dust += vec2(sin(uTime * 0.3 + aSeed * 20.0), cos(uTime * 0.27 + aSeed * 17.0)) * 0.04;
  vec2 swoop = vec2(-aRand.y, aRand.x) * sin(PI * ae) * 0.45;   // curved flight into place
  vec2 s = mix(dust, logo, ae) + swoop;
  s += aRand.xy * 0.003 * sin(uTime * 2.0 + aSeed * 40.0) * ae; // shimmer once placed

  // Landing: everything blasts outward from the logo
  float b = uBurst * uBurst;
  s += vec2(aRand.x * uAspect, aRand.y) * b * (0.9 + aSeed * 1.4);

  vec2 d = s - uMouse;
  float dist = length(d);
  // The cursor only pushes loose background dust: once a particle's letter starts
  // forming (a > 0) it is part of the GLEITS lettering and is left alone.
  float infl = smoothstep(uRepel, 0.0, dist) * uMouseOn * (1.0 - uBurst) * (1.0 - smoothstep(0.0, 0.05, a));
  s += (dist > 0.0001 ? d / dist : vec2(0.0)) * infl * 0.12 * (uRepel / 0.3);

  gl_Position = vec4(s.x / uAspect, s.y, 0.0, 1.0);
  gl_PointSize = uSize * uPx * (0.62 + ae * 0.16) * (1.0 + sin(PI * ae) * 1.3) * (1.0 + infl * 1.2);
  vAlpha = (0.16 + 0.84 * ae) * uFade * uVis;
  vGate = uFade * uVis; // also scales the light each dot adds (blending is additive)
  vHeat = infl; vSeed = aSeed; vCol = aLogoCol; vLogo = ae;
}`;

const FRAG = /* glsl */ `#version 300 es
precision mediump float;
in float vAlpha; in float vHeat; in float vSeed; in vec3 vCol; in float vLogo; in float vGate;
out vec4 outColor;
void main() {
  if (vGate < 0.002) discard; // fully hidden: draw nothing at all
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float soft = mix(smoothstep(0.5, 0.0, r), smoothstep(0.5, 0.3, r), vLogo);
  vec3 col = mix(vec3(0.165, 0.471, 0.863), vec3(0.435, 0.816, 0.969), vSeed);
  col = mix(col, vCol, vLogo);
  col = mix(col, vec3(1.0), vHeat * 0.7);
  outColor = vec4(col * soft * vGate, soft * min(1.0, vAlpha * (0.8 + vHeat)));
}`;

const UNIFORMS = ["uLetters", "uLogoCenter", "uLogoScale", "uAspect", "uTime", "uFade", "uBurst", "uVis", "uMouse", "uMouseOn", "uRepel", "uPx", "uSize"];

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

function Words({ text }) {
  return text.split(" ").map((w, i) => (
    <Fragment key={i}>
      <span className="w">
        <span style={{ "--i": i }}>{w}</span>
      </span>{" "}
    </Fragment>
  ));
}

export default function IntroLoader({ onLand, onDone }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const logoRef = useRef(null);
  const taglineRef = useRef(null);
  const skipRef = useRef(null);
  const slotRefs = useRef([]);
  // keep the latest callbacks without re-running the effect
  const cb = useRef({ onLand, onDone });
  cb.current = { onLand, onDone };

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const html = document.documentElement;
    html.classList.add("intro-lock", "intro-logo-hidden");
    window.scrollTo(0, 0);

    let landCalled = false;
    let finished = false;
    const unlock = () => {
      html.classList.remove("intro-lock", "intro-logo-hidden");
      getLenis()?.start();
    };
    const land = () => {
      if (landCalled) return;
      landCalled = true;
      cb.current.onLand?.();
    };
    const finish = (immediate = false) => {
      if (finished) return;
      finished = true;
      land();
      html.classList.remove("intro-logo-hidden");
      // Keep the page still a moment longer so trackpad momentum doesn't fling
      // the visitor past the hero they just landed on.
      if (immediate) unlock();
      else setTimeout(unlock, 650);
      cb.current.onDone?.();
    };

    const gl = canvas.getContext("webgl2", { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) {
      finish(true);
      return;
    }
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (err) {
      console.warn("Intro skipped:", err);
      finish(true);
      return;
    }
    gl.useProgram(prog);

    const small = window.matchMedia("(max-width: 760px)").matches;
    const N = small ? 4500 : 9000;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffers = [];
    const upload = (attrs) => {
      for (const [name, [data, size]] of Object.entries(attrs)) {
        const loc = gl.getAttribLocation(prog, name);
        if (loc < 0) continue;
        const buf = gl.createBuffer();
        buffers.push(buf);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      }
    };
    const rand = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      rand.set([s * Math.cos(th), u, s * Math.sin(th)], i * 3);
      seed[i] = Math.random();
    }
    upload({ aRand: [rand, 3], aSeed: [seed, 1] });

    let ready = false;
    let cancelled = false;
    // If the logo can't be prepared quickly, don't hold the visitor up
    const stall = setTimeout(() => !ready && finish(true), 3500);
    loadLogoTargets(N)
      .then((logo) => {
        if (cancelled) return;
        gl.bindVertexArray(vao);
        upload(logo);
        ready = true;
      })
      .catch((err) => {
        console.warn("Intro skipped:", err);
        if (!cancelled) finish(true);
      });

    const U = {};
    for (const n of UNIFORMS) U[n] = gl.getUniformLocation(prog, n);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    // ---- layout (CSS gets the same logo box so the real image lines up) ----
    let w = 1, h = 1, dpr = 1, aspect = 1, logoCenter = [0, 0], logoScale = 0.5;
    const toWorld = (px, py) => [((px / w) * 2 - 1) * aspect, -((py / h) * 2 - 1)];
    const resize = () => {
      w = Math.max(1, window.innerWidth);
      h = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      aspect = w / h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const lw = aspect >= 1.15 ? Math.min(w * 0.58, 880) : w * 0.84;
      const lh = lw * LOGO_RATIO;
      const lx = (w - lw) / 2;
      const ly = h * 0.44 - lh / 2;
      root.style.setProperty("--lx", `${lx}px`);
      root.style.setProperty("--ly", `${ly}px`);
      root.style.setProperty("--lw", `${lw}px`);
      root.style.setProperty("--lh", `${lh}px`);
      logoCenter = toWorld(lx + lw / 2, ly + lh / 2);
      logoScale = lw / h;
    };
    resize();
    window.addEventListener("resize", resize);

    // ---- timeline: plays on its own; scrolling, swiping or a key skips ahead ----
    let t = 0; // timeline position the visuals follow (0..LAND, then the landing)
    let auto = 0; // seconds of playback since the logo data was ready
    let skipped = false;
    let landing = false;
    const skip = () => {
      if (ready && !landing) skipped = true;
    };
    const onKey = (e) => {
      if (e.key === "Tab" || e.key === "Shift") return; // let people reach the Skip button
      if (e.target instanceof HTMLButtonElement && (e.key === " " || e.key === "Enter")) return; // the button handles it
      skip();
    };
    // A real swipe skips; simply touching the screen (to play with the dots) doesn't
    let touchY = null;
    const onTouchStart = (e) => (touchY = e.touches[0].clientY);
    const onTouchMove = (e) => {
      if (touchY != null && Math.abs(e.touches[0].clientY - touchY) > 40) skip();
    };
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, on: 0, ton: 0 };
    const onMove = (e) => {
      [mouse.tx, mouse.ty] = toWorld(e.clientX, e.clientY);
      mouse.ton = 1;
    };
    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove, { passive: true });
    // On touch screens, let the dots settle back once the finger lifts
    const onUp = (e) => {
      if (e.pointerType !== "mouse") mouse.ton = 0;
    };
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    skipRef.current?.addEventListener("click", skip);

    // Writes a CSS variable only when it actually changes
    const cache = new WeakMap();
    const setVar = (el, name, v) => {
      if (!el) return;
      let c = cache.get(el);
      if (!c) cache.set(el, (c = {}));
      const val = Math.round(v * 1000) / 1000;
      if (c[name] !== val) {
        c[name] = val;
        el.style.setProperty(name, String(val));
      }
    };

    const letters = new Float32Array(6);
    let raf = 0, time = 0, last = performance.now();

    // Fly the logo into the header logo's position
    const flyToHeader = () => {
      root.classList.add("landing");
      const img = logoRef.current;
      const goal = document.querySelector(".site-header .logo-link img")?.getBoundingClientRect();
      // the logo's resting box (offset* ignore its glow scale); the overlay is fixed at 0,0
      const from = { left: img.offsetLeft, top: img.offsetTop, width: img.offsetWidth, height: img.offsetHeight };
      if (goal && goal.width && from.width) {
        const sc = goal.width / from.width;
        const dx = goal.left + goal.width / 2 - (from.left + from.width / 2);
        const dy = goal.top + goal.height / 2 - (from.top + from.height / 2);
        img.style.transform = `translate(${dx}px, ${dy}px) scale(${sc})`;
      } else {
        img.style.opacity = "0";
      }
    };

    function frame(now) {
      raf = 0;
      // rAF timestamps can predate `last` on the first frame, so never step backwards
      const dt = clamp((now - last) / 1000, 0, 0.12);
      last = now;
      time += dt;

      // keep the page still underneath (Lenis may start after this component)
      const lenis = getLenis();
      if (lenis && !lenis.isStopped) lenis.stop();

      if (ready) auto += dt;
      if (landing) {
        t += dt; // the landing plays out on its own once triggered
      } else {
        if (skipped) t += (LAND - t) * (1 - Math.pow(0.0005, dt)); // catch up quickly
        else t = clamp((auto - AUTO_DELAY) * AUTO_RATE, 0, LAND); // play on the clock
        if (t > LAND - 0.01) {
          t = LAND;
          landing = true;
          flyToHeader();
        }
      }

      for (let i = 0; i < 6; i++) {
        const a = smooth(L0 + i * STEP, L0 + i * STEP + DUR, t);
        letters[i] = a;
        const slot = slotRefs.current[i];
        if (slot) {
          setVar(slot, "--f", a);
          slot.classList.toggle("done", a > 0.98);
        }
      }
      const appear = smooth(0.1, 0.9, time); // intro UI fades in on load
      setVar(root, "--ui", appear * (1 - smooth(LAND - 0.1, LAND + 0.2, t)));
      setVar(root, "--slots", appear * (1 - smooth(BUILT - 0.05, BUILT + 0.25, t)));
      setVar(root, "--logo-img", smooth(BUILT - 0.15, BUILT + 0.25, t));
      setVar(root, "--glow", Math.sin(Math.PI * smooth(BUILT - 0.1, LAND + 0.15, t)));
      setVar(root, "--aura", appear * (0.35 + 0.65 * smooth(0, BUILT, t)) * (1 - smooth(LAND, LAND + 0.5, t)));
      setVar(taglineRef.current, "--in", clamp((t - L0 - 0.1) / (BUILT - 0.1 - L0 - 0.1), 0, 1));
      setVar(taglineRef.current, "--out", smooth(LAND, LAND + 0.35, t));

      if (landing && t >= LAND + 0.15) land(); // hero + header animate in under the fading overlay
      const burst = smooth(LAND, LAND + 0.9, t);
      // Once the real logo locks in, every particle fades out so only the clean image remains.
      // During the landing a light spray returns, only after the logo has started flying away.
      const spray = smooth(0.3, 0.5, burst) * (1 - smooth(0.6, 1, burst)) * 0.7;
      const vis = Math.max(1 - smooth(LOCK, LOCK + 0.3, t), spray);

      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;
      mouse.on += (mouse.ton - mouse.on) * 0.08;

      if (ready) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1fv(U.uLetters, letters);
        gl.uniform2f(U.uLogoCenter, logoCenter[0], logoCenter[1]);
        gl.uniform1f(U.uLogoScale, logoScale);
        gl.uniform1f(U.uAspect, aspect);
        gl.uniform1f(U.uTime, time);
        gl.uniform1f(U.uFade, appear);
        gl.uniform1f(U.uBurst, burst);
        gl.uniform1f(U.uVis, vis);
        gl.uniform2f(U.uMouse, mouse.x, mouse.y);
        gl.uniform1f(U.uMouseOn, mouse.on);
        gl.uniform1f(U.uRepel, Math.min(0.3, aspect * 0.28)); // ~0.13 on a phone
        gl.uniform1f(U.uPx, dpr);
        gl.uniform1f(U.uSize, small ? 3.8 : 4.2);
        gl.drawArrays(gl.POINTS, 0, N);
      }

      if (landing && t >= LAND + LAND_DUR) {
        finish();
        return;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      clearTimeout(stall);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      buffers.forEach((b) => gl.deleteBuffer(b));
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      // If unmounted early (e.g. dev hot reload), never leave the page locked.
      // After a normal finish the delayed unlock takes care of it.
      if (!finished) unlock();
    };
  }, []);

  return (
    <div className="intro" ref={rootRef}>
      <canvas ref={canvasRef} className="intro-canvas" aria-hidden="true" />
      <div className="intro-aura" aria-hidden="true" />
      <div className="intro-eyebrow" aria-hidden="true">
        <span className="eyebrow">Welcome to</span>
      </div>
      <img ref={logoRef} className="intro-logo" src="/logos/gleits-on-dark.png" alt="GLEITS" />
      <div className="intro-under" aria-hidden="true">
        <p ref={taglineRef} className="intro-tagline scrub seq" style={{ "--n": TAGLINE.split(" ").length }}>
          <Words text={TAGLINE} />
        </p>
        <div className="intro-slots">
          {LETTERS.map((l, i) => (
            <span key={l + i} className="slot" ref={(el) => (slotRefs.current[i] = el)}>
              <b>{l}</b>
              <i />
            </span>
          ))}
        </div>
      </div>
      <button ref={skipRef} type="button" className="intro-skip">
        Skip intro
      </button>
    </div>
  );
}
