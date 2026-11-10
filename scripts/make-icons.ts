/**
 * Membuat ikon PWA sementara (cincin emas pada latar hitam, monogram "RW").
 * Ganti dengan logo resmi MBtech/RWSA bila sudah tersedia: taruh PNG di public/icons/
 * dengan nama yang sama (icon-192.png, icon-512.png, maskable-512.png, apple-touch-icon.png).
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const out = path.resolve(process.cwd(), "public/icons");

const svg = (size: number, safe: number) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f3dea0"/><stop offset="0.55" stop-color="#c9a24b"/><stop offset="1" stop-color="#8a6d2b"/>
    </linearGradient>
    <radialGradient id="bg" cx="50%" cy="35%" r="75%">
      <stop offset="0" stop-color="#1d1810"/><stop offset="1" stop-color="#0a0908"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(${safe}) translate(-256 -256)">
    <circle cx="256" cy="256" r="200" fill="none" stroke="url(#g)" stroke-width="10"/>
    <circle cx="256" cy="256" r="178" fill="none" stroke="url(#g)" stroke-width="3"/>
    <text x="256" y="298" font-family="Georgia, 'Times New Roman', serif" font-size="150" font-weight="700"
          fill="url(#g)" text-anchor="middle" letter-spacing="4">RW</text>
    <text x="256" y="352" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="#c9a24b"
          text-anchor="middle" letter-spacing="10">2026</text>
  </g>
</svg>`;

async function main() {
  await mkdir(out, { recursive: true });
  const render = (size: number, safe: number, name: string) =>
    sharp(Buffer.from(svg(size, safe))).png().toFile(path.join(out, name));
  await render(192, 1, "icon-192.png");
  await render(512, 1, "icon-512.png");
  await render(512, 0.74, "maskable-512.png"); // zona aman maskable
  await render(180, 1, "apple-touch-icon.png");
  console.log("Ikon dibuat di", out);
}
main();

