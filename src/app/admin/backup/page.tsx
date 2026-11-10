import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { listBackups } from "@/lib/backup";
import { PageTitle } from "@/components/Shell";
import { BackupTrigger } from "./BackupTrigger";

export const metadata = { title: "Backup & Audit Log" };

export default async function AdminBackupPage() {
  await requireAdmin();

  const [backups, auditLogs] = await Promise.all([
    listBackups(),
    db.auditLog.findMany({
      take: 60,
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
                        {b.kind === "db" ? "MySQL Dump" : "Uploads Tar"}
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
        <h2 className="font-title text-lg font-bold text-gold-light mb-3">Audit Log Sistem (60 Terakhir)</h2>
        <div className="card table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Waktu (WIB)</th>
                <th>Aksi</th>
                <th>Entitas</th>
                <th>ID Target</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted">
                    Belum ada catatan aktivitas.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id.toString()}>
                    <td className="num text-xs text-muted">
                      {log.createdAt.toLocaleString("id-ID")}
                    </td>
                    <td>
                      <span className="badge font-mono text-xs text-gold-light">
                        {log.aksi}
                      </span>
                    </td>
                    <td className="text-xs text-cream">{log.entitas ?? "—"}</td>
                    <td className="font-mono text-xs text-muted">{log.entitasId ?? "—"}</td>
                    <td className="font-mono text-xs text-muted">{log.ip ?? "local"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

