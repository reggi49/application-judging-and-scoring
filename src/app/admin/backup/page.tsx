import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { listBackups } from "@/lib/backup";
import { PageTitle } from "@/components/Shell";
import { BackupTrigger } from "./BackupTrigger";
import { AuditLogTable, type AuditLogItem } from "./AuditLogTable";

export const metadata = { title: "Backup & Audit Log" };

export default async function AdminBackupPage() {
  await requireAdmin();

  const [backups, auditLogs] = await Promise.all([
    listBackups(),
    db.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const auditItems: AuditLogItem[] = auditLogs.map((log) => ({
    id: log.id.toString(),
    createdAtText: log.createdAt.toLocaleString("id-ID"),
    aksi: log.aksi,
    entitas: log.entitas,
    entitasId: log.entitasId,
    ip: log.ip,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 space-y-6">
      <PageTitle
        title="Backup & Audit Log"
        subtitle="Integritas data penjurian, snapshot berkas backup offline, dan riwayat audit aktivitas sistem."
      />

      <BackupTrigger />

      {/* Tabel Berkas Backup */}
      <section aria-label="Berkas Backup">
        <h2 className="font-title text-lg font-bold text-gold-light mb-3">Arsip Berkas Backup</h2>
        <div className="card table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Nama Berkas</th>
                <th>Tipe</th>
                <th className="num text-right">Ukuran</th>
                <th>Waktu Dibuat</th>
                <th className="text-right">Unduh</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">
                    Belum ada berkas backup yang tersimpan. Klik tombol &quot;Buat Backup Sekarang&quot; di atas.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.name}>
                    <td className="font-mono text-xs text-cream">{b.name}</td>
                    <td>
                      <span className={`badge ${b.kind === "db" ? "badge-gold" : "badge-ok"}`}>
                        {b.kind === "db" ? "SQLite Snapshot" : "Uploads Tar"}
                      </span>
                    </td>
                    <td className="num text-right text-xs text-muted">
                      {(b.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="text-xs text-muted">
                      {b.mtime.toLocaleString("id-ID")}
                    </td>
                    <td className="text-right">
                      <a
                        href={`/api/admin/backup/${encodeURIComponent(b.name)}`}
                        download
                        className="btn btn-ghost btn-sm text-xs"
                      >
                        ⬇ Download
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tabel Audit Log */}
      <section aria-label="Riwayat Audit Aktivitas">
        <h2 className="font-title text-lg font-bold text-gold-light mb-3">Audit Log Sistem</h2>
        <AuditLogTable items={auditItems} />
      </section>
    </main>
  );
}

