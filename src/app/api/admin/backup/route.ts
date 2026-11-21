import { NextResponse } from "next/server";
import { apiUser } from "@/lib/dal";
import { listBackups } from "@/lib/backup";

export const runtime = "nodejs";

export async function GET() {
  const admin = await apiUser("ADMIN");
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const all = await listBackups();
  const backups = all
    .filter((b) => b.kind === "db")
    .map((b) => ({
      name: b.name,
      size: b.size,
      mtime: b.mtime.toISOString(),
    }));

  return NextResponse.json({ backups });
}
