/**
 * Shared demo state. A candidate moved on the board is moved on the table and
 * the profile too, and survives a reload for the rest of the browser session.
 *
 * `usePeople()` has the same shape as `useState<Candidate[]>`, so a screen
 * swaps one for the other. Nothing leaves the browser; the reset link in the
 * rail puts the sample data back.
 */
import { useSyncExternalStore, type SetStateAction } from "react";
import { CANDIDATES, type Candidate } from "./mock";

const KEY = "recruited:demo:people:v1";

function load(): Candidate[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Pick<Candidate, "id" | "stage" | "starred" | "nextStep">[];
      const byId = new Map(saved.map((s) => [s.id, s]));
      return CANDIDATES.map((c) => ({ ...c, ...byId.get(c.id) }));
    }
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

export function resetDemo() {
  try { sessionStorage.removeItem(KEY); } catch { /* nothing to clear */ }
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
