"use client";

import type {
  NiimbotBattery,
  NiimbotDriver,
  NiimbotModelConfig,
  NiimbotPrinterInfo,
  NiimbotReadiness,
  NiimbotSizeConfig,
  NiimbotStatusResult,
} from "@/types/niimbot";

export interface NiimbotConnectionSummary {
  printer: NiimbotPrinterInfo;
  status: NiimbotStatusResult | null;
  readiness: NiimbotReadiness | null;
  battery: NiimbotBattery | null;
  detectedRollMm: { wMm: number; hMm: number } | null;
}

const DEFAULT_IDENTIFY_MODEL: Partial<NiimbotModelConfig> = {
  name_prefixes: ["B1", "B21", "B2", "D11", "M2", "N1"],
  task: "b1",
  density: 3,
  label_type: 1,
  speed: 1,
};

function getDriver(): NiimbotDriver {
  if (typeof window === "undefined" || !window.Niimbot) {
    throw new Error("Driver Niimbot Web Bluetooth belum termuat. Muat ulang halaman lalu coba lagi.");
  }
  return window.Niimbot;
}

export function checkWebBluetoothAvailability(): { ok: boolean; reason?: string } {
  if (typeof window === "undefined") {
    return { ok: false, reason: "Hanya tersedia di browser." };
  }
  if (!window.isSecureContext) {
    return {
      ok: false,
      reason:
        "Web Bluetooth membutuhkan HTTPS atau http://localhost. Saat ini Anda mengakses lewat alamat non-HTTPS.",
    };
  }
  if (!navigator.bluetooth) {
    return {
      ok: false,
      reason:
        "Browser ini belum mendukung Web Bluetooth. Gunakan Google Chrome / Microsoft Edge di Laptop/PC atau Chrome di Android (untuk iPhone/iPad gunakan browser Bluefy).",
    };
  }
  return { ok: true };
}

/**
 * Mengurai ukuran rol label (mm) dari barcode RFID Niimbot, contoh "T50*60", "T40*60", "T50*30".
 */
export function parseRfidRollDimensions(barCode?: string | null): { wMm: number; hMm: number } | null {
  if (!barCode) return null;
  const m = barCode.match(/(\d+(?:\.\d+)?)\s*[*x×]\s*(\d+(?:\.\d+)?)/i);
  if (!m) return null;
  const wMm = Math.round(parseFloat(m[1]));
  const hMm = Math.round(parseFloat(m[2]));
  if (!Number.isFinite(wMm) || !Number.isFinite(hMm) || wMm < 15 || hMm < 15 || wMm > 120 || hMm > 150) {
    return null;
  }
  return { wMm, hMm };
}

/**
 * Menghubungkan dan mengidentifikasi model printer Niimbot (B1 203dpi vs B1 Pro 300dpi)
 * sekaligus membaca ukuran rol RFID bila tersedia.
 */
export async function connectNiimbotPrinter(): Promise<NiimbotConnectionSummary> {
  const avail = checkWebBluetoothAvailability();
  if (!avail.ok) throw new Error(avail.reason);

  const driver = getDriver();
  const printer = await driver.identify(DEFAULT_IDENTIFY_MODEL);

  let status: NiimbotStatusResult | null = null;
  let readiness: NiimbotReadiness | null = null;
  let battery: NiimbotBattery | null = null;
  let detectedRollMm: { wMm: number; hMm: number } | null = null;
  try {
    status = await driver.getStatus();
    readiness = driver.readiness(status);
    battery = driver.battery(status);
    detectedRollMm = parseRfidRollDimensions(status.decoded?.rfid?.barCode);
  } catch {
    // Beberapa printer atau firmware tidak merespons penuh 0xA5/0x1B — tetap aman lanjut cetak
  }

  return { printer, status, readiness, battery, detectedRollMm };
}

export async function disconnectNiimbotPrinter(): Promise<void> {
  const driver = getDriver();
  await driver.disconnect();
}

export async function refreshNiimbotStatus(): Promise<NiimbotConnectionSummary | null> {
  const driver = getDriver();
  if (!driver.printer) return null;
  const status = await driver.getStatus();
  return {
    printer: driver.printer,
    status,
    readiness: driver.readiness(status),
    battery: driver.battery(status),
    detectedRollMm: parseRfidRollDimensions(status.decoded?.rfid?.barCode),
  };
}

