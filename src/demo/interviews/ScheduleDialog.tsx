import { useMemo, useState } from "react";
import { CalendarCheck, Check, Link2 } from "lucide-react";
import { Avatar, Button, cx, StageChip } from "@/components/ui";
import { roleById, type Candidate } from "@/data/mock";
import {
  DAYS, DEFAULT_DURATION, DEFAULT_TYPE, findSlots, fmtRange, fmtTime, INTERVIEWERS, interviewerForManager,
  NOW, type Interview, type InterviewerId, type InterviewType, type Slot,
} from "./data";
import { CloseButton } from "./parts";

const TYPES: InterviewType[] = ["Screen call", "Trial task review", "Panel", "Offer call"];
const DURATIONS = [30, 45, 60];

export interface Booking { candidateId: string; type: InterviewType; with: InterviewerId[]; duration: number; slot: Slot }

/**
 * Find a time: choose who sits in and for how long, and the open slots are
 * worked out from everyone's calendar this week. Opened for one candidate, or
 * from the header with a picker.
 */
export function ScheduleDialog({
  schedule, options, initial, replacing, onConfirm, onClose,
}: {
  schedule: Interview[];
  /** Candidates the picker offers. */
  options: Candidate[];
  initial: { candidate: Candidate; type?: InterviewType; with?: InterviewerId[]; duration?: number };
  /** When rescheduling, the block being moved: it doesn't count as a clash. */
  replacing?: Interview;
  onConfirm: (b: Booking) => void;
  onClose: () => void;
}) {
  const defaults = (c: Candidate, over?: Partial<typeof initial>) => {
    const type = over?.type ?? DEFAULT_TYPE[c.stage] ?? "Screen call";
    return {
      type,
      who: over?.with ?? [interviewerForManager(roleById(c.roleId).hiringManager)],
      duration: over?.duration ?? DEFAULT_DURATION[type],
    };
  };
  const first = defaults(initial.candidate, initial);
  const [candidateId, setCandidateId] = useState(initial.candidate.id);
  const [type, setType] = useState<InterviewType>(first.type);
  const [who, setWho] = useState<InterviewerId[]>(first.who);
  const [duration, setDuration] = useState(first.duration);
  const [pick, setPick] = useState<Slot | null>(null);

  const candidate = options.find((o) => o.id === candidateId) ?? initial.candidate;
  const pool = options;
  const others = useMemo(() => schedule.filter((e) => e.id !== replacing?.id), [schedule, replacing]);
  const slots = useMemo(() => (who.length ? findSlots(others, who, duration, candidateId) : []), [others, who, duration, candidateId]);
  const byDay = DAYS.map((d, day) => ({ ...d, day, slots: slots.filter((s) => s.day === day) })).filter((d) => d.slots.length);
  const chosen = pick && slots.some((s) => s.day === pick.day && s.start === pick.start) ? pick : slots[0] ?? null;
  const firstName = candidate.name.split(" ")[0];

  const changeCandidate = (id: string) => {
    const c = options.find((o) => o.id === id)!;
    const d = defaults(c);
    setCandidateId(id);
    setType(d.type);
    setWho(d.who);
    setDuration(d.duration);
    setPick(null);
  };
  const toggle = (id: InterviewerId) => {
    setWho((w) => (w.includes(id) ? w.filter((x) => x !== id) : INTERVIEWERS.map((i) => i.id).filter((x) => x === id || w.includes(x))));
    setPick(null);
  };

  return (
    <>
      <div className="flex items-start gap-3 border-b border-rim px-5 pt-5 pb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">{replacing ? "Reschedule" : "Find a time"}</h2>
          <p className="text-[12.5px] text-muted">Open slots are checked against every interviewer's calendar for the rest of this week.</p>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <div className="scroll-quiet flex-1 overflow-y-auto px-5 py-4">
        {/* Candidate */}
        <div className="flex items-center gap-3 rounded-card bg-inset/70 p-2.5 shadow-[inset_0_0_0_1px_var(--rim)]">
          <Avatar initials={candidate.initials} hue={candidate.hue} size={32} />
          <div className="min-w-0 flex-1">
            {pool.length > 1 && !replacing ? (
              <label className="block">
                <span className="sr-only">Candidate</span>
                <select
                  value={candidateId}
                  onChange={(ev) => changeCandidate(ev.target.value)}
                  className="w-full truncate bg-transparent text-[13.5px] font-medium outline-none"
                >
                  {pool.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="truncate text-[13.5px] font-medium">{candidate.name}</div>
            )}
            <div className="truncate text-[12px] text-muted">{roleById(candidate.roleId).title}</div>
          </div>
          <StageChip stage={candidate.stage} />
        </div>

        <Field label="Type">
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <Pill key={t} active={t === type} onClick={() => { setType(t); setDuration(DEFAULT_DURATION[t]); setPick(null); }}>{t}</Pill>
            ))}
          </div>
        </Field>

        <div className="grid gap-x-4 sm:grid-cols-[1fr_auto]">
          <Field label="Interviewers">
            <div className="flex flex-wrap gap-1.5">
              {INTERVIEWERS.map((p) => {
                const on = who.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    aria-pressed={on}
                    className={cx(
                      "inline-flex h-8 items-center gap-1.5 rounded-control pr-2.5 pl-1.5 text-[12.5px] transition-colors",
                      on ? "bg-primary-tint font-medium text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_40%,transparent)]" : "bg-card text-muted shadow-card hover:text-foreground",
                    )}
                  >
                    <Avatar initials={p.initials} hue={p.hue} size={20} />
                    {p.name}
                    {on && <Check className="size-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Duration">
            <div className="inline-flex rounded-control bg-inset p-0.5 shadow-[inset_0_0_0_1px_var(--rim)]">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => { setDuration(d); setPick(null); }}
                  aria-pressed={d === duration}
                  className={cx(
                    "tnum h-7 rounded-[6px] px-2.5 text-[12.5px] transition-colors",
                    d === duration ? "bg-card font-medium text-foreground shadow-card" : "text-muted hover:text-foreground",
                  )}
                >
                  {d}m
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Field label="Suggested times" hint={slots.length ? `${slots.length} open` : undefined}>
          {!who.length ? (
            <Empty>Pick at least one interviewer.</Empty>
          ) : !byDay.length ? (
            <Empty>No time when everyone is free before Friday ends. Drop an interviewer or shorten the call.</Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {byDay.map((d) => (
                <div key={d.day}>
                  <div className="mb-1.5 text-[12px] text-muted">
                    <span className="font-medium text-foreground">{d.day === NOW.day ? "Today" : d.day === NOW.day + 1 ? "Tomorrow" : d.short}</span> · {d.short} {d.date} Oct
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {d.slots.map((s) => {
                      const on = chosen?.day === s.day && chosen.start === s.start;
                      return (
                        <button
                          key={s.start}
                          type="button"
                          onClick={() => setPick(s)}
                          aria-pressed={on}
                          className={cx(
                            "tnum h-9 rounded-control text-[12.5px] font-medium transition-[background,box-shadow,color] duration-150",
                            on
                              ? "bg-primary text-on-primary shadow-[0_0_0_1px_var(--primary)]"
                              : "bg-card text-foreground shadow-card hover:shadow-[0_0_0_1.5px_var(--primary)]",
                          )}
                        >
                          {fmtRange(s.start, duration)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Field>

        <div className="mt-4 flex items-start gap-2.5 rounded-card bg-primary-tint/60 p-3 text-[12.5px] text-muted">
          <Link2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            {firstName} gets a self-booking link with {chosen ? "this time and the other open ones" : "the open times"}, so they can move it without
            emailing you. Whatever they pick lands on this calendar.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-rim bg-canvas/60 px-5 py-3">
        <span className="tnum min-w-0 flex-1 truncate text-[12.5px] text-muted">
          {chosen ? <><span className="font-medium text-foreground">{DAYS[chosen.day].short} {fmtTime(chosen.start)}</span> · {duration} min</> : "No time picked"}
        </span>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          disabled={!chosen}
          onClick={() => chosen && onConfirm({ candidateId, type, with: who, duration, slot: chosen })}
        >
          <CalendarCheck className="size-4" /> {replacing ? "Move it" : "Book it"}
        </Button>
      </div>
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-baseline justify-between text-[12px] font-medium text-muted">
        {label}
        {hint && <span className="tnum font-normal text-faint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "h-7 rounded-control px-2.5 text-[12.5px] transition-colors",
        active ? "bg-foreground font-medium text-background" : "bg-card text-muted shadow-card hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-card bg-inset px-3 py-4 text-center text-[12.5px] text-muted">{children}</div>;
}
