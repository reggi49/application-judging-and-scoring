import "server-only";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { db } from "./db";

type AuditInput = {
  userId?: number | null;
  aksi: string;
  entitas?: string;
  entitasId?: string | number;
  dataLama?: unknown;
  dataBaru?: unknown;
};

const toJson = (v: unknown): Prisma.InputJsonValue | undefined =>
  v === undefined ? undefined : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue);

/** Catat ke audit_log (append-only). Tidak boleh menggagalkan proses utama. */
export async function audit(a: AuditInput) {
  let ip: string | null = null;
  try {
    const h = await headers();
    ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim() || null;
  } catch {
    /* di luar konteks request */
  }
  try {
    await db.auditLog.create({
      data: {
        userId: a.userId ?? null,
        aksi: a.aksi,
        entitas: a.entitas,
        entitasId: a.entitasId === undefined ? undefined : String(a.entitasId),
        dataLama: toJson(a.dataLama),
        dataBaru: toJson(a.dataBaru),
        ip,
      },
    });
  } catch (e) {
    console.error("[audit] gagal mencatat", e);
  }
}

