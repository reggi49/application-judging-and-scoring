"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import type { ActionState } from "@/lib/action-state";
import { updateKaryaAction, deleteFotoAction, setCoverAction, moveFotoAction } from "../../actions";
import { FormMessage, SubmitButton } from "@/components/FormBits";

type FotoItem = {
  id: number;
  urutan: number;
  isCover: boolean;
  size: number;
};

export function KaryaDetailManager({
  karya,
  isBaru,
}: {
  karya: {
    id: number;
    kodeKarya: string;
    namaKarya: string;
    akronimKarya: string;
    noUrut: number;
    deskripsi: string | null;
    peserta: { id: number; kodePeserta: string; nama: string };
    gambar: FotoItem[];
  };
  isBaru?: boolean;
}) {
  const router = useRouter();
  const [updateState, updateFormAction] = useActionState(updateKaryaAction, {});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload = karya.gambar.length < 5;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(`/api/admin/karya/${karya.id}/foto`, {
        method: "POST",
        body: fd,
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setUploadError(json?.error ?? "Gagal mengunggah foto.");
      } else {
        router.refresh();
      }
    } catch {
      setUploadError("Gagal mengirim file ke server.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {isBaru && (
        <div className="rounded-lg border border-ok/50 bg-ok/10 p-4 text-ok">
          <p className="font-semibold">✓ Karya berhasil didaftarkan dengan ID: {karya.kodeKarya}</p>
          <p className="text-sm">Silakan lengkapi dengan mengunggah foto karya di bawah ini (maksimal 5 foto).</p>
        </div>
      )}

      {/* Grid: Edit Info & Kelola Foto */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* Kolom Kiri: Form Informasi */}
        <section aria-label="Informasi Karya">
          <form action={updateFormAction} className="card space-y-4 p-5 sm:p-6">
            <input type="hidden" name="id" value={karya.id} />

            <div className="rounded-lg border border-gold-dark/40 bg-gold/5 p-3.5">
              <span className="text-[0.68rem] uppercase tracking-widest text-muted">ID Karya</span>
              <div className="num font-title gold-text text-3xl font-bold">{karya.kodeKarya}</div>
              <p className="mt-1 text-xs text-muted">
                Peserta: <strong className="text-cream">{karya.peserta.nama}</strong> ({karya.peserta.kodePeserta})
              </p>
            </div>

            <div>
              <label htmlFor="namaKarya" className="label">
                Nama Karya *
              </label>
              <input
                id="namaKarya"
                name="namaKarya"
                className="input"
                defaultValue={karya.namaKarya}
                required
              />
            </div>

            <div>
              <label htmlFor="deskripsi" className="label">
                Deskripsi & Konsep
              </label>
              <textarea
                id="deskripsi"
                name="deskripsi"
                rows={4}
                className="input"
                defaultValue={karya.deskripsi ?? ""}
                placeholder="Deskripsi konsep jok motor, bahan yang digunakan, dll."
              />
            </div>

            <FormMessage state={updateState} />

            <div className="flex items-center gap-3 pt-2">
              <Link href="/admin/karya" className="btn btn-ghost flex-1">
                Kembali
              </Link>
              <SubmitButton className="btn btn-gold flex-1">Simpan Informasi</SubmitButton>
            </div>
          </form>
        </section>

        {/* Kolom Kanan: Galeri & Upload Foto */}
        <section aria-label="Foto Karya" className="space-y-4">
          <div className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
              <div>
                <h2 className="font-title text-lg font-bold text-gold-light">Foto Karya</h2>
                <p className="text-xs text-muted">
                  Maksimal 5 foto per karya (JPG/PNG/WebP). Foto pertama otomatis menjadi cover.
                </p>
              </div>
              <span className={`badge ${karya.gambar.length >= 5 ? "badge-ok" : "badge-gold"}`}>
                {karya.gambar.length} / 5 Foto
              </span>
            </div>

            {/* Tombol Upload & Ambil Kamera */}
            {canUpload ? (
              <div className="mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  className="hidden"
                  id="foto-upload"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                <label
                  htmlFor="foto-upload"
                  className={`btn btn-gold w-full cursor-pointer text-center ${
                    uploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {uploading ? "Memproses & Mengompres Foto…" : "📷 Ambil Foto Kamera / Unggah Gambar"}
                </label>
                <p className="mt-1.5 text-center text-[0.7rem] text-muted">
                  Otomatis dikonversi ke WebP & dibuat thumbnail. Metadata GPS/EXIF dibersihkan.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-center text-xs text-muted">
                Jumlah foto maksimal (5) telah tercapai. Hapus salah satu foto bila ingin mengganti.
              </p>
            )}

            {uploadError && (
              <p role="alert" className="mt-3 rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-[#ffd9d2]">
                {uploadError}
              </p>
            )}

            {/* List Foto */}
            <div className="mt-5 space-y-3">
              {karya.gambar.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-muted">
                  Belum ada foto yang diunggah. Silakan klik tombol di atas untuk menambah foto.
                </div>
              ) : (
                karya.gambar.map((g, idx) => (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 rounded-lg border border-line bg-panel p-2.5"
                  >
                    <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded bg-ink">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/foto/${g.id}?t=1`}
                        alt={`Foto karya ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {g.isCover && (
                        <span className="absolute bottom-1 left-1 rounded bg-gold px-1 py-0.5 text-[0.6rem] font-bold text-black">
                          COVER
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-cream">Foto #{idx + 1}</span>
                        {g.isCover && <span className="badge badge-gold">Cover Utama</span>}
                      </div>
                      <span className="text-[0.7rem] text-muted">{(g.size / 1024).toFixed(0)} KB WebP</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!g.isCover && (
                        <form action={setCoverAction}>
                          <input type="hidden" name="id" value={g.id} />
                          <button type="submit" className="btn btn-ghost btn-sm text-xs">
                            Jadikan Cover
                          </button>
                        </form>
                      )}

                      {idx > 0 && (
                        <form action={moveFotoAction}>
                          <input type="hidden" name="id" value={g.id} />
                          <input type="hidden" name="dir" value="up" />
                          <button type="submit" className="btn btn-ghost btn-sm px-2" title="Geser ke atas">
                            ↑
                          </button>
                        </form>
                      )}

                      {idx < karya.gambar.length - 1 && (
                        <form action={moveFotoAction}>
                          <input type="hidden" name="id" value={g.id} />
                          <input type="hidden" name="dir" value="down" />
                          <button type="submit" className="btn btn-ghost btn-sm px-2" title="Geser ke bawah">
                            ↓
                          </button>
                        </form>
                      )}

                      <form
                        action={deleteFotoAction}
                        onSubmit={(e) => {
                          if (!confirm("Hapus foto ini?")) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="id" value={g.id} />
                        <button type="submit" className="btn btn-danger btn-sm px-2 text-xs">
                          ✕
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
