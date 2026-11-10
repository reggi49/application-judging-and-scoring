import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { PageTitle } from "@/components/Shell";
import { updatePesertaAction } from "../../actions";
import { PesertaForm } from "../PesertaForm";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const p = await db.peserta.findFirst({ where: { id, deletedAt: null } });
  return { title: p ? `Edit Peserta ${p.kodePeserta}` : "Peserta Tidak Ditemukan" };
}

export default async function EditPesertaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const p = await db.peserta.findFirst({
    where: { id, deletedAt: null },
  });

  if (!p) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <PageTitle
        title={`Edit Peserta: ${p.kodePeserta}`}
        subtitle={`Ubah informasi untuk peserta ${p.nama}.`}
      />
      <PesertaForm
        action={updatePesertaAction}
        initial={{
          id: p.id,
          kodePeserta: p.kodePeserta,
          nama: p.nama,
          deskripsi: p.deskripsi,
          karyaCounter: p.karyaCounter,
        }}
      />
    </main>
  );
}

