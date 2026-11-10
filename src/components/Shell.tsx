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
      <Emblem size={compact ? 38 : 48} />
      <span className="leading-tight">
        <span className="font-title gold-text block text-base font-bold tracking-widest sm:text-lg">RIDING WITH STYLE</span>
        <span className="block text-[0.68rem] tracking-[0.3em] text-muted">AWARDS 2026 · PENJURIAN</span>
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
    <header className="no-print sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
        <Brand href={home} compact />
        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-sm font-semibold text-cream">{userLabel}</div>
            <div className="text-[0.68rem] uppercase tracking-widest text-muted">{roleLabel}</div>
          </div>
          <form action={logoutAction}>
            <button className="btn btn-ghost btn-sm" type="submit">
              Keluar
            </button>
          </form>
        </div>
      </div>
      {nav.length > 0 && (
        <nav aria-label="Navigasi utama" className="border-t border-line/60">
          <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-1.5 [scrollbar-width:none]">
            {nav.map((n) => (
              <li key={n.href} className="shrink-0">
                <Link
                  href={n.href}
                  className="inline-flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-muted transition-colors hover:bg-gold/10 hover:text-gold-light"
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

