import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight, BarChart3, CalendarDays, Columns3, CornerDownLeft, FlaskConical, Globe, Inbox, LayoutDashboard, Plus,
  Search, Users, type LucideIcon,
} from "lucide-react";
import { Avatar, cx, Kbd, StageChip, TierBadge } from "@/components/ui";
import { boardById, CANDIDATES, LISTINGS, roleById, ROLES, type Candidate } from "@/data/mock";

const EVENT = "recruited:palette";

/** Opens the palette from anywhere (the rail's search box calls this). */
export function openPalette() {
  window.dispatchEvent(new Event(EVENT));
}

type Group = "Recent" | "Suggested" | "Actions" | "Candidates" | "Listings" | "Roles" | "Pages";

interface Item {
  id: string;
  group: Exclude<Group, "Recent" | "Suggested">;
  label: string;
  /** Extra text the query matches against, weighted lower than the label. */
  keywords: string;
  to: string;
  icon?: LucideIcon;
  candidate?: Candidate;
  meta?: ReactNode;
}

const PAGES: [string, string, LucideIcon][] = [
  ["Overview", "/demo", LayoutDashboard],
  ["Inbox", "/demo/inbox", Inbox],
  ["Pipeline", "/demo/pipeline", Columns3],
  ["Candidates", "/demo/candidates", Users],
  ["Listings & split tests", "/demo/listings", FlaskConical],
  ["Interviews", "/demo/interviews", CalendarDays],
  ["New role", "/demo/roles/new", Plus],
  ["Public careers page", "/jobs", Globe],
];

