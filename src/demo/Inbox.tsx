import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, ChevronDown, ChevronLeft, ChevronUp, CornerUpLeft, FileText, Inbox as InboxIcon, Star,
} from "lucide-react";
import { Avatar, Button, ButtonLink, cx, Kbd, StageChip, TierBadge } from "@/components/ui";
import {
  BOARDS, boardById, CANDIDATES, listingById, roleById, STAGES, TIER_COLOR,
  type BoardId, type Candidate, type StageId,
} from "@/data/mock";
import { PageHeader } from "./Shell";

/* ------------------------------------------------------------------------- */
/* Messages. Derived from CANDIDATES and LISTINGS: one application per       */
/* candidate, dated by appliedDaysAgo, plus replies from people past screen. */
/* The text is what each candidate wrote; nothing here is generated.         */
/* ------------------------------------------------------------------------- */

/** The note each candidate attached to their application. */
const COVER: Record<string, string> = {
  c1: "I have spent four years as the operations VA for two independent labels. I keep the release calendar in Notion, run tasks in Asana, and pull weekly numbers from Spotify for Artists for the label heads.\n\nI saw the band on the listing and it matches what I am looking for. I can start within two weeks.",
  c2: "I coordinate release days for a K-pop fan agency: scheduling posts in Hootsuite, tracking deliverables in Asana, and reporting chart movement in Google Sheets. I am used to working US hours from Manila.",
  c3: "I am a general VA with two years in e-commerce support on Shopify. I have not worked in music yet, but I learn tools quickly and I am organised with inboxes and calendars.",
  c4: "I have one year of data entry experience and I am comfortable in Excel. I am looking for a long-term role and I am available full time.",
  c5: "I am a production assistant on two podcasts. I edit in Descript, keep the episode pipeline in Notion, and manage guest bookings in Trello. Music marketing feels like a natural next step.",
  c6: "I work in customer support at a BPO, mostly in Zendesk. I would like to move into a remote VA role with a smaller team.",
  c7: "I was a label coordinator for three years and handled royalty ops: DistroKid payouts, split sheets, and the catalogue in Airtable. I left to work remotely and would like to stay in music.",
  c8: "I ran more than 40 independent release campaigns at a distributor, covering DSP pitching, Meta and TikTok spend, and the creator side. I have worked with artists from 2k to 2M monthly listeners.\n\nThe release-strategy angle in your listing is exactly the work I want to keep doing.",
  c9: "I am the marketing manager at a country imprint in Nashville. I plan campaigns around Chartmetric data, run Meta ads, and own the fan email list.",
  c10: "I am a growth marketer from consumer apps: paid social, Google Ads, and reporting in Looker. I am a lifelong music fan and want to move my funnel work into the industry.",
  c11: "I am a retail marketing associate who runs social media for our store. I am interested in getting into music marketing.",
  c12: "I have been an artist manager's assistant for three years. I coordinate release plans, handle the TikTok side, and keep the team on top of Spotify for Artists data.",
  c13: "I promoted live events for six years before moving into digital. I run Instagram and Meta ads for venues and know how to fill a room on a short timeline.",
  c14: "I do content marketing for a B2B SaaS company: SEO, HubSpot, and long-form. I want to work on something I care about, and that is music.",
  c15: "I am the social media coordinator for a restaurant group. I make content in Canva and manage four Instagram accounts.",
  c16: "I am a PR assistant at a classical label. I build press lists, run the Mailchimp newsletter, and pitch reviews. I would like to move into campaign work.",
  c17: "I curate three playlists that sit next to editorial ones, about 180k followers in total. I pitch and get pitched every week through SubmitHub and Groover, so I know both sides.",
  c18: "I am the music director at my college radio station. I handle the adds every week and do outreach to promoters and labels.",
  c19: "I work as a barista and run a lo-fi playlist on Spotify in my spare time. I would love to do this full time.",
  c20: "I have done DSP pitching at a distributor for two years. I track results in Chartmetric and keep the pitch calendar in Airtable.",
  c21: "I have written a music blog for six years and have a list of curators and writers I talk to regularly.",
  c22: "I am a sync licensing intern, mostly cleaning metadata and preparing submissions. I am interested in the playlist side of distribution.",
  c23: "I am a freelance transcriptionist looking for a steady VA role.",
  c24: "I graduated in marketing this spring. I make content in Canva and run Instagram for a student club.",
};

