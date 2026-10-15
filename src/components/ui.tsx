import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { stageById, TIER_COLOR, type StageId, type Tier } from "@/data/mock";

export const cx = clsx;

type Variant = "primary" | "secondary" | "ghost" | "ink";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary shadow-[0_0_0_1px_color-mix(in_oklch,var(--primary)_80%,black),0_1px_2px_oklch(0_0_0/0.12),inset_0_1px_0_oklch(1_0_0/0.18)] hover:brightness-110",
  ink: "bg-foreground text-background shadow-[0_1px_2px_oklch(0_0_0/0.2),inset_0_1px_0_oklch(1_0_0/0.12)] hover:bg-foreground/90",
  secondary: "bg-card text-foreground shadow-card hover:bg-inset",
  ghost: "text-muted hover:text-foreground hover:bg-[var(--wash)]",
};

const base =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-control font-medium transition-[background,color,filter,transform] duration-150 ease-settle active:scale-[0.98] disabled:opacity-50";

const SIZES = { sm: "h-7 px-2.5 text-[12.5px]", md: "h-8.5 px-3.5 text-[13px]", lg: "h-11 px-5 text-[14.5px]" };

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: keyof typeof SIZES }) {
  return <button className={cx(base, VARIANTS[variant], SIZES[size], className)} {...props} />;
}

export function ButtonLink({
  to,
  variant = "secondary",
  size = "md",
  className,
  children,
}: {
  to: string;
  variant?: Variant;
  size?: keyof typeof SIZES;
  className?: string;
  children: ReactNode;
}) {
  const external = /^https?:/.test(to);
  const cls = cx(base, VARIANTS[variant], SIZES[size], className);
  return external ? (
    <a href={to} className={cls} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link to={to} className={cls}>
      {children}
    </Link>
  );
}

