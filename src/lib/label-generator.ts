import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";
import QRCode from "qrcode";

export type StickerPreset = "40x30" | "50x30" | "40x60" | "50x50" | "50x60" | "50x70" | "50x80";
export type LogoVariant = "rwsa" | "mbtech";

export const PRESET_MM: Record<StickerPreset, { wMm: number; hMm: number }> = {
  "40x30": { wMm: 40, hMm: 30 },
  "50x30": { wMm: 50, hMm: 30 },
  "40x60": { wMm: 40, hMm: 60 },
  "50x50": { wMm: 50, hMm: 50 },
  "50x60": { wMm: 50, hMm: 60 },
  "50x70": { wMm: 50, hMm: 70 },
  "50x80": { wMm: 50, hMm: 80 },
};

const cachedLogos = new Map<LogoVariant, { buf: Buffer; width: number; height: number; mtimeMs: number }>();

async function getTrimmedLogo(variant: LogoVariant = "rwsa"): Promise<{ buf: Buffer; width: number; height: number }> {
  const fileName = variant === "mbtech" ? "mbtech_logo.png" : "LOGO RWSA 2026 POLOS.png";
  const primaryLogo = path.resolve(process.cwd(), "public/icons", fileName);
  const fallbackLogo = path.resolve(process.cwd(), "public/icons/icon-192.png");

  let mtimeMs = 0;
  try {
    const st = await fs.stat(primaryLogo);
    mtimeMs = st.mtimeMs;
  } catch {
    // fallback
  }

  const existing = cachedLogos.get(variant);
  if (existing && existing.mtimeMs === mtimeMs && mtimeMs > 0) {
    return existing;
  }

  let raw: Buffer;
  try {
    raw = await fs.readFile(primaryLogo);
  } catch {
    raw = await fs.readFile(fallbackLogo);
  }
  const buf = await sharp(raw).trim().toBuffer();
  const meta = await sharp(buf).metadata();
  const entry = {
    buf,
    width: meta.width ?? 1000,
    height: meta.height ?? 1000,
    mtimeMs,
  };
  cachedLogos.set(variant, entry);
  return entry;
}

function getAlignmentCenters(version: number): Array<[number, number]> {
  const table: Record<number, number[]> = {
    1: [],
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30],
    6: [6, 34],
    7: [6, 22, 38],
    8: [6, 24, 42],
    9: [6, 26, 46],
    10: [6, 28, 50],
  };
  const pos = table[version] ?? [];
  const centers: Array<[number, number]> = [];
  for (const r of pos) {
    for (const c of pos) {
      const last = pos[pos.length - 1];
      if ((r === 6 && c === 6) || (r === 6 && c === last) || (r === last && c === 6)) continue;
      centers.push([r, c]);
    }
  }
  return centers;
}

/**
 * Menghasilkan QR Code modern bergaya dots (titik-titik bulat estetis),
 * mata sudut & pola alignment modern berujung halus, serta logo RWSA 2026 besar (+30% dari versi awal)
 * menggunakan cutout mengikuti siluet logo (tanpa outline/stroke, hanya memotong ~12.5% modul)
 * sehingga rasio QR selalu 1:1 dan teruji 100% terbaca pada 203 dpi thermal.
 */
