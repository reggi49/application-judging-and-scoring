"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Foto = { id: number };

/** Galeri foto referensi: strip geser (snap) + lightbox dengan perbesar/geser. */
export function Gallery({ fotos, alt }: { fotos: Foto[]; alt: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = useCallback(() => {
    dialogRef.current?.close();
    setOpen(null);
    setZoom(false);
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
  }, [open]);

  const go = useCallback(
    (delta: number) => {
      setOpen((i) => (i === null ? i : (i + delta + fotos.length) % fotos.length));
      setZoom(false);
    },
    [fotos.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  if (fotos.length === 0) {
    return (
      <div className="card grid aspect-[4/3] place-items-center text-sm text-muted">
        Belum ada foto untuk karya ini
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]"
        role="list"
        aria-label="Foto karya"
      >
        {fotos.map((f, i) => (
          <button
            key={f.id}
            type="button"
            role="listitem"
            onClick={() => setOpen(i)}
            className="card relative aspect-[4/3] w-[86%] shrink-0 snap-center overflow-hidden p-0 sm:w-[70%] md:w-[88%]"
            aria-label={`Perbesar foto ${i + 1} dari ${fotos.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/foto/${f.id}`}
              alt={`${alt} — foto ${i + 1}`}
              className="h-full w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
            />
            <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-gold-light">
              {i + 1}/{fotos.length}
            </span>
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => {
          setOpen(null);
          setZoom(false);
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-black/95 p-0 text-cream backdrop:bg-black"
      >
        {open !== null && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-2 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
              <span className="text-sm text-muted">
                Foto {open + 1} dari {fotos.length}
              </span>
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setZoom((z) => !z)}>
                  {zoom ? "Muat layar" : "Perbesar"}
                </button>
                <button type="button" className="btn btn-gold btn-sm" onClick={close}>
                  Tutup
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto" style={{ touchAction: "pan-x pan-y pinch-zoom" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/foto/${fotos[open].id}`}
                alt={`${alt} — foto ${open + 1}`}
                onClick={() => setZoom((z) => !z)}
                className={zoom ? "max-w-none cursor-zoom-out" : "mx-auto h-full w-full cursor-zoom-in object-contain"}
                style={zoom ? { width: "250%" } : undefined}
              />
            </div>
            {fotos.length > 1 && (
              <div className="flex justify-between gap-2 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <button type="button" className="btn btn-ghost" onClick={() => go(-1)}>
                  ‹ Sebelumnya
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => go(1)}>
                  Berikutnya ›
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}

