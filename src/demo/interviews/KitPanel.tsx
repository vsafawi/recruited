import { CalendarClock, ClipboardList, Copy, ExternalLink, Video, Wallet } from "lucide-react";
import { Avatar, Button, ButtonLink, StageChip, TierBadge } from "@/components/ui";
import { roleById, type Candidate } from "@/data/mock";
import {
  agendaFor, fmtDay, fmtDuration, fmtRange, interviewerById, isLive, isPast, joinLink, questionsFor,
  type Interview,
} from "./data";
import { CloseButton, SectionTitle } from "./parts";

/** The interview kit: what you need open in the five minutes before the call. */
export function KitPanel({
  interview: e, candidate: c, onClose, onReschedule, notify,
}: {
  interview: Interview;
  candidate: Candidate;
  onClose: () => void;
  onReschedule: () => void;
  notify: (msg: string) => void;
}) {
  const role = roleById(c.roleId);
  const agenda = agendaFor(e.type, e.duration);
  const questions = questionsFor(c, e.type);
  const link = joinLink(c);
  const past = isPast(e);
  const live = isLive(e);

  const copy = () => {
    try {
      void navigator.clipboard?.writeText(`https://${link}`);
    } catch {
      /* Clipboard refused: the toast still tells you what the link is. */
    }
    notify("Join link copied. It's a sample link, so it won't open a call.");
  };

  return (
    <>
      <div className="flex items-start gap-3 border-b border-rim px-5 pt-5 pb-4">
        <Avatar initials={c.initials} hue={c.hue} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-[16px] font-semibold tracking-[-0.01em]">{c.name}</h2>
            <TierBadge tier={c.tier} />
          </div>
          <div className="truncate text-[12.5px] text-muted">{role.title}</div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <StageChip stage={c.stage} />
            <span className="rounded-chip bg-inset px-1.5 py-0.5 text-[11.5px] font-medium text-muted">{e.type}</span>
            {live && <span className="rounded-chip bg-destructive/10 px-1.5 py-0.5 text-[11.5px] font-medium text-destructive">Happening now</span>}
            {past && <span className="rounded-chip bg-inset px-1.5 py-0.5 text-[11.5px] text-faint">Done</span>}
          </div>
        </div>
        <CloseButton onClick={onClose} />
      </div>

      <div className="scroll-quiet flex-1 overflow-y-auto px-5 py-4">
        <dl className="grid grid-cols-[18px_1fr] gap-x-2.5 gap-y-2.5 text-[13px]">
          <CalendarClock className="mt-0.5 size-4 text-faint" />
          <dd>
            <div className="font-medium">{fmtDay(e.day)}</div>
            <div className="tnum text-muted">{fmtRange(e.start, e.duration)} · {fmtDuration(e.duration)} · Eastern</div>
          </dd>
          <Video className="mt-0.5 size-4 text-faint" />
          <dd className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-mono text-[12px] text-muted">{link}</span>
              <button type="button" onClick={copy} className="shrink-0 rounded-[5px] p-1 text-faint hover:bg-[var(--wash)] hover:text-foreground" aria-label="Copy join link">
                <Copy className="size-3.5" />
              </button>
            </div>
          </dd>
          <Wallet className="mt-0.5 size-4 text-faint" />
          <dd className="text-muted">Asking <span className="font-medium text-foreground">{c.ask}</span> · {c.location}</dd>
        </dl>

        <div className="mt-5">
          <SectionTitle>Interviewers</SectionTitle>
          <ul className="mt-2 flex flex-col gap-1.5">
            {e.with.map((w, i) => {
              const p = interviewerById(w);
              return (
                <li key={w} className="flex items-center gap-2 text-[13px]">
                  <Avatar initials={p.initials} hue={p.hue} size={22} />
                  <span className="font-medium">{p.name}</span>
                  <span className="text-faint">{i === 0 ? "Leads" : "Joins"}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-5">
          <SectionTitle aside={<span className="tnum text-[11.5px] text-faint">{fmtDuration(e.duration)}</span>}>Agenda</SectionTitle>
          <ol className="mt-2 overflow-hidden rounded-card shadow-[inset_0_0_0_1px_var(--rim)]">
            {agenda.map((a, i) => (
              <li key={a.label} className="flex items-center gap-3 border-t border-rim px-3 py-2 text-[13px] first:border-t-0">
                <span className="tnum w-4 text-[11.5px] text-faint">{i + 1}</span>
                <span className="flex-1">{a.label}</span>
                <span className="tnum text-[12px] text-muted">{a.min} min</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-5">
          <SectionTitle aside={<span className="text-[11.5px] text-faint">From the role rubric</span>}>
            Questions
          </SectionTitle>
          <ol className="mt-2 flex flex-col gap-2.5">
            {questions.map((q, i) => (
              <li key={q.criterion} className="flex gap-2.5">
                <span className="tnum mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-inset text-[11px] font-medium text-muted">{i + 1}</span>
                <div className="min-w-0">
                  <div className="text-[13px] leading-snug">{q.text}</div>
                  <div className="mt-0.5 text-[11.5px] text-faint">Scores: {q.criterion}</div>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[12px] text-faint">Each question maps to one rubric criterion, so every interviewer scores the same things.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-rim bg-canvas/60 px-5 py-3">
        <ButtonLink to={`/demo/candidates/${c.id}`} variant="secondary" size="md">
          <ClipboardList className="size-4" /> Open scorecard
        </ButtonLink>
        {!past && (
          <Button variant="ghost" onClick={onReschedule}>Reschedule</Button>
        )}
        {!past && (
          <Button variant="primary" className="ml-auto" onClick={() => notify("This is a demo, so the call doesn't open.")}>
            <ExternalLink className="size-4" /> Join call
          </Button>
        )}
      </div>
    </>
  );
}
