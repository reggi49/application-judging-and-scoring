import { NextResponse } from "next/server";
import { apiUser } from "@/lib/dal";
import { buildRanking } from "@/lib/ranking";
import { getEvent } from "@/lib/event";

export const runtime = "nodejs";

export async function GET() {
  const u = await apiUser("ADMIN");
  if (!u) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const [data, ev] = await Promise.all([buildRanking(), getEvent()]);
  return NextResponse.json({ ...data, fase: ev.fase }, { headers: { "Cache-Control": "no-store" } });
}

