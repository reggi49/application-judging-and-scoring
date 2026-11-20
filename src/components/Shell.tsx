import Link from "next/link";
import { AppNavMenu } from "./AppNav";

export function Emblem({ size = 44 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/ticon-512.png"
      alt="MBtech Riding With Style Awards 2026"
      width={size}
      height={size}
      className="shrink-0 rounded-lg object-contain"
      style={{ width: size, height: size }}
    />
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
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right leading-tight lg:block">
            <div className="text-base font-bold text-white">{userLabel}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-gold-light">{roleLabel}</div>
          </div>
          <AppNavMenu nav={nav} home={home} userLabel={userLabel} roleLabel={roleLabel} />
        </div>
      </div>
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

