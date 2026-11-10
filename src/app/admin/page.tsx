import { requireAdmin } from "@/lib/dal";
import { buildRanking } from "@/lib/ranking";
import { getEvent } from "@/lib/event";
import { LiveRankingDashboard } from "./LiveRankingDashboard";

export const metadata = { title: "Ranking Live" };

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [data, ev] = await Promise.all([buildRanking(), getEvent()]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <LiveRankingDashboard initial={data} initialFase={ev.fase} eventNama={ev.nama} />
    </main>
  );
}

