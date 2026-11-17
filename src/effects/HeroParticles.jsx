import { useEffect, useRef } from "react";

/**
 * Cursor-reactive particle ribbon (raw WebGL2, no libraries).
 *
 * Thousands of points stream along the curve of the GLEITS logo's i→t swash,
 * with the i-dot drawn as a particle cluster and a sparse ambient field
 * across the whole hero. The cursor pushes particles away and lights them up,
 * the scene tilts slightly with the cursor (parallax), a click sends a
 * shockwave, and scrolling the hero away scatters the ribbon.
 *
 * The ribbon is fitted into `anchorRef`'s box so it lines up with the layout.
 * Calls `onFail()` if WebGL2 is unavailable so the page can keep its SVG fallback.
 */

const VERT = /* glsl */ `#version 300 es
precision highp float;

in float aT;      // position along the ribbon, 0..1
in float aOff;    // offset across the ribbon (normal direction)
in float aZ;      // depth, 0 (far) .. 1 (near)
in float aSeed;   // random 0..1
in float aKind;   // 0 ribbon, 1 logo dot, 2 ambient
in vec2  aPos;    // local position for dot / screen position for ambient

uniform float uTime;
uniform float uAspect;
uniform vec2  uBoxCenter;
uniform float uBoxScale;
uniform vec2  uMouse;      // world space
uniform float uMouseOn;    // 0..1, fades in when the cursor is over the hero
uniform vec3  uClick;      // xy world, z = time of click
uniform float uScroll;     // 0 at top .. 1 when hero is scrolled away
uniform float uPx;         // device pixel ratio
uniform float uSize;

out float vAlpha;
out float vHeat;
out float vSeed;

// The logo swash: two cubic bezier segments in a -1..1 box
vec2 bez(vec2 a, vec2 b, vec2 c, vec2 d, float t) {
  float u = 1.0 - t;
  return u*u*u*a + 3.0*u*u*t*b + 3.0*u*t*t*c + t*t*t*d;
}
vec2 bezD(vec2 a, vec2 b, vec2 c, vec2 d, float t) {
  float u = 1.0 - t;
  return 3.0*u*u*(b - a) + 6.0*u*t*(c - b) + 3.0*t*t*(d - c);
}

void main() {
  vec2 p;
  float alpha = 1.0;

  if (aKind < 0.5) {
    // Stream along the ribbon; faster particles near the core
    float speed = 0.012 + 0.03 * aSeed * (1.0 - min(abs(aOff) * 3.0, 1.0));
    float t = fract(aT + uTime * speed);
    vec2 pt, tan;
    if (t < 0.5) {
      float s = t * 2.0;
      vec2 A = vec2(-1.15, -0.43), B = vec2(-0.63, -0.43), C = vec2(-0.43, 0.0), D = vec2(-0.03, 0.0);
      pt = bez(A, B, C, D, s); tan = bezD(A, B, C, D, s);
    } else {
      float s = t * 2.0 - 1.0;
      vec2 A = vec2(-0.03, 0.0), B = vec2(0.37, 0.0), C = vec2(0.5, -0.4), D = vec2(1.15, 0.43);
      pt = bez(A, B, C, D, s); tan = bezD(A, B, C, D, s);
    }
    vec2 n = normalize(vec2(-tan.y, tan.x));
    float breathe = 1.0 + 0.25 * sin(uTime * 0.8 + aSeed * 12.0 + t * 9.0);
    p = pt + n * aOff * breathe;
    alpha = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.9, t);
    p = p * uBoxScale + uBoxCenter;
  } else if (aKind < 1.5) {
    // The i-dot: a slowly orbiting cluster
    float a = uTime * (0.2 + aSeed * 0.3) + aSeed * 40.0;
    vec2 local = aPos + vec2(cos(a), sin(a)) * 0.006;
    p = local * uBoxScale + uBoxCenter;
  } else {
    // Ambient dust, drifting upward
    p = aPos * vec2(uAspect, 1.0);
    p.y = mod(p.y + 1.0 + uTime * 0.015 * (0.3 + aSeed), 2.0) - 1.0;
    p.x += sin(uTime * 0.3 + aSeed * 20.0) * 0.02;
    alpha = 0.35;
  }

  // Parallax: near particles move more with the cursor
  p += uMouse * (aZ - 0.5) * 0.06 * uMouseOn;

  // Cursor repulsion + glow
  vec2 d = p - uMouse;
  float dist = length(d);
  float infl = smoothstep(0.38, 0.0, dist) * uMouseOn;
  p += (dist > 0.0001 ? d / dist : vec2(0.0)) * infl * (0.16 + 0.08 * aZ);

  // Click shockwave
  float age = uTime - uClick.z;
  if (age > 0.0 && age < 2.5) {
    vec2 dc = p - uClick.xy;
    float dcl = length(dc);
    float r = age * 1.1;
    float ring = exp(-pow((dcl - r) * 7.0, 2.0)) * exp(-age * 1.6);
    p += (dcl > 0.0001 ? dc / dcl : vec2(0.0)) * ring * 0.22;
    infl = max(infl, ring);
  }

  // Scroll away: scatter + fade
  vec2 scatterDir = vec2(cos(aSeed * 31.0), sin(aSeed * 47.0));
  p += scatterDir * uScroll * uScroll * 0.9;
  alpha *= 1.0 - uScroll * 0.85;

  gl_Position = vec4(p.x / uAspect, p.y, 0.0, 1.0);
  float size = uSize * (0.55 + aZ * 1.1) * (aKind > 1.5 ? 0.7 : 1.0) * (aKind > 0.5 && aKind < 1.5 ? 1.3 : 1.0);
  gl_PointSize = size * uPx * (1.0 + infl * 1.4);

  vAlpha = alpha * (0.35 + 0.65 * aZ);
  vHeat = infl;
  vSeed = aSeed;
}`;

