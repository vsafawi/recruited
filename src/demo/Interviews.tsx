import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { CalendarPlus, Check, Clock } from "lucide-react";
import { Avatar, Button, Card, cx, StageChip, TierBadge } from "@/components/ui";
import { roleById, STAGES, type Candidate, type StageId } from "@/data/mock";
import { updatePerson, usePeople } from "@/data/store";
import { PageHeader } from "./Shell";
import {
  DAYS, fmtDuration, fmtTime, INTERVIEWERS, isLive, isPast, NOW, relativeWhen, SCHEDULE,
  WEEKLY_BUDGET_MIN, type Interview,
} from "./interviews/data";
import { DayAgenda } from "./interviews/DayAgenda";
import { KitPanel } from "./interviews/KitPanel";
import { Faces, Layer, SectionTitle } from "./interviews/parts";
import { ScheduleDialog, type Booking } from "./interviews/ScheduleDialog";
import { WeekGrid } from "./interviews/WeekGrid";

const ON_CALENDAR: StageId[] = ["screen", "assess", "interview", "offer"];
const NEEDS_SLOT: StageId[] = ["screen", "assess"];

type Scheduling = { candidateId: string; replacingId?: string; fromHeader?: boolean };

export default function Interviews() {
  const [people] = usePeople();
  const [booked, setBooked] = useState<Interview[]>(SCHEDULE);
  const [openId, setOpenId] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState<Scheduling | null>(null);
  const [day, setDay] = useState(NOW.day);
  const [toast, notify] = useToast();

  const byId = useMemo(() => new Map(people.filter((c) => ON_CALENDAR.includes(c.stage)).map((c) => [c.id, c])), [people]);
  /** Blocks for people who have since left the active stages drop off the calendar. */
  const schedule = useMemo(() => booked.filter((e) => byId.has(e.candidateId)), [booked, byId]);

  const needs = useMemo(
    () =>
      people
        .filter((c) => NEEDS_SLOT.includes(c.stage) && !schedule.some((e) => e.candidateId === c.id))
        .sort((a, b) => b.score - a.score),
    [people, schedule],
  );
  const upNext = useMemo(
    () => schedule.filter((e) => !isPast(e)).sort((a, b) => a.day - b.day || a.start - b.start).slice(0, 5),
    [schedule],
  );

  const open = schedule.find((e) => e.id === openId);
  const openCandidate = open && byId.get(open.candidateId);
  const replacing = scheduling?.replacingId ? schedule.find((e) => e.id === scheduling.replacingId) : undefined;
  const schedCandidate = scheduling && people.find((c) => c.id === scheduling.candidateId);
  const closeKit = useCallback(() => setOpenId(null), []);
  const closeSched = useCallback(() => setScheduling(null), []);

  const confirm = (b: Booking) => {
    const c = people.find((p) => p.id === b.candidateId)!;
    const entry: Interview = {
      id: replacing?.id ?? `n${Date.now()}`,
      candidateId: b.candidateId,
      type: b.type,
      day: b.slot.day,
      start: b.slot.start,
      duration: b.duration,
      with: b.with,
      fresh: true,
    };
    setBooked((all) => (replacing ? all.map((e) => (e.id === replacing.id ? entry : e)) : [...all, entry]));
    updatePerson(c.id, { nextStep: `${b.type} ${DAYS[b.slot.day].short} ${fmtTime(b.slot.start)}` });
    setScheduling(null);
    setDay(b.slot.day);
    const first = c.name.split(" ")[0];
    notify(
      replacing
        ? `Moved ${first}'s ${b.type.toLowerCase()} to ${DAYS[b.slot.day].short} ${fmtTime(b.slot.start)}. ${first} gets the new time by email.`
        : `${b.type} with ${c.name} booked for ${DAYS[b.slot.day].short} ${fmtTime(b.slot.start)}. ${first} gets a self-booking link too.`,
    );
  };

  const total = schedule.length;
  const remaining = schedule.filter((e) => !isPast(e)).length;

  return (
    <MotionConfig reducedMotion="user">
    <div className="pb-12">
      <style>{`@keyframes iv-pop { from { opacity: 0; transform: translateY(4px) scale(0.97); } to { opacity: 1; transform: none; } }`}</style>
      <PageHeader
        title="Interviews"
        subtitle={`Week of 12 October · ${total} interviews, ${remaining} still to come · ${needs.length} waiting for a time`}
        actions={
          <Button
            variant="primary"
            disabled={!needs.length}
            onClick={() => needs[0] && setScheduling({ candidateId: needs[0].id, fromHeader: true })}
          >
            <CalendarPlus className="size-4" /> Schedule interview
          </Button>
        }
      />

      <div className="grid gap-5 px-4 md:px-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0" aria-label="This week">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]">October 2026</h2>
              <span className="tnum text-[12.5px] text-muted">Mon 12 – Fri 16</span>
              <span className="rounded-chip bg-primary-tint px-1.5 py-0.5 text-[11px] font-medium text-primary">This week</span>
            </div>
            <Legend />
          </div>

          <div className="hidden md:block">
            <WeekGrid schedule={schedule} people={byId} onOpen={setOpenId} selectedId={openId ?? undefined} />
          </div>
          <div className="md:hidden">
            <DayAgenda schedule={schedule} people={byId} day={day} onDay={setDay} onOpen={setOpenId} />
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-4 md:grid md:grid-cols-2 lg:flex lg:flex-col" aria-label="Scheduling">
          <UpNext items={upNext} people={byId} onOpen={setOpenId} />
          <NeedsScheduling items={needs} onFind={(c) => setScheduling({ candidateId: c.id })} />
          <Load schedule={schedule} />
        </aside>
      </div>

      <Layer open={!!(open && openCandidate)} onClose={closeKit} label="Interview kit" variant="sheet">
        {open && openCandidate && (
          <KitPanel
            interview={open}
            candidate={openCandidate}
            onClose={closeKit}
            notify={notify}
            onReschedule={() => {
              setOpenId(null);
              setScheduling({ candidateId: open.candidateId, replacingId: open.id });
            }}
          />
        )}
      </Layer>

      <Layer open={!!(scheduling && schedCandidate)} onClose={closeSched} label="Find a time" variant="dialog">
        {scheduling && schedCandidate && (
          <ScheduleDialog
            key={`${scheduling.candidateId}-${scheduling.replacingId ?? ""}`}
            schedule={schedule}
            options={scheduling.fromHeader ? needs : [schedCandidate]}
            initial={
              replacing
                ? { candidate: schedCandidate, type: replacing.type, with: replacing.with, duration: replacing.duration }
                : { candidate: schedCandidate }
            }
            replacing={replacing}
            onConfirm={confirm}
            onClose={closeSched}
          />
        )}
      </Layer>

      {toast}
    </div>
    </MotionConfig>
  );
}

