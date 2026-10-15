/**
 * The interview week. Times are fixed so the calendar reads the same for
 * everyone, and they match the next steps written in mock.ts (Jomar Thu 10:00,
 * Jasmine Wed 2pm, Noah Fri 1pm). Days are 0 = Mon 12 Oct to 4 = Fri 16 Oct;
 * times are minutes after midnight.
 */
import type { Candidate } from "@/data/mock";

export type InterviewType = "Screen call" | "Trial task review" | "Panel" | "Offer call";
export type InterviewerId = "ops" | "campaigns" | "founder";

export interface Interviewer { id: InterviewerId; name: string; initials: string; hue: number }

/** The two hiring managers in ROLES, plus the founder who sits on finals. */
export const INTERVIEWERS: Interviewer[] = [
  { id: "ops", name: "Ops lead", initials: "OL", hue: 200 },
  { id: "campaigns", name: "Head of Campaigns", initials: "HC", hue: 300 },
  { id: "founder", name: "Founder", initials: "F", hue: 40 },
];
export const interviewerById = (id: InterviewerId) => INTERVIEWERS.find((i) => i.id === id)!;
export const interviewerForManager = (name: string): InterviewerId =>
  INTERVIEWERS.find((i) => i.name === name)?.id ?? "founder";

export interface Interview {
  id: string;
  candidateId: string;
  type: InterviewType;
  day: number;
  start: number;
  duration: number;
  with: InterviewerId[];
  /** Set on blocks booked in this session, so the grid can mark them. */
  fresh?: boolean;
}

export interface Busy { id: string; label: string; day: number; start: number; duration: number; who: InterviewerId[] }

const h = (hh: number, mm = 0) => hh * 60 + mm;

export const SCHEDULE: Interview[] = [
  { id: "i1", candidateId: "c22", type: "Screen call", day: 0, start: h(11), duration: 30, with: ["campaigns"] },
  { id: "i2", candidateId: "c10", type: "Panel", day: 0, start: h(14), duration: 60, with: ["campaigns", "founder"] },
  { id: "i3", candidateId: "c1", type: "Offer call", day: 1, start: h(10, 30), duration: 30, with: ["ops", "founder"] },
  { id: "i4", candidateId: "c8", type: "Offer call", day: 2, start: h(14), duration: 45, with: ["campaigns", "founder"] },
  { id: "i5", candidateId: "c5", type: "Trial task review", day: 2, start: h(15, 30), duration: 45, with: ["ops"] },
  { id: "i6", candidateId: "c2", type: "Panel", day: 3, start: h(10), duration: 60, with: ["ops", "founder"] },
  { id: "i7", candidateId: "c9", type: "Panel", day: 3, start: h(14), duration: 60, with: ["campaigns", "founder"] },
  { id: "i8", candidateId: "c16", type: "Screen call", day: 3, start: h(16, 30), duration: 30, with: ["campaigns"] },
  { id: "i9", candidateId: "c12", type: "Trial task review", day: 4, start: h(11), duration: 45, with: ["campaigns"] },
  { id: "i10", candidateId: "c17", type: "Panel", day: 4, start: h(13), duration: 60, with: ["campaigns", "ops"] },
];

const ALL: InterviewerId[] = ["ops", "campaigns", "founder"];

/** Time the interviewers are already spoken for. Shown faintly, and avoided when finding a slot. */
export const BUSY: Busy[] = [
  ...[0, 1, 2, 3, 4].map((day) => ({ id: `s${day}`, label: "Standup", day, start: h(9), duration: 30, who: ALL })),
  { id: "b1", label: "Payroll run", day: 1, start: h(14), duration: 90, who: ["ops"] },
  { id: "b2", label: "Label partner call", day: 3, start: h(12), duration: 90, who: ["founder"] },
  { id: "b3", label: "Release check-in", day: 4, start: h(9, 30), duration: 60, who: ["campaigns"] },
  { id: "b4", label: "Focus time", day: 4, start: h(15), duration: 120, who: ["founder"] },
];

export const DAYS = [
  { short: "Mon", date: 12 },
  { short: "Tue", date: 13 },
  { short: "Wed", date: 14 },
  { short: "Thu", date: 15 },
  { short: "Fri", date: 16 },
];

