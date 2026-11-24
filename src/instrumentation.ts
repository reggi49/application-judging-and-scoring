/**
 * Dipanggil sekali saat server Node start:
 * 1. Memastikan skema SQLite (mis. kolom baru seperti `karya.whatsapp`) otomatis
 *    ditambahkan tanpa perlu `npx prisma migrate` di server hosting.
 * 2. Menjadwalkan backup otomatis bila BACKUP_AUTO_MINUTES diset.
 */
async function ensureSqliteSchema() {
  try {
    const { db } = await import("./lib/db");
    const cols = await db.$queryRawUnsafe<{ name: string }[]>('PRAGMA table_info("karya")');
    if (cols.length > 0 && !cols.some((c) => c.name === "whatsapp")) {
      await db.$executeRawUnsafe('ALTER TABLE "karya" ADD COLUMN "whatsapp" TEXT;');
      console.log("[migrate] Kolom karya.whatsapp berhasil ditambahkan otomatis.");
    }
  } catch (e) {
    console.error("[migrate] Gagal memeriksa/memperbarui skema SQLite:", e instanceof Error ? e.message : e);
  }
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  await ensureSqliteSchema();

  const minutes = Number(process.env.BACKUP_AUTO_MINUTES ?? 0);
  if (!minutes || minutes < 1) return;

  const g = globalThis as unknown as { __backupTimer?: NodeJS.Timeout };
  if (g.__backupTimer) return;

  const { runBackup } = await import("./lib/backup");
  const tick = async () => {
    try {
      const f = await runBackup("auto");
      console.log(`[backup] otomatis OK: ${f.name} (${(f.size / 1024).toFixed(0)} KB)`);
      if (f.mirrorWarning) console.warn("[backup]", f.mirrorWarning);
    } catch (e) {
      console.error("[backup] otomatis GAGAL:", e instanceof Error ? e.message : e);
    }
  };
  g.__backupTimer = setInterval(tick, minutes * 60_000);
  g.__backupTimer.unref?.();
}
