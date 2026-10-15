/**
 * Every number on the Reports page, derived from src/data/mock.ts.
 *
 * Two inputs are not in mock.ts and are marked "sample figure" on the page:
 * the days a candidate spends in each stage, and the offer acceptance rate.
 * Nobody has been hired in the demo yet, so neither can be measured.
 */
import { BOARDS, LISTINGS, ROLES, type Board, type BoardId, type Listing, type Tier } from "@/data/mock";

export type RoleFilter = "all" | string;

/**
 * Line colours per board. Three follow mock.ts. Indeed's board hue sits about
 * 11 ΔE from OnlineJobs.ph's — fine for a dot next to a name, too close for two
 * lines crossing on one plot — so this page steps it to ochre. Validated as a
 * set (adjacent CVD ΔE ≥ 8.2, normal-vision ≥ 16) with the dataviz validator.
 */
export const BOARD_SERIES: Record<BoardId, string> = {
  onlinejobs: "oklch(0.58 0.15 240)",
  indeed: "oklch(0.62 0.13 85)",
  mbw: "oklch(0.55 0.16 25)",
  roster: "oklch(0.55 0.15 320)",
};

export const listingsFor = (role: RoleFilter) =>
  role === "all" ? LISTINGS : LISTINGS.filter((l) => l.roleId === role);

const sum = (ls: Listing[], f: (l: Listing) => number) => ls.reduce((a, l) => a + f(l), 0);

/* --------------------------------------------------------------- boards -- */

export interface BoardRow {
  board: Board;
  listings: number;
  spend: number;
  views: number;
  applies: number;
  qualified: number;
  interviews: number;
  offers: number;
  tiers: Record<Tier, number>;
  costPerQualified: number | null;
  costPerA: number | null;
  costPerHire: number | null;
  trend: number[];
}

export function boardRows(role: RoleFilter): BoardRow[] {
  const ls = listingsFor(role);
  return BOARDS.flatMap((board) => {
    const mine = ls.filter((l) => l.board === board.id);
    if (!mine.length) return [];
    const spend = sum(mine, (l) => l.spend);
    const qualified = sum(mine, (l) => l.qualified);
    const offers = sum(mine, (l) => l.offers);
    const tiers = {
      A: Math.round(sum(mine, (l) => (l.applies * l.tierMix.A) / 100)),
      B: Math.round(sum(mine, (l) => (l.applies * l.tierMix.B) / 100)),
      C: Math.round(sum(mine, (l) => (l.applies * l.tierMix.C) / 100)),
    };
    return [{
      board,
      listings: mine.length,
      spend,
      views: sum(mine, (l) => l.views),
      applies: sum(mine, (l) => l.applies),
      qualified,
      interviews: sum(mine, (l) => l.interviews),
      offers,
      tiers,
      costPerQualified: qualified ? spend / qualified : null,
      costPerA: tiers.A ? spend / tiers.A : null,
      costPerHire: offers ? spend / offers : null,
      trend: Array.from({ length: 14 }, (_, i) => sum(mine, (l) => l.trend[i])),
    }];
  });
}

/* --------------------------------------------------------------- funnel -- */

export const FUNNEL_STEPS = ["Views", "Applies", "Qualified", "Interviews", "Offers"] as const;

export function funnelFor(roleId: string) {
  const ls = LISTINGS.filter((l) => l.roleId === roleId);
  return [
    sum(ls, (l) => l.views),
    sum(ls, (l) => l.applies),
    sum(ls, (l) => l.qualified),
    sum(ls, (l) => l.interviews),
    sum(ls, (l) => l.offers),
  ];
}

/* ------------------------------------------------- time in stage (sample) -- */

export const HEAT_STAGES = [
  { id: "new", label: "New" },
  { id: "screen", label: "Screen" },
  { id: "assess", label: "Assessment" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
] as const;

/** Median days in each stage. Sample figures: fixed, so every reload agrees. */
export const DAYS_IN_STAGE: Record<string, number[]> = {
  "va-ops": [1.5, 2.4, 4.1, 3.2, 2.0],
  "campaign-mgr": [1.2, 3.1, 5.6, 6.8, 3.5],
  playlist: [0.9, 2.2, 3.4, 4.0, 2.5],
};

/** Sample figure: offers accepted over the agency's last twelve months. */
export const OFFER_HISTORY = { made: 5, accepted: 4 };

export const rolesFor = (role: RoleFilter) => (role === "all" ? ROLES : ROLES.filter((r) => r.id === role));

export const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const timeToHire = (roleId: string) => DAYS_IN_STAGE[roleId].reduce((a, b) => a + b, 0);

/* ----------------------------------------------------------------- format -- */

export const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: n < 100 ? 2 : 0, minimumFractionDigits: n < 100 ? 2 : 0 })}`;
export const int = (n: number) => Math.round(n).toLocaleString("en-US");
export const pct = (n: number) => `${n < 10 && n > 0 ? n.toFixed(1) : Math.round(n)}%`;

/** 14 days ending 15 October 2026, the demo's today. */
export const DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9, 2 + i));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
});

/* ------------------------------------------------------------------- CSV -- */

export function boardCsv(rows: BoardRow[], roleLabel: string) {
  const head = ["Board", "Role", "Listings", "Spend (USD)", "Views", "Applies", "Qualified", "Interviews", "Offers",
    "A-tier", "B-tier", "C-tier", "Cost per qualified", "Cost per A-tier", "Cost per hire"];
  const f = (n: number | null) => (n == null ? "" : n.toFixed(2));
  const esc = (s: string | number) => (/[",\n]/.test(String(s)) ? `"${String(s).replace(/"/g, '""')}"` : String(s));
  const lines = rows.map((r) => [r.board.name, roleLabel, r.listings, r.spend, r.views, r.applies, r.qualified, r.interviews,
    r.offers, r.tiers.A, r.tiers.B, r.tiers.C, f(r.costPerQualified), f(r.costPerA), f(r.costPerHire)].map(esc).join(","));
  return [head.map(esc).join(","), ...lines].join("\n") + "\n";
}

export function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
