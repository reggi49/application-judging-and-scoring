import { requireAdmin } from "@/lib/dal";
import { PageTitle } from "@/components/Shell";
import { createPesertaAction } from "../../actions";
import { PesertaForm } from "../PesertaForm";

export const metadata = { title: "Tambah Peserta Baru" };

export default async function TambahPesertaPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-7xl px-4 py-5">
      <PageTitle
        title="Tambah Peserta"
        subtitle="Daftarkan peserta atau workshop baru ke dalam sistem."
      />
      <PesertaForm action={createPesertaAction} />
    </main>
  );
}
