import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { pad } from "../data.js";
import { scramble } from "./scramble.js";
import { crystal, globe, lattice, network, ribbon, seeded } from "./storyShapes.js";

/**
 * Pinned, scroll-driven story: four chapters as rotating crystals (WebGL2 particles).
 *
 * Each chapter is an ice-like crystal with its shape "frozen" inside (lattice,
 * network, globe, GLEITS swash). The crystals sit on a vertical carousel: the
 * current one is centred and turning, the next one peeks in from below. Scrolling
 * spins the crystal and rotates the carousel to bring the next one up, so it's
 * always obvious there is more below.
 *
 * Around the active crystal, HUD labels with thin leader lines name the chapter
 * ("GLEITS_01 / STRUCTURE"), its focus, and prompt "Scroll to explore ↓".
 * The chapter title and text are revealed by the scroll. The first crystal and its
 * text are already visible as the section arrives, so it never starts empty.
 * Reduced motion or no WebGL2 → a static version with the same content.
 */

const CHAPTERS = [
  {
    tag: "Structure",
    kicker: "Purpose-built solutions",
    title: "Thoughtful software.",
    text: "Technology that fits your business. Software built around the way your business works.",
  },
  {
    tag: "Connection",
    kicker: "Quality at every step",
    title: "Connected experiences.",
    text: "Thoughtful design and dependable delivery, connecting your teams, information and customers.",
  },
  {
    tag: "Reach",
    kicker: "Local roots",
    title: "Global possibilities.",
    text: "Based in Sri Lanka, we work with startups, SMEs and organizations ready to take their next step.",
  },
  {
    tag: "Partnership",
    kicker: "A partner, from day one",
    title: "Your goals guide everything we build.",
    text: "A technology partner who sees the bigger picture, from the first conversation to what’s next.",
  },
];
const COUNT = CHAPTERS.length;

/* ---- Timeline, measured in screens (viewport heights) of scrolling ---- */
const CH_LEN = 0.55; // scroll length of each chapter (about half a screen per crystal)
const chStart = (i) => i * CH_LEN;
const STORY_END = chStart(COUNT); // 2.2
const SCREENS = STORY_END + 0.2; // a little extra to let the last crystal dissolve
const TURN_FROM = 0.6; // within a chapter: hold, then rotate to the next from 60%…
const TURN_TO = 1.0; // …to 100% of its scroll length

/** Thin "constellation" lines around each crystal (in crystal-radius units). */
const CONSTELLATIONS = CHAPTERS.map((_, i) => {
  const rnd = seeded(101 + i * 17);
  const cluster = (x0, x1, y0, y1) =>
    Array.from({ length: 3 }, () => [x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0)].map((v) => +v.toFixed(3)));
  return [cluster(-1.02, -0.78, 0.12, 0.72), cluster(0.95, 1.45, -0.18, 0.5)];
});

