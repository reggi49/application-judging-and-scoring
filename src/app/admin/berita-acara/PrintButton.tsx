"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-gold btn-sm font-extrabold shadow-md flex-1 sm:flex-none justify-center gap-1.5"
      title="Cetak Berita Acara resmi atau simpan sebagai dokumen PDF"
    >
      <span>Cetak Berita Acara / PDF</span>
    </button>
  );
}
