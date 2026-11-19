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
      {/* Pilihan Login Sebagai Apa — Jelas & Kontras Tinggi */}
      <div className="mb-6 flex rounded-xl border-2 border-line bg-panel2 p-1.5 shadow-md">
        <button
          type="button"
          onClick={() => setTab("JURI")}
          className={`flex-1 rounded-lg py-3 text-center text-base font-bold transition-all ${
            tab === "JURI"
              ? "bg-gold text-ink shadow-md"
              : "text-[#ded7c8] hover:bg-panel hover:text-white"
          }`}
        >
          Dewan Juri
        </button>
        <button
          type="button"
          onClick={() => setTab("ADMIN")}
          className={`flex-1 rounded-lg py-3 text-center text-base font-bold transition-all ${
            tab === "ADMIN"
              ? "bg-gold text-ink shadow-md"
              : "text-[#ded7c8] hover:bg-panel hover:text-white"
          }`}
        >
          Administrator
        </button>
      </div>

      {/* FORM LOGIN JURI (TANPA PASSWORD) */}
      {tab === "JURI" && (
        <form action={juriFormAction} className="space-y-4">
          <div className="rounded-xl border-2 border-gold-dark/60 bg-gold/15 p-3.5 text-center shadow-sm">
            <p className="text-sm font-bold text-white">
              Khusus Dewan Juri: Langsung pilih profil di bawah tanpa password.
            </p>
          </div>

          <div>
            <label htmlFor="juriId" className="label text-base">
              Pilih Profil Anda:
            </label>
            {juriList.length === 0 ? (
              <p className="rounded-xl border-2 border-warn/60 bg-warn/15 p-4 text-center text-sm font-bold text-warn">
                Belum ada dewan juri aktif. Silakan hubungi admin panitia.
              </p>
            ) : (
              <div className="space-y-3">
                <input type="hidden" name="juriId" value={selectedJuriId} />

                <div className="grid gap-2.5 pt-1">
                  {juriList.map((j) => {
                    const isSelected = j.id === selectedJuriId;
                    return (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => setSelectedJuriId(j.id)}
                        className={`flex items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${
                          isSelected
                            ? "border-gold bg-gold/25 text-white shadow-md ring-2 ring-gold/40"
                            : "border-line bg-panel hover:border-gold hover:bg-panel2 text-white"
                        }`}
                      >
                        <div>
                          <div className="text-lg font-bold text-white">{j.nama}</div>
                          <div className="text-sm font-semibold text-gold-light mt-0.5">Kode Juri: {j.kodeJuri}</div>
                        </div>
                        <span
                          className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                            isSelected
                              ? "bg-gold text-ink shadow-sm"
                              : "bg-[#38332a] text-[#ded7c8]"
                          }`}
                        >
                          {isSelected ? "Terpilih" : "Pilih"}
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
            className="btn btn-gold w-full text-lg py-3.5 mt-2"
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
          <div className="rounded-xl border-2 border-gold-dark/60 bg-gold/15 p-3 text-center shadow-sm">
            <p className="text-xs font-bold text-white">
              Default Login: Username: <span className="text-gold-light">admin</span> · Password: <span className="text-gold-light">admin</span>
            </p>
          </div>

          <div>
            <label htmlFor="username" className="label text-sm">
              Username Admin
            </label>
            <input
              id="username"
              name="username"
              className="input text-base"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="admin"
              defaultValue="admin"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="label text-sm">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input text-base"
              autoComplete="current-password"
              placeholder="admin"
              defaultValue="admin"
              required
            />
            <p className="mt-1.5 text-xs font-medium text-gold-light">
              Bisa menggunakan password <strong>admin</strong> atau <strong>MBtech123</strong>
            </p>
          </div>

          <FormMessage state={adminState} />

          <SubmitButton className="btn btn-gold w-full text-base py-3 mt-2" pending="Memverifikasi…">
            Masuk sebagai Administrator ➔
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