const VERT = /* glsl */ `#version 300 es
precision highp float;
in vec3 aLocal;   // position inside its crystal
in float aGroup;  // which chapter's crystal (0..3)
in float aShell;  // 1 = crystal shell, 0 = shape inside
in float aSeed;
in vec3 aRand;
in float aHome;   // Sri Lanka highlight on the globe

uniform float uRing;    // carousel position in chapters (0 = first crystal at the front)
uniform float uRad;     // carousel radius
uniform float uTime;
uniform float uSpin;    // crystal rotation (time + scroll)
uniform float uCam;
uniform float uAspect;
uniform vec2  uCenter;
uniform float uScale;
uniform float uSide;    // how visible the neighbouring crystals are
uniform float uFade;    // fade-in as the section arrives
uniform float uExit;    // dissolve as the section leaves
uniform vec2  uMouse;
uniform float uMouseOn;
uniform float uRepel;   // push radius (world units): smaller on narrow screens
uniform float uPx;
uniform float uSize;

out float vAlpha; out float vHeat; out float vSeed; out float vShell; out float vHome; out float vGate;

const float PI = 3.14159265;
mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }
mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0., -s, c, 0., 0., 0., 1.); }

void main() {
  float k = aGroup - uRing;                 // 0 = front, 1 = next (below), -1 = previous (above)
  float front = clamp(1.0 - abs(k), 0.0, 1.0);
  vec2 m = uMouse * uMouseOn * front;       // only the front crystal tilts toward the cursor

  mat3 R = rotX(0.16 + sin(uTime * 0.35 + aGroup) * 0.06 - m.y * 0.35)
         * rotY(uSpin + aGroup * 1.7 + m.x * 0.5)
         * rotZ(0.14 * sin(aGroup * 2.1 + 0.5));
  vec3 lp = R * aLocal;
  lp += aRand * 0.007 * sin(uTime * 1.4 + aSeed * 30.0);   // shimmer
  lp += aRand * uExit * (0.8 + aSeed * 1.6);               // dissolve on exit

  // Vertical carousel: rotate around the X axis, one quarter turn per chapter
  float th = k * PI * 0.5;
  vec3 p = vec3(0.0, -sin(th) * uRad, (cos(th) - 1.0) * uRad) + lp;

  float zRaw = uCam - p.z;
  float zc = max(zRaw, 0.2);
  vec2 s = p.xy * (2.2 / zc) * uScale + uCenter;

  vec2 d = s - uMouse;
  float dist = length(d);
  float infl = smoothstep(uRepel, 0.0, dist) * uMouseOn * 0.6;
  s += (dist > 0.0001 ? d / dist : vec2(0.0)) * infl * 0.06 * (uRepel / 0.25);

  gl_Position = vec4(s.x / uAspect, s.y, 0.0, 1.0);

  float vis = mix(uSide, 1.0, front) * smoothstep(1.6, 1.0, abs(k)); // front + one neighbour each side
  float back = clamp((lp.z + 0.9) / 1.8, 0.0, 1.0);                   // far side of the crystal is dimmer
  float home = aHome * front;
  gl_PointSize = uSize * uPx * (2.4 / zc) * (aShell > 0.5 ? 0.95 : 1.0) * (1.0 + home * 0.9) * (1.0 + infl)
               * step(0.2, zRaw);
  vAlpha = (aShell > 0.5 ? 0.68 : 0.85) * mix(0.45, 1.0, back);
  vGate = vis * uFade * (1.0 - uExit) * step(0.2, zRaw);
  vHeat = infl; vSeed = aSeed; vShell = aShell; vHome = home;
}`;

const FRAG = /* glsl */ `#version 300 es
precision mediump float;
in float vAlpha; in float vHeat; in float vSeed; in float vShell; in float vHome; in float vGate;
out vec4 outColor;
void main() {
  if (vGate < 0.003) discard;
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.0, r);
  vec3 inner = mix(vec3(0.165, 0.471, 0.863), vec3(0.435, 0.816, 0.969), vSeed); // brand blues
  vec3 ice = mix(vec3(0.6, 0.72, 0.86), vec3(0.93, 0.97, 1.0), vSeed);            // frosty shell
  vec3 col = mix(inner, ice, vShell);
  col = mix(col, vec3(1.0), max(vHeat * 0.5, vHome * 0.85));
  // additive glow: gate the light as well as the alpha so hidden crystals truly vanish
  outColor = vec4(col * soft * vGate, soft * min(1.0, vAlpha + vHome * 0.6) * vGate);
}`;

const UNIFORMS = ["uRing", "uRad", "uTime", "uSpin", "uCam", "uAspect", "uCenter", "uScale", "uSide", "uFade", "uExit", "uMouse", "uMouseOn", "uRepel", "uPx", "uSize"];

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

