/**
 * Dipanggil sekali saat server Node start. Menjadwalkan backup otomatis bila
 * BACKUP_AUTO_MINUTES diset (mis. 60 = tiap jam). Untuk produksi disarankan
 * juga cron sistem (`npm run backup`) sebagai lapisan kedua.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
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

