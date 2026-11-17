import { useCallback, useEffect, useRef, useState } from "react";
import { pad } from "../data.js";
import { scramble } from "./scramble.js";
import { globe, lattice, network, ribbon } from "./storyShapes.js";

/**
 * Pinned, scroll-driven story (the igloo.inc-style section).
 *
 * The section is several screens tall; its stage sticks to the viewport while you
 * scroll through it. Scroll position drives a WebGL particle scene:
 *   - particles assemble from dust as you arrive,
 *   - shatter and re-form into a new shape for each chapter while the camera
 *     dollies in through the cloud,
 *   - spin with the scroll, react to the cursor,
 *   - and scatter again as you leave.
 * Chapter text decodes in sync. Reduced motion or no WebGL2 → a static version.
 */

const CHAPTERS = [
  {
    tag: "Structure",
    kicker: "Purpose-built solutions",
    title: "Thoughtful software.",
    text: "Technology that fits your business — software built around the way your business works.",
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
    text: "From the first conversation to what’s next — a technology partner who sees the bigger picture.",
  },
];
const n0 = CHAPTERS.length;

const VERT = /* glsl */ `#version 300 es
precision highp float;
in vec3 aS0; in vec3 aS1; in vec3 aS2; in vec3 aS3;
in vec3 aRand;
in float aSeed;
in float aHome;

uniform vec4  uW;        // blend weight of each shape
uniform float uScatter;  // 0 = crisp shape, >0 = exploded
uniform float uTime;
uniform float uSpin;     // scroll-driven rotation
uniform float uCam;      // camera distance (dollies in during transitions)
uniform float uAspect;
uniform vec2  uCenter;
uniform float uScale;
uniform vec2  uMouse;
uniform float uMouseOn;
uniform float uPx;
uniform float uSize;

out float vAlpha; out float vHeat; out float vSeed; out float vHome;

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }

void main() {
  vec2 m = uMouse * uMouseOn;
  // The first three shapes spin with the scroll; the logo swash only sways so it stays readable
  mat3 spin = rotX(0.38 - m.y * 0.25) * rotY(uSpin + m.x * 0.35);
  mat3 sway = rotX(-m.y * 0.2 + sin(uTime * 0.5) * 0.05) * rotY(sin(uTime * 0.35) * 0.22 + m.x * 0.3);
  vec3 p = spin * aS0 * uW.x + spin * aS1 * uW.y + spin * aS2 * uW.z + sway * aS3 * uW.w;

  p += aRand * 0.012 * sin(uTime * 1.3 + aSeed * 30.0);     // shimmer
  p += aRand * uScatter * (1.0 + aSeed * 1.8);              // shatter

  float zc = uCam - p.z;
  if (zc < 0.2) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; vAlpha = 0.0; vHeat = 0.0; vSeed = 0.0; vHome = 0.0; return; }
  vec2 s = p.xy * (2.2 / zc) * uScale + uCenter;

  vec2 d = s - uMouse;
  float dist = length(d);
  float infl = smoothstep(0.3, 0.0, dist) * uMouseOn;
  s += (dist > 0.0001 ? d / dist : vec2(0.0)) * infl * 0.12;

  gl_Position = vec4(s.x / uAspect, s.y, 0.0, 1.0);
  float near = clamp((uCam + 1.3 - zc) / 2.6, 0.0, 1.0);
  float home = aHome * uW.z;
  gl_PointSize = uSize * uPx * (2.4 / zc) * (1.0 + infl * 1.2) * (1.0 + home * 0.9);
  vAlpha = (0.22 + 0.78 * near) * (1.0 - min(uScatter * 0.3, 0.55));
  vHeat = infl; vSeed = aSeed; vHome = home;
}`;

const FRAG = /* glsl */ `#version 300 es
precision mediump float;
in float vAlpha; in float vHeat; in float vSeed; in float vHome;
out vec4 outColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.0, r);
  vec3 col = mix(vec3(0.165, 0.471, 0.863), vec3(0.435, 0.816, 0.969), vSeed);
  col = mix(col, vec3(0.84, 0.855, 0.878), step(0.94, vSeed) * 0.8);
  col = mix(col, vec3(1.0), max(vHeat * 0.7, vHome * 0.85));
  outColor = vec4(col * soft, soft * min(1.0, vAlpha * (0.8 + vHeat) + vHome * 0.6));
}`;

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

function buildAttributes(N) {
  const home = new Float32Array(N);
  const rand = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    // random unit direction, used for shimmer and the explosion
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    rand.set([s * Math.cos(th), u, s * Math.sin(th)], i * 3);
    seed[i] = Math.random();
  }
  return {
    aS0: [lattice(N), 3],
    aS1: [network(N), 3],
    aS2: [globe(N, home), 3],
    aS3: [ribbon(N), 3],
    aRand: [rand, 3],
    aSeed: [seed, 1],
    aHome: [home, 1],
  };
}

