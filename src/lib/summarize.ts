/**
 * Candidate summaries. In demo mode (the default) the text is pre-written in
 * mock.ts and streamed out locally, so the demo never spends API credits.
 * To use a real model later, set VITE_SUMMARY_MODE=live and serve
 * POST /api/summarize, which should return the same SummaryLine[] shape.
 */
import {
  AI_SUMMARIES, boardById, listingById, roleById, SCORECARDS,
  type Candidate, type SummaryLine,
} from "@/data/mock";

export const SUMMARY_MODE: "demo" | "live" =
  (import.meta.env.VITE_SUMMARY_MODE as string | undefined) === "live" ? "live" : "demo";

/** Built only from the application, for candidates the team hasn't interviewed yet. */
function fromApplication(c: Candidate): SummaryLine[] {
  const l = listingById(c.listingId);
  const first = c.name.split(" ")[0];
  return [
    { kind: "summary", text: `${first} applied for ${roleById(c.roleId).title} through ${boardById(l.board).name}, variant ${l.variant}. The rubric scored the application ${c.score}, Tier ${c.tier}. There are no scorecards yet, so this is drawn only from what ${first} sent.`, source: "Application" },
    { kind: "strength", text: `In their words: “${c.headline}.”`, source: "Application" },
    { kind: "strength", text: `Lists ${c.skills.join(", ")}.`, source: "Application" },
    { kind: "question", text: `Asks ${c.ask}; the listing shows ${l.payBand === "Not shown" ? "no pay band" : l.payBand}. Confirm in the first call.`, source: "Application" },
  ];
}

export function demoSummary(c: Candidate): SummaryLine[] {
  return AI_SUMMARIES[c.id] ?? fromApplication(c);
}

/** What the summary is grounded in, shown under the card. */
export function summarySources(c: Candidate) {
  const n = SCORECARDS.filter((s) => s.candidateId === c.id).length;
  return n ? `${n} scorecard${n > 1 ? "s" : ""} and the application` : "the application";
}

export async function getSummary(c: Candidate): Promise<SummaryLine[]> {
  if (SUMMARY_MODE === "live") {
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ candidateId: c.id, scorecards: SCORECARDS.filter((s) => s.candidateId === c.id) }),
    });
    if (res.ok) return (await res.json()) as SummaryLine[];
  }
  return demoSummary(c);
}
