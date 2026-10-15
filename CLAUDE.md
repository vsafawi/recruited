# recruited.tools — working agreement

This is the briefing for any coding agent (Claude, Cursor, Codex, ...) working in this
repo. `AGENTS.md` is a symlink to it. Read it before writing code.

## What this is

An open-source applicant tracking system (ATS) for small businesses and startups.
Post one role to every job board you use, **split-test the listing** (pay band, wording,
board), and see which variant brings the candidates worth hiring. The metric that
matters is **A-tier candidates per dollar**, not applications.

Built at a hackathon. Today it is a **frontend-only demo on sample data** — nothing
saves. Judges need to understand the product in two minutes; the demo has to look
real and feel fast.

The real-world scenario behind the demo: Music Market Agency (a music marketing
agency) hiring per position, running seven listings across OnlineJobs.ph, Indeed,
Music Business Worldwide Jobs and Roster, split-testing listings to see which tier of
candidate each brings and what it costs.

## Hard rules

- **Never mention "Hired" or "hired.tools"** anywhere — code, copy, commits. This
  product is recruited.tools and stands on its own.
- **Voice:** plain, direct, second person, no marketing fluff, no exclamation marks,
  no emoji. Sentences carry information.
- **Fast:** no new dependencies without a reason. No chart library — charts are inline
  SVG. The landing page is in the first bundle; every `/demo` screen is lazy-loaded
  (`src/main.tsx`). Keep it that way.
- **One data file:** every number on every screen comes from `src/data/mock.ts`, so
  the landing page and the demo always agree. Change data there, not inline.
- **One design system:** tokens live in `src/styles.css` (Tailwind v4 `@theme`),
  primitives in `src/components/ui.tsx`. Use `bg-card`, `text-muted`, `shadow-card`,
  `rounded-panel` etc. Don't hard-code colours or add a second set of components.
- **Responsive:** every page works at 390px wide with no horizontal page scroll.
- **Respect `prefers-reduced-motion`.** Animations play once on entry; nothing loops.
- **No fabrication:** anything that looks like AI output (screening summaries, drafted
  variants) is labelled as drawn only from what the candidate sent, or as a draft for
  you to edit.

## The map

```
src/main.tsx                Routes. / is the landing page, /demo/* is the app.
src/styles.css              Design tokens (oklch surfaces, ink, accent, stage + tier colours, shadows).
src/data/mock.ts            The demo scenario: STAGES, BOARDS, ROLES, LISTINGS, CANDIDATES,
                            ACTIVITY, plus totals(), aTierPerDollar(), costPerQualified().
src/components/ui.tsx       Button, ButtonLink, StageChip, TierBadge, Avatar, Card,
                            Sparkline, TierBar, Kbd, GithubIcon.
src/components/mark.tsx     Logo: Mark, Wordmark, Mark3D (CSS 3D, no WebGL).
src/pages/Landing.tsx       Landing page (+ src/pages/landing/).
src/demo/Shell.tsx          App layout (left rail) and PageHeader.
src/demo/Pipeline.tsx       /demo/pipeline — kanban, drag between stages.
src/demo/Candidates.tsx     /demo/candidates — table, filters, bulk actions.
src/demo/CandidateDetail.tsx /demo/candidates/:id — profile, scorecard, notes.
src/demo/Listings.tsx       /demo — the split-test showpiece, and the app's home.
src/demo/NewRole.tsx        /demo/roles/new — 4-step wizard to post variants.
Dockerfile, Caddyfile, railway.json, wrangler.toml, vercel.json, netlify.toml
                            Deploy configs. It builds to a static site in dist/.
docs/WORKSTREAMS.md         Who is building what, and the claim-first protocol. Read before starting.
docs/pitch/DECK.md          The pitch: problem, positioning, pricing, market size, roadmap, with sources.
                            Product decisions (what's free, what's paid, what we claim) should match it.
docs/pitch/QA.md            Judge and investor questions with the answers we give.
docs/DEMO.md                The 2½-minute demo click path. Update it when a screen it uses changes.
```

## Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # must be clean
npm run build      # must succeed before you push
```

## How we work during the hackathon

- Claim a workstream in `docs/WORKSTREAMS.md` with a commit to `main` BEFORE you build,
  pre-wiring its route and nav with a stub in that commit. Then stay inside the
  files it lists. Parallel work only stays safe if two people never edit the same file.
- Shared files (`styles.css`, `ui.tsx`, `mock.ts`, `main.tsx`, `Shell.tsx`) are
  append-only during the hackathon: add a token, a component, a field or a route; don't
  rename or restyle what's there. Say so in the team chat when you do.
- Branch per workstream, `npm run typecheck && npm run build` before every push, small
  commits with imperative messages that describe what it does for the user.
- Before calling something done, open it at 1440px and 390px.
