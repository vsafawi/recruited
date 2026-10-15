/**
 * The Reports charts. Inline SVG and plain HTML, no chart library. Marks are
 * thin, ends are rounded, fills sit 2px apart, text stays in ink tokens and a
 * coloured mark beside it carries identity. Every chart has a hover layer.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/components/ui";
import { TIER_COLOR, type Tier } from "@/data/mock";
import {
  BOARD_SERIES, DAYS, DAYS_IN_STAGE, FUNNEL_STEPS, HEAT_STAGES, int, money, pct, type BoardRow,
} from "./data";

/* --------------------------------------------------------------- shared -- */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** A tooltip pinned inside a relative container, kept within its edges. */
function Tip({ x, y, width, side, children }: { x: number; y: number; width: number; side?: boolean; children: ReactNode }) {
  const W = 184;
  /* Above the mark by default; beside the crosshair for line charts, flipping left near the right edge. */
  const left = side
    ? (x + 12 + W <= width ? x + 12 : Math.max(0, x - 12 - W))
    : Math.max(0, Math.min(x - W / 2, width - W));
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 rounded-card bg-card px-2.5 py-2 text-[12px] shadow-overlay"
      style={{ left, top: y, width: W, transform: side ? undefined : "translateY(calc(-100% - 8px))" }}
    >
      {children}
    </div>
  );
}

