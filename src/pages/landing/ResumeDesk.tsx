import { FileText, MapPin } from "lucide-react";
import { Avatar, TierBadge, cx } from "@/components/ui";
import { CANDIDATES, TIER_COLOR, boardById, listingById, roleById, type Candidate, type Tier } from "@/data/mock";
import { useInView } from "./hooks";

/* The résumé desk: every applicant to one job lands as a sheet of paper in a
   messy pile, then slides into the pile its suggested tier puts it in. Plays
   once when the section comes into view; reduced motion shows the sorted
   desk. All of it comes from the Operations VA applicants in mock.ts. */

const ROLE = roleById("va-ops");
const APPLICANTS = CANDIDATES.filter((c) => c.roleId === ROLE.id);
const TIERS: Tier[] = ["A", "B", "C"];
const PILES: Record<Tier, { title: string; note: string }> = {
  A: { title: "Interview these", note: "Matches what the job needs" },
  B: { title: "Maybe", note: "Close, could be trained" },
  C: { title: "Not a fit", note: "Missing the basics" },
};

/* Fixed jitter so the pile looks thrown, not random on every render. */
const PILE_ROT = [-9, 6, -3, 11, -7, 4, -12, 8, -5, 2];
const PILE_X = [-3, 2.5, -1, 4, -4, 1.5, 3, -2, 0.5, -2.5];
const TRAY_ROT = [-2.5, 1.8, -1, 2.6, -1.8, 0.8];

function Sheet({ c, col, k, order }: { c: Candidate; col: number; k: number; order: number }) {
  const l = listingById(c.listingId);
  const board = boardById(l.board);
  // Bar widths vary per candidate so no two sheets read the same.
  const bars = [92, 78, 86, 64].map((w, i) => Math.max(40, w - ((c.score + i * 13) % 22)));
  return (
    <div
      className="sheet"
      style={{
        ["--col" as string]: col,
        ["--k" as string]: k,
        ["--pr" as string]: `${PILE_ROT[order % PILE_ROT.length]}deg`,
        ["--px" as string]: `${PILE_X[order % PILE_X.length]}%`,
        ["--tr" as string]: `${TRAY_ROT[(order + k) % TRAY_ROT.length]}deg`,
        ["--d" as string]: `${300 + order * 140}ms`,
        zIndex: 10 + k,
      }}
    >
      <div className="sheet-paper rounded-[6px] bg-card p-3 shadow-raised">
        <div className="flex items-center gap-2">
          <Avatar initials={c.initials} hue={c.hue} size={24} />
          <div className="min-w-0">
            <div className="truncate text-[11.5px] leading-tight font-semibold tracking-[-0.01em]">{c.name}</div>
            <div className="flex items-center gap-0.5 truncate text-[9px] text-faint">
              <MapPin className="size-2.5 shrink-0" />
              {c.location}
            </div>
          </div>
        </div>
        <p className="mt-2 line-clamp-2 min-h-[26px] text-[9.5px] leading-snug text-muted">{c.headline}</p>
        <div className="mt-2 border-t border-rim pt-2">
          <div className="text-[7.5px] font-semibold tracking-[0.08em] text-faint uppercase">Experience</div>
          <div className="mt-1.5 space-y-1">
            {bars.map((w, i) => (
              <div key={i} className="h-[3px] rounded-full bg-inset" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {c.skills.slice(0, 2).map((s) => (
            <span key={s} className="truncate rounded-[3px] bg-inset px-1 py-px text-[8px] text-muted">
              {s}
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1 text-[8px] text-faint">
          <span className="size-1.5 rounded-full" style={{ background: board.color }} />
          via {board.name}
        </div>
      </div>
      <span className="stamp" style={{ ["--tone" as string]: TIER_COLOR[c.tier] }} aria-label={`Suggested tier ${c.tier}`}>
        <span className="text-[15px] leading-none font-bold">{c.tier}</span>
        <span className="text-[6.5px] font-semibold tracking-[0.08em] uppercase">Tier</span>
      </span>
    </div>
  );
}

export function ResumeDesk() {
  const [ref, run] = useInView<HTMLDivElement>();
  // Interleave the tiers so the pile is mixed, then remember each sheet's
  // place in its own pile.
  const seen: Record<Tier, number> = { A: 0, B: 0, C: 0 };
  const sheets = APPLICANTS.map((c, order) => ({ c, order, col: TIERS.indexOf(c.tier), k: seen[c.tier]++ }));
  const boards = [...new Set(CANDIDATES.filter((c) => c.roleId === ROLE.id).map((c) => boardById(listingById(c.listingId).board).name))];

  return (
    <section className="px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-[1120px]">
        <div className="reveal mx-auto max-w-[680px] text-center">
          <div className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary">
            <FileText className="size-3.5" /> Applicants
          </div>
          <h2 className="mt-3 text-[2rem] leading-[1.02] font-semibold tracking-[-0.04em] text-balance sm:text-[2.6rem] lg:text-[3.25rem]">
            Every résumé, read and sorted.
          </h2>
          <p className="mx-auto mt-5 max-w-[580px] text-[16px] leading-relaxed text-pretty text-muted">
            Applications come in from every site you posted on. Each one is scored against what the job needs and put on
            a pile for you: interview these, maybe, or not a fit. The pile is a suggestion. You make the call.
          </p>
        </div>

        <div ref={ref} className={cx("desk reveal relative mt-12 overflow-hidden rounded-[28px] p-4 shadow-card sm:mt-14 sm:p-8", run && "is-in")}>
          {/* The job posting the applications are for. */}
          <div className="relative z-30 mx-auto w-fit max-w-full rounded-panel bg-card px-5 py-3.5 text-center shadow-raised">
            <div className="text-[10.5px] font-semibold tracking-[0.08em] text-primary uppercase">Now hiring</div>
            <div className="mt-1 text-[15px] font-semibold tracking-[-0.015em] sm:text-[17px]">{ROLE.title}</div>
            <div className="mt-0.5 text-[12px] text-muted">
              {ROLE.location} · Posted on {boards.join(" and ")}
            </div>
          </div>

          <div className="desk-floor relative">
            {sheets.map((s) => (
              <Sheet key={s.c.id} {...s} />
            ))}
          </div>

          <div className="relative z-30 grid grid-cols-3 gap-2 sm:gap-6">
            {TIERS.map((t, i) => (
              <div key={t} className="fade-in text-center" style={{ ["--d" as string]: `${1500 + i * 120}ms` }}>
                <div className="inline-flex items-center gap-1.5">
                  <TierBadge tier={t} />
                  <span className="text-[12.5px] font-semibold tracking-[-0.01em] sm:text-[14px]">{PILES[t].title}</span>
                </div>
                <div className="mt-1 hidden text-[12px] text-muted sm:block">{PILES[t].note}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-[12.5px] text-faint">
          The tier is suggested from what the candidate sent. Nothing moves to a stage until you move it.
        </p>
      </div>
    </section>
  );
}