/** Replies from candidates who are past the first screen. Days ago, minutes into that day. */
const REPLIES: { candidateId: string; days: number; minutes: number; subject: string; body: string }[] = [
  {
    candidateId: "c1", days: 0, minutes: 47, subject: "Re: Offer — Senior Operations VA",
    body: "Hi,\n\nThank you for the offer. I have read through it. Before I sign, can you confirm the start date and that the hours are 9am to 5pm Manila time? Everything else works for me.\n\nMaricel",
  },
  {
    candidateId: "c8", days: 0, minutes: 95, subject: "Re: Offer call",
    body: "Wednesday at 2pm Eastern is good for me.\n\nI would like to talk through the bonus structure, and whether the role includes sign-off on paid campaign budgets.\n\nJasmine",
  },
  {
    candidateId: "c2", days: 0, minutes: 190, subject: "Re: Final interview",
    body: "Thursday at 10:00 works. I will join on the link you sent.\n\nIf it helps, I can walk through the release-day checklist I built for the fan agency.\n\nJomar",
  },
  {
    candidateId: "c18", days: 0, minutes: 320, subject: "Re: Curator outreach exercise",
    body: "I finished the outreach exercise. I wrote the pitches the way I would for college radio adds: short, with the hook first.\n\nLet me know if you want a different format.\n\nAva",
  },
  {
    candidateId: "c3", days: 1, minutes: 260, subject: "Re: Trial task",
    body: "Quick question on the trial task. Should the weekly report pull from the sample Asana board only, or should I include the Google Sheet tab too? I want to hand in the right thing by Friday.\n\nAileen",
  },
  {
    candidateId: "c5", days: 1, minutes: 410, subject: "Re: Trial task — submitted",
    body: "I have shared the Notion page with the release calendar and the two SOPs. I drafted it in Trello first and then moved it over. It took about three hours.\n\nKristine",
  },
  {
    candidateId: "c10", days: 1, minutes: 600, subject: "Re: Case study",
    body: "The case study is in the shared folder. It is from a consumer app rather than music, but the funnel and the paid social mix are close to what you described.\n\nHappy to walk through it.\n\nPriya",
  },
  {
    candidateId: "c16", days: 1, minutes: 720, subject: "Re: A few questions",
    body: "Yes, I am fine with US hours. I am in Brooklyn, so Eastern is easy. My notice period at the label is two weeks.\n\nElena",
  },
  {
    candidateId: "c17", days: 2, minutes: 300, subject: "Re: Interview Friday",
    body: "Friday at 1pm works.\n\nFor context, I already pitch to about half of the curators on the list you shared, so I can tell you which ones still take cold submissions.\n\nNoah",
  },
  {
    candidateId: "c9", days: 2, minutes: 540, subject: "Re: Panel with Head of Campaigns",
    body: "I can do Tuesday or Wednesday afternoon, Central time.\n\nI can bring two campaign recaps from the imprint with the Chartmetric numbers before and after.\n\nDaniel",
  },
  {
    candidateId: "c12", days: 3, minutes: 200, subject: "Re: Campaign brief exercise",
    body: "Thanks for the brief. I will have it back to you by Monday.\n\nOne question: is the release budget in the brief for paid media only, or does it include content production?\n\nSofia",
  },
];

type Kind = "application" | "reply";

interface Message {
  id: string;
  kind: Kind;
  candidateId: string;
  /** Minutes before now. Sorting and grouping both read this. */
  minutesAgo: number;
  subject: string;
  body: string;
}

const num = (id: string) => parseInt(id.replace(/\D/g, ""), 10) || 0;