const FRAG = /* glsl */ `#version 300 es
precision mediump float;
in float vAlpha;
in float vHeat;
in float vSeed;
out vec4 outColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.0, r);
  vec3 blue = vec3(0.165, 0.471, 0.863);   // #2A78DC
  vec3 sky  = vec3(0.435, 0.816, 0.969);   // #6FD0F7
  vec3 mist = vec3(0.84, 0.855, 0.878);    // #D6DADF
  vec3 col = mix(blue, sky, vSeed);
  col = mix(col, mist, step(0.93, vSeed) * 0.8); // a few silver sparks, like the logo grey
  col = mix(col, vec3(1.0), vHeat * 0.7);
  outColor = vec4(col * soft, soft * vAlpha * (0.75 + vHeat));
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
}

/** Gaussian-ish random in -1..1 (sum of uniforms), so particles cluster at the core. */
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

function buildParticles(count) {
  const ribbon = Math.floor(count * 0.78);
  const dot = Math.floor(count * 0.07);
  const ambient = count - ribbon - dot;
  const n = ribbon + dot + ambient;
  const T = new Float32Array(n), OFF = new Float32Array(n), Z = new Float32Array(n);
  const SEED = new Float32Array(n), KIND = new Float32Array(n), POS = new Float32Array(n * 2);
  // Ribbon strands echo the hero SVG: a thick core plus thin parallel lines
  const strands = [0, 0, 0, 0, 0.13, -0.13, 0.26, -0.24];
  let i = 0;
  for (; i < ribbon; i++) {
    const strand = strands[Math.floor(Math.random() * strands.length)];
    T[i] = Math.random();
    OFF[i] = strand === 0 ? gauss() * 0.06 : strand + gauss() * 0.008;
    Z[i] = Math.random();
    SEED[i] = Math.random();
  }
  for (; i < ribbon + dot; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 0.075;
    POS[i * 2] = 0.59 + Math.cos(a) * r;
    POS[i * 2 + 1] = 0.5 + Math.sin(a) * r;
    KIND[i] = 1;
    Z[i] = 0.6 + Math.random() * 0.4;
    SEED[i] = 0.85 + Math.random() * 0.15; // mostly silver, like the logo's i-dot
  }
  for (; i < n; i++) {
    POS[i * 2] = Math.random() * 2 - 1;
    POS[i * 2 + 1] = Math.random() * 2 - 1;
    KIND[i] = 2;
    Z[i] = Math.random() * 0.6;
    SEED[i] = Math.random();
  }
  return { n, attrs: { aT: [T, 1], aOff: [OFF, 1], aZ: [Z, 1], aSeed: [SEED, 1], aKind: [KIND, 1], aPos: [POS, 2] } };
}

export default function HeroParticles({ anchorRef, onFail }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas.parentElement; // the hero section
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: true, premultipliedAlpha: true });
    if (!gl) {
      onFail?.();
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
      console.warn("Hero particles disabled:", err);
      onFail?.();
      return;
    }
    gl.useProgram(prog);

    const small = window.matchMedia("(max-width: 760px)").matches;
    const { n, attrs } = buildParticles(small ? 2600 : 7000);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffers = [];
    for (const [name, [data, size]] of Object.entries(attrs)) {
      const loc = gl.getAttribLocation(prog, name);
      const buf = gl.createBuffer();
      buffers.push(buf);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }

    const U = {};
    for (const name of ["uTime", "uAspect", "uBoxCenter", "uBoxScale", "uMouse", "uMouseOn", "uClick", "uScroll", "uPx", "uSize"]) {
      U[name] = gl.getUniformLocation(prog, name);
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied, additive-looking glow
    gl.clearColor(0, 0, 0, 0);

    // ---- sizing: canvas fills the hero; ribbon fits the anchor box ----
    let w = 1, h = 1, dpr = 1, aspect = 1;
    const box = { cx: 0.5, cy: 0, s: 0.6 };
    const toWorld = (px, py) => [((px / w) * 2 - 1) * aspect, -((py / h) * 2 - 1)];

    const resize = () => {
      const r = host.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      aspect = w / h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const a = anchorRef?.current?.getBoundingClientRect();
      if (a && a.width > 0) {
        const [cx, cy] = toWorld(a.left - r.left + a.width / 2, a.top - r.top + a.height / 2);
        box.cx = cx;
        box.cy = cy;
        box.s = a.width / h; // world units per local unit (local box is -1..1)
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // ---- input ----
    const mouse = { x: 0, y: 0, tx: 0, ty: 0, on: 0, ton: 0 };
    let click = [0, 0, -10];
    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      const [x, y] = toWorld(e.clientX - r.left, e.clientY - r.top);
      mouse.tx = x;
      mouse.ty = y;
      mouse.ton = e.clientY >= r.top && e.clientY <= r.bottom ? 1 : 0;
    };
    const onLeave = () => (mouse.ton = 0);
    const onDown = (e) => {
      const r = host.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      const [x, y] = toWorld(e.clientX - r.left, e.clientY - r.top);
      click = [x, y, time];
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    // ---- loop (paused when off-screen or tab hidden) ----
    let raf = 0, time = 0, last = performance.now(), visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(host);

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      const k = 1 - Math.pow(0.0015, dt); // frame-rate independent easing
      mouse.x += (mouse.tx - mouse.x) * k;
      mouse.y += (mouse.ty - mouse.y) * k;
      mouse.on += (mouse.ton - mouse.on) * k * 0.6;

      const r = host.getBoundingClientRect();
      const scroll = Math.min(Math.max(-r.top / r.height, 0), 1);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uAspect, aspect);
      gl.uniform2f(U.uBoxCenter, box.cx, box.cy);
      gl.uniform1f(U.uBoxScale, box.s);
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.uniform1f(U.uMouseOn, mouse.on);
      gl.uniform3f(U.uClick, click[0], click[1], click[2]);
      gl.uniform1f(U.uScroll, scroll);
      gl.uniform1f(U.uPx, dpr);
      gl.uniform1f(U.uSize, small ? 3.2 : 3.6);
      gl.drawArrays(gl.POINTS, 0, n);
      raf = requestAnimationFrame(frame);
    }
    const onVis = () => {
      if (!document.hidden && visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(frame);
    canvas.classList.add("ready");

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      buffers.forEach((b) => gl.deleteBuffer(b));
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    };
  }, [anchorRef, onFail]);

  return <canvas ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}