function getPrintheadPx(printer: NiimbotPrinterInfo | null): { dpi: number; headPx: number } {
  const dpi = printer?.dpi ?? 203;
  const id = printer?.modelId;
  if (id === 4608) return { dpi: 300, headPx: 567 }; // M2-H ribbon drift margin
  if (id === 528) return { dpi: 300, headPx: 144 }; // D11_H
  if (id === 2304 || id === 2320 || id === 3586) return { dpi: 203, headPx: 96 }; // D110 / N1
  return dpi >= 300 ? { dpi: 300, headPx: 576 } : { dpi: 203, headPx: 384 }; // B1 Pro (300) / B1 (203)
}

/**
 * Menghitung konfigurasi model & ukuran piksel akurat sesuai hardware & DPI printer
 * untuk sembarang ukuran rol fisik (wMm × hMm).
 */
export function resolveNiimbotConfigs(
  printer: NiimbotPrinterInfo | null,
  wMm: number,
  hMm: number,
  density: number,
  offsetYOverride?: number | null
): { model: NiimbotModelConfig; size: NiimbotSizeConfig } {
  const task: "b1" | "v4" = printer?.task ?? "b1";
  const { dpi, headPx } = getPrintheadPx(printer);

  const model: NiimbotModelConfig = {
    name_prefixes: ["B1", "B21", "B2", "D11", "M2", "N1"],
    task,
    density: Math.min(5, Math.max(1, Math.round(density))),
    label_type: 1,
    speed: 1,
  };

  // Offset Y kalibrasi fisik (B1 203dpi di registry.json = +4px)
  const defaultOffsetY = dpi === 203 && printer?.modelId === 4096 ? 4 : 0;
  const offset_y_px =
    offsetYOverride != null && Number.isFinite(offsetYOverride) ? Math.round(offsetYOverride) : defaultOffsetY;

  // Entri terverifikasi registry.json untuk 50x30
  if (Math.round(wMm) === 50 && Math.round(hMm) === 30) {
    if (dpi === 203) {
      return { model, size: { w_px: Math.min(384, headPx), h_px: 240, offset_y_px, dpi: 203 } };
    }
    return { model, size: { w_px: Math.min(576, headPx), h_px: 354, offset_y_px, dpi: 300 } };
  }

  const calc = window.NiimbotLabelSize?.sizeFromMm({
    w_mm: wMm,
    h_mm: hMm,
    dpi,
    printhead_px: headPx,
  });

  if (calc) {
    return {
      model,
      size: { w_px: calc.w_px, h_px: calc.h_px, offset_y_px, dpi },
    };
  }

  const pxPerMm = dpi / 25.4;
  return {
    model,
    size: {
      w_px: Math.min(headPx, Math.round(wMm * pxPerMm)),
      h_px: Math.round(hMm * pxPerMm),
      offset_y_px,
      dpi,
    },
  };
}

/**
 * Mengambil gambar stiker dari server (dengan cookie sesi) lalu menggambarnya ke kanvas
 * seukuran tepat w_px × h_px dengan menjaga rasio aspek 1:1 (tanpa stretch/distorsi)
 * dan dipusatkan tepat di tengah (auto-center) dengan opsi geser manual offsetX.
 */
async function prepareStickerDataUrl(
  apiUrl: string,
  w_px: number,
  h_px: number,
  offsetXOverride?: number | null
): Promise<string> {
  const res = await fetch(apiUrl, { credentials: "same-origin" });
  if (!res.ok) {
    throw new Error(`Gagal memuat gambar stiker (${res.status} ${res.statusText}). Pastikan Anda masih login.`);
  }
  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);

  const canvas = document.createElement("canvas");
  canvas.width = w_px;
  canvas.height = h_px;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close();
    throw new Error("Gagal membuat kanvas 2D browser.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w_px, h_px);

  // Jaga rasio aspek 1:1 agar QR tidak pernah ter-stretch meskipun printhead 48mm (384px) vs kertas 50mm
  const scale = Math.min(w_px / bmp.width, h_px / bmp.height);
  const drawW = Math.round(bmp.width * scale);
  const drawH = Math.round(bmp.height * scale);
  const shiftX = offsetXOverride != null && Number.isFinite(offsetXOverride) ? Math.round(offsetXOverride) : 0;
  const offsetX = Math.round((w_px - drawW) / 2) + shiftX;
  const offsetY = Math.round((h_px - drawH) / 2);

  ctx.drawImage(bmp, offsetX, offsetY, drawW, drawH);
  bmp.close();

  return canvas.toDataURL("image/png");
}

function buildLabelUrl(
  kodeKarya: string,
  wMm: number,
  hMm: number,
  rotate90 = false,
  logo: "rwsa" | "mbtech" = "mbtech"
): string {
  return `/api/admin/label/${encodeURIComponent(kodeKarya)}?w=${wMm}&h=${hMm}&logo=${logo}${rotate90 ? "&rotate=1" : ""}&v=11`;
}