const MESSAGES: Message[] = [
  ...CANDIDATES.map((c): Message => ({
    id: `app-${c.id}`,
    kind: "application",
    candidateId: c.id,
    // Spread the day's applications across working hours, deterministically.
    // Isabel's arrives 8 minutes ago, matching the activity feed.
    minutesAgo: c.id === "c24" ? 8 : c.appliedDaysAgo * 1440 + 30 + ((num(c.id) * 97) % 600),
    subject: `Application: ${listingById(c.listingId).headline}`,
    body: COVER[c.id] ?? "No cover note attached.",
  })),
  ...REPLIES.map((r): Message => ({
    id: `re-${r.candidateId}`,
    kind: "reply",
    candidateId: r.candidateId,
    minutesAgo: r.days * 1440 + r.minutes,
    subject: r.subject,
    body: r.body,
  })),
].sort((a, b) => a.minutesAgo - b.minutesAgo);

/** The one-line preview: the body without its greeting, on one line. */
const preview = (m: Message) =>
  m.body.split("\n").filter((x) => x.trim() && !/^(hi|hello|dear)\b.{0,20},$/i.test(x.trim())).join(" ");

const dayOf = (m: Message) => Math.floor(m.minutesAgo / 1440);

const GROUPS: { label: string; test: (d: number) => boolean }[] = [
  { label: "Today", test: (d) => d === 0 },
  { label: "Yesterday", test: (d) => d === 1 },
  { label: "Earlier this week", test: (d) => d >= 2 && d <= 6 },
  { label: "Earlier", test: (d) => d >= 7 },
];

function when(m: Message) {
  const mins = m.minutesAgo;
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  const d = dayOf(m);
  return d === 1 ? "Yesterday" : `${d}d`;
}

