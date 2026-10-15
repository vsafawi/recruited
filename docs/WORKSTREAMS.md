# Workstreams

Several people, each with their own Claude in the cloud, build at once. This file is
how we avoid two threads building the same thing or editing the same file.

## The protocol (fast version)

1. **Claim first, on `main`.** Before writing any code, edit the board below — your
   thread's name in **Owner**, **Status** `claimed` — commit, and push straight to
   `main`. Pull first; if someone got there before you, pick another stream. A claim is
   a 30-second commit, and it is the only thing that stops duplicate work.
2. **Shared files are pre-wired in the claim commit.** Routes (`src/main.tsx`), nav
   entries and mounts (`src/demo/Shell.tsx`) are added when you claim, pointing at a
   stub file. After that, a stream edits only the files in its row — never another
   stream's files, never the shared ones.
3. **Build on a branch, merge to `main` when it passes.** `npm run typecheck && npm
   run build`, look at it at 1440px and 390px, then `git merge --no-ff` into `main`.
   Set **Status** to `done` in the same merge.
4. **`styles.css`, `ui.tsx`, `mock.ts` are append-only.** Add a token, a component, a
   field. Don't rename or restyle what's there.
5. **Use `usePeople()` from `src/data/store.ts`**, not `CANDIDATES`, for anything a person can change (stage, star, next step), so every screen agrees.
6. **Hand a stream to a fresh Claude session** by pasting its prompt from below.
   `CLAUDE.md` loads on its own and gives it the rest of the context.

## Board

| # | Stream | Files it owns | Owner | Status |
| --- | --- | --- | --- | --- |
| — | Scaffold, tokens, demo data, shell | `src/styles.css`, `src/components/*`, `src/data/mock.ts`, `src/demo/Shell.tsx`, `src/main.tsx` | lead thread | done |
| — | Deploy configs, README, briefing | `Dockerfile`, `Caddyfile`, `*.json`, `*.toml`, `README.md`, `CLAUDE.md` | lead thread | done |
| — | Landing page | `src/pages/Landing.tsx`, `src/pages/landing/*` | lead thread | done |
| — | Pipeline, candidates, profile | `src/demo/Pipeline.tsx`, `Candidates.tsx`, `CandidateDetail.tsx` | lead thread | done |
| — | Overview, split tests, new role | `src/demo/Overview.tsx`, `Listings.tsx`, `NewRole.tsx` | lead thread | done |
| 1 | Pitch deck | `deck/` or a Slides artifact | deck thread | claimed |
| 2 | Demo script and screenshots | `docs/DEMO.md`, `docs/screenshots/` | deck thread | claimed |
| 3 | Command palette (⌘K) | `src/demo/CommandPalette.tsx` | lead thread | done |
| 4 | Public careers page and apply form | `src/pages/Careers.tsx`, `src/pages/Apply.tsx`, `src/pages/apply/*` | lead thread | claimed |
| 5 | Inbox — every board in one feed | `src/demo/Inbox.tsx` | lead thread | claimed |
| 8 | Interviews — calendar and scheduling | `src/demo/Interviews.tsx` | lead thread | claimed |
| 9 | Shared demo state — a move on one screen shows on every screen | `src/data/store.ts`, `Pipeline.tsx`, `Candidates.tsx`, `CandidateDetail.tsx` | lead thread | done |
| 12 | Interview loop tab on the candidate profile | `src/demo/InterviewLoop.tsx`, `mock.ts` (interview data) | another thread, PR #1 | done — landed without a claim; claim first next time |
| 6 | Dark mode | `src/styles.css` (append a dark block), a toggle in `Shell.tsx` | — | open |
| 7 | Backend (after the hackathon) | `supabase/`, `src/lib/` | — | open |
| 10 | Reports — time to hire, source of hire, cost per hire | `src/demo/Reports.tsx` (+ route and nav in the claim commit) | lead thread | claimed |
| 11 | Team and settings — interviewers, rubric templates, board connections | `src/demo/Settings.tsx` (+ route and nav in the claim commit) | lead thread | claimed |

Already wired and stubbed until their stream lands: `/demo/inbox`, `/demo/interviews`,
`/jobs`, `/jobs/:listingId`, and the rail's search box, which calls `openPalette()`
from `CommandPalette.tsx`.

## Prompts

### 1. Pitch deck (claimed: deck thread)
> Build a 7-slide hackathon pitch deck for recruited.tools using CLAUDE.md for context.
> Slides: (1) title and one-line pitch; (2) the problem — small teams hire across 4+ boards
> and track it in a spreadsheet, and nobody knows which listing brings the hire; (3) the
> insight — measure A-tier candidates per dollar, not applies; (4) the product — pipeline,
> candidate profile, split tests (screenshots of /demo); (5) the case study — Music Market
> Agency, 7 listings across OnlineJobs.ph, Indeed, Music Business Worldwide and Roster,
> OnlineJobs.ph variant B bringing 3.7x more A-tier candidates per dollar (numbers from
> src/data/mock.ts); (6) open source, deploys in five minutes on Cloudflare, Railway,
> Vercel or Docker; (7) roadmap and ask. Plain voice, no exclamation marks.

### 2. Demo script and screenshots (claimed: deck thread)
> Write a 2-minute live demo script for recruited.tools (see CLAUDE.md): which page to
> open, what to click, what to say — landing hero, /demo overview, pipeline drag, a
> candidate profile, /demo/listings verdict, /demo/roles/new publish, /jobs apply. Capture
> 1440x900 screenshots of each step with Playwright into docs/screenshots/. Don't edit src/.

### 6. Dark mode
> Add dark mode to recruited.tools (see CLAUDE.md and the protocol in docs/WORKSTREAMS.md —
> claim it on main first). Redefine every token in styles.css under
> `:root[data-theme="dark"]` and `prefers-color-scheme: dark`, add a toggle in the rail,
> persist it in localStorage inside try/catch. Check every /demo page and the landing page
> at 1440px in both themes.

### 7. Backend
> Design the Supabase schema for recruited.tools (see CLAUDE.md; claim it on main first):
> organisations, roles, listings (with variant and board), candidates, applications
> (attributed to a listing), stages, scorecards, notes. Row-level security per
> organisation. SQL migration in supabase/migrations, a typed client in src/lib/. Don't
> wire it into the screens yet.

### 10. Reports
> Add /demo/reports to recruited.tools (see CLAUDE.md and docs/WORKSTREAMS.md). Claim it on
> main first, adding the route in main.tsx and a nav entry in Shell.tsx with a stub page in
> that claim commit. Then build: time to hire per role, source of hire, cost per hire by
> board, stage conversion, offer acceptance — all derived from src/data/mock.ts, charts as
> inline SVG.

### 11. Team and settings
> Add /demo/settings to recruited.tools (see CLAUDE.md and docs/WORKSTREAMS.md). Claim it on
> main first with the route, nav entry and a stub page. Then build: team members and their
> interview load, rubric templates per role, connected job boards (OnlineJobs.ph, Indeed,
> MBW, Roster) with connect/disconnect state, email templates.