/** The demo's "now": Thursday 15 October, 11:40. */
export const NOW = { day: 3, min: h(11, 40) };

export const GRID_START = h(8);
export const GRID_END = h(18);
const WORK_START = h(9);
const WORK_END = h(17, 30);

/** Hours each interviewer has set aside for interviews this week. */
export const WEEKLY_BUDGET_MIN = 6 * 60;

export const DEFAULT_TYPE: Record<string, InterviewType> = { screen: "Screen call", assess: "Trial task review", interview: "Panel", offer: "Offer call" };
export const DEFAULT_DURATION: Record<InterviewType, number> = { "Screen call": 30, "Trial task review": 45, Panel: 60, "Offer call": 30 };

export const isPast = (e: { day: number; start: number; duration: number }) =>
  e.day < NOW.day || (e.day === NOW.day && e.start + e.duration <= NOW.min);
export const isLive = (e: { day: number; start: number; duration: number }) =>
  e.day === NOW.day && e.start <= NOW.min && e.start + e.duration > NOW.min;

/* ------------------------------------------------------------ formatting */

export function fmtTime(min: number, withPeriod = true) {
  const hh = Math.floor(min / 60);
  const mm = min % 60;
  const h12 = ((hh + 11) % 12) + 1;
  const p = hh < 12 ? "am" : "pm";
  return `${h12}${mm ? `:${String(mm).padStart(2, "0")}` : ""}${withPeriod ? ` ${p}` : ""}`;
}

export function fmtRange(start: number, duration: number) {
  const end = start + duration;
  const samePeriod = start < 720 === end < 720;
  return `${fmtTime(start, !samePeriod)} – ${fmtTime(end)}`;
}

export const fmtDay = (day: number) => `${DAYS[day].short} ${DAYS[day].date} Oct`;

export function fmtDuration(min: number) {
  const hh = Math.floor(min / 60);
  const mm = min % 60;
  return hh ? `${hh}h${mm ? ` ${mm}m` : ""}` : `${mm}m`;
}

export function relativeWhen(e: { day: number; start: number }) {
  if (e.day === NOW.day) {
    const d = e.start - NOW.min;
    if (d > 0 && d < 60) return `in ${d} min`;
    return `Today ${fmtTime(e.start)}`;
  }
  if (e.day === NOW.day + 1) return `Tomorrow ${fmtTime(e.start)}`;
  return `${DAYS[e.day].short} ${fmtTime(e.start)}`;
}

/* ---------------------------------------------------------- slot finding */

const overlaps = (a: { start: number; duration: number }, b: { start: number; duration: number }) =>
  a.start < b.start + b.duration && b.start < a.start + a.duration;

export interface Slot { day: number; start: number }

/**
 * Open times from now to Friday where every chosen interviewer is free, on the
 * half hour, inside 9:00–17:30. At most three a day so the list spreads out.
 */
export function findSlots(schedule: Interview[], who: InterviewerId[], duration: number, candidateId?: string, perDay = 3): Slot[] {
  const out: Slot[] = [];
  const earliest = Math.ceil((NOW.min + 15) / 30) * 30;
  for (let day = NOW.day; day < DAYS.length; day++) {
    let n = 0;
    for (let start = day === NOW.day ? Math.max(earliest, WORK_START) : WORK_START; start + duration <= WORK_END; start += 30) {
      const slot = { start, duration };
      const clash =
        schedule.some((e) => e.day === day && overlaps(e, slot) && (e.candidateId === candidateId || e.with.some((w) => who.includes(w)))) ||
        BUSY.some((b) => b.day === day && overlaps(b, slot) && b.who.some((w) => who.includes(w)));
      if (!clash) {
        out.push({ day, start });
        if (++n >= perDay) break;
      }
    }
  }
  return out;
}

/* -------------------------------------------------------- column layout */

export interface Placed<T> { item: T; lane: number; lanes: number }