function whenLong(m: Message) {
  const mins = m.minutesAgo;
  if (mins < 60) return `${mins} minutes ago`;
  if (mins < 1440) { const h = Math.floor(mins / 60); return `${h} ${h === 1 ? "hour" : "hours"} ago`; }
  const d = dayOf(m);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

const FLOW: StageId[] = ["new", "screen", "assess", "interview", "offer", "hired"];
function nextStage(s: StageId): StageId | null {
  const i = FLOW.indexOf(s);
  return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null;
}
const stageLabel = (s: StageId) => STAGES.find((x) => x.id === s)!.label;
const firstName = (c: Candidate) => c.name.split(" ")[0];

/** Messages that arrived today start unread. */
const INITIAL_UNREAD = MESSAGES.filter((m) => dayOf(m) === 0).map((m) => m.id);

/* ------------------------------------------------------------------------- */

export default function Inbox() {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Candidate[]>(() => CANDIDATES.map((c) => ({ ...c })));
  const [boards, setBoards] = useState<BoardId[]>([]);
  const [aOnly, setAOnly] = useState(false);
  const [unread, setUnread] = useState<Set<string>>(() => new Set(INITIAL_UNREAD));
  const [cursor, setCursor] = useState<string | null>(MESSAGES[0]?.id ?? null);
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  const person = (id: string) => people.find((p) => p.id === id)!;

  const notify = (m: string) => {
    setToast(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  const visible = useMemo(
    () =>
      MESSAGES.filter((m) => {
        const c = people.find((p) => p.id === m.candidateId)!;
        if (aOnly && c.tier !== "A") return false;
        if (boards.length && !boards.includes(listingById(c.listingId).board)) return false;
        return true;
      }),
    [people, boards, aOnly],
  );

  const groups = useMemo(
    () => GROUPS.map((g) => ({ label: g.label, items: visible.filter((m) => g.test(dayOf(m))) })).filter((g) => g.items.length),
    [visible],
  );

  // If a filter hides the current message, fall back to the first one that is visible.
  const currentId = cursor && visible.some((m) => m.id === cursor) ? cursor : visible[0]?.id ?? null;
  const current = currentId ? MESSAGES.find((m) => m.id === currentId)! : null;
  const currentPerson = current ? person(current.candidateId) : null;

  const select = (id: string, openSheet: boolean) => {
    setCursor(id);
    setUnread((u) => { if (!u.has(id)) return u; const n = new Set(u); n.delete(id); return n; });
    if (openSheet) setSheet(true);
  };

  const step = (dir: 1 | -1) => {
    if (!visible.length) return;
    const i = currentId ? visible.findIndex((m) => m.id === currentId) : -1;
    const n = Math.min(visible.length - 1, Math.max(0, i + dir));
    const id = visible[n].id;
    select(id, false);
    rowRefs.current.get(id)?.scrollIntoView({ block: "nearest" });
  };

  const advance = (c: Candidate) => {
    const next = nextStage(c.stage);
    if (c.stage === "rejected") {
      setPeople((ps) => ps.map((p) => (p.id === c.id ? { ...p, stage: "screen" } : p)));
      notify(`${c.name} restored to Screen.`);
      return;
    }
    if (!next) { notify(`${c.name} is already at ${stageLabel(c.stage)}.`); return; }
    setPeople((ps) => ps.map((p) => (p.id === c.id ? { ...p, stage: next } : p)));
    notify(`${c.name} moved to ${stageLabel(next)}.`);
  };

  const reject = (c: Candidate) => {
    if (c.stage === "rejected") { notify(`${c.name} is already rejected.`); return; }
    setPeople((ps) => ps.map((p) => (p.id === c.id ? { ...p, stage: "rejected" } : p)));
    notify(`${c.name} rejected. Nothing is sent in the demo.`);
  };

  const star = (c: Candidate) => {
    setPeople((ps) => ps.map((p) => (p.id === c.id ? { ...p, starred: !p.starred } : p)));
    notify(c.starred ? `Star removed from ${firstName(c)}.` : `${firstName(c)} starred.`);
  };

  // Keyboard triage. Ignored while typing, and when a modifier is held.
  const keyState = useRef({ step, advance, reject, star, currentPerson, navigate });
  keyState.current = { step, advance, reject, star, currentPerson, navigate };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      const s = keyState.current;
      const c = s.currentPerson;
      switch (e.key) {
        case "j": e.preventDefault(); s.step(1); break;
        case "k": e.preventDefault(); s.step(-1); break;
        case "e": if (c) { e.preventDefault(); s.advance(c); } break;
        case "x": if (c) { e.preventDefault(); s.reject(c); } break;
        case "s": if (c) { e.preventDefault(); s.star(c); } break;
        case "Enter":
          if (c && !t.closest("button, a")) { e.preventDefault(); s.navigate(`/demo/candidates/${c.id}`); }
          break;
        case "Escape": setSheet(false); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const unreadCount = MESSAGES.filter((m) => unread.has(m.id)).length;
  const replies = MESSAGES.filter((m) => m.kind === "reply").length;
  const filtered = boards.length > 0 || aOnly;

  return (
    <div className="pb-10">
      <PageHeader
        title="Inbox"
        subtitle={`${unreadCount} unread · ${MESSAGES.length - replies} applications and ${replies} replies from ${BOARDS.length} boards`}
        actions={
          unreadCount > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => { setUnread(new Set()); notify("All messages marked read."); }}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 md:px-8">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[11.5px] text-faint">Board</span>
          {BOARDS.map((b) => {
            const on = boards.includes(b.id);
            const n = MESSAGES.filter((m) => listingById(person(m.candidateId).listingId).board === b.id).length;
            return (
              <button
                key={b.id}
                onClick={() => setBoards((xs) => (on ? xs.filter((x) => x !== b.id) : [...xs, b.id]))}
                aria-pressed={on}
                title={b.name}
                className={cx(
                  "flex h-6.5 items-center gap-1.5 rounded-full px-2.5 text-[12px] transition-[background,color,box-shadow] duration-150",
                  on ? "bg-card text-foreground shadow-[0_0_0_1px_var(--rim-strong)]" : "text-muted shadow-[inset_0_0_0_1px_var(--rim)] hover:text-foreground",
                )}
              >
                <span className="size-1.5 rounded-full" style={{ background: b.color }} />
                <span className="max-sm:hidden">{b.name}</span>
                <span className="sm:hidden">{b.short}</span>
                <span className="tnum text-[11px] text-faint">{n}</span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setAOnly((v) => !v)}
          aria-pressed={aOnly}
          className={cx(
            "flex h-6.5 items-center gap-1.5 rounded-full px-2.5 text-[12px] transition-[background,color,box-shadow] duration-150",
            aOnly ? "font-medium" : "text-muted shadow-[inset_0_0_0_1px_var(--rim)] hover:text-foreground",
          )}
          style={
            aOnly
              ? { color: TIER_COLOR.A, background: `color-mix(in oklch, ${TIER_COLOR.A} 13%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${TIER_COLOR.A} 35%, transparent)` }
              : undefined
          }
        >
          <span className="font-mono text-[11px]">A</span> A-tier only
        </button>
        {filtered && (
          <button onClick={() => { setBoards([]); setAOnly(false); }} className="text-[12px] text-muted hover:text-foreground">
            Clear filters
          </button>
        )}
        <div className="ml-auto hidden items-center gap-1.5 text-[11.5px] text-faint lg:flex">
          <Kbd>J</Kbd><Kbd>K</Kbd> move · <Kbd>E</Kbd> advance · <Kbd>X</Kbd> reject · <Kbd>S</Kbd> star · <Kbd>↵</Kbd> profile
        </div>
      </div>

      <div className="mt-4 grid gap-4 px-4 md:px-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Feed */}
        <div className="min-w-0 overflow-clip rounded-panel bg-card shadow-card">
          {groups.map((g) => (
            <section key={g.label} aria-label={g.label}>
              <h2 className="sticky top-12 z-10 flex h-8 items-center justify-between border-b border-rim bg-card/90 px-4 text-[11px] font-medium uppercase tracking-[0.06em] text-faint backdrop-blur md:top-0">
                {g.label}
                <span className="tnum normal-case tracking-normal">{g.items.length}</span>
              </h2>
              {g.items.map((m) => (
                <Row
                  key={m.id}
                  m={m}
                  c={person(m.candidateId)}
                  active={m.id === currentId}
                  unread={unread.has(m.id)}
                  onSelect={() => select(m.id, true)}
                  refFn={(el) => { if (el) rowRefs.current.set(m.id, el); else rowRefs.current.delete(m.id); }}
                />
              ))}
            </section>
          ))}
          {visible.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
              <InboxIcon className="size-5 text-faint" strokeWidth={1.75} />
              <div className="text-[13.5px] font-medium">Nothing matches</div>
              <p className="max-w-xs text-[12.5px] text-muted">No messages from these boards at this tier. Clear the filters to see everything.</p>
              <Button size="sm" onClick={() => { setBoards([]); setAOnly(false); }} className="mt-1">Clear filters</Button>
            </div>
          )}
        </div>

        {/* Reading pane: beside the feed on desktop, a full-screen sheet on mobile. */}
        <aside
          aria-label="Message"
          className={cx(
            "scroll-quiet flex flex-col overflow-y-auto bg-card",
            "max-lg:fixed max-lg:inset-0 max-lg:z-50 max-lg:transition-transform max-lg:duration-300 max-lg:ease-enter",
            sheet ? "max-lg:translate-y-0" : "max-lg:pointer-events-none max-lg:translate-y-full",
            "lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:min-w-0 lg:self-start lg:rounded-panel lg:shadow-card",
          )}
        >
          {current && currentPerson ? (
            <Pane
              key={current.id}
              m={current}
              c={currentPerson}
              index={visible.findIndex((x) => x.id === current.id)}
              total={visible.length}
              onClose={() => setSheet(false)}
              onStep={step}
              onAdvance={() => advance(currentPerson)}
              onReject={() => reject(currentPerson)}
              onStar={() => star(currentPerson)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-10 text-[12.5px] text-faint">Select a message to read it.</div>
          )}
        </aside>
      </div>

      {/* Toast */}
      <div
        aria-live="polite"
        className={cx(
          "pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 transition-[opacity,transform] duration-200 ease-settle md:left-[calc(50%+120px)]",
          // With the sheet open on a phone, the triage buttons sit at the bottom; keep the toast clear of them.
          sheet && "max-lg:top-3 max-lg:bottom-auto",
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        {toast && <div className="max-w-[calc(100vw-32px)] rounded-control bg-foreground px-3.5 py-2 text-[12.5px] text-background shadow-overlay">{toast}</div>}
      </div>
    </div>
  );
}

function BoardBadge({ c }: { c: Candidate }) {
  const l = listingById(c.listingId);
  const b = boardById(l.board);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-[5px] bg-inset px-1.5 py-px font-mono text-[10.5px] text-muted"
      title={`${b.name}, variant ${l.variant}`}
    >
      <span className="size-1.5 rounded-full" style={{ background: b.color }} />
      {b.short} · {l.variant}
    </span>
  );
}

function Row({
  m, c, active, unread, onSelect, refFn,
}: {
  m: Message;
  c: Candidate;
  active: boolean;
  unread: boolean;
  onSelect: () => void;
  refFn: (el: HTMLButtonElement | null) => void;
}) {
  const rejected = c.stage === "rejected";
  const KindIcon = m.kind === "reply" ? CornerUpLeft : FileText;
  return (
    <button
      ref={refFn}
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cx(
        "relative flex w-full scroll-mt-20 items-start gap-2.5 border-b border-rim px-4 py-3 text-left transition-colors duration-100 last:border-0",
        active ? "bg-primary-tint/70" : "hover:bg-[var(--wash)]",
        rejected && "opacity-55",
      )}
    >
      {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
      <Avatar initials={c.initials} hue={c.hue} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cx("truncate text-[13px]", unread ? "font-semibold" : "font-medium")}>{c.name}</span>
          <TierBadge tier={c.tier} className="shrink-0" />
          {c.starred && <Star className="size-3 shrink-0 text-warning" fill="currentColor" aria-label="Starred" />}
          <span className={cx("tnum ml-auto shrink-0 text-[11.5px]", unread ? "font-medium text-foreground" : "text-faint")}>{when(m)}</span>
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12px] text-muted">
          <BoardBadge c={c} />
          <KindIcon className="size-3 shrink-0 text-faint" aria-label={m.kind === "reply" ? "Reply" : "Application"} />
          <span className="truncate">{m.kind === "reply" ? m.subject : roleById(c.roleId).title}</span>
        </div>
        <p className={cx("mt-1 truncate text-[12.5px]", unread ? "text-foreground" : "text-muted")}>
          {rejected ? <span className="text-faint">Rejected · </span> : null}
          {preview(m)}
        </p>
      </div>
      {unread && <span className="absolute top-4 left-1.5 size-1.5 rounded-full bg-primary" aria-label="Unread" />}
    </button>
  );
}

function Pane({
  m, c, index, total, onClose, onStep, onAdvance, onReject, onStar,
}: {
  m: Message;
  c: Candidate;
  index: number;
  total: number;
  onClose: () => void;
  onStep: (d: 1 | -1) => void;
  onAdvance: () => void;
  onReject: () => void;
  onStar: () => void;
}) {
  const l = listingById(c.listingId);
  const b = boardById(l.board);
  const r = roleById(c.roleId);
  const next = nextStage(c.stage);
  const rejected = c.stage === "rejected";

  return (
    <>
      <div className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b border-rim bg-card/90 px-3 backdrop-blur md:px-4">
        <button onClick={onClose} aria-label="Back to inbox" className="-ml-1 rounded-control p-1.5 text-muted hover:bg-[var(--wash)] hover:text-foreground lg:hidden">
          <ChevronLeft className="size-4" />
        </button>
        <StageChip stage={c.stage} />
        <span className="hidden text-[11.5px] text-faint sm:inline">{m.kind === "reply" ? "Reply" : "Application"}</span>
        <div className="ml-auto flex items-center gap-0.5">
          <span className="tnum mr-1.5 text-[11.5px] text-faint">{index + 1} of {total}</span>
          <IconButton label="Previous (K)" onClick={() => onStep(-1)} disabled={index <= 0}><ChevronUp className="size-4" /></IconButton>
          <IconButton label="Next (J)" onClick={() => onStep(1)} disabled={index >= total - 1}><ChevronDown className="size-4" /></IconButton>
          <IconButton label={c.starred ? "Unstar (S)" : "Star (S)"} onClick={onStar} className={c.starred ? "text-warning" : undefined}>
            <Star className="size-4" fill={c.starred ? "currentColor" : "none"} />
          </IconButton>
        </div>
      </div>

      <div className="px-5 pt-5 md:px-6">
        <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.01em]">{m.subject}</h2>
        <div className="mt-3 flex items-center gap-3">
          <Avatar initials={c.initials} hue={c.hue} size={36} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13.5px] font-medium">{c.name}</span>
              <TierBadge tier={c.tier} className="shrink-0" />
              <span className="tnum text-[12px] text-muted">{c.score}</span>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[12px] text-muted">
              <BoardBadge c={c} />
              <span className="truncate">{r.title}</span>
            </div>
          </div>
          <span className="tnum shrink-0 self-start text-[11.5px] text-faint">{whenLong(m)}</span>
        </div>

        <div className="mt-5 text-[13.5px] leading-relaxed whitespace-pre-line">{m.body}</div>

        {m.kind === "application" ? (
          <>
            <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-card bg-rim shadow-[0_0_0_1px_var(--rim)]">
              {[
                { k: "Location", v: c.location },
                { k: "Asking", v: c.ask },
                { k: "Background", v: c.headline },
                { k: "Listing pay band", v: l.payBand },
              ].map(({ k, v }) => (
                <div key={k} className="min-w-0 bg-card px-3 py-2">
                  <dt className="text-[11px] text-faint">{k}</dt>
                  <dd className="truncate text-[12.5px]" title={v}>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.skills.map((s) => (
                <span key={s} className="rounded-chip bg-inset px-2 py-0.5 text-[12px] text-muted shadow-[inset_0_0_0_1px_var(--rim)]">{s}</span>
              ))}
            </div>
          </>
        ) : (
          c.nextStep && !rejected && (
            <div className="mt-5 flex items-center gap-2 rounded-card bg-primary-tint px-3 py-2 text-[12.5px]">
              <span className="text-muted">Next:</span> {c.nextStep}
            </div>
          )
        )}

        <p className="mt-4 text-[11.5px] leading-snug text-faint">
          {m.kind === "application"
            ? `Shown as ${firstName(c)} sent it through ${b.name}, variant ${l.variant}. Tier and score come from your screening rubric.`
            : `Reply from ${firstName(c)}, shown as received. Applied ${c.appliedDaysAgo === 0 ? "today" : `${c.appliedDaysAgo}d ago`} through ${b.name}, variant ${l.variant}.`}
        </p>
      </div>

      <div className="@container mt-auto border-t border-rim px-5 py-4 md:px-6 max-lg:pb-[max(1rem,env(safe-area-inset-bottom))] lg:mt-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.06em] text-faint">Triage</div>
        <div className="mt-2 grid grid-cols-2 gap-2 @xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
          <TriageButton variant="primary" k="E" onClick={onAdvance} disabled={!rejected && !next} className="col-span-2 @xl:col-span-1">
            {rejected ? "Restore to Screen" : next ? `Advance to ${stageLabel(next)}` : stageLabel(c.stage)}
          </TriageButton>
          <TriageButton k="X" onClick={onReject} disabled={rejected} danger>Reject</TriageButton>
          <TriageButton k="S" onClick={onStar}>{c.starred ? "Unstar" : "Star"}</TriageButton>
          <ButtonLink to={`/demo/candidates/${c.id}`} variant="ink" className="col-span-2 justify-between @xl:col-span-1">
            <span className="inline-flex items-center gap-1.5">Open profile <ArrowRight className="size-3.5" /></span>
            <span className="max-sm:hidden"><Kbd>↵</Kbd></span>
          </ButtonLink>
        </div>
        <p className="mt-2.5 text-[11.5px] text-faint">Triage changes this demo session only. Nothing saves and nothing is sent.</p>
      </div>
    </>
  );
}

function IconButton({
  label, onClick, disabled, className, children,
}: { label: string; onClick: () => void; disabled?: boolean; className?: string; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx("rounded-control p-1.5 text-muted hover:bg-[var(--wash)] hover:text-foreground disabled:opacity-35 disabled:hover:bg-transparent", className)}
    >
      {children}
    </button>
  );
}

function TriageButton({
  k, onClick, disabled, danger, variant = "secondary", className, children,
}: {
  k: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      className={cx("min-w-0 justify-between", className)}
      style={danger ? { color: "var(--destructive)" } : undefined}
    >
      <span className="truncate">{children}</span>
      <span className="max-sm:hidden"><Kbd>{k}</Kbd></span>
    </Button>
  );
}
