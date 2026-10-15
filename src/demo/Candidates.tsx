import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, Check, ChevronDown, Mail, Minus, Search, Star, X } from "lucide-react";
import { Avatar, Button, cx, StageChip, TierBadge } from "@/components/ui";
import {
  BOARDS, boardById, listingById, roleById, ROLES, STAGES, TIER_COLOR,
  type BoardId, type Candidate, type StageId, type Tier,
} from "@/data/mock";
import { usePeople } from "@/data/store";
import { PageHeader } from "./Shell";

type SortKey = "name" | "role" | "source" | "stage" | "tier" | "score" | "ask" | "applied";
type Sort = { key: SortKey; dir: "asc" | "desc" };

const STAGE_ORDER = Object.fromEntries(STAGES.map((s, i) => [s.id, i])) as Record<StageId, number>;

/** Pull a comparable annual-ish number out of "$950 / mo", "$62k", "$25 / hr". */
function askValue(ask: string) {
  const n = parseFloat(ask.replace(/[^0-9.]/g, "")) || 0;
  if (/k/i.test(ask)) return n * 1000;
  if (/hr/.test(ask)) return n * 2080;
  if (/mo/.test(ask)) return n * 12;
  return n;
}

const sortValue = (c: Candidate, k: SortKey): string | number => {
  switch (k) {
    case "name": return c.name;
    case "role": return roleById(c.roleId).title;
    case "source": { const l = listingById(c.listingId); return boardById(l.board).name + l.variant; }
    case "stage": return STAGE_ORDER[c.stage];
    case "tier": return c.tier;
    case "score": return c.score;
    case "ask": return askValue(c.ask);
    case "applied": return c.appliedDaysAgo;
  }
};

function ago(days: number) {
  return days === 0 ? "Today" : `${days}d ago`;
}