function TipRow({ color, label, value, strong }: { color?: string; label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-1.5 text-muted">
        {color && <span className="size-2 shrink-0 rounded-[2px]" style={{ background: color }} />}
        <span className="truncate">{label}</span>
      </span>
      <span className={cx("tnum", strong ? "font-semibold text-foreground" : "text-foreground")}>{value}</span>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11.5px] text-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="h-2 w-2.5 rounded-[2px]" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/* --------------------------------------------------------------- funnel -- */

/** One role's funnel. Bar length is log-scaled so offers stay visible next to views. */
export function RoleFunnel({ title, values }: { title: string; values: number[] }) {
  const logMax = Math.log10(Math.max(values[0], 10));
  return (
    <div className="min-w-0">
      <h3 className="truncate text-[12.5px] font-medium">{title}</h3>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {values.map((v, i) => {
          const w = v > 0 ? Math.max((Math.log10(Math.max(v, 1.5)) / logMax) * 100, 3) : 0;
          const rate = i ? (values[i - 1] ? (v / values[i - 1]) * 100 : 0) : null;
          return (
            <div key={i} className="grid grid-cols-[68px_1fr_44px] items-center gap-2" title={`${FUNNEL_STEPS[i]}: ${int(v)}${rate != null ? ` — ${pct(rate)} of ${FUNNEL_STEPS[i - 1].toLowerCase()}` : ""}`}>
              <span className="text-[11.5px] text-muted">{FUNNEL_STEPS[i]}</span>
              <div className="flex h-5 min-w-0 items-center gap-1.5">
                {v > 0 ? (
                  <div
                    className="h-full shrink-0 rounded-[4px]"
                    style={{ width: `calc((100% - 2.5rem) * ${(w / 100).toFixed(4)})`, minWidth: 4, background: `color-mix(in oklch, var(--primary) ${88 - i * 15}%, var(--card))` }}
                  />
                ) : (
                  <div className="h-full w-px bg-rim-strong" />
                )}
                <span className="tnum text-[12px] font-medium">{int(v)}</span>
              </div>
              <span className="tnum text-right text-[11.5px] text-muted">{rate == null ? "" : pct(rate)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- tier stacks -- */

const TIERS: Tier[] = ["A", "B", "C"];

export function TierStacks({ rows }: { rows: BoardRow[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<{ r: BoardRow; t: Tier; x: number; y: number } | null>(null);
  const max = Math.max(...rows.map((r) => r.applies), 1);
  return (
    <div ref={ref} className="relative flex flex-col gap-3" onPointerLeave={() => setHover(null)}>
      {rows.map((r) => {
        const total = r.tiers.A + r.tiers.B + r.tiers.C;
        return (
          <div key={r.board.id} className="grid grid-cols-[minmax(0,104px)_1fr] items-center gap-3 sm:grid-cols-[150px_1fr]">
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-medium">{r.board.name}</div>
              <div className="tnum text-[11px] text-faint">{int(total)} applies · {pct((r.tiers.A / total) * 100)} A</div>
            </div>
            <div className="flex h-6 gap-[2px]" style={{ width: `${(r.applies / max) * 100}%`, minWidth: 24 }}>
              {TIERS.map((t, i) => r.tiers[t] > 0 && (
                <div
                  key={t}
                  className={cx("flex h-full items-center justify-start overflow-hidden px-1.5 text-[11px] font-medium text-white", i === 0 && "rounded-l-[4px]", i === 2 && "rounded-r-[4px]")}
                  style={{ flex: `${r.tiers[t]} 0 0`, minWidth: 3, background: TIER_COLOR[t], opacity: hover && (hover.r !== r || hover.t !== t) ? 0.55 : 1 }}
                  onPointerEnter={(e) => {
                    const box = ref.current!.getBoundingClientRect();
                    const seg = e.currentTarget.getBoundingClientRect();
                    setHover({ r, t, x: seg.left - box.left + seg.width / 2, y: seg.top - box.top });
                  }}
                >
                  <span className="tnum truncate">{r.tiers[t] / total > 0.12 ? int(r.tiers[t]) : ""}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {hover && (
        <Tip x={hover.x} y={hover.y} width={width}>
          <div className="mb-1 font-medium">{hover.r.board.name}</div>
          {TIERS.map((t) => (
            <TipRow key={t} color={TIER_COLOR[t]} label={`Tier ${t}`} value={`${int(hover.r.tiers[t])} · ${pct((hover.r.tiers[t] / hover.r.applies) * 100)}`} strong={t === hover.t} />
          ))}
        </Tip>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ cost bars -- */

export function CostBars({ rows, pick, empty }: { rows: BoardRow[]; pick: (r: BoardRow) => number | null; empty: string }) {
  const max = Math.max(...rows.map((r) => pick(r) ?? 0), 1);
  const vals = rows.map(pick).filter((v): v is number => v != null);
  const best = vals.length > 1 ? Math.min(...vals) : null;
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => {
        const v = pick(r);
        return (
          <div key={r.board.id} className="group grid grid-cols-[minmax(0,96px)_1fr] items-center gap-3" title={v == null ? `${r.board.name}: ${empty}` : `${r.board.name}: ${money(v)} from ${money(r.spend)} spend`}>
            <span className="truncate text-[12px] text-muted group-hover:text-foreground">{r.board.name}</span>
            <div className="flex h-5 min-w-0 items-center gap-1.5">
              {v == null ? (
                <span className="text-[11.5px] text-faint">{empty}</span>
              ) : (
                <>
                  <div
                    className="h-3 shrink-0 rounded-r-[4px] transition-[filter] group-hover:brightness-110"
                    style={{ width: `calc((100% - 3.75rem) * ${(v / max).toFixed(4)})`, minWidth: 3, background: v === best ? "var(--primary)" : "color-mix(in oklch, var(--muted) 55%, var(--card))" }}
                  />
                  <span className={cx("tnum text-[12px]", v === best ? "font-semibold" : "text-muted")}>{money(v)}</span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------- heat strip -- */

export function HeatStrip({ roles }: { roles: { id: string; title: string }[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const all = Object.values(DAYS_IN_STAGE).flat();
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const t = (v: number) => (v - lo) / (hi - lo || 1);
  return (
    <div>
      <div className="grid grid-cols-5 gap-[2px] text-[11px] sm:grid-cols-[180px_repeat(5,minmax(0,1fr))]">
        <span className="hidden sm:block" />
        {HEAT_STAGES.map((s) => (
          <span key={s.id} className="truncate px-1 pb-1 text-center text-muted">{s.label}</span>
        ))}
        {roles.map((r) => (
          <Row key={r.id} role={r} hover={hover} setHover={setHover} t={t} />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-faint">
        <span>Fewer days</span>
        <span className="h-1.5 w-24 rounded-full" style={{ background: "linear-gradient(90deg, color-mix(in oklch, var(--primary) 8%, var(--card)), color-mix(in oklch, var(--primary) 85%, var(--card)))" }} />
        <span>More days</span>
      </div>
    </div>
  );
}

function Row({ role, hover, setHover, t }: { role: { id: string; title: string }; hover: string | null; setHover: (k: string | null) => void; t: (v: number) => number }) {
  return (
    <>
      <span className="col-span-5 truncate pt-1.5 pb-0.5 text-[12px] text-foreground sm:col-span-1 sm:flex sm:items-center sm:pt-0 sm:pb-0 sm:pr-2">{role.title}</span>
      {DAYS_IN_STAGE[role.id].map((v, i) => {
        const k = `${role.id}:${i}`;
        const s = t(v);
        return (
          <div
            key={k}
            onPointerEnter={() => setHover(k)}
            onPointerLeave={() => setHover(null)}
            title={`${role.title} · ${HEAT_STAGES[i].label}: ${v.toFixed(1)} days`}
            className={cx("tnum flex h-9 items-center justify-center rounded-[4px] text-[12px] font-medium", hover === k && "ring-2 ring-foreground/70 ring-inset")}
            style={{
              background: `color-mix(in oklch, var(--primary) ${Math.round(8 + s * 77)}%, var(--card))`,
              color: s > 0.62 ? "var(--on-primary)" : "var(--foreground)",
            }}
          >
            {v.toFixed(1)}
          </div>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------ line chart -- */

const SHORT: Record<string, string> = { onlinejobs: "OnlineJobs", indeed: "Indeed", mbw: "MBW", roster: "Roster" };

export function AppliesLines({ rows }: { rows: BoardRow[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [idx, setIdx] = useState<number | null>(null);
  const H = 220;
  const labels = width >= 520;
  const pad = { l: 28, r: labels ? 84 : 10, t: 12, b: 24 };
  const iw = Math.max(width - pad.l - pad.r, 10);
  const ih = H - pad.t - pad.b;
  const rawMax = Math.max(...rows.flatMap((r) => r.trend), 1);
  const step = rawMax > 20 ? 10 : 5;
  const yMax = Math.ceil(rawMax / step) * step;
  const x = (i: number) => pad.l + (i / 13) * iw;
  const y = (v: number) => pad.t + ih - (v / yMax) * ih;
  const ticks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step);

  /* Direct labels at the line ends, nudged apart so they don't collide. */
  const ends = rows.map((r) => ({ r, y: y(r.trend[13]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;

  const onMove = (e: React.PointerEvent) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - box.left - pad.l) / iw) * 13);
    setIdx(Math.max(0, Math.min(13, i)));
  };

  return (
    <div ref={ref} className="relative">
      {width > 0 && (
        <svg width={width} height={H} className="block touch-pan-y" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setIdx(null)} role="img" aria-label="Applies per day by board, last 14 days">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={pad.l + iw} y1={y(t)} y2={y(t)} stroke="var(--grid-line)" strokeWidth={1} />
              <text x={pad.l - 6} y={y(t)} dy="0.32em" textAnchor="end" className="tnum fill-[var(--faint)] text-[10.5px]">{t}</text>
            </g>
          ))}
          {[0, 4, 9, 13].map((i) => (
            <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === 13 ? "end" : "middle"} className="fill-[var(--faint)] text-[10.5px]">{DAYS[i]}</text>
          ))}
          {idx != null && <line x1={x(idx)} x2={x(idx)} y1={pad.t} y2={pad.t + ih} stroke="var(--rim-strong)" strokeWidth={1} />}
          {rows.map((r) => (
            <path
              key={r.board.id}
              d={r.trend.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}
              fill="none"
              stroke={BOARD_SERIES[r.board.id]}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {idx != null && rows.map((r) => (
            <circle key={r.board.id} cx={x(idx)} cy={y(r.trend[idx])} r={4} fill={BOARD_SERIES[r.board.id]} stroke="var(--card)" strokeWidth={2} />
          ))}
          {labels && ends.map(({ r, y: ly }) => (
            <text key={r.board.id} x={pad.l + iw + 8} y={ly} dy="0.32em" className="fill-[var(--muted)] text-[11px]">
              {SHORT[r.board.id]}
            </text>
          ))}
        </svg>
      )}
      {idx != null && (
        <Tip x={x(idx)} y={pad.t} width={width} side>
          <div className="mb-1 font-medium">{DAYS[idx]}</div>
          {[...rows].sort((a, b) => b.trend[idx] - a.trend[idx]).map((r) => (
            <TipRow key={r.board.id} color={BOARD_SERIES[r.board.id]} label={r.board.name} value={int(r.trend[idx])} />
          ))}
          <div className="mt-1 border-t border-rim pt-1">
            <TipRow label="All boards" value={int(rows.reduce((a, r) => a + r.trend[idx], 0))} strong />
          </div>
        </Tip>
      )}
    </div>
  );
}
