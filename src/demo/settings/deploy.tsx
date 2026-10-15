import { Cloud, Database, Download, Scale, Server } from "lucide-react";
import { Button, ButtonLink, GithubIcon } from "@/components/ui";
import { Section } from "./parts";

const GITHUB_URL = "https://github.com/vsafawi/recruited";

const HOSTS = [
  { icon: Cloud, name: "Cloudflare", what: "The app as a static site on Pages. Free for a team this size." },
  { icon: Server, name: "Railway", what: "One click from the repo. The Dockerfile and railway.json are already there." },
  { icon: Database, name: "Supabase", what: "Postgres for candidates and scorecards, with row-level security per company." },
];

export default function Deploy({ onExport, counts }: { onExport: () => void; counts: { candidates: number; listings: number; scorecards: number } }) {
  return (
    <Section title="Deploy and data" description="This is open source. You run it on your own accounts, and the data never leaves them.">
      <div className="grid gap-3 md:grid-cols-3">
        {HOSTS.map(({ icon: Icon, name, what }) => (
          <div key={name} className="rounded-panel bg-card p-4 shadow-card">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-8 items-center justify-center rounded-card bg-inset text-muted"><Icon className="size-4" /></span>
              <span className="text-[13.5px] font-medium">{name}</span>
            </div>
            <p className="mt-2 text-[12.5px] text-muted">{what}</p>
          </div>
        ))}
      </div>
      <p className="text-[13px] text-muted">Self-hosted on your own Cloudflare, Railway or Supabase account. Vercel, Netlify and plain Docker work too.</p>

      <div className="flex flex-col gap-3 rounded-panel bg-card p-4 shadow-card sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium">Export all data</div>
          <p className="tnum text-[12.5px] text-muted">
            One JSON file: {counts.candidates} candidates, {counts.listings} listings, {counts.scorecards} scorecards, your boards, team, rubrics, stages and templates.
          </p>
        </div>
        <Button onClick={onExport}><Download className="size-4" /> Download JSON</Button>
      </div>

      <div className="flex flex-col gap-3 rounded-panel bg-card p-4 shadow-card sm:flex-row sm:items-center">
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-card bg-inset text-muted"><Scale className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-medium">MIT licence</div>
          <p className="text-[12.5px] text-muted">Use it, change it, run it for clients. Keep the licence file with the code.</p>
        </div>
        <ButtonLink to={GITHUB_URL} variant="ink"><GithubIcon className="size-4" /> View on GitHub</ButtonLink>
      </div>
    </Section>
  );
}
