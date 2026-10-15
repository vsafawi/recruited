/**
 * Demo data. Everything the demo shows comes from this one file, so the
 * landing page mocks and the /demo app always agree on the numbers.
 *
 * The scenario is real: Music Market Agency hiring per position, running
 * seven listings across four boards and split-testing the wording and the
 * pay band to see which brings which tier of candidate, at what cost.
 */

export type StageId = "new" | "screen" | "assess" | "interview" | "offer" | "hired" | "rejected";
export type Tier = "A" | "B" | "C";
export type BoardId = "onlinejobs" | "indeed" | "mbw" | "roster";

export const STAGES: { id: StageId; label: string; color: string }[] = [
  { id: "new", label: "New", color: "var(--stage-new)" },
  { id: "screen", label: "Screen", color: "var(--stage-screen)" },
  { id: "assess", label: "Assessment", color: "var(--stage-assess)" },
  { id: "interview", label: "Interview", color: "var(--stage-interview)" },
  { id: "offer", label: "Offer", color: "var(--stage-offer)" },
  { id: "hired", label: "Hired", color: "var(--stage-hired)" },
  { id: "rejected", label: "Rejected", color: "var(--stage-rejected)" },
];

export const stageById = (id: StageId) => STAGES.find((s) => s.id === id)!;

export const TIER_COLOR: Record<Tier, string> = {
  A: "var(--tier-a)",
  B: "var(--tier-b)",
  C: "var(--tier-c)",
};

export const TIER_LABEL: Record<Tier, string> = {
  A: "Top tier — hire-ready, music-industry experience",
  B: "Solid — trainable, adjacent experience",
  C: "Entry — needs supervision",
};

export interface Board {
  id: BoardId;
  name: string;
  short: string;
  /** Monthly cost of having listings live on this board, USD. */
  costPerMonth: number;
  audience: string;
  color: string;
}

export const BOARDS: Board[] = [
  { id: "onlinejobs", name: "OnlineJobs.ph", short: "OJ", costPerMonth: 69, audience: "Remote, Philippines-based talent", color: "oklch(0.58 0.15 240)" },
  { id: "indeed", name: "Indeed", short: "IN", costPerMonth: 240, audience: "Broad, every industry", color: "oklch(0.5 0.17 265)" },
  { id: "mbw", name: "Music Business Worldwide", short: "MB", costPerMonth: 195, audience: "Music-industry professionals", color: "oklch(0.55 0.16 25)" },
  { id: "roster", name: "Roster", short: "RO", costPerMonth: 49, audience: "Predominantly music creatives", color: "oklch(0.55 0.15 320)" },
];

export const boardById = (id: BoardId) => BOARDS.find((b) => b.id === id)!;

export interface Role {
  id: string;
  title: string;
  team: string;
  location: string;
  hiringManager: string;
  openedAt: string;
  target: string;
}

export const ROLES: Role[] = [
  { id: "va-ops", title: "Operations Virtual Assistant", team: "Operations", location: "Remote", hiringManager: "Ops lead", openedAt: "2026-09-22", target: "Hire by Nov 1" },
  { id: "campaign-mgr", title: "Artist Campaign Manager", team: "Campaigns", location: "Remote · US hours", hiringManager: "Head of Campaigns", openedAt: "2026-09-29", target: "Hire by Nov 15" },
  { id: "playlist", title: "Playlist Pitching Coordinator", team: "Distribution", location: "Remote", hiringManager: "Head of Campaigns", openedAt: "2026-10-03", target: "Hire by Nov 20" },
];

export const roleById = (id: string) => ROLES.find((r) => r.id === id)!;

export interface Listing {
  id: string;
  roleId: string;
  board: BoardId;
  /** The arm of the split test, "A" or "B". */
  variant: "A" | "B";
  headline: string;
  /** What the variant is testing. */
  hypothesis: string;
  payBand: string;
  status: "live" | "paused" | "winner";
  daysLive: number;
  views: number;
  applies: number;
  qualified: number;
  interviews: number;
  offers: number;
  /** Share of applicants scored A / B / C, in percent. */
  tierMix: { A: number; B: number; C: number };
  spend: number;
  /** Applies per day for the last 14 days, for sparklines. */
  trend: number[];
}