/* ----------------------------------------------------------- sidebar */

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted">
      {STAGES.filter((s) => ON_CALENDAR.includes(s.id)).map((s) => (
        <li key={s.id} className="flex items-center gap-1.5">
          <span className="size-2 rounded-[3px]" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

function UpNext({ items, people, onOpen }: { items: Interview[]; people: Map<string, Candidate>; onOpen: (id: string) => void }) {
  return (
    <Card className="p-4">
      <SectionTitle aside={<span className="tnum text-[11.5px] text-faint">{fmtTime(NOW.min)} Thu</span>}>Up next</SectionTitle>
      {items.length === 0 ? (
        <p className="mt-3 text-[13px] text-muted">Nothing else this week.</p>
      ) : (
        <ul className="mt-2 -mx-2 flex flex-col">
          {items.map((e, i) => {
            const c = people.get(e.candidateId)!;
            const live = isLive(e);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onOpen(e.id)}
                  className="flex w-full items-center gap-2.5 rounded-control px-2 py-2 text-left hover:bg-[var(--wash)]"
                >
                  <Avatar initials={c.initials} hue={c.hue} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-medium">{c.name}</span>
                      {e.fresh && <span className="shrink-0 rounded-chip bg-success/12 px-1 text-[10.5px] font-medium text-success">New</span>}
                    </div>
                    <div className="truncate text-[11.5px] text-muted">{e.type} · {roleById(c.roleId).title}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={cx("tnum text-[11.5px] font-medium", live ? "text-destructive" : i === 0 ? "text-primary" : "text-foreground")}>
                      {live ? "Now" : relativeWhen(e)}
                    </div>
                    <Faces ids={e.with} size={16} className="mt-0.5 justify-end" />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function NeedsScheduling({ items, onFind }: { items: Candidate[]; onFind: (c: Candidate) => void }) {
  return (
    <Card className="p-4">
      <SectionTitle aside={<span className="tnum text-[11.5px] text-faint">{items.length}</span>}>Needs scheduling</SectionTitle>
      {items.length === 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-muted"><Check className="size-4 text-success" /> Everyone in screen and assessment has a time.</p>
      ) : (
        <>
          <p className="mt-1 text-[12px] text-faint">In screen or assessment with no time booked.</p>
          <ul className="mt-2 flex flex-col gap-1">
            <AnimatePresence initial={false}>
              {items.map((c) => (
                <motion.li
                  key={c.id}
                  layout
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
                  className="flex items-center gap-2.5 py-1.5"
                >
                  <Avatar initials={c.initials} hue={c.hue} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-medium">{c.name}</span>
                      <TierBadge tier={c.tier} />
                    </div>
                    <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                      <StageChip stage={c.stage} className="shrink-0 !px-1 !py-0 !text-[10.5px]" />
                      <span className="truncate text-[11.5px] text-faint">{c.nextStep ?? `Applied ${c.appliedDaysAgo}d ago`}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => onFind(c)} className="shrink-0">
                    <Clock className="size-3.5" /> Find a time
                  </Button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </>
      )}
    </Card>
  );
}

function Load({ schedule }: { schedule: Interview[] }) {
  const rows = INTERVIEWERS.map((p) => {
    const mine = schedule.filter((e) => e.with.includes(p.id));
    const done = mine.filter(isPast).reduce((a, e) => a + e.duration, 0);
    const todo = mine.filter((e) => !isPast(e)).reduce((a, e) => a + e.duration, 0);
    return { p, done, todo, count: mine.length };
  });
  const scale = Math.max(WEEKLY_BUDGET_MIN, ...rows.map((r) => r.done + r.todo));
  const budgetAt = (WEEKLY_BUDGET_MIN / scale) * 100;
  const heaviest = rows.reduce((a, b) => (b.done + b.todo > a.done + a.todo ? b : a));
  const left = WEEKLY_BUDGET_MIN - heaviest.done - heaviest.todo;

  return (
    <Card className="p-4 md:col-span-2 lg:col-span-1">
      <SectionTitle aside={<span className="text-[11.5px] text-faint">of {fmtDuration(WEEKLY_BUDGET_MIN)} each</span>}>Interviewer load</SectionTitle>
      <ul className="mt-3 flex flex-col gap-3">
        {rows.map(({ p, done, todo, count }) => {
          const over = done + todo > WEEKLY_BUDGET_MIN;
          return (
            <li key={p.id}>
              <div className="flex items-center gap-2 text-[12.5px]">
                <Avatar initials={p.initials} hue={p.hue} size={20} />
                <span className="flex-1 truncate font-medium">{p.name}</span>
                <span className={cx("tnum", over ? "font-medium text-destructive" : "text-muted")}>{fmtDuration(done + todo)}</span>
                <span className="tnum w-14 text-right text-faint">{count} {count === 1 ? "call" : "calls"}</span>
              </div>
              <div className="relative mt-1.5 h-2 overflow-hidden rounded-full bg-inset shadow-[inset_0_0_0_1px_var(--rim)]">
                <motion.div
                  className="absolute inset-y-0 left-0 flex"
                  initial={{ width: 0 }}
                  animate={{ width: `${((done + todo) / scale) * 100}%` }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="h-full bg-primary" style={{ width: `${(done / Math.max(done + todo, 1)) * 100}%` }} />
                  <span className="h-full flex-1 bg-primary/40" />
                </motion.div>
                <span className="absolute inset-y-0 w-px bg-rim-strong" style={{ left: `${budgetAt}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-faint">
        <span className="flex items-center gap-1"><span className="size-2 rounded-[2px] bg-primary" /> Done</span>
        <span className="flex items-center gap-1"><span className="size-2 rounded-[2px] bg-primary/40" /> Booked</span>
      </div>
      <p className="mt-2 text-[12px] text-muted">
        {left <= 0
          ? `${heaviest.p.name} is over budget by ${fmtDuration(-left)}. Give the next call to someone else.`
          : left <= 60
            ? `${heaviest.p.name} has ${fmtDuration(left)} left this week. Book the next panel without them if you can.`
            : "Everyone has room this week."}
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------ toast */

function useToast() {
  const [msg, setMsg] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<number>(0);
  const push = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setMsg({ id: Date.now(), text });
    timer.current = window.setTimeout(() => setMsg(null), 3600);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const node = (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4 md:pl-60">
      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
            className="flex max-w-[520px] items-start gap-2 rounded-card bg-foreground px-3.5 py-2.5 text-[13px] text-background shadow-overlay"
            role="status"
          >
            <Check className="mt-0.5 size-4 shrink-0 text-success" /> {msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  return [node, push] as const;
}

