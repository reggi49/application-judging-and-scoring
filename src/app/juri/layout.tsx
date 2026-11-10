import { requireJuri } from "@/lib/dal";
import { AppHeader } from "@/components/Shell";

export default async function JuriLayout({ children }: { children: React.ReactNode }) {
  const u = await requireJuri();
  const juri = u.juri!;
  return (
    <div className="min-h-dvh">
      <AppHeader
        home="/juri"
        userLabel={juri.nama}
        roleLabel={`Juri · ${juri.kodeJuri}`}
        nav={[]}
      />
      {children}
    </div>
  );
}

