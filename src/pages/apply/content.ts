/**
 * Copy for the candidate-facing pages: the company blurb, each role's job
 * description, its screening questions and the rubric the answers are scored
 * against. Keyed by role id so it stays deterministic; the numbers (pay band,
 * board, variant) always come from src/data/mock.ts.
 */

export const COMPANY = {
  name: "Music Market Agency",
  monogram: "MM",
  about: "A music marketing agency running release campaigns for independent artists.",
  long:
    "We plan and run release campaigns for independent artists and small labels: pre-saves, playlist pitching, paid social and the week-by-week work in between. The team is small, remote and spread across four time zones, and everyone works directly with artists.",
  facts: [
    { label: "Team", value: "14 people" },
    { label: "Based", value: "Remote-first" },
    { label: "Campaigns a year", value: "120+" },
  ],
};

export type Question =
  | { id: string; kind: "text"; label: string; hint?: string; placeholder?: string; min: number }
  | { id: string; kind: "choice"; label: string; hint?: string; options: string[] }
  | { id: string; kind: "multi"; label: string; hint?: string; options: string[] };

export interface RoleCopy {
  summary: string;
  type: string;
  description: string[];
  youllDo: string[];
  lookFor: string[];
  niceToHave: string[];
  questions: Question[];
  /** What the screening rubric weighs, shown on the confirmation. */
  rubric: string[];
  payHint: string;
}

