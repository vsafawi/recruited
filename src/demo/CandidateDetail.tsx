import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, CalendarClock, Check, ChevronLeft, ChevronRight, CircleAlert, FileText, MapPin,
  MessageSquare, MoveRight, Send, Sparkles, Star, Trophy, UserPlus, Wallet,
} from "lucide-react";
import { Avatar, Button, ButtonLink, Card, cx, Index, Kbd, SectionLabel, Segmented, StatusMark, Tag } from "@/components/ui";
import InterviewLoop, { hasWrittenScorecards } from "./InterviewLoop";
import {
  ACTIVITY, boardById, CANDIDATES, listingById, pastJobsOf, roleById, STAGES, TIER_COLOR, TIER_LABEL,
  type Candidate, type StageId,
} from "@/data/mock";
import { updatePerson, usePerson } from "@/data/store";
import { BoardLogo, Logo } from "@/components/logo";

const FLOW: StageId[] = ["new", "screen", "assess", "interview", "offer", "hired"];
const stageLabel = (s: StageId) => STAGES.find((x) => x.id === s)!.label;

/** The demo's "today", so relative dates read the same for everyone. */
const TODAY = new Date(2026, 9, 15);
function dayLabel(daysAgo: number) {
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  const d = new Date(TODAY);
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Small deterministic hash so made-up detail is stable across renders. */
function seed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

interface Criterion { name: string; detail: string; keys: string[] }

/** What each role screens for. Matches and gaps are checked against the application text only. */
const RUBRIC: Record<string, Criterion[]> = {
  "va-ops": [
    { name: "Music-industry ops", detail: "Has run operations for a label, artist or music agency", keys: ["label", "music", "royalty", "release", "k-pop", "podcast"] },
    { name: "Project tooling", detail: "Works daily in Notion, Asana or similar", keys: ["notion", "asana", "trello", "airtable"] },
    { name: "Artist platforms", detail: "Knows Spotify for Artists, distributors and DSP dashboards", keys: ["spotify for artists", "distrokid"] },
    { name: "Written communication", detail: "Clear async updates for a remote team", keys: ["coordinator", "support", "assistant"] },
    { name: "Reliability across time zones", detail: "Can overlap with US hours", keys: [] },
  ],
  "campaign-mgr": [
    { name: "Release campaigns", detail: "Has planned and run independent release campaigns", keys: ["release", "campaign", "imprint", "label", "distributor"] },
    { name: "Paid social", detail: "Hands-on with Meta and TikTok ads", keys: ["meta ads", "tiktok", "google ads"] },
    { name: "DSP and data", detail: "Pitches to DSPs and reads Chartmetric-type data", keys: ["dsp pitching", "chartmetric", "spotify for artists", "looker"] },
    { name: "Artist relations", detail: "Has worked directly with artists or managers", keys: ["artist", "pr", "press"] },
    { name: "Ownership", detail: "Runs a campaign end to end without hand-holding", keys: ["manager", "ran", "growth"] },
  ],
  playlist: [
    { name: "Curator network", detail: "Already knows playlist curators and blogs", keys: ["curat", "playlist", "blogger", "radio"] },
    { name: "DSP pitching", detail: "Has pitched to Spotify, Apple Music or Amazon editorial", keys: ["dsp pitching", "distributor", "spotify"] },
    { name: "Pitch tooling", detail: "Uses SubmitHub, Groover or similar", keys: ["submithub", "groover", "chartmetric", "airtable"] },
    { name: "Metadata hygiene", detail: "Keeps release metadata and pitch sheets clean", keys: ["metadata", "sync", "airtable"] },
    { name: "Writing", detail: "Writes short, specific pitches", keys: ["writing", "blogger", "music director"] },
  ],
};

function evaluate(c: Candidate) {
  const text = [c.headline, ...c.skills].join(" ").toLowerCase();
  return RUBRIC[c.roleId].map((cr) => {
    const hits = cr.keys.filter((k) => text.includes(k));
    const evidence = [c.headline, ...c.skills].filter((s) => cr.keys.some((k) => s.toLowerCase().includes(k)));
    return { ...cr, met: hits.length > 0, evidence };
  });
}

function scorecard(c: Candidate, interviewer: string) {
  const base = c.score / 25; // 0..4
  return RUBRIC[c.roleId].map((cr, i) => {
    const j = seed(`${c.id}:${interviewer}:${i}`);
    const raw = base + (j - 0.5) * 1.8;
    return { name: cr.name, rating: Math.max(1, Math.min(4, Math.round(raw))) };
  });
}

type Tab = "overview" | "loop" | "scorecard" | "activity" | "notes";
interface Note { id: string; text: string; when: string; author: string }
interface Event { id: string; when: string; text: ReactNode; icon: typeof Check; tone?: string }

export default function CandidateDetail() {
  const { id = "" } = useParams();
  const base = usePerson(id);
  if (!base) return <NotFound id={id} />;
  return <Detail key={base.id} c={base} />;
}

function NotFound({ id }: { id: string }) {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-inset text-muted">
          <CircleAlert className="size-5" />
        </div>
        <h1 className="mt-3 text-[16px] font-semibold">No candidate with that id</h1>
        <p className="mt-1 text-[13px] text-muted">
          There's no one at <span className="font-mono text-[12px]">{id || "this address"}</span>. They may have been removed, or the link is mistyped.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <ButtonLink to="/demo/candidates" variant="ink">All candidates</ButtonLink>
          <ButtonLink to="/demo/pipeline">Pipeline</ButtonLink>
        </div>
      </Card>
    </div>
  );
}

