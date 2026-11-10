"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-gold btn-sm"
    >
      🖨️ Cetak Berita Acara / PDF
    </button>
  );
}