export const LISTINGS: Listing[] = [
  {
    id: "l1", roleId: "va-ops", board: "onlinejobs", variant: "A",
    headline: "Virtual Assistant — Music Marketing Agency",
    hypothesis: "Entry pay band, generic title",
    payBand: "$600 / mo", status: "live", daysLive: 23,
    views: 4120, applies: 186, qualified: 31, interviews: 6, offers: 0,
    tierMix: { A: 3, B: 31, C: 66 }, spend: 52,
    trend: [9, 14, 12, 11, 8, 10, 13, 9, 7, 8, 6, 9, 7, 5],
  },
  {
    id: "l2", roleId: "va-ops", board: "onlinejobs", variant: "B",
    headline: "Senior Operations VA — Artist Campaigns (Notion, Asana, Spotify for Artists)",
    hypothesis: "Higher band, tools named in the title",
    payBand: "$950 / mo", status: "winner", daysLive: 23,
    views: 3380, applies: 94, qualified: 38, interviews: 9, offers: 1,
    tierMix: { A: 22, B: 51, C: 27 }, spend: 52,
    trend: [4, 6, 5, 7, 5, 4, 6, 3, 4, 5, 4, 3, 4, 3],
  },
  {
    id: "l3", roleId: "campaign-mgr", board: "indeed", variant: "A",
    headline: "Campaign Manager (Music Marketing)",
    hypothesis: "Salary hidden",
    payBand: "Not shown", status: "paused", daysLive: 16,
    views: 6210, applies: 212, qualified: 14, interviews: 3, offers: 0,
    tierMix: { A: 3, B: 18, C: 79 }, spend: 128,
    trend: [18, 22, 19, 16, 14, 15, 13, 12, 11, 12, 10, 9, 0, 0],
  },
  {
    id: "l4", roleId: "campaign-mgr", board: "indeed", variant: "B",
    headline: "Artist Campaign Manager — $55–65k, remote",
    hypothesis: "Salary in the headline",
    payBand: "$55–65k", status: "live", daysLive: 16,
    views: 4870, applies: 131, qualified: 27, interviews: 5, offers: 0,
    tierMix: { A: 9, B: 38, C: 53 }, spend: 128,
    trend: [7, 9, 10, 8, 9, 8, 7, 9, 8, 7, 8, 9, 8, 7],
  },
  {
    id: "l5", roleId: "campaign-mgr", board: "mbw", variant: "A",
    headline: "Artist Campaign Manager — independent release strategy",
    hypothesis: "Industry board, industry language",
    payBand: "$55–65k", status: "live", daysLive: 16,
    views: 1460, applies: 38, qualified: 21, interviews: 6, offers: 1,
    tierMix: { A: 34, B: 47, C: 19 }, spend: 195,
    trend: [2, 3, 4, 3, 2, 3, 2, 3, 2, 2, 3, 2, 3, 2],
  },
  {
    id: "l6", roleId: "playlist", board: "roster", variant: "A",
    headline: "Playlist Pitching Coordinator",
    hypothesis: "Music-native board, plain title",
    payBand: "$22–26 / hr", status: "live", daysLive: 12,
    views: 980, applies: 41, qualified: 17, interviews: 4, offers: 0,
    tierMix: { A: 27, B: 44, C: 29 }, spend: 49,
    trend: [0, 0, 4, 5, 3, 4, 3, 4, 3, 3, 4, 3, 2, 3],
  },
  {
    id: "l7", roleId: "playlist", board: "indeed", variant: "B",
    headline: "Music Playlist Coordinator — curator outreach, DSP pitching",
    hypothesis: "Broad board, specialist wording",
    payBand: "$22–26 / hr", status: "live", daysLive: 12,
    views: 2240, applies: 77, qualified: 9, interviews: 2, offers: 0,
    tierMix: { A: 5, B: 26, C: 69 }, spend: 112,
    trend: [0, 0, 8, 9, 7, 8, 6, 7, 6, 7, 5, 6, 4, 4],
  },
];

export const listingById = (id: string) => LISTINGS.find((l) => l.id === id)!;

export interface Candidate {
  id: string;
  name: string;
  initials: string;
  roleId: string;
  listingId: string;
  stage: StageId;
  tier: Tier;
  /** 0-100, from the screening rubric. */
  score: number;
  location: string;
  ask: string;
  appliedDaysAgo: number;
  headline: string;
  skills: string[];
  /** Hue for the avatar. */
  hue: number;
  nextStep?: string;
  starred?: boolean;
}

