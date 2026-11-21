// Turns the real GLEITS logo image into particle targets: one position, one
// colour and one letter index (g l e i t s → 0..5) per particle.

const SRC = "/logos/gleits-on-dark.png";

/** Height ÷ width of the logo image (588 × 233). */
export const LOGO_RATIO = 233 / 588;

/**
 * Which letter a logo pixel belongs to. Measured from the 588px-wide artwork:
 * "g l e" and the swash are blue; "i t s" are white. The swash between e and t
 * counts as part of the i (it's the stroke the i sits on) up to the t's stem.
 */
function letterOf(X, blue) {
  if (X < 132) return 0; // g
  if (X < 200) return 1; // l
  if (blue) {
    if (X < 322) return 2; // e
    if (X < 414) return 3; // swash under the i
    return 4; // swash end = t crossbar
  }
  if (X < 390) return 3; // i
  if (X < 495) return 4; // t
  return 5; // s
}

export async function loadLogoTargets(N) {
  const img = new Image();
  img.src = SRC;
  await img.decode();
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, W, H).data;

  // Every solid pixel is a candidate: x, y, r, g, b, letter
  const cand = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 140) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      cand.push(x, y, r, g, b, letterOf((x * 588) / W, b > r + 40));
    }
  }
  const count = cand.length / 6;
  if (!count) throw new Error("Logo image has no visible pixels");

  const pos = new Float32Array(N * 2);
  const col = new Float32Array(N * 3);
  const letter = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    const k = ((Math.random() * count) | 0) * 6;
    const x = cand[k] + Math.random() - 0.5;
    const y = cand[k + 1] + Math.random() - 0.5;
    // x spans -1..1; y keeps the logo's proportions
    pos[n * 2] = (x / W) * 2 - 1;
    pos[n * 2 + 1] = -((y / H) * 2 - 1) * (H / W);
    col[n * 3] = cand[k + 2] / 255;
    col[n * 3 + 1] = cand[k + 3] / 255;
    col[n * 3 + 2] = cand[k + 4] / 255;
    letter[n] = cand[k + 5];
  }
  return { aLogo: [pos, 2], aLogoCol: [col, 3], aLetter: [letter, 1] };
}
