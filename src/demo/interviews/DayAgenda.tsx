import { ChevronRight } from "lucide-react";
import { cx } from "@/components/ui";
import { roleById, stageById, type Candidate } from "@/data/mock";
import { DAYS, fmtRange, fmtTime, isLive, isPast, NOW, type Interview } from "./data";
import { Faces } from "./parts";

/** Phones get one day at a time, as a list, with the days as tabs. */
export function DayAgenda({
  schedule, people, day, onDay, onOpen,
}: {
  schedule: Interview[];
  people: Map<string, Candidate>;
  day: number;
  onDay: (d: number) => void;
  onOpen: (id: string) => void;
}) {
  const items = schedule.filter((e) => e.day === day && people.has(e.candidateId)).sort((a, b) => a.start - b.start);
  const nowIndex = day === NOW.day ? items.findIndex((e) => e.start + e.duration > NOW.min) : -1;
  const nowAt = nowIndex === -1 ? items.length : nowIndex;

  return (
    <div>
      <div role="tablist" aria-label="Day" className="grid grid-cols-5 gap-1 rounded-panel bg-inset p-1 shadow-[inset_0_0_0_1px_var(--rim)]">
        {DAYS.map((d, i) => {
          const n = schedule.filter((e) => e.day === i).length;
          const on = i === day;
          return (
            <button
              key={d.short}
              role="tab"
              aria-selected={on}
              onClick={() => onDay(i)}
              className={cx(
                "flex flex-col items-center rounded-card py-1.5 transition-colors",
                on ? "bg-card shadow-card" : "text-muted",
              )}
            >
              <span className={cx("text-[10.5px] font-medium uppercase tracking-[0.06em]", i === NOW.day ? "text-primary" : "text-faint")}>{d.short}</span>
              <span className="tnum text-[15px] font-semibold leading-tight">{d.date}</span>
              <span className="mt-0.5 flex h-1.5 gap-0.5">
                {Array.from({ length: Math.min(n, 4) }, (_, k) => (
                  <span key={k} className={cx("size-1 rounded-full", on ? "bg-primary" : "bg-rim-strong")} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 overflow-hidden rounded-panel bg-card shadow-card">
        {items.length === 0 && <div className="px-4 py-10 text-center text-[13px] text-muted">No interviews on {DAYS[day].short}.</div>}
        {items.map((e, i) => {
          const c = people.get(e.candidateId)!;
          const color = stageById(c.stage).color;
          return (
            <div key={e.id}>
              {i === nowAt && day === NOW.day && <NowRule />}
              <button
                type="button"
                onClick={() => onOpen(e.id)}
                className={cx(
                  "flex w-full items-stretch gap-3 border-t border-rim px-3.5 py-3 text-left first:border-t-0 hover:bg-[var(--wash)]",
                  isPast(e) && "opacity-60",
                )}
              >
                <div className="tnum w-14 shrink-0 pt-0.5 text-[12px]">
                  <div className="font-medium">{fmtTime(e.start)}</div>
                  <div className="text-faint">{e.duration} min</div>
                </div>
                <span className="w-[3px] shrink-0 rounded-full" style={{ background: color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[13.5px] font-medium">{c.name}</span>
                    {isLive(e) && <span className="shrink-0 rounded-chip bg-destructive/10 px-1 text-[10.5px] font-medium text-destructive">Now</span>}
                  </div>
                  <div className="truncate text-[12px] text-muted">{e.type} · {roleById(c.roleId).title}</div>
                  <div className="mt-1.5 flex items-center gap-2 text-[11.5px] text-faint">
                    <Faces ids={e.with} size={18} />
                    <span className="tnum">{fmtRange(e.start, e.duration)}</span>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 self-center text-faint" />
              </button>
            </div>
          );
        })}
        {nowAt === items.length && day === NOW.day && items.length > 0 && <NowRule />}
      </div>
    </div>
  );
}

function NowRule() {
  return (
    <div className="flex items-center gap-2 px-3.5 py-1" aria-label={`Now, ${fmtTime(NOW.min)}`}>
      <span className="tnum text-[10.5px] font-semibold text-destructive">{fmtTime(NOW.min)}</span>
      <span className="size-1.5 rounded-full bg-destructive" />
      <span className="h-px flex-1 bg-destructive" />
    </div>
  );
}
