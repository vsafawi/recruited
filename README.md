# recruited.tools

An open-source applicant tracking system for small teams. Post one role to every
job board you use, split-test the listing, and see which board and which wording
brings the candidates worth hiring — not just the most applications.

**[Open the live demo →](https://recruited.tools/demo)** · MIT licensed · deploys in five minutes

> Status: hackathon build. This is the frontend, running on sample data. Nothing
> you click saves yet. The backend (Supabase Postgres + auth) is the next milestone;
> see [Roadmap](#roadmap).

## Why

Small teams hire across a handful of boards at once — a remote-talent board, a
general one, a couple of niche industry ones — and end up tracking it all in a
spreadsheet. The question that actually matters never gets answered: *which listing,
on which board, at which pay band, brings you the person you'd hire?*

recruited answers it. Every application is tagged with the listing variant it came
from and scored A, B or C against the role's rubric, so the number you compare is
**A-tier candidates per dollar**, not applies.

The demo uses a real setup: a music marketing agency hiring three roles through
seven listings on OnlineJobs.ph, Indeed, Music Business Worldwide and Roster.

## What's in it

- **Pipeline** — a kanban board per role, drag candidates between stages.
- **Candidates** — one table across every board, with search, filters and bulk actions.
- **Candidate profile** — scorecards, an assistant summary drawn only from what the
  candidate sent (it never invents), notes and the listing they came from.
- **Listings & split tests** — A/B variants side by side, tier mix, cost per qualified
  candidate, and a verdict on which variant wins.
- **New role** — rubric, two variants, pick the boards, publish.

## Run it

```bash
git clone https://github.com/vsafawi/recruited && cd recruited
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
```

## Deploy

It builds to a static site, so it runs anywhere. Every config is already in the repo.

| Host | How |
| --- | --- |
| Cloudflare | Workers & Pages → Create → Import the repo, build command `npm run build`, deploy command `npx wrangler deploy` (reads `wrangler.toml`). Or from your machine: `npm run build && npx wrangler deploy` |
| Railway | New project → deploy from this repo. It picks up `railway.json` and the `Dockerfile` |
| Vercel | Import the repo. `vercel.json` sets the build and SPA rewrites |
| Netlify | Import the repo. `netlify.toml` handles the rest |
| Docker | `docker build -t recruited . && docker run -p 8080:8080 recruited` |
| Supabase | Will hold the database and auth once the backend lands. The frontend can sit on any host above |

## Stack

Vite, React 19, TypeScript, Tailwind CSS v4, React Router, lucide icons. No chart
library — charts are inline SVG. The landing page ships in the first bundle; the app
is split per screen and loads on demand.

```
src/
  data/mock.ts        The demo scenario. Every screen reads from here.
  components/         Shared UI primitives and the logo.
  pages/Landing.tsx   The front page.
  demo/               The app: Shell, Overview, Pipeline, Candidates,
                      CandidateDetail, Listings, NewRole.
```

## Roadmap

1. Supabase schema (roles, listings, candidates, stages, scorecards) and auth.
2. Inbound apply links per listing variant, so every application is attributed.
3. Board connectors: import applicants from Indeed, OnlineJobs.ph and email.
4. Assistant screening against the rubric — summaries drawn only from the application.
5. Significance testing on split tests, not just a fixed confidence figure.

## License

MIT