/** A stage chip: the hue is the information. */
export function StageChip({ stage, className }: { stage: StageId; className?: string }) {
  const s = stageById(stage);
  return (
    <span
      className={cx("inline-flex items-center gap-1.5 rounded-chip px-1.5 py-0.5 text-[11.5px] font-medium", className)}
      style={{ color: s.color, background: `color-mix(in oklch, ${s.color} 12%, transparent)` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  const col = TIER_COLOR[tier];
  return (
    <span
      className={cx("inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1 font-mono text-[10.5px] font-medium", className)}
      style={{ color: col, background: `color-mix(in oklch, ${col} 13%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${col} 25%, transparent)` }}
      title={`Tier ${tier}`}
    >
      {tier}
    </span>
  );
}

export function Avatar({ initials, hue, size = 28 }: { initials: string; hue: number; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(140deg, oklch(0.68 0.12 ${hue}), oklch(0.5 0.14 ${hue + 25}))`,
        boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.25), 0 0 0 1px oklch(0 0 0 / 0.06)",
      }}
    >
      {initials}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-panel bg-card shadow-card", className)}>{children}</div>;
}

/** Inline SVG sparkline. No chart library. */
export function Sparkline({
  data,
  width = 96,
  height = 28,
  color = "var(--primary)",
  fill = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  const max = Math.max(...data, 1);
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - 2 - (v / max) * (height - 4)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {fill && <path d={`${d} L${width},${height} L0,${height} Z`} fill={color} opacity={0.1} />}
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Stacked A/B/C bar. */
export function TierBar({ mix, className }: { mix: { A: number; B: number; C: number }; className?: string }) {
  return (
    <div className={cx("flex h-1.5 w-full overflow-hidden rounded-full bg-inset", className)}>
      {(["A", "B", "C"] as const).map((t) => (
        <span key={t} style={{ width: `${mix[t]}%`, background: TIER_COLOR[t] }} className="h-full" />
      ))}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] bg-card px-1 font-mono text-[10.5px] text-muted shadow-[0_0_0_1px_var(--rim),0_1px_0_var(--rim)]">
      {children}
    </kbd>
  );
}

/** GitHub's mark. Lucide dropped brand icons, so it lives here. */
export function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
   Refresh v2 primitives: segmented control, tinted tag, task capsule, step
   trace, confidence meter, section label. Plain CSS, no motion library, so
   they stay cheap in the landing bundle.
   --------------------------------------------------------------------------- */

/** A pill row of options; one is on. */
export function Segmented<T extends string>({
  options, value, onChange, className,
}: {
  options: { id: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cx("inline-flex items-center gap-0.5 rounded-full bg-inset p-0.5 shadow-[inset_0_0_0_1px_var(--rim)]", className)}>
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          type="button"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cx(
            "inline-flex h-6.5 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[12px] transition-colors duration-150",
            value === o.id ? "bg-card font-medium text-foreground shadow-[0_0_0_1px_var(--rim-strong)]" : "text-muted hover:text-foreground",
          )}
        >
          {o.label}
          {o.count != null && <span className="tnum text-[11px] text-faint">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** A tinted label. `color` is any CSS colour; the tint and text derive from it. */
export function Tag({ color = "var(--muted)", children, className }: { color?: string; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx("inline-flex h-5.5 items-center gap-1 whitespace-nowrap rounded-[6px] px-1.5 text-[12px] font-medium", className)}
      style={{ color, background: `color-mix(in oklch, ${color} 16%, transparent)` }}
    >
      {children}
    </span>
  );
}

/** A small mono number eyebrow, like "01". */
export function Index({ n, className }: { n: number; className?: string }) {
  return <span className={cx("font-mono text-[11px] text-faint tnum", className)}>{String(n).padStart(2, "0")}</span>;
}

/** Status mark for a task: a filled check, a numbered ring, or an empty ring. */
export function StatusMark({ state, n }: { state: "done" | "active" | "todo" | "failed"; n?: number }) {
  if (state === "done")
    return (
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success text-[var(--card)]">
        <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3.5 8.5 6.5 11.5 12.5 5" /></svg>
      </span>
    );
  if (state === "failed")
    return <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-[var(--card)]">!</span>;
  return (
    <span className={cx(
      "inline-flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10.5px] font-medium",
      state === "active" ? "text-foreground shadow-[inset_0_0_0_1.5px_var(--primary)]" : "text-faint shadow-[inset_0_0_0_1.5px_var(--rim-strong)]",
    )}>
      {n ?? ""}
    </span>
  );
}

/** A rounded capsule row: status, title, meta, trailing tag. */
export function Capsule({
  state, n, title, meta, trailing, onClick, className,
}: {
  state: "done" | "active" | "todo" | "failed";
  n?: number;
  title: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Tagname = onClick ? "button" : "div";
  return (
    <Tagname
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-3 rounded-full bg-card px-3 py-2.5 text-left shadow-card",
        onClick && "transition-colors hover:bg-inset",
        state === "todo" && "opacity-70",
        className,
      )}
    >
      <StatusMark state={state} n={n} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{title}</span>
      {meta && <span className="hidden shrink-0 text-[12px] text-muted sm:inline">{meta}</span>}
      {trailing}
    </Tagname>
  );
}

/** Three bars that fill to show how sure a call is. */
export function Confidence({ level, label }: { level: 1 | 2 | 3; label?: ReactNode }) {
  const color = level === 3 ? "var(--success)" : level === 2 ? "var(--warning)" : "var(--destructive)";
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] text-muted">
      <span className="inline-flex items-end gap-[3px]" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className="h-3 w-[4px] rounded-[1.5px]" style={{ background: i <= level ? color : "var(--rim-strong)" }} />
        ))}
      </span>
      {label ?? (level === 3 ? "High confidence" : level === 2 ? "Medium confidence" : "Low confidence")}
    </span>
  );
}

/** A numbered section heading with a quiet description, like a catalogue entry. */
export function SectionLabel({ n, title, children, className }: { n?: number; title: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      {n != null && <Index n={n} />}
      <h2 className="text-[14px] font-semibold tracking-[-0.01em]">{title}</h2>
      {children && <span className="text-[13px] text-muted">{children}</span>}
    </div>
  );
}