/** One crystal per chapter: its shape (scaled to fit inside) plus the crystal shell. */
function buildAttributes(perShape, perShell) {
  const per = perShape + perShell;
  const N = per * COUNT;
  const local = new Float32Array(N * 3);
  const group = new Float32Array(N);
  const shell = new Float32Array(N);
  const seed = new Float32Array(N);
  const rand = new Float32Array(N * 3);
  const home = new Float32Array(N);

  const homeShape = new Float32Array(perShape);
  const shapes = [lattice(perShape), network(perShape), globe(perShape, homeShape), ribbon(perShape)];
  const fit = [0.45, 0.45, 0.45, 0.48]; // scale each shape to sit inside its crystal

  for (let g = 0; g < COUNT; g++) {
    const shellPts = crystal(perShell, 11 + g * 13);
    for (let j = 0; j < per; j++) {
      const i = g * per + j;
      if (j < perShape) {
        local[i * 3] = shapes[g][j * 3] * fit[g];
        local[i * 3 + 1] = shapes[g][j * 3 + 1] * fit[g];
        local[i * 3 + 2] = shapes[g][j * 3 + 2] * fit[g];
        if (g === 2) home[i] = homeShape[j];
      } else {
        local.set(shellPts.subarray((j - perShape) * 3, (j - perShape) * 3 + 3), i * 3);
        shell[i] = 1;
      }
      group[i] = g;
      seed[i] = Math.random();
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      rand.set([s * Math.cos(th), u, s * Math.sin(th)], i * 3);
    }
  }
  return {
    N,
    attrs: {
      aLocal: [local, 3],
      aGroup: [group, 1],
      aShell: [shell, 1],
      aSeed: [seed, 1],
      aRand: [rand, 3],
      aHome: [home, 1],
    },
  };
}

/** Splits text into masked words for the scroll-scrubbed reveal. `--i` staggers them. */
function Words({ text, offset = 0 }) {
  return text.split(" ").map((w, i) => (
    <Fragment key={i}>
      <span className="w">
        <span style={{ "--i": i + offset }}>{w}</span>
      </span>{" "}
    </Fragment>
  ));
}

