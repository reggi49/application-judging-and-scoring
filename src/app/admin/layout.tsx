import { requireAdmin } from "@/lib/dal";
import { AppHeader } from "@/components/Shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await requireAdmin();
  return (
    <div className="min-h-dvh">
      <AppHeader
        home="/admin"
        userLabel={u.username}
        roleLabel="Administrator"
        enableSecretReset
        nav={[
          { href: "/admin", label: "Ranking Live" },
          { href: "/admin/karya", label: "Karya" },
          { href: "/admin/peserta", label: "Peserta" },
          { href: "/admin/juri", label: "Juri" },
          { href: "/admin/kriteria", label: "Kriteria" },
          { href: "/admin/nilai", label: "Rekap Nilai" },
          { href: "/admin/berita-acara", label: "Berita Acara" },
          { href: "/admin/backup", label: "Backup & Audit" },
        ]}
      />
      {children}
    </div>
  );
}

