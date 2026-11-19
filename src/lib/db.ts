import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { projectRoot } from "./env";

function resolveDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || !url.startsWith("file:") || url.startsWith("file:/")) {
    return url;
  }
  const rel = url.slice("file:".length);
  const abs = path.resolve(/*turbopackIgnore: true*/ projectRoot(), "prisma", rel);
  return `file:${abs}`;
}

const g = globalThis as unknown as { __prisma?: PrismaClient };

const datasourceUrl = resolveDatasourceUrl();

export const db: PrismaClient =
  g.__prisma ??
  new PrismaClient(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : undefined);

if (process.env.NODE_ENV !== "production") g.__prisma = db;
