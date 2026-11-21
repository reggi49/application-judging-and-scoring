"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { backupAndResetDatabaseAction, restoreBackupAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/FormBits";

type DbBackupItem = {
  name: string;
  size: number;
  mtime: string;
};

export function AdminBrandReset({
  href = "/admin",
  compact = true,
}: {
  href?: string;
  compact?: boolean;
}) {
  const [showResetBtn, setShowResetBtn] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<"RESET" | "RESTORE">("RESET");

  const [backupName, setBackupName] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetState, resetFormAction, isResetPending] = useActionState(backupAndResetDatabaseAction, {});

  const [backups, setBackups] = useState<DbBackupItem[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState("");
  const [restoreCode, setRestoreCode] = useState("");
  const [restoreState, restoreFormAction, isRestorePending] = useActionState(restoreBackupAction, {});

  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isBusy = isResetPending || isRestorePending;

  const loadBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch("/api/admin/backup", { cache: "no-store" });
      if (res.ok) {
        const json = (await res.json()) as { backups: DbBackupItem[] };
        setBackups(json.backups);
        if (json.backups.length > 0) {
          setSelectedBackup((prev) =>
            prev && json.backups.some((b) => b.name === prev) ? prev : json.backups[0].name
          );
        } else {
          setSelectedBackup("");
        }
      }
    } finally {
      setLoadingBackups(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (modalOpen) {
      loadBackups();
    }
  }, [modalOpen, loadBackups]);

  useEffect(() => {
    if (resetState.ok) {
      setBackupName("");
      setResetCode("");
      loadBackups();
    }
  }, [resetState, loadBackups]);

  useEffect(() => {
    if (restoreState.ok) {
      setRestoreCode("");
      loadBackups();
    }
  }, [restoreState, loadBackups]);

  const handleLogoClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      setShowResetBtn(true);
      return;
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2000);
  };

  const size = compact ? 40 : 48;

  return (
    <>
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={handleLogoClick}
          className="shrink-0 rounded-lg focus:outline-none"
          aria-label="Logo RWSA"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/ticon-512.png"
            alt="MBtech Riding With Style Awards 2026"
            width={size}
            height={size}
            className="shrink-0 rounded-lg object-contain"
            style={{ width: size, height: size }}
          />
        </button>

        <Link href={href} className="leading-tight">
          <span className="font-title gold-text block text-base font-bold tracking-wider sm:text-lg">
            RIDING WITH STYLE
          </span>
          <span className="block text-xs font-bold tracking-[0.22em] text-gold-light">
            AWARDS 2026 · PENJURIAN
          </span>
        </Link>

        {showResetBtn && (
          <button
            type="button"
            onClick={() => {
              setTab("RESET");
              setModalOpen(true);
            }}
            className="btn btn-danger btn-sm px-2.5 py-1 text-xs font-extrabold shadow-md"
          >
            Reset DB
          </button>
        )}
      </div>

      {modalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-db-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => {
              if (!isBusy) setModalOpen(false);
            }}
          >
            <div
              className="card w-full max-w-md border-2 border-danger/70 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h2 id="reset-db-title" className="font-title text-lg font-bold text-gold-light">
                    Kelola Reset &amp; Restore Database
                  </h2>
                  <p className="mt-0.5 text-xs text-[#ded7c8]">
                    Akses khusus administrator (dilindungi kode konfirmasi).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setModalOpen(false)}
                  className="rounded-md px-2 py-1 text-xs text-muted hover:text-white"
                  aria-label="Tutup"
                >
                  ✕
                </button>
              </div>

              {/* Tab Pilihan: Backup & Reset vs Restore */}
              <div className="grid grid-cols-2 rounded-lg border border-line bg-panel2 p-1">
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setTab("RESET")}
                  className={`rounded-md py-2 text-xs font-extrabold transition-colors ${tab === "RESET"
                    ? "bg-danger text-white shadow-sm"
                    : "text-[#ded7c8] hover:text-white"
                    }`}
                >
                  Backup &amp; Reset
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => setTab("RESTORE")}
                  className={`rounded-md py-2 text-xs font-extrabold transition-colors ${tab === "RESTORE"
                    ? "bg-gold text-ink shadow-sm"
                    : "text-[#ded7c8] hover:text-white"
                    }`}
                >
                  Restore Database ({backups.length})
                </button>
              </div>

              {tab === "RESET" ? (
                <>
                  <div className="rounded-lg border border-warn/50 bg-warn/10 p-3 text-xs text-warn leading-relaxed">
                    <strong>Perhatian:</strong> Sistem akan membuat <strong>backup penuh terlebih dahulu</strong> sebelum mereset seluruh penilaian, riwayat nilai, foto karya, dan peserta ke 75 slot awal. Jika terjadi apa-apa, Anda bisa langsung klik tab <strong>Restore Database</strong> di atas.
                  </div>

                  <form action={resetFormAction} className="space-y-3.5">
                    <div>
                      <label htmlFor="reset-backup-name" className="label text-xs">
                        Nama Backup *
                      </label>
                      <input
                        id="reset-backup-name"
                        name="backupName"
                        type="text"
                        required
                        minLength={2}
                        maxLength={40}
                        value={backupName}
                        onChange={(e) => setBackupName(e.target.value)}
                        disabled={isResetPending}
                        placeholder="Contoh: sebelum-final atau hari-1"
                        className="input text-sm"
                      />
                      <p className="mt-1 text-[11px] text-muted">
                        Tersimpan sebagai <code className="text-gold-light">rwsa-YYYYMMDD-HHMMSS-&lt;nama&gt;.db.gz</code>
                      </p>
                    </div>

                    <div>
                      <label htmlFor="reset-confirm-code" className="label text-xs">
                        Kode Konfirmasi *
                      </label>
                      <input
                        id="reset-confirm-code"
                        name="confirmCode"
                        type="password"
                        required
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        disabled={isResetPending}
                        placeholder="Masukkan kode konfirmasi"
                        autoComplete="off"
                        className="input text-sm font-mono"
                      />
                      <p className="mt-1 text-[11px] text-muted">
                        Kode default: <code className="text-gold-light">RESET-RWSA</code>
                      </p>
                    </div>

                    <FormMessage state={resetState} />

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        disabled={isResetPending}
                        onClick={() => setModalOpen(false)}
                        className="btn btn-ghost btn-sm text-xs font-bold"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isResetPending || backupName.trim().length < 2 || resetCode.trim().length === 0}
                        className="btn btn-danger btn-sm px-4 text-xs font-extrabold"
                      >
                        {isResetPending ? "Membackup & Mereset…" : "Backup & Reset Database"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-xs text-gold-light leading-relaxed">
                    Pilih file backup database yang ingin dipulihkan. Sebelum menimpa database aktif, sistem otomatis membuat backup pengaman <code className="text-white">pre-restore</code>.
                  </div>

                  <form
                    action={restoreFormAction}
                    onSubmit={(e) => {
                      if (
                        !confirm(
                          `Pulihkan database dari "${selectedBackup}"?\n\nData saat ini akan diganti dengan isi backup tersebut (backup pengaman pre-restore dibuat otomatis).`
                        )
                      ) {
                        e.preventDefault();
                      }
                    }}
                    className="space-y-3.5"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="restore-backup-select" className="label text-xs mb-0">
                          Pilih Berkas Backup *
                        </label>
                        <button
                          type="button"
                          disabled={loadingBackups}
                          onClick={loadBackups}
                          className="text-[11px] font-bold text-gold-light hover:underline"
                        >
                          {loadingBackups ? "Memuat…" : "Segarkan"}
                        </button>
                      </div>

                      {backups.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-line p-3 text-center text-xs text-muted">
                          {loadingBackups ? "Memuat daftar backup…" : "Belum ada berkas backup database (.db.gz)."}
                        </p>
                      ) : (
                        <select
                          id="restore-backup-select"
                          name="name"
                          value={selectedBackup}
                          onChange={(e) => setSelectedBackup(e.target.value)}
                          disabled={isRestorePending}
                          className="input text-xs font-mono"
                          required
                        >
                          {backups.map((b) => (
                            <option key={b.name} value={b.name}>
                              {b.name} ({(b.size / 1024).toFixed(1)} KB)
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label htmlFor="restore-confirm-code" className="label text-xs">
                        Kode Konfirmasi *
                      </label>
                      <input
                        id="restore-confirm-code"
                        name="confirmCode"
                        type="password"
                        required
                        value={restoreCode}
                        onChange={(e) => setRestoreCode(e.target.value)}
                        disabled={isRestorePending}
                        placeholder="Masukkan kode konfirmasi"
                        autoComplete="off"
                        className="input text-sm font-mono"
                      />
                      <p className="mt-1 text-[11px] text-muted">
                        Kode default: <code className="text-gold-light">RESET-RWSA</code>
                      </p>
                    </div>

                    <FormMessage state={restoreState} />

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        disabled={isRestorePending}
                        onClick={() => setModalOpen(false)}
                        className="btn btn-ghost btn-sm text-xs font-bold"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isRestorePending || !selectedBackup || restoreCode.trim().length === 0}
                        className="btn btn-gold btn-sm px-4 text-xs font-extrabold"
                      >
                        {isRestorePending ? "Merestore…" : "Restore Database"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