/** Static fallback (reduced motion / no WebGL2): the same chapters as a plain grid. */
function StaticStory() {
  return (
    <section className="section story-static" aria-label="What we stand for">
      <ol className="wrap">
        {CHAPTERS.map((c, i) => (
          <li key={c.tag} className="card">
            <span className="label-mono">
              {pad(i)} — {c.kicker}
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
  const canvasRef = useRef(null);
  const fillsRef = useRef([]);
  const hintRef = useRef(null);
  const titleRef = useRef(null);
  const kickerRef = useRef(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);

  // Decode the chapter text each time the chapter changes
  useEffect(() => {
    if (titleRef.current) scramble(titleRef.current, 700);
    if (kickerRef.current) scramble(kickerRef.current, 500);
  }, [active]);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
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
    const N = small ? 4500 : 9000;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffers = [];
    for (const [name, [data, size]] of Object.entries(buildAttributes(N))) {
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
    for (const n of ["uW", "uScatter", "uTime", "uSpin", "uCam", "uAspect", "uCenter", "uScale", "uMouse", "uMouseOn", "uPx", "uSize"]) {
      U[n] = gl.getUniformLocation(prog, n);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    // ---- layout: shape on the right on wide screens, top-centre when narrow ----
    let w = 1, h = 1, dpr = 1, aspect = 1, center = [0, 0], scale = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      aspect = w / h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (aspect >= 1.15) {
        center = [aspect * 0.42, 0.02];
        scale = 0.95;
      } else {
        center = [0, 0.3];
        scale = clamp(aspect * 1.15, 0.5, 0.85);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ---- pointer ----
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, on: 0, ton: 0 };
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = ((e.clientX - r.left) / w * 2 - 1) * aspect;
      mouse.ty = -((e.clientY - r.top) / h * 2 - 1);
      mouse.ton = e.clientY >= r.top && e.clientY <= r.bottom ? 1 : 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // ---- loop (only while the section is on screen) ----
    let raf = 0, time = 0, last = performance.now(), visible = false, sp = 0;
    const n = n0;

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      const k = 1 - Math.pow(0.002, dt);

      // scroll progress through the pinned section, 0..1
      const r = section.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      sp += (p - sp) * Math.min(1, k * 2.2);

      const idx = clamp(Math.floor(sp * n), 0, n - 1);
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
      }
      fillsRef.current.forEach((el, i) => el && (el.style.transform = `scaleX(${clamp(sp * n - i, 0, 1)})`));
      if (hintRef.current) hintRef.current.style.opacity = String(1 - smooth(0, 0.04, sp));

      // shape weights: each boundary between chapters is a short morph window
      const e = [];
      for (let b = 1; b < n; b++) e.push(smooth(b / n - 0.075, b / n + 0.075, sp));
      const W = [1 - e[0], e[0] - e[1], e[1] - e[2], e[2]];
      const morph = e.reduce((a, v) => a + Math.sin(Math.PI * v), 0); // peaks mid-transition
      const assemble = smooth(-0.02, 0.09, sp) * (1 - smooth(0.93, 1.0, sp)); // arrive / leave
      const scatter = (1 - assemble) * 1.6 + morph * 0.75;
      const cam = 3.6 - morph * 1.1 + (1 - assemble) * 0.6;

      mouse.x += (mouse.tx - mouse.x) * k;
      mouse.y += (mouse.ty - mouse.y) * k;
      mouse.on += (mouse.ton - mouse.on) * k * 0.6;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform4f(U.uW, W[0], W[1], W[2], W[3]);
      gl.uniform1f(U.uScatter, scatter);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uSpin, time * 0.12 + sp * 7.0);
      gl.uniform1f(U.uCam, cam);
      gl.uniform1f(U.uAspect, aspect);
      gl.uniform2f(U.uCenter, center[0], center[1]);
      gl.uniform1f(U.uScale, scale);
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.uniform1f(U.uMouseOn, mouse.on);
      gl.uniform1f(U.uPx, dpr);
      gl.uniform1f(U.uSize, small ? 3.8 : 4.2);
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
      document.removeEventListener("visibilitychange", kick);
      buffers.forEach((b) => gl.deleteBuffer(b));
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    };
  }, [onFail]);

  const c = CHAPTERS[active];
  return (
    <section ref={sectionRef} className="story" aria-label="What we stand for" style={{ height: `${(n0 + 1) * 100}vh` }}>
      <div className="story-stage">
        <canvas ref={canvasRef} className="story-canvas" aria-hidden="true" />
        <div className="story-shade" aria-hidden="true" />

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
              <b>{pad(active)}</b> / {pad(n0 - 1)}
            </span>
            <span>{c.tag}</span>
          </div>

          <div className="story-copy" key={active}>
            <span className="eyebrow" ref={kickerRef}>
              {c.kicker}
            </span>
            <p className="story-title" ref={titleRef}>
              {c.title}
            </p>
            <p className="story-text">{c.text}</p>
          </div>

          <ol className="story-progress">
            {CHAPTERS.map((ch, i) => (
              <li key={ch.tag} className={i === active ? "on" : undefined}>
                <span className="bar">
                  <span className="fill" ref={(el) => (fillsRef.current[i] = el)} />
                </span>
                <span className="lbl">
                  {pad(i)} {ch.tag}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="story-hint" ref={hintRef} aria-hidden="true">
          Scroll to explore
          <span />
        </div>
      </div>
    </section>
  );
}
