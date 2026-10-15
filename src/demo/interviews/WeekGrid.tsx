import { cx } from "@/components/ui";
import { Faces } from "./parts";
import { roleById, stageById, type Candidate } from "@/data/mock";
import {
  BUSY, DAYS, fmtRange, fmtTime, GRID_END, GRID_START, interviewerById, isLive, isPast, layoutDay, NOW,
  type Interview,
} from "./data";

const HOUR = 60;
const px = (min: number) => ((min - GRID_START) / 60) * HOUR;
const HOURS = Array.from({ length: (GRID_END - GRID_START) / 60 + 1 }, (_, i) => GRID_START + i * 60);

type Item = { kind: "interview" } & Interview;

export function WeekGrid({
  schedule, people, onOpen, selectedId,
}: {
  schedule: Interview[];
  people: Map<string, Candidate>;
  onOpen: (id: string) => void;
  selectedId?: string;
}) {
  return (
    <div className="overflow-hidden rounded-panel bg-card shadow-card">
      {/* Day header */}
      <div className="grid grid-cols-[52px_repeat(5,minmax(0,1fr))] border-b border-rim">
        <div className="flex items-end justify-end px-2 pb-2 text-[10.5px] text-faint">EDT</div>
        {DAYS.map((d, i) => {
          const today = i === NOW.day;
          const count = schedule.filter((e) => e.day === i).length;
          return (
            <div key={d.short} className={cx("border-l border-rim px-2.5 py-2", today && "bg-primary-tint/50")}>
              <div className={cx("text-[11px] font-medium uppercase tracking-[0.06em]", today ? "text-primary" : "text-faint")}>{d.short}</div>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={cx(
                    "tnum inline-flex h-6 min-w-6 items-center justify-center rounded-full text-[15px] font-semibold tracking-[-0.01em]",
                    today ? "bg-primary px-1.5 text-on-primary" : i < NOW.day ? "text-muted" : "text-foreground",
                  )}
                >
                  {d.date}
                </span>
                <span className="truncate text-[11px] text-faint">
                  {count ? <>{count}<span className="hidden xl:inline"> {count === 1 ? "interview" : "interviews"}</span></> : "Free"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className="relative grid grid-cols-[52px_repeat(5,minmax(0,1fr))]" style={{ height: px(GRID_END) + 8 }}>
        {/* Hour labels */}
        <div className="relative">
          {HOURS.map((m) => (
            <div key={m} className="tnum absolute right-2 -translate-y-1/2 text-[10.5px] text-faint" style={{ top: px(m) + 4 }}>
              {m === GRID_START ? "" : fmtTime(m)}
            </div>
          ))}
        </div>

        {DAYS.map((d, day) => {
          const busy = BUSY.filter((b) => b.day === day);
          const items: Item[] = schedule.filter((e) => e.day === day).map((e) => ({ kind: "interview" as const, ...e }));
          const placed = layoutDay(items);
          return (
            <div key={d.short} className={cx("relative border-l border-rim", day === NOW.day && "bg-primary-tint/25", day < NOW.day && "bg-inset/40")}>
              {/* Hour and half-hour rules */}
              {HOURS.map((m) => (
                <div key={m} className="absolute inset-x-0 border-t border-[var(--grid-line)]" style={{ top: px(m) + 4 }} />
              ))}
              {HOURS.slice(0, -1).map((m) => (
                <div key={`h${m}`} className="absolute inset-x-0 border-t border-dashed border-[var(--grid-line)] opacity-60" style={{ top: px(m + 30) + 4 }} />
              ))}

              {busy.map((b) => (
                <div
                  key={b.id}
                  style={{
                    top: px(b.start) + 5,
                    height: (b.duration / 60) * HOUR - 2,
                    backgroundImage: "repeating-linear-gradient(135deg, var(--wash) 0 4px, transparent 4px 8px)",
                  }}
                  className="absolute inset-x-[3px] overflow-hidden rounded-[6px] px-1.5 py-0.5 text-[10.5px] leading-tight text-faint shadow-[inset_0_0_0_1px_var(--rim)]"
                  title={`${b.label} · ${b.who.map((w) => interviewerById(w).name).join(", ")}`}
                >
                  <span className="block truncate">{b.label}</span>
                </div>
              ))}

              {placed.map(({ item, lane, lanes }) => {
                const style = {
                  top: px(item.start) + 5,
                  height: (item.duration / 60) * HOUR - 2,
                  left: `calc(${(lane / lanes) * 100}% + 3px)`,
                  width: `calc(${100 / lanes}% - 6px)`,
                };
                const c = people.get(item.candidateId);
                if (!c) return null;
                return (
                  <Block
                    key={item.id}
                    interview={item}
                    candidate={c}
                    style={style}
                    selected={selectedId === item.id}
                    onOpen={() => onOpen(item.id)}
                  />
                );
              })}

              {day === NOW.day && (
                <div className="pointer-events-none absolute inset-x-0 z-10" style={{ top: px(NOW.min) + 4 }} aria-hidden>
                  <div className="absolute -left-[5px] -top-[4.5px] size-[9px] rounded-full bg-destructive ring-2 ring-card" />
                  <div className="h-[1.5px] bg-destructive" />
                </div>
              )}
            </div>
          );
        })}

        {/* Now label in the gutter */}
        <div
          className="tnum pointer-events-none absolute left-0 w-[52px] -translate-y-1/2 pr-1.5 text-right text-[10px] font-semibold text-destructive"
          style={{ top: px(NOW.min) + 4 }}
        >
          <span className="rounded-[4px] bg-card px-0.5">{fmtTime(NOW.min, false)}</span>
        </div>
      </div>
    </div>
  );
}

function Block({
  interview: e, candidate: c, style, selected, onOpen,
}: {
  interview: Interview;
  candidate: Candidate;
  style: React.CSSProperties;
  selected: boolean;
  onOpen: () => void;
}) {
  const color = stageById(c.stage).color;
  const past = isPast(e);
  const live = isLive(e);
  const short = e.duration <= 30;
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        ...style,
        backgroundColor: "var(--card)",
        backgroundImage: `linear-gradient(color-mix(in oklch, ${color} ${past ? 8 : 13}%, transparent), color-mix(in oklch, ${color} ${past ? 8 : 13}%, transparent))`,
        boxShadow: selected
          ? `inset 3px 0 0 ${color}, 0 0 0 1.5px ${color}, 0 4px 12px oklch(0 0 0 / 0.1)`
          : `inset 3px 0 0 ${color}, inset 0 0 0 1px color-mix(in oklch, ${color} 22%, transparent)`,
      }}
      className={cx(
        "group absolute z-[1] flex flex-col overflow-hidden rounded-[6px] py-1 pr-1.5 pl-2.5 text-left transition-[box-shadow,transform,filter] duration-150 ease-settle hover:z-[2] hover:brightness-[0.98] hover:shadow-raised",
        past && "opacity-70",
        e.fresh && "animate-[iv-pop_600ms_var(--enter)_1]",
      )}
      aria-label={`${e.type} with ${c.name}, ${fmtRange(e.start, e.duration)}`}
    >
      {short ? (
        <div className="flex min-w-0 shrink-0 items-center gap-1 text-[11px] leading-tight">
          <span className="truncate font-medium text-foreground">{c.name}</span>
          <span className="tnum hidden shrink-0 text-muted xl:inline">{fmtTime(e.start, false)}</span>
        </div>
      ) : (
        <>
          <div className="tnum flex shrink-0 items-center gap-1 text-[10.5px] leading-[14px]" style={{ color }}>
            {live && <span className="size-1.5 shrink-0 rounded-full bg-destructive" />}
            <span className="min-w-0 flex-1 truncate font-medium">{fmtRange(e.start, e.duration)}</span>
            {e.duration >= 60 && <Faces ids={e.with} size={14} className="hidden shrink-0 lg:flex" />}
          </div>
          <div className="shrink-0 truncate text-[12px] leading-4 font-medium text-foreground">{c.name}</div>
          {e.duration >= 60 && <div className="shrink-0 truncate text-[11px] leading-4 text-muted">{e.type} · {roleById(c.roleId).title}</div>}
        </>
      )}
    </button>
  );
}
