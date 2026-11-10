import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

export function Emblem({ size = 44 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="font-title gold-text inline-grid shrink-0 place-items-center rounded-full border border-gold-dark"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      RW
    </span>
  );
}

export function Brand({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <Emblem size={compact ? 40 : 48} />
      <span className="leading-tight">
        <span className="font-title gold-text block text-base font-bold tracking-wider sm:text-lg">RIDING WITH STYLE</span>
        <span className="block text-xs font-bold tracking-[0.22em] text-gold-light">AWARDS 2026 · PENJURIAN</span>
      </span>
    </Link>
  );
}

export type NavItem = { href: string; label: string };

export function AppHeader({
  nav,
  userLabel,
  roleLabel,
  home,
}: {
  nav: NavItem[];
  userLabel: string;
  roleLabel: string;
  home: string;
}) {
  return (
    <header className="no-print sticky top-0 z-30 border-b-2 border-line bg-panel/95 backdrop-blur-md shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Brand href={home} compact />
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-base font-bold text-white">{userLabel}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-gold-light">{roleLabel}</div>
          </div>
          <form action={logoutAction}>
            <button className="btn btn-ghost btn-sm" type="submit">
              Keluar
            </button>
          </form>
        </div>
      </div>
      {nav.length > 0 && (
        <nav aria-label="Navigasi utama" className="border-t border-line/80 bg-panel2/50">
          <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none]">
            {nav.map((n) => (
              <li key={n.href} className="shrink-0">
                <Link
                  href={n.href}
                  className="inline-flex min-h-10 items-center rounded-lg px-3.5 text-sm font-bold text-[#ded7c8] transition-colors hover:bg-gold/25 hover:text-white"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-title gold-text text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

