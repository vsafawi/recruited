# Workstreams

Each stream owns a set of files so several people (each with their own Claude) can
work at once without stepping on each other. Put your name next to one before you
start. To hand a stream to Claude, paste its **Prompt** into a fresh session opened in
this repo — `CLAUDE.md` loads automatically and gives it the rest of the context.

## Built — first pass done (merged to main)

| Stream | Files | Owner |
| --- | --- | --- |
| Scaffold, tokens, demo data, app shell | `src/styles.css`, `src/components/*`, `src/data/mock.ts`, `src/demo/Shell.tsx`, `src/main.tsx` | done |
| Deploy configs and README | `Dockerfile`, `Caddyfile`, `railway.json`, `wrangler.toml`, `vercel.json`, `netlify.toml`, `README.md` | done |
| Landing page | `src/pages/Landing.tsx`, `src/pages/landing/*` | done |
| Pipeline, candidates, profile | `src/demo/Pipeline.tsx`, `Candidates.tsx`, `CandidateDetail.tsx` | done |
| Overview, listings & split tests, new-role wizard | `src/demo/Overview.tsx`, `Listings.tsx`, `NewRole.tsx` | done |

## Open — pick one

### 1. Pitch deck
**Files:** `deck/` (new) or a Slides artifact — not in `src/`.
**Owner:** _
**Prompt:**
> Build a 7-slide hackathon pitch deck for recruited.tools using CLAUDE.md for context.
> Slides: (1) title + one-line pitch; (2) the problem — small teams hire across 4+ boards
> and track it in a spreadsheet, nobody knows which listing brings the hire; (3) the
> insight — measure A-tier candidates per dollar, not applies; (4) the product — pipeline,
> candidate profile, split tests (use screenshots of /demo); (5) the case study — Music
> Market Agency, 7 listings across OnlineJobs.ph, Indeed, Music Business Worldwide and
> Roster, OnlineJobs.ph variant B bringing 3.7x more A-tier candidates per dollar (numbers
> from src/data/mock.ts); (6) open source and deploys in five minutes on Cloudflare,
> Railway, Vercel or Docker; (7) roadmap and ask. Plain voice, no exclamation marks.

### 2. Demo script and screenshots
**Files:** `docs/DEMO.md`, `docs/screenshots/`
**Owner:** _
**Prompt:**
> Write a 2-minute live demo script for recruited.tools (see CLAUDE.md): which page to
> open, what to click, what to say, in order — landing hero, /demo overview, pipeline drag,
> a candidate profile, /demo/listings split-test verdict, /demo/roles/new publish. Then run
> the app (`npm run build && npx vite preview`) and capture 1440x900 screenshots of each
> step with Playwright into docs/screenshots/. Don't edit anything in src/.

### 3. Command palette (⌘K)
**Files:** `src/demo/CommandPalette.tsx` (new); one import line in `src/demo/Shell.tsx`
**Owner:** _
**Prompt:**
> Add a ⌘K command palette to the recruited.tools demo (see CLAUDE.md). Search candidates,
> roles and listings from src/data/mock.ts; actions "New role", "Go to pipeline", "Go to
> split tests". Keyboard-first, fuzzy match, opens from the search box in the rail. No new
> dependencies. Only touch the new file and the one wiring line in Shell.tsx.

### 4. Public job page + apply form
**Files:** `src/pages/Apply.tsx` (new), one route in `src/main.tsx`
**Owner:** _
**Prompt:**
> Build the candidate-facing side of recruited.tools (see CLAUDE.md): a public job page at
> /jobs/:listingId showing the listing's headline, pay band and role from mock.ts, with an
> apply form (name, email, links, resume upload, 2 screening questions). On submit show a
> confirmation and explain that the application is attributed to this listing variant —
> that attribution is what powers split tests. Clean, fast, mobile-first.

### 5. Inbox: one feed for every board
**Files:** `src/demo/Inbox.tsx` (new), one route in `main.tsx`, one nav entry in `Shell.tsx`
**Owner:** _
**Prompt:**
> Add /demo/inbox to recruited.tools (see CLAUDE.md): a unified feed of incoming
> applications and candidate emails from every board, grouped by day, with board badges,
> tier, and quick triage (advance, reject, star) via keyboard. Mock the messages
> deterministically from CANDIDATES in mock.ts.

### 6. Dark mode
**Files:** `src/styles.css` (append a dark block), a toggle in `src/demo/Shell.tsx`
**Owner:** _
**Prompt:**
> Add dark mode to recruited.tools (see CLAUDE.md): redefine every token in styles.css
> under `:root[data-theme="dark"]` and `prefers-color-scheme: dark`, add a toggle in the
> rail, persist it in localStorage inside try/catch. Check every /demo page and the landing
> page at 1440px in both themes.

### 7. Backend (after the hackathon)
**Files:** `supabase/` (new), `src/lib/` (new)
**Owner:** _
**Prompt:**
> Design the Supabase schema for recruited.tools (see CLAUDE.md): organisations, roles,
> listings (with variant and board), candidates, applications (attributed to a listing),
> stages, scorecards, notes. Row-level security per organisation. Write the SQL migration
> in supabase/migrations and a typed client in src/lib/. Don't wire it into the screens yet.

## Rules for running streams in parallel

- Stay in your files. If you must touch a shared file (`styles.css`, `ui.tsx`,
  `mock.ts`, `main.tsx`, `Shell.tsx`), only append, and say so in the team chat.
- One branch per stream. Merge to `main` after `npm run typecheck && npm run build` pass.
- Update this table when you start and when you finish.
