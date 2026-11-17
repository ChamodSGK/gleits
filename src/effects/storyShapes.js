// Point-cloud shapes for the scroll story. Each returns a Float32Array of N xyz
// positions, roughly within a radius of ~1.2 around the origin.
// Particle i in one shape flies to particle i in the next, which gives the
// chaotic "shatter and re-form" transition.

/** Gaussian-ish random in about -1..1, so points cluster toward the middle. */
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

/** Small seeded PRNG so node layouts look the same on every visit. */
function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (arr) => arr[(Math.random() * arr.length) | 0];

/** 01 — "Thoughtful software": a crisp 3×3×3 engineering lattice. */
export function lattice(N) {
  const out = new Float32Array(N * 3);
  const G = [-0.75, -0.25, 0.25, 0.75];
  for (let i = 0; i < N; i++) {
    let x, y, z;
    if (Math.random() < 0.14) {
      // glowing joints where the lines meet
      x = pick(G) + gauss() * 0.03;
      y = pick(G) + gauss() * 0.03;
      z = pick(G) + gauss() * 0.03;
    } else {
      const t = (Math.random() * 2 - 1) * 0.75;
      const a = pick(G) + gauss() * 0.006;
      const b = pick(G) + gauss() * 0.006;
      const axis = (Math.random() * 3) | 0;
      [x, y, z] = axis === 0 ? [t, a, b] : axis === 1 ? [a, t, b] : [a, b, t];
    }
    out.set([x, y, z], i * 3);
  }
  return out;
}

/** 02 — "Connected experiences": nodes joined by streams of light. */
export function network(N) {
  const out = new Float32Array(N * 3);
  const rnd = seeded(42);
  const nodes = [];
  const count = 16;
  for (let k = 0; k < count; k++) {
    // spread over a sphere (golden angle), with varied radius for depth
    const y = 1 - (k / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = k * 2.39996;
    const rad = 0.6 + rnd() * 0.5;
    nodes.push([Math.cos(th) * r * rad, y * rad * 0.9, Math.sin(th) * r * rad]);
  }
  const edges = [];
  nodes.forEach((a, i) => {
    const near = nodes
      .map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])])
      .filter(([j]) => j !== i)
      .sort((p, q) => p[1] - q[1])
      .slice(0, 3);
    near.forEach(([j]) => {
      if (!edges.some(([p, q]) => (p === j && q === i) || (p === i && q === j))) edges.push([i, j]);
    });
  });
  for (let i = 0; i < N; i++) {
    let p;
    if (Math.random() < 0.3) {
      const n = pick(nodes);
      p = [n[0] + gauss() * 0.06, n[1] + gauss() * 0.06, n[2] + gauss() * 0.06];
    } else {
      const [a, b] = pick(edges).map((k) => nodes[k]);
      const t = Math.random();
      p = [0, 1, 2].map((d) => a[d] + (b[d] - a[d]) * t + gauss() * 0.01);
    }
    out.set(p, i * 3);
  }
  return out;
}

/** 03 — "Global possibilities": a globe, with Sri Lanka lit up. `home` flags those points. */
export function globe(N, home) {
  const out = new Float32Array(N * 3);
  const deg = Math.PI / 180;
  const onSphere = (lat, lon, r = 1) => [Math.cos(lat) * Math.sin(lon) * r, Math.sin(lat) * r, Math.cos(lat) * Math.cos(lon) * r];
  const LK = [7.87 * deg, 80.77 * deg]; // Sri Lanka
  for (let i = 0; i < N; i++) {
    const r = Math.random();
    let p;
    if (r < 0.05) {
      p = onSphere(LK[0] + gauss() * 0.06, LK[1] + gauss() * 0.05, 1.03);
      home[i] = 1;
    } else if (r < 0.2) {
      p = onSphere(pick([-60, -30, 0, 30, 60]) * deg, Math.random() * Math.PI * 2);
    } else if (r < 0.32) {
      p = onSphere((Math.random() - 0.5) * Math.PI, pick([0, 30, 60, 90, 120, 150]) * deg);
    } else if (r < 0.42) {
      // a tilted orbit ring
      const a = Math.random() * Math.PI * 2;
      const rr = 1.38 + gauss() * 0.015;
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      p = [x, z * Math.sin(0.45), z * Math.cos(0.45)];
    } else {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      p = [s * Math.cos(th), u, s * Math.sin(th)];
    }
    out.set(p, i * 3);
  }
  return out;
}

/** 04 — "Your goals guide everything we build": the GLEITS i→t swash, in 3D. */
export function ribbon(N) {
  const out = new Float32Array(N * 3);
  const bez = (a, b, c, d, t) => {
    const u = 1 - t;
    return [0, 1].map((k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]);
  };
  const bezD = (a, b, c, d, t) => {
    const u = 1 - t;
    return [0, 1].map((k) => 3 * u * u * (b[k] - a[k]) + 6 * u * t * (c[k] - b[k]) + 3 * t * t * (d[k] - c[k]));
  };
  const S1 = [[-1.15, -0.43], [-0.63, -0.43], [-0.43, 0], [-0.03, 0]];
  const S2 = [[-0.03, 0], [0.37, 0], [0.5, -0.4], [1.15, 0.43]];
  const strands = [0, 0, 0, 0, 0.13, -0.13, 0.26, -0.24];
  for (let i = 0; i < N; i++) {
    let p;
    if (Math.random() < 0.08) {
      // the i-dot
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      const r = Math.cbrt(Math.random()) * 0.085;
      p = [0.59 + s * Math.cos(th) * r, 0.5 + u * r, s * Math.sin(th) * r];
    } else {
      const t = Math.random();
      const seg = t < 0.5 ? S1 : S2;
      const s = t < 0.5 ? t * 2 : t * 2 - 1;
      const [x, y] = bez(...seg, s);
      const [dx, dy] = bezD(...seg, s);
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const strand = pick(strands);
      const off = strand === 0 ? gauss() * 0.06 : strand + gauss() * 0.008;
      const z = strand === 0 ? gauss() * 0.06 : gauss() * 0.01;
      p = [x + nx * off, y + ny * off, z];
    }
    // centre the shape
    out.set([p[0] * 0.95, (p[1] - 0.03) * 0.95, p[2]], i * 3);
  }
  return out;
}