const c = (
  id: string, name: string, roleId: string, listingId: string, stage: StageId, tier: Tier,
  score: number, location: string, ask: string, appliedDaysAgo: number, headline: string,
  skills: string[], hue: number, nextStep?: string, starred?: boolean,
): Candidate => ({
  id, name, initials: name.split(" ").map((p) => p[0]).join("").slice(0, 2),
  roleId, listingId, stage, tier, score, location, ask, appliedDaysAgo, headline, skills, hue, nextStep, starred,
});

export const CANDIDATES: Candidate[] = [
  c("c1", "Maricel Santos", "va-ops", "l2", "offer", "A", 92, "Cebu, PH", "$950 / mo", 19, "4 yrs ops VA for two indie labels", ["Notion", "Asana", "Spotify for Artists", "Canva"], 30, "Offer sent — awaiting reply", true),
  c("c2", "Jomar Reyes", "va-ops", "l2", "interview", "A", 88, "Manila, PH", "$900 / mo", 14, "Release-day coordinator for a K-pop fan agency", ["Asana", "Google Sheets", "Hootsuite"], 200, "Final interview Thu 10:00"),
  c("c3", "Aileen Cruz", "va-ops", "l1", "assess", "B", 74, "Davao, PH", "$650 / mo", 11, "General VA, e-commerce support", ["Shopify", "Gmail", "Canva"], 340, "Trial task due Fri"),
  c("c4", "Paolo Mendoza", "va-ops", "l1", "screen", "C", 58, "Quezon City, PH", "$550 / mo", 6, "Data entry, 1 yr", ["Excel", "Data entry"], 120),
  c("c5", "Kristine Bautista", "va-ops", "l2", "assess", "B", 79, "Iloilo, PH", "$850 / mo", 9, "Podcast production assistant", ["Descript", "Notion", "Trello"], 260, "Trial task submitted"),
  c("c6", "Renz Villanueva", "va-ops", "l1", "new", "C", 51, "Pampanga, PH", "$500 / mo", 2, "Customer support, BPO", ["Zendesk"], 80),
  c("c7", "Liza Navarro", "va-ops", "l2", "new", "A", 86, "Baguio, PH", "$1,000 / mo", 1, "Ex-label coordinator, royalty ops", ["Notion", "DistroKid", "Airtable"], 160, undefined, true),
  c("c8", "Jasmine Okafor", "campaign-mgr", "l5", "offer", "A", 94, "Atlanta, GA", "$62k", 15, "Ran 40+ independent release campaigns at a distributor", ["Release strategy", "Meta Ads", "TikTok", "DSP pitching"], 10, "Offer call Wed 2pm", true),
  c("c9", "Daniel Mercer", "campaign-mgr", "l5", "interview", "A", 89, "Nashville, TN", "$60k", 12, "Marketing manager, country imprint", ["Meta Ads", "Chartmetric", "Email"], 220, "Panel with Head of Campaigns"),
  c("c10", "Priya Raman", "campaign-mgr", "l4", "interview", "B", 81, "Austin, TX", "$58k", 10, "Growth marketer, consumer apps", ["Meta Ads", "Google Ads", "Looker"], 290, "Case study review"),
  c("c11", "Tyler Brooks", "campaign-mgr", "l3", "rejected", "C", 44, "Columbus, OH", "$48k", 13, "Retail marketing associate", ["Social media"], 50),
  c("c12", "Sofia Alvarez", "campaign-mgr", "l5", "assess", "A", 87, "Los Angeles, CA", "$65k", 8, "Artist manager's assistant, 3 yrs", ["Artist relations", "TikTok", "Spotify for Artists"], 350, "Campaign brief exercise"),
  c("c13", "Marcus Hill", "campaign-mgr", "l4", "screen", "B", 72, "Chicago, IL", "$55k", 5, "Event promoter turned digital marketer", ["Instagram", "Eventbrite", "Meta Ads"], 140),
  c("c14", "Hannah Lee", "campaign-mgr", "l4", "new", "B", 76, "Seattle, WA", "$60k", 1, "Content marketing, B2B SaaS", ["SEO", "HubSpot"], 190),
  c("c15", "Andre Thompson", "campaign-mgr", "l3", "screen", "C", 55, "Detroit, MI", "$50k", 9, "Social media coordinator, restaurant group", ["Instagram", "Canva"], 20),
  c("c16", "Elena Petrova", "campaign-mgr", "l5", "screen", "B", 78, "Brooklyn, NY", "$64k", 4, "PR assistant, classical label", ["PR", "Press lists", "Mailchimp"], 300),
  c("c17", "Noah Kim", "playlist", "l6", "interview", "A", 90, "Remote — Toronto", "$25 / hr", 9, "Curates three editorial-adjacent playlists, 180k followers", ["SubmitHub", "Groover", "Spotify for Artists"], 240, "Interview Fri 1pm", true),
  c("c18", "Ava Martinez", "playlist", "l6", "assess", "B", 77, "Miami, FL", "$23 / hr", 7, "College radio music director", ["Radio", "Curator outreach"], 330),
  c("c19", "Leo Fischer", "playlist", "l7", "screen", "C", 52, "Denver, CO", "$20 / hr", 6, "Barista, runs a lo-fi playlist", ["Spotify"], 100),
  c("c20", "Grace Wu", "playlist", "l6", "new", "A", 84, "San Francisco, CA", "$26 / hr", 2, "DSP pitching at a distributor, 2 yrs", ["DSP pitching", "Chartmetric", "Airtable"], 170),
  c("c21", "Omar Haddad", "playlist", "l7", "new", "B", 70, "Dearborn, MI", "$22 / hr", 1, "Music blogger, 6 yrs", ["Writing", "Curator outreach"], 40),
  c("c22", "Chloe Dubois", "playlist", "l6", "screen", "B", 75, "Montreal, QC", "$24 / hr", 3, "Sync licensing intern", ["Sync", "Metadata"], 280),
  c("c23", "Ethan Park", "va-ops", "l1", "rejected", "C", 41, "Laguna, PH", "$450 / mo", 16, "Freelance transcription", ["Transcription"], 210),
  c("c24", "Isabel Romero", "campaign-mgr", "l3", "new", "C", 49, "Phoenix, AZ", "$45k", 0, "Recent graduate, marketing", ["Canva", "Instagram"], 60),
];

