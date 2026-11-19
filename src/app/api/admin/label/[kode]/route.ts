import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  generateStickerByMm,
  generateStickerImage,
  generateQrWithLogo,
  PRESET_MM,
  type LogoVariant,
  type StickerPreset,
} from "@/lib/label-generator";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ kode: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { kode } = await params;
  if (!kode || !/^[A-Za-z0-9_-]+$/.test(kode)) {
    return new NextResponse("Kode karya tidak valid", { status: 400 });
  }

  const urlObj = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? urlObj.host;
  const proto = req.headers.get("x-forwarded-proto") ?? (urlObj.protocol.replace(":", "") || "http");
  const baseUrl = `${proto}://${host}`;
  const targetUrl = `${baseUrl}/juri/karya/${kode}`;

  const layout = urlObj.searchParams.get("layout") ?? "40x30";
  const wParam = parseFloat(urlObj.searchParams.get("w") ?? "");
  const hParam = parseFloat(urlObj.searchParams.get("h") ?? "");
  const hasExplicitMm =
    Number.isFinite(wParam) && Number.isFinite(hParam) && wParam >= 15 && hParam >= 15 && wParam <= 120 && hParam <= 150;

  const logoVariant: LogoVariant = urlObj.searchParams.get("logo") === "mbtech" ? "mbtech" : "rwsa";
  const rotate = urlObj.searchParams.get("rotate") === "1" || urlObj.searchParams.get("rotate") === "true";
  const previewUpright = urlObj.searchParams.get("preview") === "upright";
  const isDownload = urlObj.searchParams.get("download") === "1" || urlObj.searchParams.get("download") === "true";

  const stickerOpts = {
    rotate90: rotate,
    outputRotated: rotate && !previewUpright,
    logo: logoVariant,
  };

  let imageBuffer: Buffer;
  try {
    if (layout === "qr") {
      imageBuffer = await generateQrWithLogo(targetUrl, 500, { logo: logoVariant });
    } else if (hasExplicitMm) {
      imageBuffer = await generateStickerByMm(targetUrl, kode, wParam, hParam, stickerOpts);
    } else {
      const preset: StickerPreset = layout in PRESET_MM ? (layout as StickerPreset) : "40x30";
      imageBuffer = await generateStickerImage(targetUrl, kode, preset, stickerOpts);
    }
  } catch (err) {
    console.error("Gagal membuat label gambar:", err);
    return new NextResponse("Gagal membuat label gambar", { status: 500 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "image/png",
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };

  const sizeTag = `${logoVariant}-${hasExplicitMm ? `${wParam}x${hParam}` : layout}${rotate && !previewUpright ? "-rot90" : ""}`;
  if (isDownload) {
    headers["Content-Disposition"] = `attachment; filename="label-niimbot-${kode}-${sizeTag}.png"`;
  } else {
    headers["Content-Disposition"] = `inline; filename="label-${kode}.png"`;
  }

  return new NextResponse(new Uint8Array(imageBuffer), { headers });
}
