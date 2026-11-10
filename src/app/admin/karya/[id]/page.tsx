import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { PageTitle } from "@/components/Shell";
import { KaryaDetailManager } from "./KaryaDetailManager";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const k = await db.karya.findFirst({ where: { id, deletedAt: null } });
  return { title: k ? `Karya ${k.kodeKarya}` : "Karya Tidak Ditemukan" };
}

export default async function KaryaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ baru?: string }>;
}) {
  await requireAdmin();
  const id = Number((await params).id);
  const sp = await searchParams;
  const isBaru = sp.baru === "1";

  if (!Number.isInteger(id)) notFound();

  const karya = await db.karya.findFirst({
    where: { id, deletedAt: null },
    include: {
      peserta: true,
      gambar: {
        orderBy: [{ urutan: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!karya) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <PageTitle
        title={`Kelola Karya: ${karya.kodeKarya}`}
        subtitle={`${karya.namaKarya} — oleh ${karya.peserta.nama}`}
      />
      <KaryaDetailManager karya={karya} isBaru={isBaru} />
    </main>
  );
}

