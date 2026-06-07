// Generates the PWA PNG icons (no image libraries needed).
// Draws a dark rounded disc with a glowing golden ring — the One Ring motif.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const ringR = size * 0.32;
  const ringW = size * 0.085;

  const night = [27, 20, 7];
  const nightLight = [42, 32, 18];
  const goldHi = [231, 200, 120];
  const gold = [200, 162, 74];
  const goldLo = [138, 106, 47];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);

      // Background radial gradient
      const bgT = Math.min(1, dist / (size * 0.7));
      let r = lerp(nightLight[0], night[0], bgT);
      let g = lerp(nightLight[1], night[1], bgT);
      let b = lerp(nightLight[2], night[2], bgT);
      let a = 255;

      // Golden ring (annulus)
      const ringEdge = Math.abs(dist - ringR);
      if (ringEdge < ringW / 2) {
        // vertical position controls gold shade (top bright -> bottom dark)
        const vt = (y - (cy - ringR)) / (2 * ringR);
        const vtc = Math.max(0, Math.min(1, vt));
        let gr, gg, gb;
        if (vtc < 0.55) {
          const t = vtc / 0.55;
          gr = lerp(goldHi[0], gold[0], t);
          gg = lerp(goldHi[1], gold[1], t);
          gb = lerp(goldHi[2], gold[2], t);
        } else {
          const t = (vtc - 0.55) / 0.45;
          gr = lerp(gold[0], goldLo[0], t);
          gg = lerp(gold[1], goldLo[1], t);
          gb = lerp(gold[2], goldLo[2], t);
        }
        // Soft anti-aliased edge
        const edgeBlend = Math.min(1, (ringW / 2 - ringEdge) / (size * 0.01));
        r = lerp(r, gr, edgeBlend);
        g = lerp(g, gg, edgeBlend);
        b = lerp(b, gb, edgeBlend);
      }

      // Rounded-corner transparency
      const corner = size * 0.22;
      const inX = Math.min(x, size - 1 - x);
      const inY = Math.min(y, size - 1 - y);
      if (inX < corner && inY < corner) {
        const cdx = corner - inX;
        const cdy = corner - inY;
        if (Math.hypot(cdx, cdy) > corner) a = 0;
      }

      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = a;
    }
  }
  return buf;
}

// ── Minimal PNG encoder (RGBA, 8-bit) ──
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(rgba, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 default 0
  // Add filter byte (0) per scanline
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(new URL("../public", import.meta.url), { recursive: true });
for (const size of [192, 512]) {
  const png = encodePNG(makeIcon(size), size);
  const out = new URL(`../public/icon-${size}.png`, import.meta.url);
  writeFileSync(out, png);
  console.log(`wrote icon-${size}.png (${png.length} bytes)`);
}