export default function Candidates() {
  const navigate = useNavigate();
  const [people, setPeople] = usePeople();
  const [q, setQ] = useState("");
  const [stages, setStages] = useState<StageId[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [boards, setBoards] = useState<BoardId[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>({ key: "score", dir: "desc" });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);

  const notify = (m: string) => {
    setToast(m);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !t.closest("input, textarea")) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") {
        if (t === searchRef.current && q) setQ("");
        else setSelected(new Set());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = people.filter((c) => {
      const l = listingById(c.listingId);
      if (stages.length && !stages.includes(c.stage)) return false;
      if (tiers.length && !tiers.includes(c.tier)) return false;
      if (boards.length && !boards.includes(l.board)) return false;
      if (roles.length && !roles.includes(c.roleId)) return false;
      if (!needle) return true;
      return [c.name, c.headline, c.location, roleById(c.roleId).title, boardById(l.board).name, ...c.skills]
        .some((s) => s.toLowerCase().includes(needle));
    });
    const m = sort.dir === "asc" ? 1 : -1;
    return out.sort((a, b) => {
      const va = sortValue(a, sort.key), vb = sortValue(b, sort.key);
      const r = typeof va === "number" ? va - (vb as number) : va.localeCompare(vb as string);
      return r * m || b.score - a.score;
    });
  }, [people, q, stages, tiers, boards, roles, sort]);

  const filtered = stages.length + tiers.length + boards.length + roles.length > 0 || q.length > 0;
  const allOn = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someOn = rows.some((r) => selected.has(r.id));

  const toggle = (id: string) =>
    setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSelected(allOn ? new Set() : new Set(rows.map((r) => r.id)));

  const clickSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" || key === "role" || key === "source" || key === "tier" ? "asc" : "desc" }));

  const bulkMove = (stage: StageId) => {
    const n = selected.size;
    setPeople((ps) => ps.map((c) => (selected.has(c.id) ? { ...c, stage } : c)));
    setSelected(new Set());
    notify(`${n} ${n === 1 ? "candidate" : "candidates"} moved to ${STAGES.find((s) => s.id === stage)!.label}.`);
  };

  const clearAll = () => { setQ(""); setStages([]); setTiers([]); setBoards([]); setRoles([]); };

  return (
    <div className="pb-28">
      <PageHeader
        title="Candidates"
        subtitle={`${people.length} people across ${ROLES.length} roles and ${BOARDS.length} boards`}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 md:px-8">
        <label className="relative flex h-8 w-full items-center sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 size-3.5 text-faint" />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, skill, location"
            className="h-full w-full rounded-control bg-card pr-8 pl-8 text-[13px] shadow-card outline-none placeholder:text-faint focus:shadow-[0_0_0_1.5px_var(--primary)]"
          />
          {q ? (
            <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 text-faint hover:text-foreground"><X className="size-3.5" /></button>
          ) : (
            <span className="pointer-events-none absolute right-2 hidden font-mono text-[10.5px] text-faint sm:block">/</span>
          )}
        </label>
        <FilterMenu
          label="Stage"
          options={STAGES.map((s) => ({ id: s.id, label: s.label, dot: s.color }))}
          value={stages}
          onChange={(v) => setStages(v as StageId[])}
        />
        <FilterMenu
          label="Tier"
          options={(["A", "B", "C"] as Tier[]).map((t) => ({ id: t, label: `Tier ${t}`, dot: TIER_COLOR[t] }))}
          value={tiers}
          onChange={(v) => setTiers(v as Tier[])}
        />
        <FilterMenu
          label="Board"
          options={BOARDS.map((b) => ({ id: b.id, label: b.name, dot: b.color }))}
          value={boards}
          onChange={(v) => setBoards(v as BoardId[])}
        />
        <FilterMenu
          label="Role"
          options={ROLES.map((r) => ({ id: r.id, label: r.title }))}
          value={roles}
          onChange={setRoles}
        />
        {filtered && (
          <button onClick={clearAll} className="h-8 px-1.5 text-[12.5px] text-muted hover:text-foreground">Clear</button>
        )}
        <span className="tnum ml-auto text-[12px] text-faint">
          {rows.length === people.length ? `${rows.length} candidates` : `${rows.length} of ${people.length}`}
        </span>
      </div>

      {/* Desktop table */}
      <div className="mt-4 hidden px-8 md:block">
        <div className="overflow-hidden rounded-panel bg-card shadow-card">
          <div className="scroll-quiet overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-[13px]">
              <thead>
                <tr className="h-9 border-b border-rim text-left text-[11.5px] text-muted">
                  <th className="w-11 pr-1 pl-4">
                    <Checkbox checked={allOn} indeterminate={!allOn && someOn} onChange={toggleAll} label="Select all" />
                  </th>
                  <Th k="name" sort={sort} onSort={clickSort}>Candidate</Th>
                  <Th k="role" sort={sort} onSort={clickSort}>Role</Th>
                  <Th k="source" sort={sort} onSort={clickSort}>Source</Th>
                  <Th k="stage" sort={sort} onSort={clickSort}>Stage</Th>
                  <Th k="tier" sort={sort} onSort={clickSort}>Tier</Th>
                  <Th k="score" sort={sort} onSort={clickSort}>Score</Th>
                  <Th k="ask" sort={sort} onSort={clickSort} align="right">Ask</Th>
                  <Th k="applied" sort={sort} onSort={clickSort} align="right" className="pr-4">Applied</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const l = listingById(c.listingId);
                  const b = boardById(l.board);
                  const on = selected.has(c.id);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/demo/candidates/${c.id}`)}
                      className={cx(
                        "group h-12 cursor-pointer border-b border-rim transition-colors duration-100 last:border-0",
                        on ? "bg-primary-tint/70" : "hover:bg-[var(--wash)]",
                      )}
                    >
                      <td className="pr-1 pl-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={on} onChange={() => toggle(c.id)} label={`Select ${c.name}`} />
                      </td>
                      <td className="py-1.5 pr-4">
                        <div className="flex max-w-[260px] items-center gap-2.5">
                          <Avatar initials={c.initials} hue={c.hue} size={28} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link to={`/demo/candidates/${c.id}`} onClick={(e) => e.stopPropagation()} className="truncate font-medium hover:underline">
                                {c.name}
                              </Link>
                              {c.starred && <Star className="size-3 shrink-0 text-warning" fill="currentColor" aria-label="Starred" />}
                            </div>
                            <div className="truncate text-[12px] text-muted">{c.headline}</div>
                          </div>
                        </div>
                      </td>
                      <td className="pr-4 text-muted"><div className="max-w-[150px] truncate">{roleById(c.roleId).title}</div></td>
                      <td className="pr-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-1.5 rounded-full" style={{ background: b.color }} />
                          <span className="max-w-[120px] truncate text-muted">{b.name}</span>
                          <span className="rounded-[4px] bg-inset px-1 font-mono text-[10.5px] text-muted">{l.variant}</span>
                        </span>
                      </td>
                      <td className="pr-4"><StageChip stage={c.stage} /></td>
                      <td className="pr-4"><TierBadge tier={c.tier} /></td>
                      <td className="pr-4"><ScoreBar score={c.score} tier={c.tier} /></td>
                      <td className="tnum pr-4 text-right whitespace-nowrap text-muted">{c.ask}</td>
                      <td className="tnum pr-4 text-right whitespace-nowrap text-faint">{ago(c.appliedDaysAgo)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <Empty onClear={clearAll} />}
        </div>
      </div>

      {/* Mobile list */}
      <div className="mt-4 px-4 md:hidden">
        {rows.length > 0 && (
          <div className="mb-2 flex items-center gap-2 px-1 text-[12px] text-muted">
            <Checkbox checked={allOn} indeterminate={!allOn && someOn} onChange={toggleAll} label="Select all" />
            Select all
            <label className="ml-auto flex items-center gap-1">
              Sort
              <select
                value={`${sort.key}:${sort.dir}`}
                onChange={(e) => { const [key, dir] = e.target.value.split(":"); setSort({ key: key as SortKey, dir: dir as Sort["dir"] }); }}
                className="rounded-[6px] bg-card px-1.5 py-0.5 text-[12px] text-foreground shadow-card outline-none"
              >
                <option value="score:desc">Score</option>
                <option value="applied:asc">Newest</option>
                <option value="stage:desc">Furthest along</option>
                <option value="name:asc">Name</option>
              </select>
            </label>
          </div>
        )}
        <div className="overflow-hidden rounded-panel bg-card shadow-card">
          {rows.map((c) => {
            const l = listingById(c.listingId);
            const b = boardById(l.board);
            const on = selected.has(c.id);
            return (
              <div key={c.id} className={cx("flex items-start gap-3 border-b border-rim p-3 last:border-0", on && "bg-primary-tint/70")}>
                <div className="pt-1.5"><Checkbox checked={on} onChange={() => toggle(c.id)} label={`Select ${c.name}`} /></div>
                <Link to={`/demo/candidates/${c.id}`} className="flex min-w-0 flex-1 items-start gap-2.5">
                  <Avatar initials={c.initials} hue={c.hue} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13.5px] font-medium">{c.name}</span>
                      <TierBadge tier={c.tier} className="shrink-0" />
                      <span className="tnum ml-auto text-[13px] font-medium">{c.score}</span>
                    </div>
                    <div className="truncate text-[12px] text-muted">{c.headline}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-faint">
                      <StageChip stage={c.stage} />
                      <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-muted">
                        <span className="size-1.5 rounded-full" style={{ background: b.color }} />{b.short} · {l.variant}
                      </span>
                      <span className="tnum">{c.ask}</span>
                      <span className="tnum">{ago(c.appliedDaysAgo)}</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
          {rows.length === 0 && <Empty onClear={clearAll} />}
        </div>
      </div>

      <BulkBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onMove={bulkMove}
        onReject={() => bulkMove("rejected")}
        onEmail={() => {
          notify(`Email drafted to ${selected.size} ${selected.size === 1 ? "candidate" : "candidates"}. Nothing is sent in the demo.`);
          setSelected(new Set());
        }}
      />

      <div
        aria-live="polite"
        className={cx(
          "pointer-events-none fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 transition-[opacity,transform] duration-200 ease-settle md:left-[calc(50%+120px)]",
          toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        )}
      >
        {toast && <div className="max-w-[calc(100vw-32px)] rounded-control bg-card px-3.5 py-2 text-[12.5px] shadow-overlay">{toast}</div>}
      </div>
    </div>
  );
}

function Th({
  k, sort, onSort, children, align, className,
}: { k: SortKey; sort: Sort; onSort: (k: SortKey) => void; children: ReactNode; align?: "right"; className?: string }) {
  const active = sort.key === k;
  const Icon = sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={cx("pr-4 font-medium", align === "right" && "text-right", className)} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        onClick={() => onSort(k)}
        className={cx("inline-flex items-center gap-1 rounded-[4px] transition-colors hover:text-foreground", active && "text-foreground", align === "right" && "flex-row-reverse")}
      >
        {children}
        <Icon className={cx("size-3 transition-opacity", active ? "opacity-100" : "opacity-0")} />
      </button>
    </th>
  );
}

function Checkbox({ checked, indeterminate, onChange, label }: { checked: boolean; indeterminate?: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={cx(
        "flex size-4 shrink-0 items-center justify-center rounded-[4px] transition-[background,box-shadow] duration-100",
        checked || indeterminate ? "bg-primary text-on-primary shadow-[0_0_0_1px_var(--primary)]" : "bg-card shadow-[inset_0_0_0_1px_var(--rim-strong)] hover:shadow-[inset_0_0_0_1px_var(--muted)]",
      )}
    >
      {indeterminate ? <Minus className="size-3" strokeWidth={3} /> : checked ? <Check className="size-3" strokeWidth={3} /> : null}
    </button>
  );
}

function ScoreBar({ score, tier }: { score: number; tier: Tier }) {
  return (
    <div className="flex items-center gap-2">
      <span className="tnum w-6 text-right font-medium">{score}</span>
      <span className="h-1 w-14 overflow-hidden rounded-full bg-inset">
        <span className="block h-full rounded-full" style={{ width: `${score}%`, background: TIER_COLOR[tier] }} />
      </span>
    </div>
  );
}

function Empty({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="text-[13.5px] font-medium">No candidates match</div>
      <p className="max-w-xs text-[12.5px] text-muted">Loosen a filter or clear the search to see everyone again.</p>
      <Button size="sm" onClick={onClear} className="mt-1">Clear filters</Button>
    </div>
  );
}

function useOutside(ref: React.RefObject<HTMLElement | null>, on: boolean, close: () => void) {
  useEffect(() => {
    if (!on) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [ref, on, close]);
}

function FilterMenu({
  label, options, value, onChange,
}: { label: string; options: { id: string; label: string; dot?: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useMemo(() => () => setOpen(false), []);
  useOutside(ref, open, close);
  const summary = value.length === 0 ? null : value.length === 1 ? options.find((o) => o.id === value[0])?.label : `${value.length} selected`;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cx(
          "flex h-8 items-center gap-1.5 rounded-control px-2.5 text-[12.5px] transition-colors",
          value.length ? "bg-primary-tint text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_30%,transparent)]" : "bg-card text-muted shadow-card hover:text-foreground",
        )}
      >
        {label}
        {summary && <span className="max-w-28 truncate font-medium text-foreground">{summary}</span>}
        <ChevronDown className={cx("size-3.5 transition-transform duration-150", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-56 rounded-card bg-card p-1 shadow-overlay">
          {options.map((o) => {
            const on = value.includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => onChange(on ? value.filter((v) => v !== o.id) : [...value, o.id])}
                className="flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[12.5px] hover:bg-[var(--wash)]"
              >
                <span className={cx("flex size-3.5 items-center justify-center rounded-[3px]", on ? "bg-primary text-on-primary" : "shadow-[inset_0_0_0_1px_var(--rim-strong)]")}>
                  {on && <Check className="size-2.5" strokeWidth={3.5} />}
                </span>
                {o.dot && <span className="size-1.5 rounded-full" style={{ background: o.dot }} />}
                <span className="truncate">{o.label}</span>
              </button>
            );
          })}
          {value.length > 0 && (
            <button onClick={() => onChange([])} className="mt-1 flex h-7 w-full items-center rounded-[6px] border-t border-rim px-2 text-[12px] text-muted hover:text-foreground">
              Clear {label.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BulkBar({
  count, onClear, onMove, onReject, onEmail,
}: { count: number; onClear: () => void; onMove: (s: StageId) => void; onReject: () => void; onEmail: () => void }) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useMemo(() => () => setMenu(false), []);
  useOutside(ref, menu, close);
  useEffect(() => { if (!count) setMenu(false); }, [count]);
  const show = count > 0;
  return (
    <div
      className={cx(
        "fixed bottom-5 left-1/2 z-50 -translate-x-1/2 transition-[opacity,transform] duration-200 ease-enter md:left-[calc(50%+120px)]",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <div className="flex items-center gap-1 rounded-panel bg-foreground p-1.5 pl-3.5 text-background shadow-lift">
        <span className="tnum mr-1.5 text-[12.5px] whitespace-nowrap">{count} selected</span>
        <div ref={ref} className="relative">
          <button onClick={() => setMenu((m) => !m)} aria-expanded={menu} className="flex h-7.5 items-center gap-1 rounded-control px-2.5 text-[12.5px] whitespace-nowrap hover:bg-ink-hover">
            Move to <ChevronDown className="size-3.5 opacity-70" />
          </button>
          {menu && (
            <div className="absolute bottom-full left-0 mb-2 w-44 rounded-card bg-card p-1 text-foreground shadow-overlay">
              {STAGES.filter((s) => s.id !== "rejected").map((s) => (
                <button key={s.id} onClick={() => onMove(s.id)} className="flex h-7.5 w-full items-center gap-2 rounded-[6px] px-2 text-[12.5px] hover:bg-[var(--wash)]">
                  <span className="size-1.5 rounded-full" style={{ background: s.color }} />{s.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={onEmail} className="flex h-7.5 items-center gap-1.5 rounded-control px-2.5 text-[12.5px] hover:bg-ink-hover">
          <Mail className="size-3.5 opacity-70" /> <span className="max-sm:hidden">Email</span>
        </button>
        <button onClick={onReject} className="flex h-7.5 items-center rounded-control px-2.5 text-[12.5px] text-ink-danger hover:bg-ink-hover">
          Reject
        </button>
        <span className="mx-0.5 h-4 w-px bg-background/20" />
        <button onClick={onClear} aria-label="Clear selection" className="flex size-7.5 items-center justify-center rounded-control hover:bg-ink-hover">
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
