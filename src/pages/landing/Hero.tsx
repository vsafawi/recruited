import { ArrowRight } from "lucide-react";
import { ButtonLink, GithubIcon, Index, cx } from "@/components/ui";
import { Mark3D, Wordmark } from "@/components/mark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BOARDS, LISTINGS, ROLES } from "@/data/mock";
import { useScrollSpy } from "./hooks";

export const GITHUB = "https://github.com/vsafawi/recruited";

/** The catalogue, in page order. Ids are the anchors the sidebar links to. */
export const ENTRIES = [
  { id: "split-tests", title: "Split tests" },
  { id: "pipeline", title: "Pipeline" },
  { id: "interview-loop", title: "Interview loop" },
  { id: "apply-page", title: "Apply page" },
  { id: "deploy", title: "Deploy" },
] as const;

/**
 * The intro: the pitch, the mark and the way into the demo. A sticky sidebar
 * from 1024px up, the top of the page below it.
 */
export function Intro() {
  const active = useScrollSpy(ENTRIES.map((e) => e.id));
  return (
    <div className="flex flex-col px-4 pt-6 pb-8 sm:px-8 lg:h-full lg:px-7 lg:pt-8 lg:pb-6">
      <div className="rise flex items-center gap-2">
        <a href="#top" aria-label="recruited.tools home">
          <Wordmark className="text-[14px]" />
        </a>
        <a
          href={GITHUB}
          target="_blank"
          rel="noreferrer"
          aria-label="recruited on GitHub"
          className="ml-auto grid size-8 place-items-center rounded-control text-muted transition-colors hover:bg-[var(--wash)] hover:text-foreground"
        >
          <GithubIcon className="size-4" />
        </a>
        <ThemeToggle />
      </div>

      <div className="rise mt-10 lg:mt-12" style={{ ["--d" as string]: "60ms" }}>
        <Mark3D size={60} />
      </div>
      <h1
        className="rise mt-8 text-[23px] leading-[1.2] font-semibold tracking-[-0.025em] text-balance"
        style={{ ["--d" as string]: "120ms" }}
      >
        Hire from the listing that brings A‑tier candidates.
      </h1>
      <p className="rise mt-3 text-[13.5px] leading-relaxed text-pretty text-muted" style={{ ["--d" as string]: "180ms" }}>
        One applicant tracker for every board you post on. Split-test your listings to see which board and which wording
        bring the candidates worth hiring, and what each one costs you.
      </p>
      <div className="rise mt-5 flex flex-wrap items-center gap-2" style={{ ["--d" as string]: "240ms" }}>
        <ButtonLink to="/demo" variant="primary">
          Open the demo <ArrowRight className="size-3.5" />
        </ButtonLink>
        <a
          href="#deploy"
          className="inline-flex h-8.5 items-center rounded-control bg-card px-3.5 text-[13px] font-medium shadow-card transition-colors hover:bg-inset"
        >
          Deploy it
        </a>
      </div>
      <p className="rise mt-3 text-[12px] text-faint" style={{ ["--d" as string]: "280ms" }}>
        Open source · MIT · No account needed for the demo
      </p>

      <nav aria-label="Sections" className="rise mt-8 hidden border-t rule-dashed pt-6 lg:block" style={{ ["--d" as string]: "320ms" }}>
        <div className="mb-2 px-2 text-[12px] text-faint">What’s inside</div>
        <ul className="space-y-0.5">
          {ENTRIES.map((e, i) => (
            <li key={e.id}>
              <a
                href={`#${e.id}`}
                aria-current={active === e.id ? "true" : undefined}
                className={cx(
                  "flex h-7.5 items-center gap-2.5 rounded-control px-2 text-[13px] transition-colors duration-150",
                  active === e.id ? "bg-inset font-medium text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                <Index n={i + 1} />
                {e.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto hidden pt-6 text-[12px] leading-relaxed text-faint lg:block">
        <div className="font-medium text-muted">Built on sample data</div>
        Music Market Agency’s search: {ROLES.length} roles, {LISTINGS.length} listings, {BOARDS.length} boards. Nothing you click in the demo is saved.
      </div>
    </div>
  );
}
