"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Gallery } from "@/components/Gallery";
import { loadDraft, removeDraft, saveDraft } from "@/lib/local-draft";
import type { PenilaianState } from "@/lib/penilaian-types";
import { formatScaled, formatSkor, isNilaiValid, SCALE, skorJuriScaled } from "@/lib/scoring";

type KriteriaView = { id: number; kode: string; nama: string; deskripsi: string | null; bobotBp: number };

export type PanelProps = {
  mode: "juri" | "admin";
  /** pemisah penyimpanan lokal: mis. "juri-3" atau "admin-1-for-3" */
  scope: string;
  endpoint: string;
  karya: {
    kode: string;
    nama: string;
    peserta: string;
    kodePeserta: string;
    deskripsi: string | null;
    fotos: { id: number }[];
  };
  kriteria: KriteriaView[];
  initial: PenilaianState | null;
  fase: "PERSIAPAN" | "PENJURIAN" | "SELESAI";
  backHref: string;
  /** hanya mode admin: nama juri yang diwakili */
  onBehalfOf?: string;
};

type Sync = "saved" | "saving" | "pending" | "offline" | "error" | "auth" | "fase";

const SYNC_LABEL: Record<Sync, { text: string; cls: string }> = {
  saved: { text: "Tersimpan di server", cls: "badge-ok" },
  saving: { text: "Menyimpan…", cls: "badge-gold" },
  pending: { text: "Menunggu sinkron", cls: "badge-warn" },
  offline: { text: "Offline · aman di perangkat", cls: "badge-warn" },
  error: { text: "Gagal terhubung · mencoba lagi", cls: "badge-bad" },
  auth: { text: "Sesi berakhir · login ulang", cls: "badge-bad" },
  fase: { text: "Penjurian ditutup", cls: "badge-bad" },
};

type ServerReply =
  | { ok: true; applied: boolean; alreadyFinal?: boolean; state: PenilaianState }
  | { ok: false; code: string; message: string; state?: PenilaianState };

function toInputs(kriteria: KriteriaView[], nilai: Record<string, number>) {
  const v: Record<string, string> = {};
  for (const k of kriteria) v[k.kode] = nilai[k.kode] === undefined ? "" : String(nilai[k.kode]);
  return v;
}

