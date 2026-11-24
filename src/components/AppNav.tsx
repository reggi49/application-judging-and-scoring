"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/actions/auth";
import type { NavItem } from "./Shell";

export function AppNavMenu({
  nav,
  home,
  userLabel,
  roleLabel,
}: {
  nav: NavItem[];
  home: string;
  userLabel: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const containerRef = useRef<HTMLDivElement>(null);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const isItemActive = (href: string) => {
    if (href === home) return pathname === home;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const activeItem = nav.find((n) => isItemActive(n.href));

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex items-center gap-2">
      {activeItem && (
        <span
          className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/15 px-3 py-1 text-xs font-bold text-gold-light"
          title={`Menu aktif: ${activeItem.label}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
          <span>{activeItem.label}</span>
        </span>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="app-nav-dropdown"
        aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
        className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition-colors ${
          open
            ? "border-gold bg-gold text-ink shadow-md"
            : "border-line bg-panel2 text-cream hover:border-gold hover:text-gold-light"
        }`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
        <span className="hidden sm:inline">Menu</span>
      </button>

      {open && (
        <nav
          id="app-nav-dropdown"
          aria-label="Navigasi utama"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border-2 border-line bg-panel shadow-2xl"
        >
          <div className="border-b border-line/80 bg-panel2/80 px-3.5 py-2.5">
            <p className="text-sm font-bold text-white leading-tight">{userLabel}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold-light">
              {roleLabel}
            </p>
            {activeItem && (
              <p className="mt-1 text-xs font-semibold text-muted">
                Menu aktif: <span className="text-gold-light">{activeItem.label}</span>
              </p>
            )}
          </div>
          {nav.length > 0 && (
            <ul className="space-y-1 p-2">
              {nav.map((n) => {
                const active = isItemActive(n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
                        active
                          ? "bg-gold text-ink shadow-sm"
                          : "text-[#ded7c8] hover:bg-gold/15 hover:text-white"
                      }`}
                    >
                      <span>{n.label}</span>
                      {active && (
                        <span className="rounded-full bg-ink/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink">
                          Aktif
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-line/80 bg-panel2/40 p-2">
            <form action={logoutAction}>
              <button
                type="submit"
                className="btn btn-danger btn-sm w-full justify-center text-sm font-bold"
              >
                Keluar
              </button>
            </form>
          </div>
        </nav>
      )}
    </div>
  );
}
