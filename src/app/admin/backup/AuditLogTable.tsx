"use client";

import { useState } from "react";

export type AuditLogItem = {
  id: string;
  createdAtText: string;
  aksi: string;
  entitas: string | null;
  entitasId: string | null;
  ip: string | null;
};

const PAGE_SIZE = 20;

export function AuditLogTable({ items }: { items: AuditLogItem[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginated = items.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (p: number) => {
    const valid = Math.min(totalPages, Math.max(1, p));
    setPage(valid);
  };

  return (
    <div className="card table-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>Waktu (WIB)</th>
            <th>Aksi</th>
            <th>Entitas</th>
            <th>ID Target</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-center text-muted">
                Belum ada catatan aktivitas.
              </td>
            </tr>
          ) : (
            paginated.map((log) => (
              <tr key={log.id}>
                <td className="num text-xs text-muted">{log.createdAtText}</td>
                <td>
                  <span className="badge font-mono text-xs text-gold-light">
                    {log.aksi}
                  </span>
                </td>
                <td className="text-xs text-cream">{log.entitas ?? "—"}</td>
                <td className="font-mono text-xs text-muted">{log.entitasId ?? "—"}</td>
                <td className="font-mono text-xs text-muted">{log.ip ?? "local"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-line/70 bg-panel2/40">
          <div className="text-xs font-semibold text-[#ded7c8]">
            Menampilkan <strong>{startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, items.length)}</strong> dari <strong>{items.length}</strong> log (20 baris per halaman)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="btn btn-ghost btn-sm px-3 font-bold text-xs"
            >
              ‹ Sebelumnya
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => goToPage(p)}
                className={`min-w-8 h-8 rounded-md text-xs font-bold transition-all ${
                  page === p
                    ? "bg-gold text-ink shadow-md font-black"
                    : "bg-panel2 border border-line text-[#ded7c8] hover:text-white hover:border-gold"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="btn btn-ghost btn-sm px-3 font-bold text-xs"
            >
              Berikutnya ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