export const ROLE_COPY: Record<string, RoleCopy> = {
  "va-ops": {
    type: "Full time",
    summary: "Keep a dozen release campaigns on schedule from one Notion workspace.",
    description: [
      "Every release we run has forty or so small tasks attached to it: assets to chase, pre-save links to set up, playlist pitches to log, invoices to send. You keep all of it moving so the campaign managers can spend their time with artists.",
      "You'll work from our Notion and Asana setup, with Spotify for Artists and our distributor dashboards open in the next tab. Most of the week is async; there's a standing call with the ops lead on Monday and Thursday mornings, US Eastern time.",
    ],
    youllDo: [
      "Set up and maintain each release's task board from our campaign template",
      "Chase artists and labels for artwork, credits and audio before the deadlines that matter",
      "Upload metadata, pitch drafts and pre-save links to distributor and DSP dashboards",
      "Keep the weekly campaign report current, so nobody has to ask where a release stands",
      "Handle the shared inbox and calendar for the campaigns team",
    ],
    lookFor: [
      "Two or more years as a VA or coordinator for a team that ships on deadlines",
      "Daily, confident use of Notion or Asana, and Google Sheets",
      "Clear written English: short messages that say what is needed and by when",
      "At least three hours of overlap with US Eastern mornings",
    ],
    niceToHave: [
      "Experience with Spotify for Artists, DistroKid or another distributor dashboard",
      "You've worked for a label, artist manager or music agency before",
    ],
    questions: [
      {
        id: "tools", kind: "multi", label: "Which of these do you use day to day?",
        hint: "Pick any that apply. None is fine too.",
        options: ["Notion", "Asana", "Google Sheets", "Spotify for Artists", "DistroKid", "Canva"],
      },
      {
        id: "overlap", kind: "choice", label: "How many hours can you overlap with US Eastern mornings (8am–12pm)?",
        options: ["Under 2 hours", "2–3 hours", "3–4 hours", "The full window"],
      },
      {
        id: "juggle", kind: "text", min: 40,
        label: "Tell us about a week where you kept several deadlines moving at once.",
        hint: "What was due, what slipped or nearly slipped, and what you did about it.",
        placeholder: "Three clients had launches the same week...",
      },
    ],
    rubric: ["Tools used day to day", "Overlap with US mornings", "Evidence of running deadlines", "Written clarity"],
    payHint: "Monthly, in USD",
  },
  "campaign-mgr": {
    type: "Full time",
    summary: "Own release campaigns for independent artists from plan to week-four report.",
    description: [
      "You'll run six to eight artist campaigns at a time, each from the first planning call to the report four weeks after release. That means the release plan, the budget split across paid social and playlist pitching, the creative brief, and the honest read on what worked.",
      "You report to the Head of Campaigns and work with a VA, a playlist coordinator and freelance designers. Our artists are independent, so budgets are real money and every decision gets explained to the person paying for it.",
    ],
    youllDo: [
      "Build release plans and budgets with artists and their managers",
      "Run paid campaigns on Meta and TikTok, and brief the creative they need",
      "Coordinate playlist pitching and press with the distribution team",
      "Read Chartmetric and Spotify for Artists data and adjust mid-campaign",
      "Write the post-release report the artist actually reads",
    ],
    lookFor: [
      "Three or more years running campaigns, at least one in music or entertainment",
      "Hands-on paid social: you've set up and optimised the campaigns yourself",
      "Comfort explaining results, good or bad, to an artist directly",
      "Available for calls during US business hours",
    ],
    niceToHave: [
      "Experience at a distributor, label or artist management company",
      "A sense of how DSP editorial pitching works in practice",
    ],
    questions: [
      {
        id: "campaign", kind: "text", min: 60,
        label: "Walk us through a release campaign you ran.",
        hint: "Where the artist started, what you did, and what moved. Numbers help if you have them.",
        placeholder: "The artist had 2,000 monthly listeners and a single coming out in six weeks...",
      },
      {
        id: "channels", kind: "multi", label: "Which channels have you run paid spend on yourself?",
        options: ["Meta (Instagram, Facebook)", "TikTok", "YouTube", "Google Search", "Spotify Marquee", "None yet"],
      },
      {
        id: "budget", kind: "choice", label: "The largest monthly ad budget you've managed",
        options: ["Under $1k", "$1k–$5k", "$5k–$20k", "Over $20k"],
      },
    ],
    rubric: ["Music or entertainment campaign experience", "Hands-on paid social", "Results explained with evidence", "Budget managed"],
    payHint: "Annual salary, in USD",
  },
  playlist: {
    type: "Part time · 25 hrs/wk",
    summary: "Get the right tracks in front of the right curators, every week.",
    description: [
      "You'll own playlist pitching for every release we run: picking which tracks to pitch, matching them to independent curators and editorial contacts, writing the pitches, and tracking what landed. It's a relationship job as much as a research one.",
      "You'll work with the campaign managers on timing and with our distribution partners on DSP editorial pitches. Expect about fifteen releases in flight at any time, most of them singles.",
    ],
    youllDo: [
      "Choose which tracks to pitch and to whom, and say why",
      "Write and send pitches to independent curators, blogs and DSP editorial",
      "Keep our curator list current: who's active, what they add, who's slipped",
      "Track placements and streams per placement, and report them weekly",
    ],
    lookFor: [
      "You listen widely and can explain why a track fits a playlist",
      "A year or more pitching music, curating, or working in music media or radio",
      "Organised outreach: you follow up without being chased",
      "Comfort with Spotify for Artists and a curator platform like SubmitHub or Groover",
    ],
    niceToHave: [
      "Playlists or a radio show of your own",
      "Existing relationships with curators in hip-hop, indie or electronic",
    ],
    questions: [
      {
        id: "playlist", kind: "text", min: 8,
        label: "Link a playlist you curate or a pitch you've written",
        hint: "A Spotify link, a doc, or paste a short pitch.",
        placeholder: "https://open.spotify.com/playlist/...",
      },
      {
        id: "volume", kind: "choice", label: "How many curators or editors do you contact in a typical week?",
        options: ["Under 10", "10–30", "30–60", "More than 60"],
      },
      {
        id: "ep", kind: "text", min: 40,
        label: "An artist sends a 6-track EP. How do you decide which tracks to pitch first?",
        placeholder: "I'd start by listening for...",
      },
    ],
    rubric: ["Pitching or curation track record", "Weekly outreach volume", "Reasoning about fit", "Written pitch quality"],
    payHint: "Hourly, in USD",
  },
};
