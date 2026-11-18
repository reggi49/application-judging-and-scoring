import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateStickerImage, generateQrWithLogo, type StickerPreset, type LogoChoice } from "@/lib/label-generator";

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

  const layout = urlObj.searchParams.get("layout") ?? "50x50";
  const logoParam = urlObj.searchParams.get("logo")?.toLowerCase();
  const logoChoice: LogoChoice = logoParam === "mbtech" ? "mbtech" : "rwsa";
  const isDownload = urlObj.searchParams.get("download") === "1" || urlObj.searchParams.get("download") === "true";

  let imageBuffer: Buffer;
  try {
    if (layout === "qr") {
      imageBuffer = await generateQrWithLogo(targetUrl, 500, logoChoice);
    } else {
      const preset: StickerPreset =
        layout === "50x30" || layout === "40x30" || layout === "50x80" ? layout : "50x50";
      imageBuffer = await generateStickerImage(targetUrl, kode, preset, logoChoice);
    }
  } catch (err) {
    console.error("Gagal membuat label gambar:", err);
    return new NextResponse("Gagal membuat label gambar", { status: 500 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "image/png",
    "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
  };

  if (isDownload) {
    headers["Content-Disposition"] = `attachment; filename="label-niimbot-${kode}-${layout}-${logoChoice}.png"`;
  } else {
    headers["Content-Disposition"] = `inline; filename="label-${kode}-${logoChoice}.png"`;
  }

  return new NextResponse(new Uint8Array(imageBuffer), { headers });
}