const ITEMS: Item[] = [
  { id: "a-post", group: "Actions", label: "Post a new role", keywords: "create add job wizard", to: "/demo/roles/new", icon: Plus },
  { id: "a-compare", group: "Actions", label: "Compare split tests", keywords: "variants a/b listings winner", to: "/demo/listings", icon: FlaskConical },
  ...CANDIDATES.map<Item>((c) => ({
    id: c.id, group: "Candidates", label: c.name, to: `/demo/candidates/${c.id}`, candidate: c,
    keywords: `${roleById(c.roleId).title} ${c.stage} tier ${c.tier} ${c.location} ${c.skills.join(" ")}`,
  })),
  ...LISTINGS.map<Item>((l) => {
    const b = boardById(l.board);
    return {
      id: l.id, group: "Listings", label: l.headline, to: "/demo/listings", icon: FlaskConical,
      keywords: `${b.name} ${b.short} variant ${l.variant} ${l.payBand} ${l.status} ${roleById(l.roleId).title}`,
      meta: <span className="font-mono text-[11px] text-faint">{b.short} · {l.variant}</span>,
    };
  }),
  ...ROLES.map<Item>((r) => ({
    id: r.id, group: "Roles", label: r.title, to: `/demo/pipeline?role=${r.id}`, icon: BarChart3,
    keywords: `${r.team} ${r.location} pipeline`,
    meta: <span className="text-[11.5px] text-faint">{r.team}</span>,
  })),
  ...PAGES.map<Item>(([label, to, icon]) => ({
    id: `p-${to}`, group: "Pages", label, to, icon, keywords: to.replace(/\//g, " "),
    meta: <span className="font-mono text-[11px] text-faint">{to}</span>,
  })),
];

const ORDER: Item["group"][] = ["Actions", "Candidates", "Listings", "Roles", "Pages"];
const SUGGESTED = ["c7", "c8", "a-compare", "a-post", "p-/demo/pipeline", "p-/demo/inbox"];

/** Fuzzy score: every query char must appear in order. Rewards word starts, runs and early hits. 0 = no match. */
function fuzzy(q: string, text: string): number {
  const t = text.toLowerCase();
  const sub = t.indexOf(q);
  if (sub >= 0) return 100 + (sub === 0 || t[sub - 1] === " " ? 50 : 0) - Math.min(sub, 30);
  let score = 0, run = 0, ti = 0;
  for (const ch of q) {
    const at = t.indexOf(ch, ti);
    if (at < 0) return 0;
    run = at === ti ? run + 1 : 0;
    score += 1 + run * 2 + (at === 0 || t[at - 1] === " " ? 4 : 0);
    ti = at + 1;
  }
  return score;
}

function score(q: string, item: Item) {
  return q.split(/\s+/).reduce((sum, word) => {
    if (sum < 0) return sum;
    const s = Math.max(fuzzy(word, item.label) * 2, fuzzy(word, item.keywords));
    return s ? sum + s : -1;
  }, 0);
}

let recent: string[] = [];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  useEffect(() => {
    const show = () => { setQuery(""); setActive(0); setOpen(true); };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => { if (!o) { setQuery(""); setActive(0); } return !o; });
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener(EVENT, show);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener(EVENT, show); window.removeEventListener("keydown", onKey); };
  }, []);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      const pick = (ids: string[]) => ids.map((id) => ITEMS.find((i) => i.id === id)!).filter(Boolean);
      const r = pick(recent);
      const s = pick(SUGGESTED.filter((id) => !recent.includes(id)));
      return [...(r.length ? [{ group: "Recent" as Group, items: r }] : []), { group: "Suggested" as Group, items: s }];
    }
    const hits = ITEMS.map((item) => ({ item, s: score(q, item) })).filter((h) => h.s > 0);
    return ORDER.map((group) => ({
      group: group as Group,
      items: hits.filter((h) => h.item.group === group).sort((a, b) => b.s - a.s).slice(0, group === "Candidates" ? 6 : 4).map((h) => h.item),
    }))
      .filter((sec) => sec.items.length)
      // Best match's group first.
      .sort((a, b) => score(q, b.items[0]) - score(q, a.items[0]));
  }, [query]);

  const flat = sections.flatMap((s) => s.items);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const go = (item: Item | undefined) => {
    if (!item) return;
    recent = [item.id, ...recent.filter((id) => id !== item.id)].slice(0, 4);
    setOpen(false);
    navigate(item.to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = flat.length;
    if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n")) { e.preventDefault(); setActive((a) => (n ? (a + 1) % n : 0)); }
    else if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p")) { e.preventDefault(); setActive((a) => (n ? (a - 1 + n) % n : 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(flat[active]); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  };

  let index = -1;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-center px-3 pt-3 sm:px-4 sm:pt-[12vh]" role="presentation">
          <motion.div
            className="absolute inset-0 bg-black/25 backdrop-blur-[3px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.15 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label="Search and jump"
            className="relative flex max-h-[min(560px,calc(100dvh-24px))] w-full max-w-[620px] flex-col self-start overflow-hidden rounded-panel bg-card shadow-overlay"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -4 }}
            transition={{ duration: reduce ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-2.5 border-b border-rim px-4">
              <Search className="size-4 shrink-0 text-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                onKeyDown={onKeyDown}
                placeholder="Search candidates, listings, roles, pages"
                className="h-13 min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-faint"
                style={{ outline: "none" }}
                role="combobox" aria-expanded aria-controls="palette-list"
                aria-activedescendant={flat[active] ? `palette-${flat[active].id}` : undefined}
              />
              <button onClick={() => setOpen(false)} className="hidden sm:block" aria-label="Close"><Kbd>esc</Kbd></button>
            </div>

            <div ref={listRef} id="palette-list" role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
              {flat.length === 0 && (
                <div className="px-3 py-10 text-center text-[13px] text-muted">
                  Nothing matches "{query}". Try a name, a board or a skill.
                </div>
              )}
              {sections.map((sec) => (
                <div key={sec.group} className="pb-1">
                  <div className="px-2.5 pt-2 pb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-faint">{sec.group}</div>
                  {sec.items.map((item) => {
                    const i = ++index;
                    const on = i === active;
                    const c = item.candidate;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        id={`palette-${item.id}`}
                        data-index={i}
                        role="option"
                        aria-selected={on}
                        onMouseMove={() => active !== i && setActive(i)}
                        onClick={() => go(item)}
                        className={cx(
                          "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-control px-2.5 py-1.5 text-[13px]",
                          on ? "bg-[var(--wash)] text-foreground" : "text-foreground/90",
                        )}
                      >
                        {c ? (
                          <Avatar initials={c.initials} hue={c.hue} size={24} />
                        ) : (
                          Icon && (
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-inset text-muted">
                              <Icon className="size-3.5" strokeWidth={1.75} />
                            </span>
                          )
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-medium">{item.label}</span>
                          {c && <span className="ml-2 hidden text-[12px] text-faint sm:inline">{roleById(c.roleId).title}</span>}
                        </span>
                        {c ? (
                          <span className="flex shrink-0 items-center gap-1.5">
                            <TierBadge tier={c.tier} />
                            <StageChip stage={c.stage} />
                          </span>
                        ) : (
                          <span className="hidden shrink-0 sm:inline">{item.meta}</span>
                        )}
                        <ArrowRight className={cx("size-3.5 shrink-0 text-faint transition-opacity", on ? "opacity-100" : "opacity-0")} />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 border-t border-rim bg-inset px-4 py-2 text-[11.5px] text-muted">
              <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> to move</span>
              <span className="flex items-center gap-1.5"><Kbd><CornerDownLeft className="size-3" /></Kbd> to open</span>
              <span className="hidden items-center gap-1.5 sm:flex"><Kbd>esc</Kbd> to close</span>
              <span className="ml-auto hidden items-center gap-1.5 sm:flex"><Kbd>⌘K</Kbd> anywhere</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