export async function generateQrWithLogo(
  url: string,
  targetWidth = 468,
  opts?: { exactModulePx?: number; qrMargin?: number; logo?: LogoVariant }
): Promise<Buffer> {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const margin = opts?.qrMargin ?? 1;
  const modulePx = opts?.exactModulePx ?? Math.max(7, Math.floor(targetWidth / (size + margin * 2)));
  const qrPx = (size + margin * 2) * modulePx;

  const logoVariant: LogoVariant = opts?.logo ?? "rwsa";
  // RWSA (perisai 0.82:1): tinggi 39% (~12.5% modul terpotong)
  // MBtech (bulat 1:1): diameter 36% (~14.4% modul terpotong) — keduanya 100% lolos 203 dpi
  const trimmedLogo = await getTrimmedLogo(logoVariant);
  const logoHFrac = logoVariant === "mbtech" ? 0.36 : 0.39;
  const logoTargetH = Math.round(qrPx * logoHFrac);
  const logoTargetW = Math.round(logoTargetH * (trimmedLogo.width / trimmedLogo.height));

  const logoRaw = await sharp(trimmedLogo.buf)
    .resize(logoTargetW, logoTargetH, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data: alphaData, info: logoInfo } = logoRaw;
  const logoLeft = Math.round((qrPx - logoInfo.width) / 2);
  const logoTop = Math.round((qrPx - logoInfo.height) / 2);
  const padPx = modulePx * 0.62;
  const padSq = padPx * padPx;

  const alignCenters = getAlignmentCenters(qr.version);

  function isFinder(r: number, c: number) {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= size - 7) return true;
    if (r >= size - 7 && c < 7) return true;
    return false;
  }

  function isAlignment(r: number, c: number) {
    for (const [ar, ac] of alignCenters) {
      if (Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2) return true;
    }
    return false;
  }

  function overlapsLogoSilhouette(cx: number, cy: number) {
    const r = Math.ceil(padPx);
    const x0 = Math.max(0, Math.floor(cx - r) - logoLeft);
    const x1 = Math.min(logoInfo.width - 1, Math.ceil(cx + r) - logoLeft);
    const y0 = Math.max(0, Math.floor(cy - r) - logoTop);
    const y1 = Math.min(logoInfo.height - 1, Math.ceil(cy + r) - logoTop);
    if (x0 > x1 || y0 > y1) return false;
    for (let y = y0; y <= y1; y += 2) {
      for (let x = x0; x <= x1; x += 2) {
        if (alphaData[(y * logoInfo.width + x) * 4 + 3] > 20) {
          const dx = logoLeft + x - cx;
          const dy = logoTop + y - cy;
          if (dx * dx + dy * dy <= padSq) return true;
        }
      }
    }
    return false;
  }

  const svgParts: string[] = [
    `<svg width="${qrPx}" height="${qrPx}" viewBox="0 0 ${qrPx} ${qrPx}" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="100%" height="100%" fill="#ffffff"/>`,
  ];

  // Titik data QR (smooth dots padat agar kontras maksimal di printer thermal 203 dpi)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c) || isAlignment(r, c)) continue;
      const cx = (c + margin + 0.5) * modulePx;
      const cy = (r + margin + 0.5) * modulePx;
      if (overlapsLogoSilhouette(cx, cy)) continue;

      if (qr.modules.get(r, c)) {
        svgParts.push(`<circle cx="${cx}" cy="${cy}" r="${modulePx * 0.48}" fill="#000000"/>`);
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

    svgParts.push(
      `<rect x="${x}" y="${y}" width="${7 * modulePx}" height="${7 * modulePx}" rx="${outerRx}" fill="#000000"/>`
    );
    svgParts.push(
      `<rect x="${x + modulePx}" y="${y + modulePx}" width="${5 * modulePx}" height="${5 * modulePx}" rx="${midRx}" fill="#ffffff"/>`
    );
    svgParts.push(
      `<rect x="${x + 2 * modulePx}" y="${y + 2 * modulePx}" width="${3 * modulePx}" height="${3 * modulePx}" rx="${innerRx}" fill="#000000"/>`
    );
  }

  // Pola alignment 5×5 (sudut modern halus — sangat membantu kecepatan & akurasi scan HP)
  for (const [ar, ac] of alignCenters) {
    const x = (ac - 2 + margin) * modulePx;
    const y = (ar - 2 + margin) * modulePx;
    svgParts.push(
      `<rect x="${x}" y="${y}" width="${5 * modulePx}" height="${5 * modulePx}" rx="${Math.round(modulePx * 0.45)}" fill="#000000"/>`
    );
    svgParts.push(
      `<rect x="${x + modulePx}" y="${y + modulePx}" width="${3 * modulePx}" height="${3 * modulePx}" rx="${Math.round(modulePx * 0.3)}" fill="#ffffff"/>`
    );
    svgParts.push(
      `<rect x="${x + 2 * modulePx}" y="${y + 2 * modulePx}" width="${modulePx}" height="${modulePx}" rx="${Math.round(modulePx * 0.25)}" fill="#000000"/>`
    );
  }

  svgParts.push(`</svg>`);

  const qrBaseBuffer = await sharp(Buffer.from(svgParts.join(""))).png().toBuffer();

  const resizedLogo = await sharp(trimmedLogo.buf)
    .resize(logoTargetW, logoTargetH, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .sharpen()
    .png()
    .toBuffer();

  return sharp(qrBaseBuffer)
    .composite([{ input: resizedLogo, left: logoLeft, top: logoTop }])
    .png()
    .toBuffer();
}