/** Side-by-side lanes for blocks that overlap in one day column. */
export function layoutDay<T extends { start: number; duration: number }>(items: T[]): Placed<T>[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.duration - a.duration);
  const out: Placed<T>[] = [];
  let cluster: Placed<T>[] = [];
  let clusterEnd = -1;
  let laneEnds: number[] = [];
  const flush = () => {
    const lanes = laneEnds.length || 1;
    cluster.forEach((p) => (p.lanes = lanes));
    out.push(...cluster);
    cluster = [];
    laneEnds = [];
  };
  for (const item of sorted) {
    if (item.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(0); }
    laneEnds[lane] = item.start + item.duration;
    clusterEnd = Math.max(clusterEnd, item.start + item.duration);
    cluster.push({ item, lane, lanes: 1 });
  }
  flush();
  return out;
}

/* ------------------------------------------------------------- the kit */

export interface Question { criterion: string; text: string }

/** Interview questions, one per rubric criterion (the same criteria the candidate profile scores). */
export const QUESTIONS: Record<string, Question[]> = {
  "va-ops": [
    { criterion: "Music-industry ops", text: "Walk me through the checklist you'd run for a single that drops this Friday." },
    { criterion: "Project tooling", text: "Show me how you'd set that checklist up in Asana or Notion. What's a task, what's a field?" },
    { criterion: "Artist platforms", text: "Which Spotify for Artists jobs have you done yourself, and which have you only watched?" },
    { criterion: "Written communication", text: "Cover art is missing the night before release. Write the two-line update you'd post." },
    { criterion: "Reliability across time zones", text: "Our team works US Eastern hours. How have you handled a 12-hour gap before?" },
  ],
  "campaign-mgr": [
    { criterion: "Release campaigns", text: "Pick a release you ran. What was the budget, and how did you split it?" },
    { criterion: "Paid social", text: "A single is underperforming on day three. What do you look at first, and what do you change?" },
    { criterion: "DSP and data", text: "How do you decide between pitching editorial and putting the money into ads?" },
    { criterion: "Artist relations", text: "Tell me about an artist who disagreed with your plan. How did it end?" },
    { criterion: "Ownership", text: "What does your end-of-campaign report to an artist look like?" },
  ],
  playlist: [
    { criterion: "Curator network", text: "How do you build a curator list for a genre you don't know well?" },
    { criterion: "DSP pitching", text: "Walk me through a pitch that got placed. Why do you think it landed?" },
    { criterion: "Pitch tooling", text: "How do you tell a real curator from a pay-for-play playlist?" },
    { criterion: "Metadata hygiene", text: "What goes on your pitch sheet before a release is sent anywhere?" },
    { criterion: "Writing", text: "Pitch me one of our releases in three sentences, out loud." },
  ],
};

const AGENDA: Record<InterviewType, [string, number][]> = {
  "Screen call": [["Intro and the role in two minutes", 5], ["Background and why this role", 15], ["Logistics: pay ask, hours, start date", 5], ["Their questions", 5]],
  "Trial task review": [["Intro", 5], ["They walk you through the task", 20], ["Your questions on their choices", 15], ["Next steps", 5]],
  Panel: [["Intros around the room", 5], ["Rubric questions", 35], ["Live scenario", 10], ["Their questions", 10]],
  "Offer call": [["Recap of the process", 5], ["The offer: pay, start date, terms", 15], ["Their questions and next steps", 10]],
};

/** The agenda for a type, stretched or squeezed to the booked length in 5-minute steps. */
export function agendaFor(type: InterviewType, duration: number) {
  const base = AGENDA[type];
  const total = base.reduce((a, [, m]) => a + m, 0);
  const items = base.map(([label, m]) => ({ label, min: Math.max(5, Math.round((m * duration) / total / 5) * 5) }));
  const diff = duration - items.reduce((a, i) => a + i.min, 0);
  const longest = items.reduce((best, it, i) => (it.min > items[best].min ? i : best), 0);
  items[longest].min += diff;
  return items;
}

export const questionsFor = (c: Candidate, type: InterviewType) =>
  (QUESTIONS[c.roleId] ?? []).slice(0, type === "Screen call" || type === "Offer call" ? 4 : 5);

export const joinLink = (c: Candidate) => `meet.recruited.tools/mma-${c.name.toLowerCase().replace(/[^a-z]+/g, "-")}`;