/**
 * Cetak 1 stiker langsung via Web Bluetooth (mode satu per satu).
 */
export async function printSingleViaBluetooth(params: {
  kodeKarya: string;
  wMm: number;
  hMm: number;
  rotate90?: boolean;
  logo?: "rwsa" | "mbtech";
  density: number;
  offsetXOverride?: number | null;
  offsetYOverride?: number | null;
  onProgress?: (msg: string) => void;
  onConnected?: (printer: NiimbotPrinterInfo) => void;
}): Promise<NiimbotPrinterInfo> {
  const avail = checkWebBluetoothAvailability();
  if (!avail.ok) throw new Error(avail.reason);

  const driver = getDriver();
  if (!driver.printer) {
    params.onProgress?.("Menghubungkan ke Niimbot B1 via Bluetooth…");
    await driver.identify(DEFAULT_IDENTIFY_MODEL);
  }
  const printer = driver.printer!;
  params.onConnected?.(printer);

  const { model, size } = resolveNiimbotConfigs(printer, params.wMm, params.hMm, params.density, params.offsetYOverride);

  params.onProgress?.(`Menyiapkan stiker ${params.kodeKarya} (${size.w_px}×${size.h_px} px @ ${printer.dpi ?? 203} dpi)…`);
  const dataUrl = await prepareStickerDataUrl(
    buildLabelUrl(params.kodeKarya, params.wMm, params.hMm, params.rotate90, params.logo ?? "rwsa"),
    size.w_px,
    size.h_px,
    params.offsetXOverride
  );

  await driver.printImage(dataUrl, {
    model,
    size,
    density: model.density,
    offsetY: size.offset_y_px,
    onProgress: (s) => params.onProgress?.(`Slot ${params.kodeKarya}: ${s}`),
  });

  return printer;
}

/**
 * Cetak banyak stiker beruntun (Continuous Batch) tanpa berhenti/tarik kertas antar label.
 */
export async function printBatchViaBluetooth(params: {
  kodeList: string[];
  wMm: number;
  hMm: number;
  rotate90?: boolean;
  logo?: "rwsa" | "mbtech";
  density: number;
  offsetXOverride?: number | null;
  offsetYOverride?: number | null;
  onProgress?: (msg: string, current?: number, total?: number) => void;
  onConnected?: (printer: NiimbotPrinterInfo) => void;
}): Promise<NiimbotPrinterInfo> {
  const avail = checkWebBluetoothAvailability();
  if (!avail.ok) throw new Error(avail.reason);
  if (params.kodeList.length === 0) throw new Error("Tidak ada label yang dipilih.");

  const driver = getDriver();
  if (!driver.printer) {
    params.onProgress?.("Menghubungkan ke Niimbot B1 via Bluetooth…", 0, params.kodeList.length);
    await driver.identify(DEFAULT_IDENTIFY_MODEL);
  }
  const printer = driver.printer!;
  params.onConnected?.(printer);

  const { model, size } = resolveNiimbotConfigs(printer, params.wMm, params.hMm, params.density, params.offsetYOverride);
  const total = params.kodeList.length;

  const dataUrls: string[] = new Array(total);
  const CONCURRENCY = 5;
  let prepared = 0;

  for (let start = 0; start < total; start += CONCURRENCY) {
    const slice = params.kodeList.slice(start, start + CONCURRENCY);
    const rendered = await Promise.all(
      slice.map((kode) =>
        prepareStickerDataUrl(
          buildLabelUrl(kode, params.wMm, params.hMm, params.rotate90, params.logo ?? "rwsa"),
          size.w_px,
          size.h_px,
          params.offsetXOverride
        )
      )
    );
    for (let j = 0; j < rendered.length; j++) {
      dataUrls[start + j] = rendered[j];
    }
    prepared += rendered.length;
    params.onProgress?.(`Menyiapkan gambar stiker ${prepared}/${total}…`, 0, total);
  }

  params.onProgress?.(
    `Mengirim ${total} label continuous ke ${printer.label} (${size.w_px}×${size.h_px} px)…`,
    0,
    total
  );

  await driver.printBatch(dataUrls, {
    model,
    size,
    density: model.density,
    offsetY: size.offset_y_px,
    onProgress: (s) => {
      const m = s.match(/label\s+(\d+)\/(\d+)/i);
      const cur = m ? parseInt(m[1], 10) : undefined;
      params.onProgress?.(s, cur, total);
    },
  });

  return printer;
}
