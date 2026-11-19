import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { LabelPrintClient } from "./LabelPrintClient";

export const metadata = {
  title: "Cetak Label Motor Peserta (Niimbot B1)",
  description: "Cetak stiker label motor peserta menggunakan printer thermal Niimbot B1.",
};

export default async function CetakLabelKaryaPage() {
  await requireAdmin();

  const karya = await db.karya.findMany({
    where: { deletedAt: null, peserta: { deletedAt: null } },
    select: { id: true, kodeKarya: true },
    orderBy: { kodeKarya: "asc" },
  });

  return (
    <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <LabelPrintClient items={karya} />
    </main>
  );
}
