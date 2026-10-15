// /demo/inbox — every board's mail in one feed. Triage with the keyboard: j/k to move,
// e to mark done, a to advance, x to reject, r to reply. Local state only; nothing saves.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Archive, ArrowLeft, ArrowRight, Check, ExternalLink, FileText, Inbox as InboxIcon, Reply, Send, Sparkles, Star, X,
} from "lucide-react";
import { Avatar, Button, ButtonLink, Card, cx, Kbd, StageChip, TierBadge, TierBar } from "@/components/ui";
import {
  BOARDS, boardById, candidateById, CANDIDATES, LISTINGS, listingById, roleById, STAGES, TIER_LABEL,
  type Board, type BoardId, type Candidate, type Listing, type StageId,
} from "@/data/mock";
import { PageHeader } from "./Shell";

/* ------------------------------------------------------------------ items */

type Kind = "application" | "reply" | "assessment" | "notice";
type Group = "Today" | "Yesterday" | "Earlier";

interface Item {
  id: string;
  kind: Kind;
  group: Group;
  time: string;
  unread: boolean;
  listingId: string;
  candidateId?: string;
  subject: string;
  body: string[];
  attachments?: string[];
}

const first = (c: Candidate) => c.name.split(" ")[0];
const fileName = (c: Candidate) => `${c.name.toLowerCase().replace(/\s+/g, "-")}-resume.pdf`;

function application(cid: string, group: Group, time: string, unread = false): Item {
  const c = candidateById(cid)!;
  const l = listingById(c.listingId);
  return {
    id: `app-${cid}`, kind: "application", group, time, unread, candidateId: cid, listingId: l.id,
    subject: `Applied: ${roleById(c.roleId).title}`,
    body: [`${c.headline}. Based in ${c.location}, asking ${c.ask}.`],
    attachments: [fileName(c)],
  };
}

function message(kind: "reply" | "assessment", cid: string, group: Group, time: string, subject: string, body: string[], attachments?: string[], unread = false): Item {
  const c = candidateById(cid)!;
  return { id: `${kind}-${cid}`, kind, group, time, unread, candidateId: cid, listingId: c.listingId, subject, body: [...body, first(c)], attachments };
}

function notice(listingId: string, group: Group, time: string, kind: "applicants" | "expiry" | "views", unread = false): Item {
  const l = listingById(listingId);
  const recent = l.trend.slice(-2).reduce((a, b) => a + b, 0);
  const winner = LISTINGS.find((x) => x.roleId === l.roleId && x.board === l.board && x.id !== l.id && x.status === "winner");
  const n = (v: number) => v.toLocaleString("en-US");
  const content: Record<typeof kind, { subject: string; body: string[] }> = {
    applicants: {
      subject: `Your listing has ${recent} new applicants`,
      body: [
        `"${l.headline}" received ${recent} new applicants in the last two days. It has ${n(l.applies)} in total after ${l.daysLive} days live.`,
        "Review them from your employer dashboard.",
      ],
    },
    expiry: {
      subject: `Your listing expires in ${30 - l.daysLive} days`,
      body: [
        `"${l.headline}" has been live for ${l.daysLive} days and closes in ${30 - l.daysLive}. Renew it to keep it in search results.`,
        ...(winner ? [`In recruited.tools, variant ${winner.variant} of this split test is marked the winner, so you may want to let this one lapse.`] : []),
      ],
    },
    views: {
      subject: `Your listing has ${n(l.views)} views`,
      body: [`"${l.headline}" has ${n(l.views)} views and ${n(l.applies)} applications in ${l.daysLive} days.`],
    },
  };
  return { id: `notice-${listingId}-${kind}`, kind: "notice", group, time, unread, listingId, ...content[kind] };
}

const ITEMS: Item[] = [
  application("c24", "Today", "9:52 am", true),
  message("reply", "c2", "Today", "9:14 am", "Re: Final interview Thursday", [
    "Thursday at 10:00 works for me.",
    "Should I bring anything for the release-day walkthrough, or is it the same Asana board from the first call?",
  ], undefined, true),
  message("reply", "c8", "Today", "8:40 am", "Re: Offer call Wednesday", [
    "Wednesday at 2pm is good. I've read the draft and have one question about the start date, which we can cover on the call.",
  ], undefined, true),
  message("assessment", "c5", "Today", "8:05 am", "Trial task submitted", [
    "Hi, my trial task is attached: the weekly release calendar and the inbox triage notes.",
    "It took about two hours. Happy to walk you through it.",
  ], ["release-calendar.xlsx", "triage-notes.pdf"], true),
  notice("l4", "Today", "7:30 am", "applicants", true),
  message("reply", "c17", "Today", "7:02 am", "Re: Interview Friday 1pm", [
    "Confirmed for Friday at 1pm. I'll share my screen and go through how I pitch to the three playlists I run.",
  ]),
  application("c7", "Yesterday", "6:48 pm", true),
  application("c14", "Yesterday", "4:20 pm"),
  application("c21", "Yesterday", "2:05 pm"),
  message("reply", "c3", "Yesterday", "11:30 am", "Re: trial task", [
    "Quick question on the trial task: should the weekly summary go in a Google Doc or a Sheet?",
    "I'll have it back by Friday either way.",
  ]),
  notice("l1", "Yesterday", "9:00 am", "expiry"),
  application("c20", "Earlier", "Oct 13"),
  message("assessment", "c12", "Earlier", "Oct 13", "Campaign brief submitted", [
    "Attached is my campaign brief for the sample single: a six-week plan with a TikTok-first rollout and a DSP pitching timeline.",
  ], ["campaign-brief.pdf"]),
  message("reply", "c16", "Earlier", "Oct 12", "Available Thursday?", [
    "Thanks for the screening invite. Are you available Thursday afternoon, Eastern time? I'm at a press day on Wednesday.",
  ]),
  notice("l5", "Earlier", "Oct 12", "views"),
];

