"use client";

import { useActionState, useState } from "react";
import { loginJuriAction, loginAdminAction } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/FormBits";

type JuriOption = {
  id: number;
  kodeJuri: string;
  nama: string;
};

export function LoginForm({ juriList }: { juriList: JuriOption[] }) {
  const [tab, setTab] = useState<"JURI" | "ADMIN">("JURI");
  const [juriState, juriFormAction] = useActionState(loginJuriAction, {});
  const [adminState, adminFormAction] = useActionState(loginAdminAction, {});
  const [selectedJuriId, setSelectedJuriId] = useState<number>(juriList[0]?.id ?? 0);

  return (
    <div>
      {/* Pilihan Login Sebagai Apa */}
      <div className="mb-6 flex rounded-lg border border-line bg-panel2 p-1">
        <button
          type="button"
          onClick={() => setTab("JURI")}
          className={`flex-1 rounded-md py-2 text-center text-sm font-semibold transition-all ${
            tab === "JURI"
              ? "bg-gold text-ink shadow"
              : "text-muted hover:text-cream"
          }`}
        >
          🎖️ Dewan Juri
        </button>
        <button
          type="button"
          onClick={() => setTab("ADMIN")}
          className={`flex-1 rounded-md py-2 text-center text-sm font-semibold transition-all ${
            tab === "ADMIN"
              ? "bg-gold text-ink shadow"
              : "text-muted hover:text-cream"
          }`}
        >
          ⚙️ Administrator
        </button>
      </div>

      {/* FORM LOGIN JURI (TANPA PASSWORD) */}
      {tab === "JURI" && (
        <form action={juriFormAction} className="space-y-4">
          <div className="rounded-lg border border-gold-dark/40 bg-gold/5 p-3 text-center">
            <p className="text-xs font-medium text-gold-light">
              Khusus dewan juri: Langsung masuk tanpa password.
            </p>
          </div>

          <div>
            <label htmlFor="juriId" className="label">
              Pilih Profil Dewan Juri
            </label>
            {juriList.length === 0 ? (
              <p className="rounded-md border border-warn/40 bg-warn/10 p-3 text-center text-xs text-warn">
                Belum ada dewan juri aktif. Silakan hubungi admin panitia.
              </p>
            ) : (
              <div className="space-y-2">
                <select
                  id="juriId"
                  name="juriId"
                  className="input text-base font-medium"
                  value={selectedJuriId}
                  onChange={(e) => setSelectedJuriId(Number(e.target.value))}
                  required
                >
                  {juriList.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.kodeJuri} — {j.nama}
                    </option>
                  ))}
                </select>

                <div className="grid gap-2 pt-1">
                  {juriList.map((j) => {
                    const isSelected = j.id === selectedJuriId;
                    return (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => setSelectedJuriId(j.id)}
                        className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
                          isSelected
                            ? "border-gold bg-gold/15 text-gold-light shadow-sm"
                            : "border-line bg-panel hover:border-gold-dark/50"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-cream">{j.nama}</div>
                          <div className="text-xs text-muted">ID: {j.kodeJuri}</div>
                        </div>
                        <span className={`text-xs ${isSelected ? "text-gold font-bold" : "text-muted"}`}>
                          {isSelected ? "● Terpilih" : "Pilih"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <FormMessage state={juriState} />

          <SubmitButton
            className="btn btn-gold w-full text-base"
            disabled={juriList.length === 0}
            pending="Masuk…"
          >
            Masuk Portal Juri ➔
          </SubmitButton>
        </form>
      )}

      {/* FORM LOGIN ADMIN (DENGAN PASSWORD) */}
      {tab === "ADMIN" && (
        <form action={adminFormAction} className="space-y-4" noValidate>
          <div>
            <label htmlFor="username" className="label">
              Username Admin
            </label>
            <input
              id="username"
              name="username"
              className="input"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="admin"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>

          <FormMessage state={adminState} />

          <SubmitButton className="btn btn-gold w-full" pending="Memverifikasi…">
            Masuk sebagai Administrator
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