/** Static fallback (reduced motion / no WebGL2): the same chapters as a plain grid. */
function StaticStory() {
  return (
    <section className="section story-static" aria-label="What we stand for">
      <ol className="wrap">
        {CHAPTERS.map((c, i) => (
          <li key={c.tag} className="card">
            <span className="label-mono">
              {pad(i)} · {c.kicker}
            </span>
            <h2>{c.title}</h2>
            <p>{c.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function ScrollStory() {
  const [mode, setMode] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "static" : "fx",
  );
  const fail = useCallback(() => setMode("static"), []);
  if (mode === "static") return <StaticStory />;
  return <PinnedStory onFail={fail} />;
}

function PinnedStory({ onFail }) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const hudRef = useRef(null);
  const tagRef = useRef(null);
  const cueRef = useRef(null);
  const cueTextRef = useRef(null);
  const chapterRefs = useRef([]);
  const hudItemRefs = useRef([]);
  const fillRefs = useRef([]);
  const phaseRef = useRef(0);
  const [phase, setPhase] = useState(0);

  // Decode the labels of the chapter that just came to the front
  useEffect(() => {
    if (tagRef.current) scramble(tagRef.current, 600);
    hudItemRefs.current[phase]?.querySelectorAll(".hud-label span").forEach((el) => scramble(el, 650));
  }, [phase]);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const hud = hudRef.current;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) return onFail();

    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (err) {
      console.warn("Scroll story disabled:", err);
      return onFail();
    }
    gl.useProgram(prog);

    const small = window.matchMedia("(max-width: 760px)").matches;
    const { N, attrs } = small ? buildAttributes(900, 1000) : buildAttributes(1700, 1900);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffers = [];
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
    const U = {};
    for (const n of UNIFORMS) U[n] = gl.getUniformLocation(prog, n);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    // ---- layout: crystal on the right when wide, upper centre when narrow ----
    const CAM = 3.6;
    let w = 1, h = 1, dpr = 1, aspect = 1, center = [0, 0], scale = 1, side = 0.35;
    const toWorld = (px, py) => [((px / w) * 2 - 1) * aspect, -((py / h) * 2 - 1)];
    const resize = () => {
      const r = stage.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      aspect = w / h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const wide = aspect >= 1.15;
      center = wide ? [aspect * 0.4, 0.0] : [0, 0.33];
      scale = wide ? 0.92 : clamp(aspect * 1.05, 0.46, 0.78);
      side = wide ? 0.38 : 0.18; // on phones the next crystal would sit under the text: keep it faint
      // HUD anchor: the front crystal's centre and radius in CSS pixels
      const r0 = 1.0 * (2.2 / CAM) * scale * (h / 2);
      hud.style.setProperty("--cx", `${(w / 2 + center[0] * (h / 2)).toFixed(1)}px`);
      hud.style.setProperty("--cy", `${(h / 2 - center[1] * (h / 2)).toFixed(1)}px`);
      hud.style.setProperty("--r", `${r0.toFixed(1)}px`);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    // ---- pointer ----
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, on: 0, ton: 0 };
    const onMove = (e) => {
      const r = stage.getBoundingClientRect();
      [mouse.tx, mouse.ty] = toWorld(e.clientX - r.left, e.clientY - r.top);
      mouse.ton = e.clientY >= r.top && e.clientY <= r.bottom ? 1 : 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    // On touch screens, let the dots settle back once the finger lifts
    const onUp = (e) => {
      if (e.pointerType !== "mouse") mouse.ton = 0;
    };
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });

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

    // ---- loop (only while the section is on screen) ----
    let raf = 0, time = 0, last = performance.now(), visible = false, ss = 0;
    let lastY = window.scrollY, lastMove = performance.now(), cueText = "";

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = clamp((now - last) / 1000, 0, 0.05);
      last = now;
      time += dt;
      const k = 1 - Math.pow(0.002, dt);

      // Scroll position in "screens" (negative while the section is still below)
      const r = section.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const raw = total > 0 ? (-r.top / total) * SCREENS : 0;
      ss += (clamp(raw, 0, SCREENS) - ss) * Math.min(1, k * 2.4);
      const s = ss;
      const exit = smooth(STORY_END, SCREENS, s);

      // Carousel: hold on each crystal, then rotate the next one up into place
      let ring;
      if (s >= STORY_END) ring = COUNT - 1 + exit * 0.6;
      else {
        const i = clamp(Math.floor(s / CH_LEN), 0, COUNT - 1);
        const local = (s - chStart(i)) / CH_LEN;
        ring = i + (i < COUNT - 1 ? smooth(TURN_FROM, TURN_TO, local) : 0);
      }

      // Chapter text + HUD: revealed by scroll, in step with the carousel
      let ph = phaseRef.current;
      let best = 0.05;
      CHAPTERS.forEach((_, i) => {
        const a = chStart(i);
        const inP = i === 0 ? smooth(-0.7, -0.1, raw) : smooth(a - 0.06 * CH_LEN, a + 0.25 * CH_LEN, s);
        const outP =
          i === COUNT - 1 ? smooth(STORY_END - 0.05, STORY_END + 0.15, s) : smooth(a + 0.58 * CH_LEN, a + 0.82 * CH_LEN, s);
        setVar(chapterRefs.current[i], "--in", inP);
        setVar(chapterRefs.current[i], "--out", outP);
        setVar(hudItemRefs.current[i], "--a", clamp(inP - outP, 0, 1));
        if (inP - outP > best) {
          best = inP - outP;
          ph = i;
        }
      });
      if (ph !== phaseRef.current) {
        phaseRef.current = ph;
        setPhase(ph);
      }
      fillRefs.current.forEach((el, i) => {
        if (el) el.style.transform = `scaleX(${clamp((s - chStart(i)) / CH_LEN, 0, 1).toFixed(3)})`;
      });

      // Pause detection → "keep scrolling" cue
      if (Math.abs(window.scrollY - lastY) > 1) lastMove = now;
      lastY = window.scrollY;
      const idle = now - lastMove > 2200;
      cueRef.current?.classList.toggle("show", raw > -0.3 && (s < 0.1 || (idle && s < STORY_END - 0.1)));
      cueRef.current?.classList.toggle("side", s >= 0.1);
      const label = s < 0.3 ? "Scroll to explore" : "Keep scrolling";
      if (label !== cueText && cueTextRef.current) cueTextRef.current.textContent = cueText = label;

      mouse.x += (mouse.tx - mouse.x) * k;
      mouse.y += (mouse.ty - mouse.y) * k;
      mouse.on += (mouse.ton - mouse.on) * k * 0.6;

      // The camera eases back a touch while the carousel turns
      const turning = Math.sin(Math.PI * (ring - Math.floor(ring)));

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.uRing, ring);
      gl.uniform1f(U.uRad, 2.3);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uSpin, time * 0.25 + s * 3.6);
      gl.uniform1f(U.uCam, CAM + turning * 0.35);
      gl.uniform1f(U.uAspect, aspect);
      gl.uniform2f(U.uCenter, center[0], center[1]);
      gl.uniform1f(U.uScale, scale);
      gl.uniform1f(U.uSide, side);
      gl.uniform1f(U.uFade, smooth(-0.95, -0.35, raw));
      gl.uniform1f(U.uExit, exit);
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.uniform1f(U.uMouseOn, mouse.on);
      gl.uniform1f(U.uRepel, Math.min(0.25, aspect * 0.22));
      gl.uniform1f(U.uPx, dpr);
      gl.uniform1f(U.uSize, small ? 3.4 : 3.8);
      gl.drawArrays(gl.POINTS, 0, N);
      raf = requestAnimationFrame(frame);
    }
    const kick = () => {
      if (visible && !raf && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      kick();
    });
    io.observe(section);
    document.addEventListener("visibilitychange", kick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", kick);
      buffers.forEach((b) => gl.deleteBuffer(b));
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    };
  }, [onFail]);

  return (
    <section ref={sectionRef} className="story" aria-label="What we stand for" style={{ height: `${(SCREENS + 1) * 100}vh` }}>
      <div className="story-stage" ref={stageRef}>
        <canvas ref={canvasRef} className="story-canvas" aria-hidden="true" />
        <div className="story-shade" aria-hidden="true" />

        {/* HUD around the front crystal (positions come from --cx/--cy/--r, set in JS) */}
        <div className="story-hud" ref={hudRef} aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <div key={c.tag} className="hud-item" ref={(el) => (hudItemRefs.current[i] = el)}>
              <svg className="hud-lines" viewBox="-2 -2 4 4" preserveAspectRatio="none">
                <polyline points="-1.75,-0.86 -0.95,-0.86 -0.42,-0.5" />
                <polyline className="hud-b-line" points="0.4,-0.34 0.78,-0.58 1.48,-0.58" />
                <polyline points="0.3,0.58 0.58,0.84 1.66,0.84" />
                {CONSTELLATIONS[i].map((pts, j) => (
                  <polyline key={j} className="faint" points={pts.map((p) => p.join(",")).join(" ")} />
                ))}
                {CONSTELLATIONS[i].flat().map(([x, y], j) => (
                  <circle key={j} cx={x} cy={y} r="0.014" />
                ))}
              </svg>
              <div className="hud-label hud-a">
                <span>GLEITS_{pad(i)}</span>
                <span>{c.tag}</span>
              </div>
              <div className="hud-label hud-b">
                <span>Focus</span>
                <span>{c.kicker}</span>
              </div>
              <div className="hud-label hud-c">
                <span>
                  {pad(i)} / {pad(COUNT - 1)}
                </span>
                <span>{i < COUNT - 1 ? "Scroll to explore ↓" : "Keep scrolling ↓"}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Screen readers get every chapter at once, in order */}
        <ol className="sr-only">
          {CHAPTERS.map((ch) => (
            <li key={ch.tag}>
              <h2>{ch.title}</h2>
              <p>
                {ch.kicker}. {ch.text}
              </p>
            </li>
          ))}
        </ol>

        <div className="wrap story-ui" aria-hidden="true">
          <div className="story-top">
            <span>
              <b>{pad(phase)}</b> / {pad(COUNT - 1)}
            </span>
            <span ref={tagRef}>{CHAPTERS[phase].tag}</span>
          </div>

          <div className="story-frame">
            {CHAPTERS.map((c, i) => (
              <div key={c.tag} className="story-chapter scrub" ref={(el) => (chapterRefs.current[i] = el)}>
                <span className="story-num">{pad(i)}</span>
                <span className="story-kicker">
                  <span className="story-line" />
                  <Words text={c.kicker} />
                </span>
                <p className="story-title">
                  <Words text={c.title} offset={2} />
                </p>
                <p className="story-text">{c.text}</p>
              </div>
            ))}
          </div>

          <ol className="story-progress">
            {CHAPTERS.map((ch, i) => (
              <li key={ch.tag} className={i === phase ? "on" : undefined}>
                <span className="bar">
                  <span className="fill" ref={(el) => (fillRefs.current[i] = el)} />
                </span>
                <span className="lbl">
                  {pad(i)} {ch.tag}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="story-cue" ref={cueRef} aria-hidden="true">
          <span className="mouse">
            <i />
          </span>
          <span ref={cueTextRef}>Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}