const GROUPS: Group[] = ["Today", "Yesterday", "Earlier"];
const boardOf = (i: Item) => boardById(listingById(i.listingId).board);

/* ------------------------------------------------------------ triage note */

/** Pull the top of a pay band or an ask out of "$950 / mo", "$55–65k", "$25 / hr". */
function money(s: string) {
  const nums = s.replace(/,/g, "").match(/\d+(\.\d+)?/g);
  if (!nums) return null;
  const v = parseFloat(nums[nums.length - 1]);
  return /k/i.test(s) ? v * 1000 : v;
}

const STAGE_FLOW: StageId[] = ["new", "screen", "assess", "interview", "offer", "hired"];
function nextStage(s: StageId): StageId | null {
  const i = STAGE_FLOW.indexOf(s);
  return i < 0 || i === STAGE_FLOW.length - 1 ? null : STAGE_FLOW[i + 1];
}

function triage(item: Item, c: Candidate, stage: StageId): { facts: string[]; suggestion: string } {
  const l = listingById(c.listingId);
  const facts = [`Scored ${c.score} on the screening rubric, which puts ${first(c)} in Tier ${c.tier}.`];
  const ask = money(c.ask);
  const top = money(l.payBand);
  if (ask != null && top != null) {
    facts.push(
      ask > top
        ? `Asks ${c.ask}, above the top of the listed band (${l.payBand}).`
        : `Asks ${c.ask}, inside the listed band (${l.payBand}).`,
    );
  } else {
    facts.push(`Asks ${c.ask}. This listing doesn't show a pay band, so there's nothing to compare against.`);
  }
  const named = c.skills.filter((s) => l.headline.toLowerCase().includes(s.toLowerCase()));
  if (named.length) facts.push(`Lists ${named.join(", ")}, which the listing title asks for.`);
  if (l.status === "winner") facts.push(`Came in through the winning variant of this split test.`);
  if (l.status === "paused") facts.push(`Came in through a variant that is now paused.`);
  if (c.nextStep && item.kind !== "application") facts.push(`Next step on file: ${c.nextStep}.`);

  let suggestion: string;
  if (item.kind === "assessment") suggestion = "Open the attachment, then advance to Interview if it holds up.";
  else if (item.kind === "reply") suggestion = `Reply to confirm. ${first(c)} is waiting on you.`;
  else if (stage !== "new") suggestion = "Already past New. Nothing to triage here.";
  else if (c.tier === "A") suggestion = "Invite to screen.";
  else if (c.tier === "B") suggestion = "Invite to screen, or compare with the A-tier applicants for this role first.";
  else suggestion = "Send a polite no, unless the pool for this role is thin.";
  return { facts, suggestion };
}

/* -------------------------------------------------------------- templates */

const TEMPLATES = [
  {
    id: "screen", label: "Invite to screen",
    text: (c: Candidate) =>
      `Hi ${first(c)},\n\nThanks for applying for the ${roleById(c.roleId).title} role. We'd like to book a 20-minute screening call. Pick a time that suits you here: [scheduling link]\n\nMusic Market Agency`,
  },
  {
    id: "trial", label: "Send trial task",
    text: (c: Candidate) =>
      `Hi ${first(c)},\n\nThanks for your time so far. The next step is a short trial task, about two hours of work. The brief is attached. Send it back within five days, and tell us if you need longer.\n\nMusic Market Agency`,
  },
  {
    id: "no", label: "Polite no",
    text: (c: Candidate) =>
      `Hi ${first(c)},\n\nThanks for applying for the ${roleById(c.roleId).title} role and for the time you put in. We've decided to go ahead with candidates whose experience is closer to what this role needs right now. We'll keep your details on file for future roles.\n\nMusic Market Agency`,
  },
];

/* ------------------------------------------------------------------- page */

type Filter = "all" | "unread" | "applications" | "replies";
const FILTERS: { id: Filter; label: string; test: (i: Item, unread: boolean) => boolean }[] = [
  { id: "all", label: "All", test: () => true },
  { id: "unread", label: "Unread", test: (_, u) => u },
  { id: "applications", label: "Applications", test: (i) => i.kind === "application" },
  { id: "replies", label: "Replies", test: (i) => i.kind === "reply" || i.kind === "assessment" },
];

