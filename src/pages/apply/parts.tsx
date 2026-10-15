import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Mark } from "@/components/mark";
import { cx } from "@/components/ui";
import { COMPANY } from "./content";
import "./apply.css";

/** The company's own monogram. Deliberately not the recruited mark. */
export function Monogram({ size = 44, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cx("inline-flex shrink-0 items-center justify-center rounded-[28%] font-semibold tracking-[-0.03em] text-background", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: "linear-gradient(150deg, color-mix(in oklch, var(--foreground) 82%, var(--primary)), var(--foreground))",
        boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.16), 0 1px 2px oklch(0 0 0 / 0.18)",
      }}
      aria-hidden
    >
      {COMPANY.monogram}
    </span>
  );
}

/** The strip that tells a judge they're looking at the candidate side. */
export function DemoBanner() {
  return (
    <div className="border-b border-rim bg-primary-tint text-[12.5px] text-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <span className="flex min-w-0 items-center gap-2">
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
          <span className="truncate">This is the page candidates see</span>
        </span>
        <Link to="/demo" className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline">
          <ArrowLeft className="size-3.5" /> Back to the demo
        </Link>
      </div>
    </div>
  );
}

export function CompanyBar({ back }: { back?: boolean }) {
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 pt-5 sm:px-6">
      <Link to="/jobs" className="flex min-w-0 items-center gap-2.5">
        <Monogram size={30} />
        <span className="truncate text-[14px] font-semibold tracking-[-0.01em]">{COMPANY.name}</span>
      </Link>
      {back && (
        <Link to="/jobs" className="inline-flex shrink-0 items-center gap-1 text-[13px] text-muted hover:text-foreground">
          <ArrowLeft className="size-3.5" /> All roles
        </Link>
      )}
    </header>
  );
}

export function PoweredBy() {
  return (
    <footer className="mx-auto max-w-5xl px-4 pb-10 pt-14 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rim pt-5 text-[12.5px] text-faint">
        <span>© 2026 {COMPANY.name}</span>
        <Link to="/" className="group inline-flex items-center gap-1.5 text-muted hover:text-foreground">
          Careers page powered by
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Mark size={14} /> recruited.tools
          </span>
          <ArrowUpRight className="size-3 opacity-60 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
        </Link>
      </div>
    </footer>
  );
}

export function Page({ children, back }: { children: ReactNode; back?: boolean }) {
  return (
    <div className="min-h-dvh bg-background">
      <DemoBanner />
      <CompanyBar back={back} />
      {children}
      <PoweredBy />
    </div>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-[14.5px] leading-relaxed text-foreground/85">
          <span className="mt-[0.7em] size-1 shrink-0 rounded-full bg-faint" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}
