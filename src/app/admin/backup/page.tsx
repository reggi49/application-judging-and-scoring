import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { PageTitle } from "@/components/Shell";
import { BackupTrigger } from "./BackupTrigger";
import { AuditLogTable, type AuditLogItem } from "./AuditLogTable";

export const metadata = { title: "Backup & Audit Log" };

export default async function AdminBackupPage() {
  await requireAdmin();

  const auditLogs = await db.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
  });

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

      {/* Tabel Audit Log */}
      <section aria-label="Riwayat Audit Aktivitas">
        <h2 className="font-title text-lg font-bold text-gold-light mb-3">Audit Log Sistem</h2>
        <AuditLogTable items={auditItems} />
      </section>
    </main>
  );
}