function Detail({ c }: { c: Candidate }) {
  const navigate = useNavigate();
  const l = listingById(c.listingId);
  const b = boardById(l.board);
  const jobs = pastJobsOf(c.id);
  const r = roleById(c.roleId);

  const stage = c.stage;
  const starred = !!c.starred;
  const setStage = (s: StageId) => updatePerson(c.id, { stage: s });
  const setStarred = (f: (s: boolean) => boolean) => updatePerson(c.id, { starred: f(starred) });
  const [tab, setTab] = useState<Tab>(() => (hasWrittenScorecards(c) ? "loop" : "overview"));
  const [moves, setMoves] = useState<Event[]>([]);
  const [notes, setNotes] = useState<Note[]>(() =>
    ACTIVITY.filter((a) => a.kind === "note" && a.candidateId === c.id).map((a) => ({
      id: a.id,
      text: a.text.replace(/^Note on [^:]+:\s*/, "").replace(/^"|"$/g, ""),
      when: "Yesterday",
      author: r.hiringManager,
    })),
  );
  const [draft, setDraft] = useState("");

  const idx = CANDIDATES.findIndex((x) => x.id === c.id);
  const prev = CANDIDATES[(idx - 1 + CANDIDATES.length) % CANDIDATES.length];
  const next = CANDIDATES[(idx + 1) % CANDIDATES.length];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === "j" || e.key === "ArrowRight") navigate(`/demo/candidates/${next.id}`);
      if (e.key === "k" || e.key === "ArrowLeft") navigate(`/demo/candidates/${prev.id}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, next.id, prev.id]);

  const changeStage = (s: StageId) => {
    if (s === stage) return;
    const from = stage;
    setStage(s);
    setMoves((m) => [
      { id: `m${Date.now()}`, when: "Just now", icon: s === "rejected" ? CircleAlert : MoveRight, tone: s === "rejected" ? "var(--stage-rejected)" : undefined, text: <>You moved {c.name.split(" ")[0]} from <b className="font-medium">{stageLabel(from)}</b> to <b className="font-medium">{stageLabel(s)}</b></> },
      ...m,
    ]);
  };

  const addNoteText = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setNotes((n) => [{ id: `n${Date.now()}`, text: t, when: "Just now", author: "You" }, ...n]);
  };
  const addNote = () => {
    if (!draft.trim()) return;
    addNoteText(draft);
    setDraft("");
  };

  const criteria = useMemo(() => evaluate(c), [c]);
  const matches = criteria.filter((x) => x.met);
  const gaps = criteria.filter((x) => !x.met);

  const activity = useMemo<Event[]>(() => {
    const out: Event[] = [];
    const reached = FLOW.indexOf(c.stage === "rejected" ? "screen" : c.stage);
    const span = c.appliedDaysAgo;
    for (let i = reached; i >= 1; i--) {
      const daysAgo = Math.round(span * (1 - i / (reached + 1)));
      out.push({ id: `s${i}`, when: dayLabel(daysAgo), icon: MoveRight, text: <>Moved to <b className="font-medium">{stageLabel(FLOW[i])}</b> by {r.hiringManager}</> });
    }
    if (c.stage === "rejected") out.unshift({ id: "rej", when: dayLabel(Math.max(0, span - 4)), icon: CircleAlert, tone: "var(--stage-rejected)", text: <>Rejected at Screen — below the rubric bar for this role</> });
    if (c.stage === "offer") out.unshift({ id: "off", when: dayLabel(Math.max(0, Math.round(span * 0.1))), icon: Trophy, tone: "var(--stage-offer)", text: <>Offer drafted at {c.ask}</> });
    out.push({ id: "sc", when: dayLabel(span), icon: Sparkles, text: <>Scored {c.score} against the rubric — Tier {c.tier}</> });
    out.push({ id: "ap", when: dayLabel(span), icon: UserPlus, text: <>Applied via {b.name}, variant {l.variant}: “{l.headline}”</> });
    return out;
  }, [c, r, b, l]);

  const timeline: Event[] = [
    ...moves,
    ...notes.filter((n) => n.author === "You").map((n) => ({ id: `t${n.id}`, when: n.when, icon: MessageSquare, text: <>You added a note</> })),
    ...activity,
  ];

  const rejected = stage === "rejected";
  const nextInFlow = FLOW[FLOW.indexOf(stage) + 1] as StageId | undefined;
  const interviewers = [r.hiringManager, "Founder"];
  const hasScorecards = ["interview", "offer", "hired"].includes(stage) || (["assess"].includes(stage) && c.score >= 75);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "loop", label: "Interview loop" },
    { id: "scorecard", label: "Scorecard" },
    { id: "activity", label: "Activity", count: timeline.length },
    { id: "notes", label: "Notes", count: notes.length },
  ];

  const stageMeta = STAGES.find((x) => x.id === stage)!;

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-4 pb-16 md:px-8 md:pt-6">
      {/* Breadcrumb + prev/next */}
      <div className="flex items-center gap-2 text-[12.5px]">
        <Link to="/demo/candidates" className="inline-flex items-center gap-1 text-muted hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Candidates
        </Link>
        <span className="text-faint">/</span>
        <span className="truncate text-muted">{r.title}</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="tnum mr-1.5 hidden font-mono text-[11px] text-faint sm:inline">{String(idx + 1).padStart(2, "0")} / {CANDIDATES.length}</span>
          <span className="mr-1 hidden items-center gap-1 text-[11px] text-faint md:flex"><Kbd>K</Kbd><Kbd>J</Kbd></span>
          <Link to={`/demo/candidates/${prev.id}`} aria-label={`Previous: ${prev.name}`} title={`${prev.name} (K)`} className="flex size-7 items-center justify-center rounded-full text-muted shadow-[inset_0_0_0_1px_var(--rim)] hover:bg-inset hover:text-foreground">
            <ChevronLeft className="size-4" />
          </Link>
          <Link to={`/demo/candidates/${next.id}`} aria-label={`Next: ${next.name}`} title={`${next.name} (J)`} className="flex size-7 items-center justify-center rounded-full text-muted shadow-[inset_0_0_0_1px_var(--rim)] hover:bg-inset hover:text-foreground">
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Avatar initials={c.initials} hue={c.hue} size={52} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[20px] font-semibold tracking-[-0.02em]">{c.name}</h1>
              <button onClick={() => setStarred((s) => !s)} aria-label={starred ? "Unstar" : "Star"} aria-pressed={starred} className={cx("rounded p-0.5", starred ? "text-warning" : "text-faint hover:text-foreground")}>
                <Star className="size-4" fill={starred ? "currentColor" : "none"} />
              </button>
            </div>
            <p className="mt-0.5 text-[13.5px] text-muted">{c.headline}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Tag color={stageMeta.color}><span className="size-1.5 rounded-full" style={{ background: stageMeta.color }} />{stageMeta.label}</Tag>
              <Tag color={TIER_COLOR[c.tier]}>Tier {c.tier}</Tag>
              <Tag color={b.color}><BoardLogo id={l.board} size={13} />{b.name}</Tag>
              <Tag color="var(--muted)"><span className="font-mono text-[11px]">{b.short} · {l.variant}</span></Tag>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-faint" />{c.location}</span>
              <span className="inline-flex items-center gap-1.5"><Wallet className="size-3.5 text-faint" />Asks {c.ask}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5 text-faint" />Applied {dayLabel(c.appliedDaysAgo)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ScoreRing score={c.score} color={TIER_COLOR[c.tier]} />
          <div className="flex flex-col gap-1.5">
            {!rejected && nextInFlow && (
              <Button variant="primary" onClick={() => changeStage(nextInFlow)}>Advance to {stageLabel(nextInFlow)}</Button>
            )}
            {rejected ? (
              <Button onClick={() => changeStage("screen")}>Restore to Screen</Button>
            ) : (
              <Button variant="ghost" style={{ color: "var(--destructive)" }} onClick={() => changeStage("rejected")}>Reject</Button>
            )}
          </div>
        </div>
      </div>

      {/* Stepper */}
      <Stepper stage={stage} onPick={changeStage} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {/* Tabs */}
          <div className="scroll-quiet -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <Segmented options={tabs} value={tab} onChange={setTab} />
          </div>

          <div className="pt-6">
            {tab === "overview" && (
              <div className="flex flex-col gap-8">
                <section className="flex flex-col gap-3">
                  <SectionLabel n={1} title="Screening summary">Drawn only from the application</SectionLabel>
                  <Card className="px-4 py-4 md:px-6 md:py-5">
                    <p className="text-[14px] leading-relaxed">
                      The application says “{c.headline}” and lists {c.skills.join(", ")}.
                      Against the {r.title} rubric that meets {matches.length} of {criteria.length} criteria, which is where the score of {c.score} comes from.
                      They're asking {c.ask}; the listing they answered shows {l.payBand === "Not shown" ? "no pay band" : l.payBand}.
                    </p>
                    <p className="mt-2 text-[12px] text-faint">
                      Nothing here is inferred beyond what {c.name.split(" ")[0]} sent. A gap means the application doesn't mention it, not that they can't do it — ask in the screen.
                    </p>

                    <div className="rule-dashed mt-5 grid gap-5 border-t pt-5 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center gap-2 text-[12.5px] font-medium">
                          <StatusMark state="done" /> Matches <span className="tnum font-mono text-[11px] text-faint">{matches.length}</span>
                        </div>
                        <ul className="mt-2">
                          {matches.map((m) => (
                            <li key={m.name} className="border-b border-rim py-2 last:border-b-0">
                              <div className="text-[13px] font-medium">{m.name}</div>
                              <div className="mt-0.5 text-[12px] text-muted">From the application: {m.evidence.slice(0, 2).map((e) => `“${e}”`).join(", ")}</div>
                            </li>
                          ))}
                          {matches.length === 0 && <li className="py-2 text-[12.5px] text-muted">The application doesn't speak to any rubric criterion directly.</li>}
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-[12.5px] font-medium">
                          <StatusMark state="todo" /> Gaps <span className="tnum font-mono text-[11px] text-faint">{gaps.length}</span>
                        </div>
                        <ul className="mt-2">
                          {gaps.map((g) => (
                            <li key={g.name} className="border-b border-rim py-2 last:border-b-0">
                              <div className="text-[13px] font-medium">{g.name}</div>
                              <div className="mt-0.5 text-[12px] text-muted">Not mentioned. {g.detail}.</div>
                            </li>
                          ))}
                          {gaps.length === 0 && <li className="py-2 text-[12.5px] text-muted">No gaps against this rubric.</li>}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </section>

                <section className="flex flex-col gap-3">
                  <SectionLabel n={2} title={`Tier ${c.tier}`}>{TIER_LABEL[c.tier]}</SectionLabel>
                  <Card className="px-4 py-5 md:px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-1.5 flex-1 rounded-full bg-inset">
                        {[60, 84].map((t) => <span key={t} className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-rim-strong" style={{ left: `${t}%` }} />)}
                        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${c.score}%`, background: TIER_COLOR[c.tier] }} />
                      </div>
                      <span className="tnum font-mono text-[12.5px] font-medium">{c.score}</span>
                    </div>
                    <div className="relative mt-1.5 mr-9 h-4 text-[11px] text-faint"><span className="absolute left-0">C</span><span className="absolute left-[60%] pl-1">B from 60</span><span className="absolute left-[84%] pl-1 whitespace-nowrap">A from 84</span></div>
                  </Card>
                </section>
              </div>
            )}

            {tab === "loop" && (
              <InterviewLoop
                c={c}
                stage={stage}
                onStage={changeStage}
                onTab={(t) => { setTab(t); window.scrollTo({ top: 0 }); }}
                onNote={addNoteText}
              />
            )}

            {tab === "scorecard" && (
              <section className="flex flex-col gap-3">
                <SectionLabel n={1} title="Interview scorecard">1 is no evidence, 4 is strong evidence</SectionLabel>
                <Scorecard c={c} interviewers={interviewers} ready={hasScorecards} />
              </section>
            )}

            {tab === "activity" && (
              <section className="flex flex-col gap-3">
                <SectionLabel n={1} title="Activity">Every move, note and score, newest first</SectionLabel>
                <Card className="px-4 py-4 md:px-5">
                  <ol className="relative flex flex-col">
                    {timeline.map((e, i) => {
                      const Icon = e.icon;
                      return (
                        <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                          {i < timeline.length - 1 && <span className="absolute top-7 bottom-0 left-[12px] w-px bg-rim" />}
                          <span className="relative flex size-[25px] shrink-0 items-center justify-center rounded-full bg-inset shadow-[inset_0_0_0_1px_var(--rim)]" style={{ color: e.tone ?? "var(--muted)" }}>
                            <Icon className="size-3.5" />
                          </span>
                          <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 pt-[3px]">
                            <div className="min-w-0 text-[13px]">{e.text}</div>
                            <div className="shrink-0 font-mono text-[11px] text-faint">{e.when}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </Card>
              </section>
            )}

            {tab === "notes" && (
              <section className="flex flex-col gap-3">
                <SectionLabel n={1} title="Notes">Visible to everyone on the hiring team</SectionLabel>
                <Card className="p-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addNote(); } }}
                    rows={3}
                    placeholder={`What should the team know about ${c.name.split(" ")[0]}?`}
                    className="w-full resize-none bg-transparent px-1 text-[13.5px] outline-none placeholder:text-faint"
                  />
                  <div className="rule-dashed flex items-center justify-between gap-2 border-t pt-2">
                    <span className="hidden items-center gap-1 text-[11.5px] text-faint sm:flex"><Kbd>⌘</Kbd><Kbd>↵</Kbd> to add</span>
                    <Button size="sm" variant="primary" disabled={!draft.trim()} onClick={addNote} className="ml-auto">
                      <Send className="size-3" /> Add note
                    </Button>
                  </div>
                </Card>
                {notes.length === 0 ? (
                  <p className="px-1 text-[13px] text-muted">No notes yet. Notes are visible to everyone on the hiring team.</p>
                ) : (
                  <Card className="px-4 md:px-5">
                    <ul>
                      {notes.map((n) => (
                        <li key={n.id} className="border-b border-rim py-3.5 last:border-b-0">
                          <div className="flex items-center gap-2 text-[12px]">
                            <span className="font-medium">{n.author}</span>
                            <span className="font-mono text-[11px] text-faint">{n.when}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-[13.5px]">{n.text}</p>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
              </section>
            )}
          </div>
        </div>

        {/* Right column */}
        <aside className="flex min-w-0 flex-col gap-3">
          <Card className="p-4">
            <SideTitle n={1}>Next step</SideTitle>
            {c.nextStep && !rejected ? (
              <div className="mt-2.5 flex items-start gap-2 text-[13px]">
                <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-primary" />
                {c.nextStep}
              </div>
            ) : (
              <p className="mt-2.5 text-[13px] text-muted">{rejected ? "None. This candidate is rejected." : "Nothing scheduled."}</p>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between gap-2">
              <SideTitle n={2}>Source</SideTitle>
              {l.status === "winner" && <Tag color="var(--success)">Winning variant</Tag>}
              {l.status === "paused" && <Tag color="var(--muted)">Paused</Tag>}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Tag color={b.color}><BoardLogo id={l.board} size={13} />{b.name}</Tag>
              <Tag color="var(--muted)"><span className="font-mono text-[11px]">{b.short} · {l.variant}</span></Tag>
            </div>
            <p className="mt-2.5 text-[13px] leading-snug">“{l.headline}”</p>
            <dl className="rule-dashed mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t pt-3 text-[12px]">
              <div><dt className="text-faint">Pay band</dt><dd className="font-medium">{l.payBand}</dd></div>
              <div><dt className="text-faint">They ask</dt><dd className="font-medium">{c.ask}</dd></div>
              <div className="col-span-2"><dt className="text-faint">Testing</dt><dd>{l.hypothesis}</dd></div>
              <div><dt className="text-faint">Tier A share</dt><dd className="tnum font-mono font-medium">{l.tierMix.A}%</dd></div>
              <div><dt className="text-faint">Applies</dt><dd className="tnum font-mono font-medium">{l.applies}</dd></div>
            </dl>
            <Link to="/demo" className="mt-3 flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
              Compare variants <ChevronRight className="size-3" />
            </Link>
          </Card>

          <Card className="p-4">
            <SideTitle n={3}>Experience</SideTitle>
            {jobs.length ? (
              <ul className="mt-2.5 space-y-2.5">
                {jobs.map((j) => (
                  <li key={j.company.domain + j.years} className="flex items-center gap-2.5">
                    <Logo name={j.company.name} domain={j.company.domain} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium">{j.title}</div>
                      <div className="truncate text-[12px] text-muted">{j.company.name} · <span className="tnum">{j.years}</span></div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2.5 text-[13px] text-muted">No past employers listed.</p>
            )}
          </Card>

          <Card className="p-4">
            <SideTitle n={4}>Skills</SideTitle>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {c.skills.map((s) => (
                <span key={s} className="rounded-[6px] bg-inset px-1.5 py-0.5 text-[12px] text-muted shadow-[inset_0_0_0_1px_var(--rim)]">{s}</span>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <SideTitle n={5}>Documents</SideTitle>
            <div className="mt-2 flex flex-col">
              {["Application answers", c.roleId === "va-ops" || c.stage === "assess" ? "Trial task brief" : "Resume"].map((d) => (
                <div key={d} className="flex items-center gap-2 border-b border-rim py-1.5 text-[12.5px] text-muted last:border-b-0">
                  <FileText className="size-3.5 text-faint" /> {d}
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SideTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h3 className="flex items-baseline gap-2 text-[13px] font-semibold">
      <Index n={n} />
      {children}
    </h3>
  );
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 24, circ = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(score)); return () => cancelAnimationFrame(t); }, [score]);
  return (
    <div className="relative size-[60px] shrink-0" title={`Rubric score ${score} of 100`}>
      <svg viewBox="0 0 60 60" className="size-full -rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" stroke="var(--inset)" strokeWidth="5" />
        <circle
          cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - shown / 100)}
          style={{ transition: "stroke-dashoffset 700ms var(--enter)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum text-[17px] font-semibold leading-none tracking-[-0.02em]">{score}</span>
        <span className="mt-0.5 text-[9.5px] text-faint">score</span>
      </div>
    </div>
  );
}

function Stepper({ stage, onPick }: { stage: StageId; onPick: (s: StageId) => void }) {
  const rejected = stage === "rejected";
  const cur = FLOW.indexOf(stage);
  return (
    <div className="mt-6">
      <div className="scroll-quiet -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ol className="flex min-w-[560px] items-stretch gap-1">
          {FLOW.map((s, i) => {
            const st = STAGES.find((x) => x.id === s)!;
            const done = !rejected && i < cur;
            const on = !rejected && i === cur;
            return (
              <li key={s} className="flex-1">
                <button
                  onClick={() => onPick(s)}
                  aria-current={on ? "step" : undefined}
                  className={cx(
                    "group flex w-full flex-col gap-1.5 rounded-control px-1 pt-1 pb-1.5 text-left transition-colors hover:bg-[var(--wash)]",
                  )}
                >
                  <span
                    className="h-[3px] w-full rounded-full transition-[background] duration-300"
                    style={{ background: done || on ? st.color : "var(--rim)", opacity: done ? 0.55 : 1 }}
                  />
                  <span className={cx("flex items-center gap-1.5 text-[12px]", on ? "font-medium text-foreground" : done ? "text-muted" : "text-faint group-hover:text-muted")}>
                    {done ? <Check className="size-3 text-success" strokeWidth={2.5} /> : <span className="font-mono text-[10.5px] text-faint">{String(i + 1).padStart(2, "0")}</span>}
                    {st.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      {rejected && (
        <div className="mt-2 flex items-center gap-2 rounded-control px-3 py-2 text-[12.5px]" style={{ background: "color-mix(in oklch, var(--stage-rejected) 9%, transparent)", color: "var(--stage-rejected)" }}>
          <CircleAlert className="size-3.5" /> Rejected. Pick a stage above to bring them back.
        </div>
      )}
    </div>
  );
}

function Scorecard({ c, interviewers, ready }: { c: Candidate; interviewers: string[]; ready: boolean }) {
  const rows = RUBRIC[c.roleId];
  const cards = interviewers.map((who) => scorecard(c, who));
  const avg = (i: number) => cards.reduce((a, card) => a + card[i].rating, 0) / cards.length;
  const overall = rows.reduce((a, _, i) => a + avg(i), 0) / rows.length;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-rim px-4 py-3.5 md:px-5">
        <p className="min-w-0 flex-1 text-[12.5px] text-muted">Each interviewer scores on their own before seeing the other's.</p>
        {ready && (
          <div className="ml-auto text-right">
            <div className="tnum font-mono text-[18px] font-semibold leading-none">{overall.toFixed(1)}</div>
            <div className="text-[11px] text-faint">average of 4</div>
          </div>
        )}
      </div>
      {!ready && (
        <div className="border-b border-rim bg-inset px-5 py-3 text-[12.5px] text-muted">
          No scorecards yet. They open once {c.name.split(" ")[0]} reaches an interview; these are the criteria they'll be scored on.
        </div>
      )}
      <div className="scroll-quiet overflow-x-auto">
        <table className="w-full min-w-[480px] text-[13px]">
          <thead>
            <tr className="h-9 text-left text-[11.5px] text-muted">
              <th className="pl-5 font-medium">Criterion</th>
              {interviewers.map((w) => <th key={w} className="w-[120px] font-medium">{w}</th>)}
              <th className="w-16 pr-5 text-right font-medium">Avg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.name} className="border-t border-rim">
                <td className="py-2.5 pl-5 pr-3">
                  <div className="font-medium">{row.name}</div>
                  <div className="text-[12px] text-muted">{row.detail}</div>
                </td>
                {cards.map((card, j) => (
                  <td key={j}>{ready ? <Pips n={card[i].rating} /> : <span className="text-[12px] text-faint">Not rated</span>}</td>
                ))}
                <td className="tnum pr-5 text-right font-medium">{ready ? avg(i).toFixed(1) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Pips({ n }: { n: number }) {
  const color = n >= 4 ? "var(--success)" : n === 3 ? "var(--stage-screen)" : n === 2 ? "var(--warning)" : "var(--destructive)";
  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`${n} of 4`}>
      <span className="flex gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className="h-3.5 w-1.5 rounded-[2px]" style={{ background: i <= n ? color : "var(--rim)" }} />
        ))}
      </span>
      <span className="tnum text-[12px] text-muted">{n}</span>
    </span>
  );
}
