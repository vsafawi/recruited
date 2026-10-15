import { ArrowRight, Check, ClipboardCheck, Link2, MoveRight } from "lucide-react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ButtonLink, Card, cx } from "@/components/ui";
import { STAGES, type Board, type Listing, type Role } from "@/data/mock";
import type { RoleCopy } from "./content";
import type { Submission } from "./ApplyForm";
import { addApplicant } from "@/data/store";

/* ---------------------------------------------------------------------------
   After submit: what the candidate sees, then a card for whoever is giving the
   demo that shows what recruited did with the application. No score is shown
   because none was computed — this is a static demo; the card says what would
   be scored and that it uses only what the candidate sent.
   --------------------------------------------------------------------------- */

export function Confirmation({
  submission, role, listing, board, variant, srcLine, copy,
}: {
  submission: Submission;
  role: Role;
  listing: Listing;
  board: Board;
  variant: "A" | "B";
  srcLine: string;
  copy: RoleCopy;
}) {
  useEffect(() => window.scrollTo({ top: 0 }), []);

  // Put the applicant into the demo pipeline once, so "See it in the pipeline"
  // shows their card in New. The ref survives StrictMode's double effect.
  const added = useRef<string | null>(null);
  useEffect(() => {
    if (added.current) return;
    const answered = copy.questions.filter((q) => {
      const v = submission.answers[q.id];
      return Array.isArray(v) ? v.length > 0 : !!v?.trim();
    }).length;
    added.current = addApplicant({
      name: submission.name,
      location: submission.location,
      pay: submission.pay,
      link: submission.link,
      hasResume: !!submission.resume,
      answered,
      questions: copy.questions.length,
      listing,
    }).id;
  }, [copy.questions, listing, submission]);
  const first = submission.name.trim().split(/\s+/)[0];
  const lanes = STAGES.filter((s) => s.id !== "rejected" && s.id !== "hired");
  const initials = submission.name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="mx-auto max-w-2xl px-4 pt-12 sm:px-6 sm:pt-16">
      <div className="j-rise text-center">
        <span className="j-pop mx-auto flex size-12 items-center justify-center rounded-full bg-success text-on-primary shadow-[0_0_0_6px_color-mix(in_oklch,var(--success)_14%,transparent)]">
          <Check className="size-6" strokeWidth={2.5} />
        </span>
        <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.025em]">Application received</h1>
        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted">
          Thanks, {first}. Your application for {role.title} is with the {role.team.toLowerCase()} team. You'll hear back at{" "}
          <span className="text-foreground">{submission.email.trim()}</span> within ten working days, whatever the answer.
        </p>
      </div>

      <Card className="j-rise mt-10 overflow-hidden" >
        <div className="flex items-center justify-between gap-3 border-b border-rim bg-primary-tint px-5 py-3">
          <p className="shrink-0 text-[12px] font-medium uppercase tracking-[0.07em] text-primary">Behind the scenes</p>
          <p className="text-[11.5px] text-muted"><span className="sm:hidden">Demo only</span><span className="hidden sm:inline">Shown for the demo · candidates don't see this</span></p>
        </div>

        <ol className="divide-y divide-rim">
          <Step n={1} icon={<Link2 className="size-4" />} title={<>Attributed to <span className="text-primary">{board.name} · Variant {variant}</span></>}>
            The link the candidate arrived on carries the board and the arm of the split test, so every application counts toward the listing that earned it.
            <code className="mt-2.5 block overflow-x-auto whitespace-nowrap rounded-control bg-inset px-3 py-2 font-mono text-[12px] text-foreground shadow-[inset_0_0_0_1px_var(--rim)] scroll-quiet">
              {srcLine}
            </code>
            <span className="mt-2 block text-[12.5px] text-faint">Testing: {listing.hypothesis.toLowerCase()} · band {listing.payBand}</span>
          </Step>

          <Step n={2} icon={<ClipboardCheck className="size-4" />} title={`Scored against the ${role.title} rubric`}>
            Drawn only from what {first} sent — the resume, the answers above and the pay ask — then placed in Tier A, B or C. Nothing is inferred from a name or a photo.
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {copy.rubric.map((r) => (
                <li key={r} className="rounded-chip bg-inset px-2 py-1 text-[12px] text-foreground/85 shadow-[inset_0_0_0_1px_var(--rim)]">{r}</li>
              ))}
            </ul>
          </Step>

          <Step n={3} icon={<MoveRight className="size-4" />} title="Lands in the New column">
            The hiring manager sees it at the top of the pipeline, tagged with its board and variant.
            <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-5" aria-hidden>
              {lanes.map((s, i) => (
                <div key={s.id} className={cx("min-w-0 rounded-card p-1.5", i > 2 && "hidden sm:block", i === 0 ? "bg-inset shadow-[inset_0_0_0_1px_var(--rim)]" : "bg-inset/50")}>
                  <p className="flex items-center gap-1 truncate text-[10.5px] font-medium text-muted">
                    <span className="size-1.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="truncate">{s.label}</span>
                  </p>
                  {i === 0 ? (
                    <div className="j-rise mt-1.5 rounded-[7px] bg-card p-1.5 shadow-raised" style={{ "--d": "450ms" } as CSSProperties}>
                      <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[8.5px] font-medium text-on-primary">{initials}</span>
                      <span className="mt-1 block truncate text-[10.5px] font-medium">{first}</span>
                      <span className="block truncate font-mono text-[9.5px] text-faint">{board.short}·{variant}</span>
                    </div>
                  ) : (
                    <div className="mt-1.5 space-y-1">
                      <div className="h-5 rounded-[6px] bg-card/70" />
                      {i < 2 && <div className="h-5 rounded-[6px] bg-card/50" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Step>
        </ol>

        <div className="flex flex-col gap-2 border-t border-rim bg-inset/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <ButtonLink to={`/demo/pipeline?role=${role.id}`} variant="primary" className="w-full sm:w-auto">
            See it in the pipeline <ArrowRight className="size-3.5" />
          </ButtonLink>
          <Link to="/demo" className="text-center text-[13px] text-muted hover:text-foreground">
            Or see how this variant is performing
          </Link>
        </div>
      </Card>

      <p className="mt-8 text-center text-[13px] text-muted">
        <Link to="/jobs" className="font-medium text-foreground hover:underline">See the other open roles</Link>
      </p>
    </main>
  );
}

function Step({ n, icon, title, children }: { n: number; icon: ReactNode; title: ReactNode; children: ReactNode }) {
  return (
    <li className="j-rise flex gap-3.5 px-5 py-5" style={{ "--d": `${120 + n * 90}ms` } as CSSProperties}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-card text-primary shadow-card">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold tracking-[-0.01em]">{title}</p>
        <div className="mt-1 text-[13.5px] leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  );
}
