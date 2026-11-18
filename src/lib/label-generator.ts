import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import QRCode from "qrcode";

export type LogoChoice = "rwsa" | "mbtech";
export type StickerPreset = "50x50" | "50x30" | "40x30" | "50x80";

let cachedTrimmedRwsa: Buffer | null = null;
let cachedTrimmedMbtech: Buffer | null = null;

async function getTrimmedLogo(logoChoice: LogoChoice): Promise<Buffer> {
  if (logoChoice === "mbtech") {
    if (!cachedTrimmedMbtech) {
      const mbtechLogoPath = path.resolve(process.cwd(), "public/icons/mbtech_logo.png");
      const raw = await fs.readFile(mbtechLogoPath);
      cachedTrimmedMbtech = await sharp(raw).trim().toBuffer();
    }
    return cachedTrimmedMbtech;
  } else {
    if (!cachedTrimmedRwsa) {
      const primaryLogo = path.resolve(process.cwd(), "public/icons/LOGO RWSA 2026 POLOS.png");
      const fallbackLogo = path.resolve(process.cwd(), "public/icons/icon-192.png");
      let raw: Buffer;
      try {
        raw = await fs.readFile(primaryLogo);
      } catch {
        raw = await fs.readFile(fallbackLogo);
      }
      cachedTrimmedRwsa = await sharp(raw).trim().toBuffer();
    }
    return cachedTrimmedRwsa;
  }
}

/**
 * Menghasilkan QR Code modern bergaya dots (titik-titik bulat estetis),
 * mata sudut modern berujung halus, dan logo di tengah yang diperbesar TANPA outline/stroke.
 */
