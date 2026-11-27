// Draws the Home Screen icons (m9-release B1) as PNGs with no dependency: a glowing saber blade in the app's accent on its dark
// background, drawn with signed distances and antialiased. Run once (node scripts/make-icons.mjs); the PNGs are committed in
// public/icons. Colours from src/ui/styles.css (--bg #070b12, --accent #3fc6ff).
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG = [7, 11, 18];
const ACCENT = [63, 198, 255];
const HILT = [150, 160, 175];
const HILT_DARK = [70, 80, 95];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel((x + 0.5) / size, (y + 0.5) / size, size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/** Distance from p to the segment a-b. */
function seg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

/** The icon at unit coordinates; `scale` shrinks the drawing toward the centre (the maskable icon's safe zone). */
const icon = (scale) => (u, v, size) => {
  const x = 0.5 + (u - 0.5) / scale, y = 0.5 + (v - 0.5) / scale;
  const aa = 1.2 / (size * scale);
  // A diagonal saber: the hilt at the lower left, the blade to the upper right.
  const hiltA = [0.24, 0.8], hiltB = [0.38, 0.62], tip = [0.8, 0.14];
  let c = mix(BG, [12, 22, 36], Math.max(0, 1 - Math.hypot(x - 0.55, y - 0.4) / 0.75));
  const dBlade = seg(x, y, hiltB[0], hiltB[1], tip[0], tip[1]);
  const glow = Math.exp(-((dBlade / 0.09) ** 2));
  c = mix(c, ACCENT, glow * 0.55);
  const core = Math.min(1, Math.max(0, (0.035 - dBlade) / aa + 0.5));
  c = mix(c, mix(ACCENT, [235, 250, 255], 0.65), core);
  const dHilt = seg(x, y, hiltA[0], hiltA[1], hiltB[0], hiltB[1]);
  const hilt = Math.min(1, Math.max(0, (0.042 - dHilt) / aa + 0.5));
  const band = Math.abs(((x - hiltA[0]) * 0.7 + (y - hiltA[1]) * -0.7) * 40) % 2 < 0.5 ? HILT_DARK : HILT;
  c = mix(c, band, hilt);
  return c.map((n) => Math.round(Math.max(0, Math.min(255, n))));
};

const out = 'public/icons';
for (const [name, size, scale] of [['icon-180.png', 180, 1], ['icon-192.png', 192, 1], ['icon-512.png', 512, 1], ['icon-maskable-512.png', 512, 0.8]]) {
  writeFileSync(`${out}/${name}`, png(size, icon(scale)));
  console.log(`${out}/${name}`);
}
