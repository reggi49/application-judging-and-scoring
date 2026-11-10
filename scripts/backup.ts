import { runBackup } from "../src/lib/backup";

runBackup("cli")
  .then((f) => {
    console.log(`Backup OK: ${f.name} (${(f.size / 1024).toFixed(0)} KB)`);
    if (f.mirrorWarning) console.warn(f.mirrorWarning);
  })
  .catch((e) => {
    console.error("Backup GAGAL:", e instanceof Error ? e.message : e);
    process.exit(1);
  });