export async function generateQrWithLogo(
  url: string,
  targetWidth = 450,
  logoChoice: LogoChoice = "rwsa"
): Promise<Buffer> {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const margin = 1;
  const modulePx = Math.max(9, Math.floor(targetWidth / (size + margin * 2)));
  const qrPx = (size + margin * 2) * modulePx;

  const centerCoord = qrPx / 2;
  // Logo diperbesar (~29% dari lebar QR)
  const logoDiameter = Math.round(qrPx * 0.29);
  const logoRadius = logoDiameter / 2;
  const clearanceRadius = logoRadius + modulePx * 0.4;

  function isFinder(r: number, c: number) {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= size - 7) return true;
    if (r >= size - 7 && c < 7) return true;
    return false;
  }

  function isInsideCenter(cx: number, cy: number) {
    return Math.hypot(cx - centerCoord, cy - centerCoord) < clearanceRadius;
  }

  const svgParts: string[] = [
    `<svg width="${qrPx}" height="${qrPx}" viewBox="0 0 ${qrPx} ${qrPx}" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
  ];

  // Titik data QR (smooth dots)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) continue;
      const cx = (c + margin + 0.5) * modulePx;
      const cy = (r + margin + 0.5) * modulePx;
      if (isInsideCenter(cx, cy)) continue;

      if (qr.modules.get(r, c)) {
        svgParts.push(`<circle cx="${cx}" cy="${cy}" r="${modulePx * 0.44}" fill="#000000"/>`);
      }
    }
  }

  // 3 Finder eyes (sudut modern halus)
  const finders = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];

  for (const [fr, fc] of finders) {
    const x = (fc + margin) * modulePx;
    const y = (fr + margin) * modulePx;
    const outerRx = Math.round(modulePx * 0.55);
    const midRx = Math.round(modulePx * 0.35);
    const innerRx = Math.round(modulePx * 0.2);

    svgParts.push(`<rect x="${x}" y="${y}" width="${7 * modulePx}" height="${7 * modulePx}" rx="${outerRx}" fill="#000000"/>`);
    svgParts.push(`<rect x="${x + modulePx}" y="${y + modulePx}" width="${5 * modulePx}" height="${5 * modulePx}" rx="${midRx}" fill="#ffffff"/>`);
    svgParts.push(`<rect x="${x + 2 * modulePx}" y="${y + 2 * modulePx}" width="${3 * modulePx}" height="${3 * modulePx}" rx="${innerRx}" fill="#000000"/>`);
  }

  // Lingkaran putih bersih di tengah untuk logo — TANPA OUTLINE / TANPA STROKE!
  svgParts.push(`<circle cx="${centerCoord}" cy="${centerCoord}" r="${logoRadius}" fill="#ffffff"/>`);
  svgParts.push(`</svg>`);

  const qrBaseBuffer = await sharp(Buffer.from(svgParts.join(""))).png().toBuffer();

  const trimmedLogo = await getTrimmedLogo(logoChoice);
  const logoInnerSize = Math.round(logoDiameter * 0.94);
  const resizedLogo = await sharp(trimmedLogo)
    .resize(logoInnerSize, logoInnerSize, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp(qrBaseBuffer)
    .composite([{ input: resizedLogo, gravity: "center" }])
    .png()
    .toBuffer();
}

/**
 * Menghasilkan 1 gambar stiker utuh (QR Code modern + Nomor Slot)
 * yang sudah diposisikan pas dengan ukuran label Niimbot B1.
 */
export async function generateStickerImage(
  url: string,
  kodeKarya: string,
  preset: StickerPreset = "50x50",
  logoChoice: LogoChoice = "rwsa"
): Promise<Buffer> {
  const formattedKode = kodeKarya.startsWith("#") ? kodeKarya : `#${kodeKarya}`;

  if (preset === "50x30") {
    // Rasio 50mm x 30mm (Landscape Side-by-Side: QR di kiri, Nomor di kanan)
    const width = 600;
    const height = 360;
    const qrSize = 320;
    const qrBuffer = await generateQrWithLogo(url, qrSize, logoChoice);

    const textSvg = Buffer.from(
      `<svg width="240" height="${height}">
        <text x="120" y="195" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="70" font-weight="900" text-anchor="middle" fill="#000000" letter-spacing="1">${formattedKode}</text>
        <text x="120" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" text-anchor="middle" fill="#666666" letter-spacing="2">SLOT</text>
      </svg>`
    );

    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: qrBuffer, top: 20, left: 20 },
        { input: textSvg, top: 0, left: 350 },
      ])
      .png()
      .toBuffer();
  }

  if (preset === "40x30") {
    // Rasio 40mm x 30mm (Landscape Kompak)
    const width = 480;
    const height = 360;
    const qrSize = 300;
    const qrBuffer = await generateQrWithLogo(url, qrSize, logoChoice);

    const textSvg = Buffer.from(
      `<svg width="160" height="${height}">
        <text x="80" y="195" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="54" font-weight="900" text-anchor="middle" fill="#000000" letter-spacing="1">${formattedKode}</text>
        <text x="80" y="230" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" text-anchor="middle" fill="#666666" letter-spacing="2">SLOT</text>
      </svg>`
    );

    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: qrBuffer, top: 30, left: 15 },
        { input: textSvg, top: 0, left: 315 },
      ])
      .png()
      .toBuffer();
  }

  if (preset === "50x80") {
    // Rasio 50mm x 80mm (Portrait Panjang)
    const width = 600;
    const height = 960;
    const qrSize = 520;
    const qrBuffer = await generateQrWithLogo(url, qrSize, logoChoice);

    const textSvg = Buffer.from(
      `<svg width="${width}" height="280">
        <text x="${width / 2}" y="120" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="96" font-weight="900" text-anchor="middle" fill="#000000" letter-spacing="3">${formattedKode}</text>
        <text x="${width / 2}" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="#666666" letter-spacing="3">SLOT PESERTA</text>
      </svg>`
    );

    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: qrBuffer, top: 40, left: Math.round((width - qrSize) / 2) },
        { input: textSvg, top: 620, left: 0 },
      ])
      .png()
      .toBuffer();
  }

  // Default: 50mm x 50mm (Square Kotak - Rekomendasi Utama Niimbot B1)
  const width = 600;
  const height = 600;
  const qrSize = 440;
  const qrBuffer = await generateQrWithLogo(url, qrSize, logoChoice);

  const textSvg = Buffer.from(
    `<svg width="${width}" height="120">
      <text x="${width / 2}" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="80" font-weight="900" text-anchor="middle" fill="#000000" letter-spacing="2">${formattedKode}</text>
    </svg>`
  );

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: qrBuffer, top: 25, left: Math.round((width - qrSize) / 2) },
      { input: textSvg, top: 475, left: 0 },
    ])
    .png()
    .toBuffer();
}