export function PenilaianPanel(p: PanelProps) {
  const { kriteria, karya } = p;
  const storageKey = `${p.scope}:${karya.kode}`;

  const [values, setValues] = useState<Record<string, string>>(() => toInputs(kriteria, p.initial?.nilai ?? {}));
  const [catatan, setCatatan] = useState(p.initial?.catatan ?? "");
  const [status, setStatus] = useState<"DRAFT" | "FINAL">(p.initial?.status ?? "DRAFT");
  const [skorFinal, setSkorFinal] = useState<string | null>(p.initial?.skorJuri ?? null);
  const [sync, setSync] = useState<Sync>("saved");
  const [ready, setReady] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const uuidRef = useRef<string>("");
  const tsRef = useRef<number>(p.initial?.clientUpdatedAt ?? 0);
  const dirtyRef = useRef(false);
  const valuesRef = useRef(values);
  const catatanRef = useRef(catatan);
  const statusRef = useRef(status);
  const syncingRef = useRef(false);
  const failRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncNowRef = useRef<() => void>(() => {});

  valuesRef.current = values;
  catatanRef.current = catatan;
  statusRef.current = status;

  const canEdit = p.fase === "PENJURIAN" && status !== "FINAL";

  const nextTs = () => {
    tsRef.current = Math.max(Date.now(), tsRef.current + 1);
    return tsRef.current;
  };

  const payloadNilai = useCallback((vals: Record<string, string>) => {
    const out: Record<string, number | null> = {};
    for (const k of kriteria) {
      const raw = vals[k.kode]?.trim() ?? "";
      out[k.kode] = raw === "" ? null : Number(raw);
    }
    return out;
  }, [kriteria]);

  const persistLocal = useCallback(
    (dirty: boolean) =>
      saveDraft({
        key: storageKey,
        uuid: uuidRef.current,
        values: valuesRef.current,
        catatan: catatanRef.current,
        clientUpdatedAt: tsRef.current,
        dirty,
      }),
    [storageKey],
  );

  const adoptServer = useCallback(
    (s: PenilaianState) => {
      setValues(toInputs(kriteria, s.nilai));
      setCatatan(s.catatan ?? "");
      setStatus(s.status);
      setSkorFinal(s.skorJuri);
      tsRef.current = Math.max(tsRef.current, s.clientUpdatedAt);
      dirtyRef.current = false;
      removeDraft(storageKey);
    },
    [kriteria, storageKey],
  );

  const scheduleSync = useCallback((delay: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => syncNowRef.current(), delay);
  }, []);

  /** Kirim draft ke server. Aman diulang (idempoten); data lama tidak menimpa data baru. */
  const syncNow = useCallback(async () => {
    if (statusRef.current === "FINAL" || syncingRef.current || !dirtyRef.current) return;
    if (!navigator.onLine) {
      setSync("offline");
      return;
    }
    syncingRef.current = true;
    setSync("saving");
    const sentTs = tsRef.current;
    try {
      const res = await fetch(p.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          kodeKarya: karya.kode,
          clientUuid: uuidRef.current,
          nilai: payloadNilai(valuesRef.current),
          catatan: catatanRef.current.trim() === "" ? null : catatanRef.current,
          clientUpdatedAt: sentTs,
          final: false,
        }),
      });
      if (res.status === 401) {
        setSync("auth");
        return; // data tetap aman di perangkat
      }
      const json = (await res.json().catch(() => null)) as ServerReply | null;
      if (!json) throw new Error("Respons tidak valid");
      if (json.ok) {
        failRef.current = 0;
        if (json.state.status === "FINAL") {
          adoptServer(json.state);
          setSync("saved");
        } else if (!json.applied) {
          // Server punya data lebih baru → ikuti server
          adoptServer(json.state);
          setSync("saved");
        } else if (tsRef.current === sentTs) {
          dirtyRef.current = false;
          await persistLocal(false);
          setSync("saved");
        } else {
          setSync("pending");
          scheduleSync(200); // ada perubahan baru selama pengiriman
        }
      } else if (json.code === "LOCKED" && json.state) {
        adoptServer(json.state);
        setSync("saved");
      } else if (json.code === "FASE") {
        setSync("fase");
        setServerMsg(json.message);
      } else {
        // Kesalahan validasi dll: jangan retry tanpa henti
        setSync("error");
        setServerMsg(json.message);
      }
    } catch {
      failRef.current += 1;
      setSync(navigator.onLine ? "error" : "offline");
      scheduleSync(Math.min(2000 * 2 ** (failRef.current - 1), 30_000));
    } finally {
      syncingRef.current = false;
    }
  }, [p.endpoint, karya.kode, payloadNilai, adoptServer, persistLocal, scheduleSync]);

  syncNowRef.current = syncNow;

  /* Muat draft lokal & putuskan sumber kebenaran */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = await loadDraft(storageKey);
      if (cancelled) return;
      const server = p.initial;
      uuidRef.current = local?.uuid || server?.id ? local?.uuid ?? crypto.randomUUID() : crypto.randomUUID();
      if (!uuidRef.current) uuidRef.current = crypto.randomUUID();

      if (server?.status === "FINAL") {
        if (local) removeDraft(storageKey);
      } else if (local && local.dirty && local.clientUpdatedAt >= (server?.clientUpdatedAt ?? 0)) {
        setValues(local.values);
        setCatatan(local.catatan);
        tsRef.current = local.clientUpdatedAt;
        dirtyRef.current = true;
        setSync(navigator.onLine ? "pending" : "offline");
        scheduleSync(300);
      } else if (local) {
        removeDraft(storageKey);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  /* Pulihkan sinkron saat koneksi kembali / tab aktif / berkala */
  useEffect(() => {
    const trigger = () => {
      if (dirtyRef.current) syncNowRef.current();
    };
    const onOffline = () => {
      if (dirtyRef.current) setSync("offline");
    };
    const onVisible = () => document.visibilityState === "visible" && trigger();
    window.addEventListener("online", trigger);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisible);
    const iv = setInterval(trigger, 15_000);
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("online", trigger);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("beforeunload", beforeUnload);
      clearInterval(iv);
    };
  }, []);

  const markChanged = useCallback(() => {
    nextTs();
    dirtyRef.current = true;
    setServerMsg(null);
    persistLocal(true); // ke perangkat DULU, baru ke server
    setSync(navigator.onLine ? "pending" : "offline");
    scheduleSync(700);
  }, [persistLocal, scheduleSync]);

  const setNilai = (kode: string, raw: string) => {
    if (!canEdit) return;
    const digits = raw.replace(/\D/g, "").slice(0, 3).replace(/^0+(?=\d)/, "");
    if (digits !== "" && Number(digits) > 100) {
      setHint("Nilai maksimal 100.");
      return;
    }
    setHint(null);
    setValues((v) => {
      const nv = { ...v, [kode]: digits };
      valuesRef.current = nv;
      return nv;
    });
    markChanged();
  };

  const step = (kode: string, delta: number) => {
    const cur = values[kode] === "" ? null : Number(values[kode]);
    const base = cur ?? (delta > 0 ? -1 : 101);
    const nxt = Math.min(100, Math.max(0, base + delta));
    setNilai(kode, String(nxt));
  };

  const onCatatan = (t: string) => {
    if (!canEdit) return;
    setCatatan(t);
    catatanRef.current = t;
    markChanged();
  };

  /* Skor langsung (dihitung dengan fungsi yang sama dengan server; server tetap menghitung ulang) */
  const live = useMemo(() => {
    const filled = kriteria.filter((k) => values[k.kode] !== "" && isNilaiValid(Number(values[k.kode])));
    const lengkap = filled.length === kriteria.length;
    let total: string | null = null;
    if (lengkap) {
      const map: Record<number, number> = {};
      for (const k of kriteria) map[k.id] = Number(values[k.kode]);
      total = formatSkor(skorJuriScaled(map, kriteria));
    }
    return { filled: filled.length, lengkap, total };
  }, [values, kriteria]);

  const displayTotal = status === "FINAL" && skorFinal ? formatScaled(Math.round(Number(skorFinal) * SCALE), SCALE, 2) : live.total;

  const openConfirm = () => {
    setConfirmError(null);
    dialogRef.current?.showModal();
  };

  const submitFinal = async () => {
    setSubmitting(true);
    setConfirmError(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      if (!navigator.onLine) throw new Error("OFFLINE");
      const res = await fetch(p.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          kodeKarya: karya.kode,
          clientUuid: uuidRef.current,
          nilai: payloadNilai(valuesRef.current),
          catatan: catatanRef.current.trim() === "" ? null : catatanRef.current,
          clientUpdatedAt: nextTs(),
          final: true,
        }),
      });
      if (res.status === 401) {
        setConfirmError("Sesi berakhir. Login ulang; nilai Anda tetap aman di perangkat ini.");
        return;
      }
      const json = (await res.json().catch(() => null)) as ServerReply | null;
      if (!json) throw new Error("BAD");
      if (json.ok) {
        adoptServer(json.state);
        setSync("saved");
        dialogRef.current?.close();
      } else {
        if (json.state) adoptServer(json.state);
        setConfirmError(json.message);
      }
    } catch (e) {
      setConfirmError(
        e instanceof Error && e.message === "OFFLINE"
          ? "Tidak ada koneksi. Submit Final hanya bisa saat online. Nilai Anda tetap tersimpan sebagai draft di perangkat."
          : "Gagal menghubungi server. Nilai belum final; coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const syncBadge = status === "FINAL" ? { text: "FINAL · terkunci", cls: "badge-ok" } : SYNC_LABEL[sync];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-40 pt-4 md:pb-10">
      {/* Header karya — ID besar agar tidak salah karya */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link href={p.backHref} className="btn btn-ghost btn-sm">
          ‹ Daftar karya
        </Link>
        <span className={`badge ${syncBadge.cls}`} role="status" aria-live="polite">
          {syncBadge.text}
        </span>
      </div>

      {p.mode === "admin" && p.onBehalfOf && (
        <p className="mb-4 rounded-md border border-warn/50 bg-warn/10 px-3 py-2 text-sm text-warn">
          Mode fallback: Anda menginput nilai <strong>atas nama {p.onBehalfOf}</strong>. Tindakan ini ditandai &quot;diinput admin&quot; dan tercatat di audit log.
        </p>
      )}
      {p.fase !== "PENJURIAN" && (
        <p className="mb-4 rounded-md border border-warn/50 bg-warn/10 px-3 py-2 text-sm text-warn">
          Fase penjurian sedang {p.fase === "PERSIAPAN" ? "belum dibuka" : "ditutup"}; nilai tidak dapat diubah.
        </p>
      )}
      {serverMsg && (
        <p role="alert" className="mb-4 rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-[#ffd9d2]">
          {serverMsg}
        </p>
      )}
      {sync === "auth" && (
        <p role="alert" className="mb-4 rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-[#ffd9d2]">
          Sesi login berakhir. Nilai Anda aman di perangkat ini.{" "}
          <Link href="/login" className="underline">
            Login ulang
          </Link>{" "}
          lalu buka karya ini lagi; draft akan terkirim otomatis.
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2 md:items-start lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {/* Kolom kiri: identitas + galeri */}
        <section aria-labelledby="judul-karya">
          <div className="card mb-4 p-4">
            <p className="text-[0.7rem] uppercase tracking-[0.25em] text-muted">ID Karya</p>
            <h1 id="judul-karya" className="font-title gold-text num text-3xl font-bold leading-tight sm:text-4xl">
              {karya.kode}
            </h1>
            <p className="mt-2 text-lg font-semibold text-cream">{karya.nama}</p>
            <p className="text-sm text-muted">
              {karya.peserta} <span className="text-gold-dark">· {karya.kodePeserta}</span>
            </p>
            {karya.deskripsi && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{karya.deskripsi}</p>}
          </div>
          <Gallery fotos={karya.fotos} alt={karya.nama} />
        </section>

        {/* Kolom kanan: form nilai */}
        <section aria-label="Form penilaian" className="md:sticky md:top-28">
          <div className="card p-4">
            <div className="mb-1 flex items-baseline justify-between">
              <h2 className="font-title text-lg font-bold text-gold-light">Penilaian</h2>
              <span className="text-xs text-muted">Skala 0–100</span>
            </div>
            <hr className="hairline mb-3" />

            <ul className="space-y-4">
              {kriteria.map((k) => {
                const raw = values[k.kode];
                const n = raw === "" ? null : Number(raw);
                const poin = n === null ? null : formatScaled(n * k.bobotBp, SCALE, 2);
                return (
                  <li key={k.id}>
                    <div className="flex items-start justify-between gap-3">
                      <label htmlFor={`n-${k.kode}`} className="min-w-0 flex-1">
                        <span className="block font-semibold text-cream">{k.nama}</span>
                        {k.deskripsi && <span className="mt-0.5 block text-xs leading-snug text-muted">{k.deskripsi}</span>}
                      </label>
                      <span className="badge badge-gold shrink-0">Bobot {k.bobotBp / 100}%</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost w-12 shrink-0 text-xl"
                        onClick={() => step(k.kode, -1)}
                        disabled={!canEdit}
                        aria-label={`Kurangi nilai ${k.nama}`}
                      >
                        −
                      </button>
                      <input
                        id={`n-${k.kode}`}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        className="input num text-center text-2xl font-semibold"
                        placeholder="0–100"
                        value={raw}
                        readOnly={!canEdit}
                        onChange={(e) => setNilai(k.kode, e.target.value)}
                        onFocus={(e) => e.currentTarget.select()}
                        aria-describedby={`poin-${k.kode}`}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost w-12 shrink-0 text-xl"
                        onClick={() => step(k.kode, 1)}
                        disabled={!canEdit}
                        aria-label={`Tambah nilai ${k.nama}`}
                      >
                        +
                      </button>
                    </div>
                    <p id={`poin-${k.kode}`} className="num mt-1 text-right text-xs text-muted">
                      {poin === null ? "belum diisi" : `${n} × ${k.bobotBp / 100}% = ${poin} poin`}
                    </p>
                  </li>
                );
              })}
            </ul>

            {hint && (
              <p role="alert" className="mt-2 text-sm text-warn">
                {hint}
              </p>
            )}

            <div className="mt-4">
              <label htmlFor="catatan" className="label">
                Catatan (opsional)
              </label>
              <textarea
                id="catatan"
                rows={3}
                maxLength={2000}
                className="input"
                value={catatan}
                readOnly={!canEdit}
                onChange={(e) => onCatatan(e.target.value)}
                placeholder="Catatan untuk dewan juri"
              />
            </div>

            <div className="mt-4 flex items-end justify-between rounded-lg border border-gold-dark/60 bg-gold/5 px-4 py-3">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.2em] text-muted">Skor Anda</p>
                <p className="text-xs text-muted">
                  {live.filled}/{kriteria.length} kriteria terisi
                </p>
              </div>
              <p className="num gold-text font-title text-4xl font-bold">{displayTotal ?? "—"}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Bilah aksi (menempel di bawah untuk smartphone) */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:static md:mt-5 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-7xl items-center gap-3 md:justify-end">
          <div className="min-w-0 flex-1 md:hidden">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted">Skor</p>
            <p className="num gold-text font-title text-2xl font-bold leading-none">{displayTotal ?? "—"}</p>
          </div>
          {status === "FINAL" ? (
            <p className="text-sm font-semibold text-ok">✓ Nilai final terkunci. Hubungi admin untuk membuka.</p>
          ) : (
            <button
              type="button"
              className="btn btn-gold min-w-44 flex-[2] md:flex-none"
              disabled={!canEdit || !live.lengkap || !ready}
              onClick={openConfirm}
            >
              Submit Final
            </button>
          )}
        </div>
      </div>

      {/* Dialog konfirmasi */}
      <dialog
        ref={dialogRef}
        className="m-auto w-[min(32rem,calc(100vw-1.5rem))] rounded-2xl border border-gold-dark bg-panel p-0 text-cream backdrop:bg-black/80"
      >
        <div className="p-5">
          <h2 className="font-title gold-text text-xl font-bold">Konfirmasi Nilai Final</h2>
          <p className="mt-1 text-sm text-muted">Periksa kembali. Setelah final, nilai terkunci dan hanya admin yang dapat membukanya.</p>

          <div className="card mt-4 p-3">
            <p className="text-[0.7rem] uppercase tracking-[0.25em] text-muted">Karya</p>
            <p className="font-title gold-text num text-2xl font-bold">{karya.kode}</p>
            <p className="text-sm">
              {karya.nama} · <span className="text-muted">{karya.peserta}</span>
            </p>
          </div>

          <table className="tbl mt-3">
            <tbody>
              {kriteria.map((k) => (
                <tr key={k.id}>
                  <td>
                    {k.nama}
                    <span className="block text-xs text-muted">bobot {k.bobotBp / 100}%</span>
                  </td>
                  <td className="num text-right text-xl font-semibold">{values[k.kode] || "—"}</td>
                </tr>
              ))}
              <tr>
                <td className="font-semibold text-gold-light">Skor</td>
                <td className="num gold-text font-title text-right text-3xl font-bold">{live.total ?? "—"}</td>
              </tr>
            </tbody>
          </table>

          {confirmError && (
            <p role="alert" className="mt-3 rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-[#ffd9d2]">
              {confirmError}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button type="button" className="btn btn-ghost flex-1" onClick={() => dialogRef.current?.close()} disabled={submitting} autoFocus>
              Periksa lagi
            </button>
            <button type="button" className="btn btn-gold flex-1" onClick={submitFinal} disabled={submitting || !live.lengkap}>
              {submitting ? "Mengirim…" : "Kirim Final"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