interface Snapshot {
  done: Set<string>;
  read: Set<string>;
  stages: Record<string, StageId>;
  starred: Record<string, boolean>;
  selected: string | null;
}

interface Toast { id: number; text: string; undo?: Snapshot }

const initialStages = () => Object.fromEntries(CANDIDATES.map((c) => [c.id, c.stage])) as Record<string, StageId>;
const initialStars = () => Object.fromEntries(CANDIDATES.map((c) => [c.id, !!c.starred])) as Record<string, boolean>;

export default function Inbox() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [read, setRead] = useState<Set<string>>(new Set());
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [stages, setStages] = useState(initialStages);
  const [starred, setStarred] = useState(initialStars);
  const [filter, setFilter] = useState<Filter>("all");
  const [boards, setBoards] = useState<BoardId[]>([]);
  const [selected, setSelected] = useState<string | null>(ITEMS[0].id);
  const [mobileReading, setMobileReading] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const isUnread = (i: Item) => i.unread && !read.has(i.id);

  const inbox = ITEMS.filter((i) => !done.has(i.id));
  const visible = inbox.filter(
    (i) => FILTERS.find((f) => f.id === filter)!.test(i, isUnread(i)) && (!boards.length || boards.includes(boardOf(i).id)),
  );
  const current = visible.find((i) => i.id === selected) ?? visible.find((i) => !leaving.has(i.id)) ?? null;
  const unreadCount = inbox.filter(isUnread).length;

  const snapshot = (): Snapshot => ({ done: new Set(done), read: new Set(read), stages: { ...stages }, starred: { ...starred }, selected });

  function notify(text: string, undo?: Snapshot) {
    window.clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }

  function restore(s: Snapshot) {
    setDone(s.done);
    setRead(s.read);
    setStages(s.stages);
    setStarred(s.starred);
    setSelected(s.selected);
    setLeaving(new Set());
    setToast(null);
  }

  function select(id: string, opts: { open?: boolean } = {}) {
    setSelected(id);
    setRead((r) => (r.has(id) ? r : new Set(r).add(id)));
    setReplyOpen(false);
    setDraft("");
    if (opts.open) {
      setMobileReading(true);
      paneRef.current?.scrollTo({ top: 0 });
    }
  }

  function move(delta: 1 | -1) {
    const list = visible.filter((i) => !leaving.has(i.id));
    if (!list.length) return;
    const idx = current ? list.findIndex((i) => i.id === current.id) : -1;
    const next = list[Math.min(list.length - 1, Math.max(0, idx + delta))];
    select(next.id);
    rowRefs.current[next.id]?.scrollIntoView({ block: "nearest" });
  }

  /** Take an item out of the feed: animate the row away, then mark it done. */
  function retire(item: Item) {
    const list = visible.filter((i) => !leaving.has(i.id));
    const idx = list.findIndex((i) => i.id === item.id);
    const next = list[idx + 1] ?? list[idx - 1];
    setLeaving((l) => new Set(l).add(item.id));
    window.setTimeout(() => {
      setDone((d) => new Set(d).add(item.id));
      setLeaving((l) => {
        const n = new Set(l);
        n.delete(item.id);
        return n;
      });
    }, 220);
    setReplyOpen(false);
    setDraft("");
    if (next) {
      setSelected(next.id);
      setRead((r) => new Set(r).add(next.id));
    } else {
      setSelected(null);
      setMobileReading(false);
    }
  }

  function archive(item: Item) {
    const s = snapshot();
    retire(item);
    notify("Marked done.", s);
  }

  function advance(item: Item) {
    const c = item.candidateId ? candidateById(item.candidateId) : undefined;
    if (!c) return notify("Board notices have no candidate to move. Press e to mark it done.");
    const to = nextStage(stages[c.id]);
    if (!to) return notify(`${c.name} is already at the last stage.`);
    const s = snapshot();
    setStages((st) => ({ ...st, [c.id]: to }));
    retire(item);
    notify(`${c.name} moved to ${STAGES.find((x) => x.id === to)!.label}.`, s);
  }

  function reject(item: Item) {
    const c = item.candidateId ? candidateById(item.candidateId) : undefined;
    if (!c) return notify("Board notices have no candidate to reject. Press e to mark it done.");
    const s = snapshot();
    setStages((st) => ({ ...st, [c.id]: "rejected" }));
    retire(item);
    notify(`${c.name} rejected.`, s);
  }

  function star(item: Item) {
    const c = item.candidateId ? candidateById(item.candidateId) : undefined;
    if (!c) return;
    const on = !starred[c.id];
    setStarred((st) => ({ ...st, [c.id]: on }));
    notify(on ? `Starred ${c.name}.` : `Removed the star from ${c.name}.`);
  }

  function openReply(item: Item) {
    if (!item.candidateId) return notify("Board notices come from a no-reply address.");
    setReplyOpen(true);
    requestAnimationFrame(() => replyRef.current?.focus());
  }

  function send(item: Item) {
    const c = candidateById(item.candidateId!)!;
    const s = snapshot();
    retire(item);
    notify(`Reply sent to ${first(c)}. In the demo nothing leaves this page.`, s);
  }

  // Keyboard triage. The handler reads the latest state through a ref so the listener mounts once.
  const keys = useRef<(e: KeyboardEvent) => void>(() => {});
  keys.current = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.closest("input, textarea, select, [contenteditable='true']") || t.closest("[aria-modal='true']"))) {
      if (e.key === "Escape" && t === replyRef.current) {
        setReplyOpen(false);
        t.blur();
      }
      return;
    }
    if (document.querySelector("[aria-modal='true']")) return;
    const k = e.key;
    if (k === "j" || k === "ArrowDown") return e.preventDefault(), move(1);
    if (k === "k" || k === "ArrowUp") return e.preventDefault(), move(-1);
    if (k === "Escape") return setMobileReading(false);
    if (!current || leaving.has(current.id)) return;
    if (k === "e") return archive(current);
    if (k === "a") return advance(current);
    if (k === "x") return reject(current);
    if (k === "s") return star(current);
    if (k === "r") return e.preventDefault(), openReply(current);
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keys.current(e);
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keydown", h);
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  const boardCounts = useMemo(() => {
    const m: Partial<Record<BoardId, number>> = {};
    for (const i of inbox) m[boardOf(i).id] = (m[boardOf(i).id] ?? 0) + 1;
    return m;
  }, [inbox]);

  const filtered = filter !== "all" || boards.length > 0;

  return (
    <div className="pb-24">
      <PageHeader
        title="Inbox"
        subtitle={
          inbox.length
            ? `${unreadCount} unread · ${inbox.length} from four boards and your candidates, in one feed`
            : "Everything from every board is handled."
        }
      />

      <div className="px-4 md:px-8">
        <Card className="flex flex-col overflow-hidden lg:h-[calc(100dvh-8.5rem)] lg:min-h-[560px]">
          {/* Toolbar */}
          <div className="flex flex-col gap-2 border-b border-rim px-3 py-2.5 xl:flex-row xl:items-center">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <div className="flex shrink-0 rounded-control bg-inset p-0.5" role="tablist" aria-label="Filter">
                {FILTERS.map((f) => {
                  const n = inbox.filter((i) => f.test(i, isUnread(i))).length;
                  return (
                    <button
                      key={f.id}
                      role="tab"
                      aria-selected={filter === f.id}
                      onClick={() => setFilter(f.id)}
                      className={cx(
                        "flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[12.5px] transition-colors",
                        filter === f.id ? "bg-card font-medium text-foreground shadow-card" : "text-muted hover:text-foreground",
                      )}
                    >
                      {f.label}
                      <span className="tnum text-[11px] text-faint">{n}</span>
                    </button>
                  );
                })}
              </div>
              <div className="-mx-1 flex min-w-0 max-w-full gap-1 overflow-x-auto px-1 py-0.5">
                {BOARDS.map((b) => {
                  const on = boards.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      onClick={() => setBoards((bs) => (on ? bs.filter((x) => x !== b.id) : [...bs, b.id]))}
                      aria-pressed={on}
                      className={cx(
                        "flex h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] transition-colors",
                        on ? "bg-card font-medium text-foreground shadow-[0_0_0_1.5px_var(--primary)]" : "text-muted shadow-[0_0_0_1px_var(--rim)] hover:text-foreground",
                      )}
                    >
                      <span className="size-2 rounded-full" style={{ background: b.color }} />
                      {b.name === "Music Business Worldwide" ? "MBW" : b.name}
                      <span className="tnum text-[11px] text-faint">{boardCounts[b.id] ?? 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="ml-auto hidden shrink-0 items-center gap-3 text-[11.5px] text-faint md:flex">
              <Hint k="j" k2="k">move</Hint>
              <Hint k="e">done</Hint>
              <Hint k="a">advance</Hint>
              <Hint k="x">reject</Hint>
              <Hint k="r">reply</Hint>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(330px,390px)_1fr]">
            {/* List */}
            <div className={cx("scroll-quiet min-h-0 overflow-y-auto lg:border-r lg:border-rim", mobileReading && "max-lg:hidden")}>
              {visible.length === 0 ? (
                <Empty filtered={filtered} onClear={() => { setFilter("all"); setBoards([]); }} onReset={() => restore({ done: new Set(), read: new Set(), stages: initialStages(), starred: initialStars(), selected: ITEMS[0].id })} />
              ) : (
                GROUPS.map((g) => {
                  const rows = visible.filter((i) => i.group === g);
                  if (!rows.length) return null;
                  return (
                    <section key={g}>
                      <h2 className="sticky top-0 z-10 bg-card/90 px-4 pt-3 pb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-faint backdrop-blur">
                        {g}
                      </h2>
                      {rows.map((i) => (
                        <Row
                          key={i.id}
                          item={i}
                          unread={isUnread(i)}
                          active={current?.id === i.id}
                          leaving={leaving.has(i.id)}
                          starred={!!(i.candidateId && starred[i.candidateId])}
                          refCb={(el) => { rowRefs.current[i.id] = el; }}
                          onClick={() => select(i.id, { open: true })}
                        />
                      ))}
                    </section>
                  );
                })
              )}
            </div>

            {/* Reading pane */}
            <div ref={paneRef} className={cx("@container scroll-quiet min-h-0 min-w-0 overflow-y-auto bg-background/60", !mobileReading && "max-lg:hidden")}>
              {current ? (
                <Reader
                  key={current.id}
                  item={current}
                  stage={current.candidateId ? stages[current.candidateId] : undefined}
                  starred={!!(current.candidateId && starred[current.candidateId])}
                  replyOpen={replyOpen}
                  draft={draft}
                  setDraft={setDraft}
                  replyRef={replyRef}
                  onBack={() => setMobileReading(false)}
                  onArchive={() => archive(current)}
                  onAdvance={() => advance(current)}
                  onReject={() => reject(current)}
                  onStar={() => star(current)}
                  onReply={() => openReply(current)}
                  onCloseReply={() => setReplyOpen(false)}
                  onSend={() => send(current)}
                />
              ) : (
                <div className="hidden h-full items-center justify-center p-8 text-[13px] text-faint lg:flex">Nothing selected.</div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <ToastView toast={toast} onUndo={() => toast?.undo && restore(toast.undo)} onClose={() => setToast(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------ parts */

function Hint({ k, k2, children }: { k: string; k2?: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1">
      <Kbd>{k}</Kbd>
      {k2 && <Kbd>{k2}</Kbd>}
      {children}
    </span>
  );
}

function BoardBadge({ board, className }: { board: Board; className?: string }) {
  return (
    <span
      className={cx("inline-flex h-4 shrink-0 items-center rounded-[4px] px-1 font-mono text-[9.5px] font-semibold", className)}
      style={{ color: board.color, background: `color-mix(in oklch, ${board.color} 13%, transparent)` }}
      title={board.name}
    >
      {board.short}
    </span>
  );
}

function BoardAvatar({ board, size = 32 }: { board: Board; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-[9px] font-mono font-semibold text-white"
      style={{
        width: size, height: size, fontSize: size * 0.34,
        background: `linear-gradient(140deg, color-mix(in oklch, ${board.color} 80%, white), ${board.color})`,
        boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.25), 0 0 0 1px oklch(0 0 0 / 0.06)",
      }}
    >
      {board.short}
    </span>
  );
}

const KIND_LABEL: Record<Kind, string> = { application: "Application", reply: "Reply", assessment: "Assessment", notice: "Board notice" };

function Row({
  item, unread, active, leaving, starred, refCb, onClick,
}: {
  item: Item; unread: boolean; active: boolean; leaving: boolean; starred: boolean;
  refCb: (el: HTMLButtonElement | null) => void; onClick: () => void;
}) {
  const c = item.candidateId ? candidateById(item.candidateId) : undefined;
  const board = boardOf(item);
  const l = listingById(item.listingId);
  const preview = item.body[0];
  return (
    <div
      className={cx(
        "grid transition-[grid-template-rows,opacity,transform] duration-200 ease-settle",
        leaving ? "grid-rows-[0fr] translate-x-6 opacity-0" : "grid-rows-[1fr]",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <button
          ref={refCb}
          onClick={onClick}
          aria-current={active || undefined}
          className={cx(
            "relative flex w-full gap-3 border-b border-rim/70 px-4 py-3 text-left transition-colors",
            active ? "bg-primary-tint/70" : "hover:bg-[var(--wash)]",
          )}
        >
          {active && <span className="absolute inset-y-0 left-0 w-[3px] bg-primary" />}
          <span className={cx("absolute top-[22px] left-1.5 size-1.5 rounded-full bg-primary transition-opacity", unread ? "opacity-100" : "opacity-0")} aria-hidden />
          <span className="relative mt-0.5">
            {c ? <Avatar initials={c.initials} hue={c.hue} size={32} /> : <BoardAvatar board={board} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className={cx("truncate text-[13.5px]", unread ? "font-semibold text-foreground" : "font-medium text-foreground/85")}>
                {c ? c.name : board.name}
              </span>
              {c && <TierBadge tier={c.tier} />}
              {starred && <Star className="size-3 shrink-0 fill-warning text-warning" aria-label="Starred" />}
              <span className={cx("tnum ml-auto shrink-0 text-[11.5px]", unread ? "font-medium text-foreground" : "text-faint")}>{item.time}</span>
            </span>
            <span className="mt-0.5 flex items-center gap-1.5">
              <BoardBadge board={board} />
              {item.kind !== "notice" && <span className="shrink-0 font-mono text-[10.5px] text-faint">{l.variant}</span>}
              <span className={cx("truncate text-[12.5px]", unread ? "text-foreground" : "text-muted")}>{item.subject}</span>
            </span>
            <span className="mt-0.5 block truncate text-[12px] text-faint">
              <span className="sr-only">{KIND_LABEL[item.kind]}: </span>
              {preview}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

function Reader({
  item, stage, starred, replyOpen, draft, setDraft, replyRef,
  onBack, onArchive, onAdvance, onReject, onStar, onReply, onCloseReply, onSend,
}: {
  item: Item; stage?: StageId; starred: boolean; replyOpen: boolean; draft: string; setDraft: (s: string) => void;
  replyRef: React.RefObject<HTMLTextAreaElement | null>;
  onBack: () => void; onArchive: () => void; onAdvance: () => void; onReject: () => void; onStar: () => void;
  onReply: () => void; onCloseReply: () => void; onSend: () => void;
}) {
  const c = item.candidateId ? candidateById(item.candidateId) : undefined;
  const l = listingById(item.listingId);
  const board = boardById(l.board);
  const next = stage ? nextStage(stage) : null;
  const nextLabel = next ? STAGES.find((s) => s.id === next)!.label : null;

  return (
    <article className="flex min-h-full flex-col">
      {/* Action bar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1.5 border-b border-rim bg-card/90 px-3 py-2 backdrop-blur md:px-5">
        <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden" aria-label="Back to inbox">
          <ArrowLeft className="size-4" /> Inbox
        </Button>
        {c ? (
          <>
            <Button variant="primary" size="sm" onClick={onAdvance} disabled={!next} title="Advance (a)">
              <ArrowRight className="size-3.5" /> {nextLabel ? `Advance to ${nextLabel}` : "Last stage"}
            </Button>
            <Button size="sm" onClick={onReject} title="Reject (x)">
              <X className="size-3.5" /> Reject
            </Button>
            <Button size="sm" onClick={onReply} title="Reply (r)">
              <Reply className="size-3.5" /> Reply
            </Button>
            <Button variant="ghost" size="sm" onClick={onStar} aria-pressed={starred} title="Star (s)">
              <Star className={cx("size-3.5", starred && "fill-warning text-warning")} /> <span className="max-sm:sr-only">{starred ? "Starred" : "Star"}</span>
            </Button>
          </>
        ) : (
          <ButtonLink to="/demo/listings" variant="primary" size="sm">
            <ExternalLink className="size-3.5" /> Open listing
          </ButtonLink>
        )}
        <Button variant="ghost" size="sm" onClick={onArchive} className="ml-auto" title="Mark done (e)">
          <Archive className="size-3.5" /> <span className="max-sm:sr-only">Done</span>
          <span className="hidden md:inline-flex"><Kbd>e</Kbd></span>
        </Button>
      </div>

      <div className="px-4 py-5 md:px-6">
        <div className="flex items-center gap-1.5 text-[11.5px] text-faint">
          <BoardBadge board={board} />
          <span>{KIND_LABEL[item.kind]}</span>
          <span>·</span>
          <span>{item.group === "Earlier" ? item.time : `${item.group}, ${item.time}`}</span>
        </div>
        <h2 className="mt-1.5 text-[19px] font-semibold tracking-[-0.015em] text-balance">{item.subject}</h2>

        <div className="mt-5 grid gap-5 @2xl:grid-cols-[minmax(0,1fr)_260px]">
          {/* Message */}
          <div className="min-w-0">
            <div className="rounded-card bg-card p-4 shadow-card">
              <div className="flex items-center gap-2.5">
                {c ? <Avatar initials={c.initials} hue={c.hue} size={30} /> : <BoardAvatar board={board} size={30} />}
                <div className="min-w-0 text-[12.5px] leading-tight">
                  <div className="truncate font-medium">{c ? c.name : board.name}</div>
                  <div className="truncate text-faint">
                    {c ? `via ${board.name} · variant ${l.variant}` : "Board notification"}
                  </div>
                </div>
              </div>

              {item.kind === "application" && c ? (
                <ApplicationBody c={c} l={l} board={board} />
              ) : (
                <div className="mt-3.5 space-y-2.5 text-[13.5px] leading-relaxed">
                  {item.body.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              )}

              {item.attachments && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.attachments.map((a) => (
                    <span key={a} className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-control bg-inset px-2.5 py-1.5 text-[12px] text-muted shadow-[inset_0_0_0_1px_var(--rim)]">
                      <FileText className="size-3.5 shrink-0" /> <span className="truncate">{a}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {c && replyOpen && (
              <ReplyBox c={c} draft={draft} setDraft={setDraft} replyRef={replyRef} onClose={onCloseReply} onSend={onSend} />
            )}
            {c && !replyOpen && (
              <button
                onClick={onReply}
                className="mt-3 flex w-full items-center gap-2 rounded-card bg-card px-4 py-3 text-left text-[13px] text-faint shadow-card hover:text-muted"
              >
                <Reply className="size-4" /> Reply to {first(c)}
                <span className="ml-auto hidden md:inline-flex"><Kbd>r</Kbd></span>
              </button>
            )}
          </div>

          {/* Side: profile + triage */}
          <div className="flex min-w-0 flex-col gap-4">
            {c && stage ? <Profile c={c} l={l} board={board} stage={stage} /> : <ListingCard l={l} board={board} />}
            {c && stage ? <TriageNote item={item} c={c} stage={stage} /> : <ListingTriage l={l} />}
          </div>
        </div>
      </div>
    </article>
  );
}

function ApplicationBody({ c, l, board }: { c: Candidate; l: Listing; board: Board }) {
  const rows: [string, ReactNode][] = [
    ["Applied to", <>{l.headline} <span className="text-faint">({board.name}, variant {l.variant})</span></>],
    ["Headline", c.headline],
    ["Location", c.location],
    ["Asking", c.ask],
    [
      "Skills",
      <span className="flex flex-wrap gap-1">
        {c.skills.map((s) => (
          <span key={s} className="rounded-chip bg-inset px-1.5 py-0.5 text-[11.5px] text-muted shadow-[inset_0_0_0_1px_var(--rim)]">{s}</span>
        ))}
      </span>,
    ],
  ];
  return (
    <dl className="mt-3.5 grid grid-cols-[84px_minmax(0,1fr)] gap-x-3 gap-y-2 text-[13px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-faint">{k}</dt>
          <dd className="min-w-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Profile({ c, l, board, stage }: { c: Candidate; l: Listing; board: Board; stage: StageId }) {
  return (
    <div className="rounded-card bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/demo/candidates/${c.id}`} className="block truncate text-[13.5px] font-medium hover:underline">{c.name}</Link>
          <div className="truncate text-[12px] text-faint">{roleById(c.roleId).title}</div>
        </div>
        <div className="text-right">
          <div className="tnum text-[22px] leading-none font-semibold tracking-[-0.02em]">{c.score}</div>
          <div className="mt-0.5 text-[10.5px] text-faint">score</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <TierBadge tier={c.tier} />
        <StageChip stage={stage} />
      </div>
      <p className="mt-2 text-[11.5px] leading-snug text-muted">{TIER_LABEL[c.tier]}</p>
      <dl className="mt-3 space-y-1.5 border-t border-rim pt-3 text-[12px]">
        <div className="flex justify-between gap-3"><dt className="text-faint">Ask</dt><dd className="tnum">{c.ask}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-faint">Band</dt><dd className="tnum">{l.payBand}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-faint">Location</dt><dd className="truncate">{c.location}</dd></div>
      </dl>
      <div className="mt-3 border-t border-rim pt-3">
        <div className="text-[11px] text-faint">Source listing</div>
        <div className="mt-1 flex items-start gap-1.5 text-[12px]">
          <BoardBadge board={board} className="mt-0.5" />
          <span className="min-w-0">
            <span className="line-clamp-2">{l.headline}</span>
            <span className="text-faint">Variant {l.variant} · {l.hypothesis.toLowerCase()}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function ListingCard({ l, board }: { l: Listing; board: Board }) {
  return (
    <div className="rounded-card bg-card p-4 shadow-card">
      <div className="flex items-center gap-1.5 text-[11px] text-faint">
        <BoardBadge board={board} /> Variant {l.variant} · {l.status}
      </div>
      <div className="mt-1.5 text-[13px] font-medium leading-snug">{l.headline}</div>
      <div className="text-[12px] text-faint">{roleById(l.roleId).title} · {l.payBand}</div>
      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-rim pt-3 text-[12px]">
        {[["Views", l.views], ["Applies", l.applies], ["Qualified", l.qualified]].map(([k, v]) => (
          <div key={k}>
            <dt className="text-faint">{k}</dt>
            <dd className="tnum font-medium">{v.toLocaleString("en-US")}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11px] text-faint">
          <span>Tier mix</span>
          <span className="tnum">A {l.tierMix.A}% · B {l.tierMix.B}% · C {l.tierMix.C}%</span>
        </div>
        <TierBar mix={l.tierMix} />
      </div>
    </div>
  );
}

function NoteShell({ title, children, footer }: { title: string; children: ReactNode; footer: string }) {
  return (
    <div className="rounded-card bg-primary-tint/60 p-4 shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_18%,transparent)]">
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-primary">
        <Sparkles className="size-3.5" /> {title}
      </div>
      {children}
      <p className="mt-3 border-t border-[color-mix(in_oklch,var(--primary)_15%,transparent)] pt-2 text-[11px] leading-snug text-muted">{footer}</p>
    </div>
  );
}

function TriageNote({ item, c, stage }: { item: Item; c: Candidate; stage: StageId }) {
  const { facts, suggestion } = triage(item, c, stage);
  return (
    <NoteShell
      title="Assistant triage"
      footer={`Drawn only from what ${first(c)} sent and the listing they applied to. Nothing here comes from outside the application.`}
    >
      <ul className="mt-2 space-y-1.5 text-[12.5px] leading-snug">
        {facts.map((f) => (
          <li key={f} className="flex gap-2"><Check className="mt-0.5 size-3 shrink-0 text-primary" /> <span>{f}</span></li>
        ))}
      </ul>
      <div className="mt-2.5 text-[12.5px]"><span className="font-medium">Suggested:</span> {suggestion}</div>
    </NoteShell>
  );
}

function ListingTriage({ l }: { l: Listing }) {
  const aTier = Math.round((l.applies * l.tierMix.A) / 100);
  const siblings = LISTINGS.filter((x) => x.roleId === l.roleId && x.id !== l.id);
  return (
    <NoteShell title="Assistant triage" footer="Drawn only from this listing's numbers in recruited.tools. Nothing here comes from the board's own data.">
      <ul className="mt-2 space-y-1.5 text-[12.5px] leading-snug">
        <li className="flex gap-2"><Check className="mt-0.5 size-3 shrink-0 text-primary" /> <span>About {aTier} of {l.applies} applicants are Tier A, for ${l.spend} spent.</span></li>
        <li className="flex gap-2"><Check className="mt-0.5 size-3 shrink-0 text-primary" /> <span>{siblings.length} other listing{siblings.length === 1 ? "" : "s"} for this role in the split test.</span></li>
      </ul>
      <div className="mt-2.5 text-[12.5px]"><span className="font-medium">Suggested:</span> No action needed here. Mark it done.</div>
    </NoteShell>
  );
}

function ReplyBox({
  c, draft, setDraft, replyRef, onClose, onSend,
}: {
  c: Candidate; draft: string; setDraft: (s: string) => void; replyRef: React.RefObject<HTMLTextAreaElement | null>;
  onClose: () => void; onSend: () => void;
}) {
  const [template, setTemplate] = useState<string | null>(null);
  return (
    <div className="mt-3 rounded-card bg-card shadow-raised">
      <div className="flex items-center gap-2 border-b border-rim px-4 py-2 text-[12px] text-faint">
        <Reply className="size-3.5" /> To {c.name}
        <button onClick={onClose} className="ml-auto rounded p-0.5 hover:text-foreground" aria-label="Close reply"><X className="size-3.5" /></button>
      </div>
      <div className="flex flex-wrap gap-1.5 px-4 pt-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTemplate(t.id); setDraft(t.text(c)); replyRef.current?.focus(); }}
            className={cx(
              "h-7 rounded-full px-2.5 text-[12px] transition-colors",
              template === t.id ? "bg-primary-tint font-medium text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_30%,transparent)]" : "text-muted shadow-[inset_0_0_0_1px_var(--rim)] hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        ref={replyRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) onSend(); }}
        rows={7}
        placeholder={`Write to ${first(c)}, or start from a template.`}
        className="block w-full resize-y bg-transparent px-4 py-3 text-[13.5px] leading-relaxed outline-none placeholder:text-faint"
      />
      <div className="flex flex-wrap items-center gap-2 border-t border-rim px-4 py-2.5">
        <span className="text-[11.5px] text-faint">{template ? "Template. Edit it before you send." : "Esc to close."}</span>
        <Button variant="primary" size="sm" className="ml-auto" disabled={!draft.trim()} onClick={onSend}>
          <Send className="size-3.5" /> Send
        </Button>
      </div>
    </div>
  );
}

function Empty({ filtered, onClear, onReset }: { filtered: boolean; onClear: () => void; onReset: () => void }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-inset text-faint shadow-[inset_0_0_0_1px_var(--rim)]">
        {filtered ? <InboxIcon className="size-5" /> : <Check className="size-5 text-success" />}
      </span>
      <h3 className="mt-3 text-[15px] font-semibold">{filtered ? "Nothing matches" : "Inbox zero"}</h3>
      <p className="mt-1 max-w-[30ch] text-[13px] text-muted">
        {filtered ? "No items left for these filters." : "Every application, reply and board notice is handled."}
      </p>
      <Button size="sm" className="mt-4" onClick={filtered ? onClear : onReset}>
        {filtered ? "Clear filters" : "Restore the sample inbox"}
      </Button>
    </div>
  );
}

function ToastView({ toast, onUndo, onClose }: { toast: Toast | null; onUndo: () => void; onClose: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4 md:pl-60" aria-live="polite">
      <div
        key={toast?.id}
        className={cx(
          "pointer-events-auto flex max-w-full items-center gap-3 rounded-card bg-foreground py-2 pr-2 pl-3.5 text-[13px] text-background shadow-overlay transition-[opacity,transform] duration-200 ease-enter",
          toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <span className="min-w-0">{toast?.text}</span>
        {toast?.undo && (
          <button onClick={onUndo} className="shrink-0 rounded-[6px] px-2 py-1 font-medium text-[color-mix(in_oklch,var(--primary)_55%,white)] hover:bg-white/10">
            Undo
          </button>
        )}
        <button onClick={onClose} className="shrink-0 rounded-[6px] p-1 opacity-60 hover:opacity-100" aria-label="Dismiss"><X className="size-3.5" /></button>
      </div>
    </div>
  );
}