/**
 * Menghasilkan 1 gambar stiker utuh untuk rol fisik wMm × hMm:
 * - Jika `rotate90: true` (Opsi 1 untuk rol 40×30 / 50×30 mm):
 *   Desain digambar BERDIRI (lebar = hMm, tinggi = wMm, mis. 30×40 mm) agar QR besar di atas
 *   dan angka 001 besar & lebar penuh di bawah, lalu diputar 90° bila `outputRotated !== false`
 *   supaya pas dengan kepala cetak landscape Niimbot B1 (40×30 mm).
 * - QR selalu 1:1 (tanpa stretch), mepet kiri–kanan, dan otomatis di-center antara atas & bawah.
 */
export async function generateStickerByMm(
  url: string,
  kodeKarya: string,
  wMm = 40,
  hMm = 30,
  opts?: { rotate90?: boolean; outputRotated?: boolean; logo?: LogoVariant }
): Promise<Buffer> {
  const safeW = Math.min(120, Math.max(15, wMm));
  const safeH = Math.min(150, Math.max(15, hMm));
  const rotate90 = !!opts?.rotate90;
  const outputRotated = opts?.outputRotated ?? rotate90;
  const logoVariant: LogoVariant = opts?.logo ?? "rwsa";

  // Dimensi desain visual saat ditempel berdiri (bila rotate90=true, tukar lebar & tinggi!)
  const designWmm = rotate90 ? safeH : safeW; // mis. 30mm
  const designHmm = rotate90 ? safeW : safeH; // mis. 40mm

  // Skala 16 px/mm untuk stiker kecil (<=35mm) agar modul QR tajam, 12 px/mm untuk stiker besar
  const pxPerMm = Math.min(designWmm, designHmm) <= 35 ? 16 : 12;
  const width = Math.round(designWmm * pxPerMm); // 30mm * 16 = 480px
  const height = Math.round(designHmm * pxPerMm); // 40mm * 16 = 640px
  const formattedKode = kodeKarya.replace(/^#+/, "");

  const qrData = QRCode.create(url, { errorCorrectionLevel: "H" });
  const qrSize = qrData.modules.size;
  const qrMargin = 1;

  let finalBuf: Buffer;

  // Mode Landscape Side-by-Side (hanya bila TIDAK rotate90 dan lebar > tinggi * 1.15)
  if (!rotate90 && designWmm > designHmm * 1.15) {
    const padY = Math.round(height * 0.04);
    const padX = Math.round(width * 0.03);
    const maxQrSide = Math.min(height - 2 * padY, Math.round(width * 0.58));
    let modulePx = 6;
    for (let m = 22; m >= 6; m--) {
      if ((qrSize + qrMargin * 2) * m <= maxQrSide) {
        modulePx = m;
        break;
      }
    }
    const qrBuffer = await generateQrWithLogo(url, 0, { exactModulePx: modulePx, qrMargin, logo: logoVariant });
    const qrPx = (qrSize + qrMargin * 2) * modulePx;

    const rightAreaLeft = padX + qrPx + Math.round(width * 0.02);
    const rightAreaW = Math.max(80, width - rightAreaLeft - padX);
    const fontSize = Math.round(Math.min(height * 0.24, rightAreaW * 0.42));
    const capH = Math.round(fontSize * 0.72);
    const subSize = Math.max(12, Math.round(fontSize * 0.26));
    const textH = capH + subSize + 24;

    const textSvg = Buffer.from(
      `<svg width="${rightAreaW}" height="${textH}">
        <text x="${rightAreaW / 2}" y="${capH + 4}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="900" text-anchor="middle" fill="#000000" letter-spacing="2">${formattedKode}</text>
        <text x="${rightAreaW / 2}" y="${capH + subSize + 14}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${subSize}" font-weight="700" text-anchor="middle" fill="#666666" letter-spacing="2">SLOT</text>
      </svg>`
    );

    finalBuf = await sharp({
      create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    })
      .composite([
        { input: qrBuffer, top: Math.round((height - qrPx) / 2), left: padX },
        { input: textSvg, top: Math.round((height - textH) / 2), left: rightAreaLeft },
      ])
      .png()
      .toBuffer();
  } else {
    // Mode Portrait / Square / Rotated-90 (30×40 berdiri, 40×60, 50×50, dll):
    // Kiri–kanan mepet (~1.5mm) agar QR maksimal besar, angka tebal di bawah, auto-center atas–bawah!
    const minSidePad = Math.max(4, Math.round(width * 0.012));
    const minVertPad = Math.round(height * 0.045);
    // Pada rasio 30×40 (height/width ~ 1.33), angka dibuat besar & tegas (23% lebar)
    const fontScale = designHmm >= designWmm * 1.25 ? 0.22 : 0.145;
    const fontSize = Math.round(Math.min(width, height) * fontScale);
    const digitCapH = Math.round(fontSize * 0.72);
    const gap = Math.max(26, Math.round(Math.min(width, height) * 0.06));

    const maxQrW = width - 2 * minSidePad;
    let modulePx = 6;
    for (let m = 24; m >= 6; m--) {
      const blackSize = qrSize * m;
      const totalWithQuiet = blackSize + qrMargin * 2 * m;
      const visualGroupH = blackSize + gap + digitCapH;
      if (totalWithQuiet <= maxQrW && visualGroupH + 2 * minVertPad <= height) {
        modulePx = m;
        break;
      }
    }

    const qrBuffer = await generateQrWithLogo(url, 0, { exactModulePx: modulePx, qrMargin, logo: logoVariant });
    const qrPx = (qrSize + qrMargin * 2) * modulePx;
    const blackQrH = qrSize * modulePx;

    // Auto-center tepat di tengah antara batas atas & bawah stiker
    const visualGroupH = blackQrH + gap + digitCapH;
    const visualTopY = Math.round((height - visualGroupH) / 2);
    const qrTop = Math.max(0, visualTopY - qrMargin * modulePx);
    const digitsTop = visualTopY + blackQrH + gap;

    const svgPadTop = 20;
    const textSvg = Buffer.from(
      `<svg width="${width}" height="${digitCapH + svgPadTop * 2}">
        <text x="${width / 2}" y="${svgPadTop + digitCapH}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="900" text-anchor="middle" fill="#000000" letter-spacing="5">${formattedKode}</text>
      </svg>`
    );

    finalBuf = await sharp({
      create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    })
      .composite([
        { input: qrBuffer, top: qrTop, left: Math.round((width - qrPx) / 2) },
        { input: textSvg, top: Math.max(0, digitsTop - svgPadTop), left: 0 },
      ])
      .png()
      .toBuffer();
  }

  // Putar 90° searah jarum jam saat dikirim ke printer landscape (40×30 / 50×30 mm)
  if (rotate90 && outputRotated) {
    return sharp(finalBuf).rotate(90).png().toBuffer();
  }
  return finalBuf;
}

export async function generateStickerImage(
  url: string,
  kodeKarya: string,
  preset: StickerPreset = "40x30",
  opts?: { rotate90?: boolean; outputRotated?: boolean; logo?: LogoVariant }
): Promise<Buffer> {
  const dim = PRESET_MM[preset] ?? PRESET_MM["40x30"];
  return generateStickerByMm(url, kodeKarya, dim.wMm, dim.hMm, opts);
}
