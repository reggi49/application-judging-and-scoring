import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { apiUser } from "@/lib/dal";
import { backupFilePath, isSafeBackupName } from "@/lib/backup";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const admin = await apiUser("ADMIN");
  if (!admin) return new NextResponse("Unauthorized", { status: 401 });

  const name = (await params).name;
  if (!isSafeBackupName(name)) return new NextResponse("Invalid filename", { status: 400 });

  try {
    const file = backupFilePath(name);
    const buf = await readFile(file);

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${name}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}