export const candidateById = (id: string) => CANDIDATES.find((x) => x.id === id);

export interface Activity {
  id: string;
  when: string;
  text: string;
  candidateId?: string;
  kind: "applied" | "moved" | "scored" | "note" | "listing" | "offer";
}

export const ACTIVITY: Activity[] = [
  { id: "a1", when: "8m", kind: "applied", candidateId: "c24", text: "Isabel Romero applied via Indeed (A)" },
  { id: "a2", when: "22m", kind: "scored", candidateId: "c7", text: "Liza Navarro scored 86 — Tier A" },
  { id: "a3", when: "1h", kind: "offer", candidateId: "c8", text: "Offer drafted for Jasmine Okafor" },
  { id: "a4", when: "2h", kind: "listing", text: "OnlineJobs.ph variant B marked winner — 3.7× more A-tier per dollar" },
  { id: "a5", when: "3h", kind: "moved", candidateId: "c2", text: "Jomar Reyes moved to Interview" },
  { id: "a6", when: "5h", kind: "listing", text: "Indeed variant A paused — 79% of applicants Tier C" },
  { id: "a7", when: "1d", kind: "note", candidateId: "c17", text: "Note on Noah Kim: \"Knows half our curator list already\"" },
];

/** Derived numbers used by the landing page and the overview. */
export function totals() {
  const sum = (k: keyof Pick<Listing, "views" | "applies" | "qualified" | "interviews" | "offers" | "spend">) =>
    LISTINGS.reduce((a, l) => a + l[k], 0);
  return {
    views: sum("views"),
    applies: sum("applies"),
    qualified: sum("qualified"),
    interviews: sum("interviews"),
    offers: sum("offers"),
    spend: sum("spend"),
  };
}

/** A-tier applicants bought per dollar spent — the number the split test is really about. */
export function aTierPerDollar(l: Listing) {
  return (l.applies * l.tierMix.A) / 100 / l.spend;
}

export function costPerQualified(l: Listing) {
  return l.qualified ? l.spend / l.qualified : 0;
}
