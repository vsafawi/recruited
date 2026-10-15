/**
 * Shared demo state. A candidate moved on the board is moved on the table and
 * the profile too, and survives a reload for the rest of the browser session.
 *
 * `usePeople()` has the same shape as `useState<Candidate[]>`, so a screen
 * swaps one for the other. Nothing leaves the browser; the reset link in the
 * rail puts the sample data back.
 */
import { useSyncExternalStore, type SetStateAction } from "react";
import { CANDIDATES, type Candidate, type Listing } from "./mock";

const KEY = "recruited:demo:people:v1";
const ADDED_KEY = "recruited:demo:applicants:v1";

/** Applicants who came in through the careers page this session, newest first. */
function loadAdded(): Candidate[] {
  try {
    const raw = sessionStorage.getItem(ADDED_KEY);
    return raw ? (JSON.parse(raw) as Candidate[]) : [];
  } catch {
    return [];
  }
}

function load(): Candidate[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    const added = loadAdded();
    if (raw) {
      const saved = JSON.parse(raw) as Pick<Candidate, "id" | "stage" | "starred" | "nextStep">[];
      const byId = new Map(saved.map((s) => [s.id, s]));
      return [...added, ...CANDIDATES].map((c) => ({ ...c, ...byId.get(c.id) }));
    }
    if (added.length) return [...added, ...CANDIDATES.map((c) => ({ ...c }))];
  } catch {
    /* Storage refused or corrupt: start from the sample data. */
  }
  return CANDIDATES.map((c) => ({ ...c }));
}

let people = load();
const listeners = new Set<() => void>();

function save() {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify(people.map(({ id, stage, starred, nextStep }) => ({ id, stage, starred, nextStep }))),
    );
  } catch {
    /* Private window or quota: the demo still works, it just forgets on reload. */
  }
}

export function setPeople(next: SetStateAction<Candidate[]>) {
  people = typeof next === "function" ? next(people) : next;
  save();
  listeners.forEach((l) => l());
}

export function updatePerson(id: string, patch: Partial<Candidate>) {
  setPeople((ps) => ps.map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

/**
 * Puts an application from the careers page into the pipeline, in New, with
 * the listing and variant it arrived on. The score is provisional and says so:
 * it only counts what the form contains, because nothing here reads a resume.
 */
export function addApplicant(a: {
  name: string;
  location: string;
  pay: string;
  link: string;
  hasResume: boolean;
  answered: number;
  questions: number;
  listing: Listing;
}): Candidate {
  const parts = a.name.trim().split(/\s+/);
  const filled = [a.hasResume, !!a.link.trim(), !!a.pay.trim(), a.questions > 0 && a.answered === a.questions].filter(Boolean).length;
  const score = 58 + filled * 6;
  const person: Candidate = {
    id: `app-${Date.now().toString(36)}`,
    name: a.name.trim(),
    initials: parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase(),
    roleId: a.listing.roleId,
    listingId: a.listing.id,
    stage: "new",
    tier: score >= 84 ? "A" : score >= 60 ? "B" : "C",
    score,
    location: a.location.trim() || "Not given",
    ask: a.pay.trim() || "Not given",
    appliedDaysAgo: 0,
    headline: "Applied just now through the careers page",
    skills: [],
    hue: (a.name.length * 47) % 360,
    nextStep: "Read the application — the score is provisional, from the form alone",
  };
  try {
    sessionStorage.setItem(ADDED_KEY, JSON.stringify([person, ...loadAdded()]));
  } catch {
    /* Storage refused: the applicant still shows until the page reloads. */
  }
  setPeople((ps) => [person, ...ps]);
  return person;
}

export function resetDemo() {
  try {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(ADDED_KEY);
  } catch { /* nothing to clear */ }
  setPeople(CANDIDATES.map((c) => ({ ...c })));
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const snapshot = () => people;

export function usePeople() {
  return [useSyncExternalStore(subscribe, snapshot, snapshot), setPeople] as const;
}

export function usePerson(id: string | undefined) {
  const [all] = usePeople();
  return all.find((c) => c.id === id);
}
