"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
    id?: number;
    kode: string;
    nama: string;
    peserta: string;
    kodePeserta: string;
    whatsapp?: string | null;
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

function safeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function toInputs(kriteria: KriteriaView[], nilai: Record<string, number>) {
  const v: Record<string, string> = {};
  for (const k of kriteria) v[k.kode] = nilai[k.kode] === undefined ? "" : String(nilai[k.kode]);
  return v;
}

function extractDisplayName(peserta: string, nama: string): string {
  const isDefaultPeserta = /^Peserta\s*#?\d+$/i.test(peserta.trim());
  const isDefaultKarya = /^Nomor\s*\d+$/i.test(nama.trim());
  if (!isDefaultPeserta && peserta.trim()) return peserta;
  if (!isDefaultKarya && nama.trim()) return nama;
  return "";
}

export function PenilaianPanel(p: PanelProps) {
  const router = useRouter();
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

  // Fitur Konsep Baru: Kelola Foto & Info Motor Slot (Nama, WhatsApp angka-only, Deskripsi tersembunyi di balik checklist)
  const [fotos, setFotos] = useState<{ id: number }[]>(karya.fotos);
  const [namaInput, setNamaInput] = useState(() => extractDisplayName(karya.peserta, karya.nama));
  const [whatsapp, setWhatsapp] = useState(() => (karya.whatsapp ?? "").replace(/\D/g, ""));
  const [deskripsi, setDeskripsi] = useState(karya.deskripsi || "");
  const [showDeskripsi, setShowDeskripsi] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const dirtyInfoRef = useRef(false);

  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoNotice, setFotoNotice] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const uuidRef = useRef<string>(p.initial?.clientUuid || safeUUID());
  const tsRef = useRef<number>(p.initial?.clientUpdatedAt ?? 0);
  const dirtyRef = useRef(false);
  const valuesRef = useRef(values);
  const catatanRef = useRef(catatan);
  const statusRef = useRef(status);
  const syncingRef = useRef(false);
  const failRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncNowRef = useRef<() => void>(() => {});

  useEffect(() => {
    valuesRef.current = values;
    catatanRef.current = catatan;
    statusRef.current = status;
  }, [values, catatan, status]);

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

  useEffect(() => {
    syncNowRef.current = syncNow;
  }, [syncNow]);

  /* Muat draft lokal & putuskan sumber kebenaran */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = await loadDraft(storageKey);
      if (cancelled) return;
      const server = p.initial;
      if (server?.clientUuid) {
        uuidRef.current = server.clientUuid;
      } else if (local?.uuid) {
        uuidRef.current = local.uuid;
      } else if (!uuidRef.current) {
        uuidRef.current = safeUUID();
      }

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

  /* Sinkronkan data bersama (Nama, WhatsApp, Deskripsi, Foto) antar seluruh juri */
  const fetchSharedInfo = useCallback(async () => {
    if (!karya.id || !navigator.onLine) return;
    try {
      const res = await fetch(`/api/admin/karya/${karya.id}/foto`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json().catch(() => null)) as {
        nama?: string;
        peserta?: string;
        whatsapp?: string;
        deskripsi?: string;
        fotos?: { id: number }[];
      } | null;
      if (!data) return;
      if (Array.isArray(data.fotos)) setFotos(data.fotos);
      if (!dirtyInfoRef.current) {
        setNamaInput(extractDisplayName(data.peserta ?? "", data.nama ?? ""));
        setWhatsapp((data.whatsapp ?? "").replace(/\D/g, ""));
        setDeskripsi(data.deskripsi ?? "");
      }
    } catch {
      /* abaikan gangguan jaringan sementara */
    }
  }, [karya.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchSharedInfo();
    }, 0);
    const onFocusOrVis = () => {
      if (document.visibilityState === "visible") void fetchSharedInfo();
    };
    window.addEventListener("focus", onFocusOrVis);
    document.addEventListener("visibilitychange", onFocusOrVis);
    const sharedIv = setInterval(() => void fetchSharedInfo(), 10_000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", onFocusOrVis);
      document.removeEventListener("visibilitychange", onFocusOrVis);
      clearInterval(sharedIv);
    };
  }, [fetchSharedInfo]);

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
    let nxt: number;
    if (cur === null || isNaN(cur)) {
      nxt = delta > 0 ? 75 : 70;
    } else {
      nxt = Math.min(100, Math.max(0, cur + delta));
    }
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

  const saveInfo = async () => {
    if (!karya.id) return;
    setSavingInfo(true);
    setInfoNotice(null);
    const cleanWa = whatsapp.replace(/\D/g, "").slice(0, 25);
    setWhatsapp(cleanWa);
    try {
      const payload: { nama: string; whatsapp: string; deskripsi?: string } = {
        nama: namaInput.trim(),
        whatsapp: cleanWa,
      };
      if (showDeskripsi) {
        payload.deskripsi = deskripsi.trim();
      }
      const res = await fetch(`/api/admin/karya/${karya.id}/foto`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan data");
      dirtyInfoRef.current = false;
      if (typeof data.peserta === "string" || typeof data.nama === "string") {
        setNamaInput(extractDisplayName(data.peserta ?? "", data.nama ?? ""));
      }
      if (typeof data.whatsapp === "string") setWhatsapp(data.whatsapp);
      if (typeof data.deskripsi === "string") setDeskripsi(data.deskripsi);
      setInfoNotice("✓ Data peserta & nomor WA tersimpan (otomatis sama di semua juri)");
      router.refresh();
      setTimeout(() => setInfoNotice(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan";
      setInfoNotice(`✕ ${msg}`);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!karya.id || !e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    e.target.value = "";
    setUploadingFoto(true);
    setFotoNotice(null);

    let successCount = 0;
    let errMsg = "";
    for (const file of files) {
      if (fotos.length + successCount >= 5) {
        errMsg = "Maksimal 5 foto per motor.";
        break;
      }
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`/api/admin/karya/${karya.id}/foto`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          successCount++;
          setFotos((prev) => [...prev, { id: data.id }]);
        } else {
          errMsg = data.error || "Gagal mengunggah foto.";
          break;
        }
      } catch {
        errMsg = "Gagal menghubungi server saat upload.";
        break;
      }
    }

    setUploadingFoto(false);
    if (errMsg) {
      setFotoNotice(`✕ ${errMsg}`);
    } else if (successCount > 0) {
      setFotoNotice(`✓ Berhasil menambahkan ${successCount} foto.`);
      router.refresh();
      setTimeout(() => setFotoNotice(null), 3500);
    }
  };

  const handleDeleteFoto = async (fotoId: number) => {
    if (!karya.id) return;
    if (!confirm("Hapus foto ini?")) return;
    setFotoNotice(null);
    try {
      const res = await fetch(`/api/admin/karya/${karya.id}/foto?fotoId=${fotoId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus foto");
      setFotos((prev) => prev.filter((f) => f.id !== fotoId));
      setFotoNotice("✓ Foto berhasil dihapus.");
      router.refresh();
      setTimeout(() => setFotoNotice(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus foto";
      setFotoNotice(`✕ ${msg}`);
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
        {/* Kolom kiri: identitas + pengelola info + galeri foto */}
        <section aria-labelledby="judul-karya">
          {/* Card 1: Identitas Slot (#001), Nama, No. WhatsApp, & Checklist Deskripsi */}
          <div className="card mb-4 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">Nomor Slot Peserta</p>
                <h1 id="judul-karya" className="font-title gold-text num text-4xl font-black leading-tight sm:text-5xl tracking-wider mt-0.5">
                  #{karya.kode}
                </h1>
              </div>
              <span className="rounded-full bg-ok/20 border border-ok/50 px-2.5 py-0.5 text-[10px] font-bold text-[#a3f7bf]">
                Berbagi ke semua juri
              </span>
            </div>

            {infoNotice && (
              <div className={`mt-3 rounded-lg px-3 py-2 text-xs font-bold ${infoNotice.startsWith("✓") ? "bg-ok/20 border border-ok/60 text-ok" : "bg-danger/20 border border-danger/60 text-white"}`}>
                {infoNotice}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor={`nama-${karya.kode}`} className="mb-1 block text-xs font-bold uppercase tracking-wider text-gold-light">
                  Nama
                </label>
                <input
                  id={`nama-${karya.kode}`}
                  type="text"
                  maxLength={150}
                  value={namaInput}
                  onChange={(e) => {
                    dirtyInfoRef.current = true;
                    setNamaInput(e.target.value);
                  }}
                  placeholder="Masukkan nama peserta / pemilik motor"
                  className="input text-sm font-semibold"
                />
              </div>

              <div>
                <label htmlFor={`wa-${karya.kode}`} className="mb-1 block text-xs font-bold uppercase tracking-wider text-gold-light">
                  Nomor WhatsApp
                </label>
                <input
                  id={`wa-${karya.kode}`}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="tel-national"
                  maxLength={25}
                  value={whatsapp}
                  onChange={(e) => {
                    dirtyInfoRef.current = true;
                    setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 25));
                  }}
                  placeholder="08xxxxxxxxxx (angka saja)"
                  className="input num text-sm font-semibold"
                />
              </div>

              <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-line bg-panel2/70 px-3 py-2.5 hover:border-gold/60 transition-colors">
                <span className="flex items-center gap-2.5 text-xs font-bold text-white">
                  <input
                    type="checkbox"
                    checked={showDeskripsi}
                    onChange={(e) => setShowDeskripsi(e.target.checked)}
                    className="h-4 w-4 accent-gold cursor-pointer rounded"
                  />
                  <span>Tampilkan Deskripsi Modifikasi</span>
                </span>
                {deskripsi.trim() !== "" && !showDeskripsi && (
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold-light">
                    Terisi
                  </span>
                )}
              </label>

              {showDeskripsi && (
                <div>
                  <label htmlFor={`desk-${karya.kode}`} className="mb-1 block text-xs font-bold uppercase tracking-wider text-gold-light">
                    Deskripsi Modifikasi Jok
                  </label>
                  <textarea
                    id={`desk-${karya.kode}`}
                    rows={3}
                    maxLength={2000}
                    className="input text-sm font-semibold w-full leading-relaxed p-3 shadow-inner"
                    value={deskripsi}
                    onChange={(e) => {
                      dirtyInfoRef.current = true;
                      setDeskripsi(e.target.value);
                    }}
                    placeholder="Bahan MBtech Giorgio & Carrera, motif diamond stitch, benang merah, busa latex custom..."
                  />
                </div>
              )}

              {karya.id && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={saveInfo}
                    disabled={savingInfo}
                    className="btn btn-gold btn-sm w-full sm:w-auto px-5 text-xs font-extrabold shadow-md"
                  >
                    {savingInfo ? "Menyimpan…" : "Simpan Data Slot"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Pengelola & Galeri Foto */}
          <div className="card mb-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-title text-base font-bold text-white">Foto Unit Motor</h3>
                <p className="text-xs text-[#ded7c8]">{fotos.length}/5 foto terunggah (berbagi ke semua juri)</p>
              </div>

              {karya.id && fotos.length < 5 && (
                <div className="flex items-center gap-2">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFotoUpload}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFotoUpload}
                  />
                  <button
                    type="button"
                    disabled={uploadingFoto}
                    onClick={() => cameraInputRef.current?.click()}
                    className="btn btn-gold btn-sm gap-1.5 px-3 py-1.5 text-xs font-extrabold shadow-md active:scale-95"
                    title="Buka kamera smartphone untuk foto langsung"
                  >
                    <span>Kamera</span>
                  </button>
                  <button
                    type="button"
                    disabled={uploadingFoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-ghost btn-sm gap-1 px-2.5 py-1.5 text-xs font-bold border border-gold/40 text-gold-light hover:bg-gold/20"
                    title="Pilih file dari galeri HP / laptop"
                  >
                    <span>Galeri</span>
                  </button>
                </div>
              )}
            </div>

            {uploadingFoto && (
              <div className="mb-3 rounded-lg border border-gold/50 bg-gold/15 p-2.5 text-center text-xs font-bold text-white animate-pulse">
                Sedang mengompres & mengunggah foto ke server…
              </div>
            )}

            {fotoNotice && (
              <div className={`mb-3 rounded-lg px-3 py-2 text-xs font-bold ${fotoNotice.startsWith("✓") ? "bg-ok/20 border border-ok/60 text-ok" : "bg-danger/20 border border-danger/60 text-white"}`}>
                {fotoNotice}
              </div>
            )}

            {fotos.length > 0 ? (
              <div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 mb-3">
                  {fotos.map((f, idx) => (
                    <div key={f.id} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-panel2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/foto/${f.id}?t=1`}
                        alt={`Foto motor #${karya.kode} ke-${idx + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      {karya.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteFoto(f.id)}
                          className="absolute right-1.5 top-1.5 rounded-full bg-black/80 p-1.5 text-xs text-danger shadow-md hover:bg-danger hover:text-white transition-colors"
                          title="Hapus foto ini"
                          aria-label="Hapus foto"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <Gallery fotos={fotos} alt={namaInput || karya.nama} />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line/80 bg-panel2/40 p-6 text-center">
                <p className="text-sm font-bold text-white">Belum ada foto motor</p>
                <p className="text-xs text-[#ded7c8] mt-1 max-w-xs mx-auto">
                  Gunakan tombol <strong>&quot;Kamera&quot;</strong> di atas untuk mengambil gambar jok motor langsung di venue acara.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Kolom kanan: form nilai */}
        <section aria-label="Form penilaian" className="md:sticky md:top-28">
          <div className="card p-5">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <h2 className="font-title text-xl font-bold text-gold-light">Lembar Penilaian</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-ok/20 border border-ok/50 px-2.5 py-0.5 text-xs font-bold text-[#a3f7bf]">
                Nilai Privat Juri
              </span>
            </div>
            <p className="text-[11px] text-[#ded7c8] mb-3">
              Skala 0–100. Nilai yang Anda input tersimpan rahasia & <strong>tidak dapat dilihat oleh juri lain</strong>.
            </p>
            <hr className="hairline mb-4" />

            <ul className="space-y-4">
              {kriteria.map((k) => {
                const raw = values[k.kode];
                const n = raw === "" ? null : Number(raw);
                const poin = n === null ? null : formatScaled(n * k.bobotBp, SCALE, 2);
                return (
                  <li key={k.id} className="rounded-xl border border-line bg-panel2/70 p-3.5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <label htmlFor={`n-${k.kode}`} className="min-w-0 flex-1">
                        <span className="block text-base font-bold text-white">{k.nama}</span>
                        {k.deskripsi && <span className="mt-1 block text-xs leading-snug text-[#ded7c8]">{k.deskripsi}</span>}
                      </label>
                      <span className="badge badge-gold shrink-0 text-xs">Bobot {k.bobotBp / 100}%</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-ghost w-14 h-14 shrink-0 text-2xl font-black bg-[#332e27] border-2 border-gold-dark/80 text-gold-light hover:bg-gold hover:text-ink shadow-sm"
                        onClick={() => step(k.kode, -5)}
                        disabled={!canEdit}
                        aria-label={`Kurangi 5 poin nilai ${k.nama}`}
                        title="Kurangi 5 poin"
                      >
                        −
                      </button>
                      <input
                        id={`n-${k.kode}`}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        className="input num text-center text-3xl font-extrabold h-14 bg-[#1f1d18] border-2 border-gold-dark/80 text-white shadow-inner"
                        placeholder="0–100"
                        value={raw}
                        readOnly={!canEdit}
                        onChange={(e) => setNilai(k.kode, e.target.value)}
                        onFocus={(e) => e.currentTarget.select()}
                        aria-describedby={`poin-${k.kode}`}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost w-14 h-14 shrink-0 text-2xl font-black bg-[#332e27] border-2 border-gold-dark/80 text-gold-light hover:bg-gold hover:text-ink shadow-sm"
                        onClick={() => step(k.kode, 5)}
                        disabled={!canEdit}
                        aria-label={`Tambah 5 poin nilai ${k.nama}`}
                        title="Tambah 5 poin"
                      >
                        +
                      </button>
                    </div>
                    <p id={`poin-${k.kode}`} className="num mt-2 text-right text-xs font-bold text-gold-light">
                      {poin === null ? "— belum diisi" : `${n} × ${k.bobotBp / 100}% = ${poin} poin`}
                    </p>
                  </li>
                );
              })}
            </ul>

            {hint && (
              <p role="alert" className="mt-3 text-sm font-bold text-warn">
                {hint}
              </p>
            )}

            <div className="mt-5">
              <label htmlFor="catatan" className="label">
                Catatan Juri (opsional)
              </label>
              <textarea
                id="catatan"
                rows={3}
                maxLength={2000}
                className="input font-medium"
                value={catatan}
                readOnly={!canEdit}
                onChange={(e) => onCatatan(e.target.value)}
                placeholder="Tuliskan catatan atau masukan untuk karya ini…"
              />
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border-2 border-gold bg-gold/15 px-4 py-3.5 shadow-md">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-light">Skor Akhir Anda</p>
                <p className="text-xs font-semibold text-white mt-0.5">
                  {live.filled}/{kriteria.length} kriteria terisi
                </p>
              </div>
              <p className="num gold-text font-title text-4xl sm:text-5xl font-black">{displayTotal ?? "—"}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Bilah aksi (menempel di bawah untuk smartphone) */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-line bg-panel/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md shadow-2xl md:static md:mt-5 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="mx-auto flex max-w-7xl items-center gap-3 md:justify-end">
          <div className="min-w-0 flex-1 md:hidden">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-light">Skor Anda</p>
            <p className="num gold-text font-title text-3xl font-black leading-none">{displayTotal ?? "—"}</p>
          </div>
          {status === "FINAL" ? (
            <p className="text-sm font-bold text-ok bg-ok/15 border border-ok/50 px-4 py-2.5 rounded-lg">
              Nilai final terkunci. Hubungi admin untuk membuka.
            </p>
          ) : (
            <button
              type="button"
              className="btn btn-gold min-w-44 flex-[2] md:flex-none text-lg py-3.5 font-bold shadow-lg"
              disabled={!canEdit || !live.lengkap || !ready}
              onClick={openConfirm}
            >
              Submit Nilai Final ➔
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

