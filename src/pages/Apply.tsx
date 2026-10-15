import { ArrowDown, ArrowRight, Briefcase, Clock, MapPin, PauseCircle, Users, Wallet } from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ButtonLink, Card } from "@/components/ui";
import { BOARDS, boardById, LISTINGS, ROLES, type BoardId } from "@/data/mock";
import { ApplyForm, type Submission } from "./apply/ApplyForm";
import { Confirmation } from "./apply/Confirmation";
import { COMPANY, ROLE_COPY } from "./apply/content";
import { Bullets, Page } from "./apply/parts";

/* ---------------------------------------------------------------------------
   /jobs/:listingId — one listing as a candidate sees it, and the form. The
   ?src= and ?v= the board link carries decide attribution; without them the
   listing's own board and variant are used, which is what the server would
   fall back to as well.
   --------------------------------------------------------------------------- */

export default function Apply() {
  const { listingId = "" } = useParams();
  const [params] = useSearchParams();
  const listing = LISTINGS.find((l) => l.id === listingId);
  const role = listing && ROLES.find((r) => r.id === listing.roleId);
  const copy = role && ROLE_COPY[role.id];
  const [sent, setSent] = useState<Submission | null>(null);

  useEffect(() => {
    document.title = role ? `${role.title} — ${COMPANY.name}` : `Careers — ${COMPANY.name}`;
  }, [role]);

  if (!listing || !role || !copy) return <NotFound id={listingId} />;

  const srcParam = params.get("src");
  const board = BOARDS.find((b) => b.id === srcParam) ?? boardById(listing.board);
  const vParam = params.get("v")?.toUpperCase();
  const variant = vParam === "A" || vParam === "B" ? vParam : listing.variant;
  const srcLine = `/jobs/${listing.id}?src=${board.id as BoardId}&v=${variant}`;
  const pay = listing.payBand === "Not shown" ? "Shared at interview" : listing.payBand;
  const closed = listing.status === "paused";
  const siblings = LISTINGS.filter((l) => l.roleId === role.id && l.id !== listing.id && l.status !== "paused");

  if (sent)
    return (
      <Page back>
        <Confirmation submission={sent} role={role} listing={listing} board={board} variant={variant} srcLine={srcLine} copy={copy} />
      </Page>
    );

  const meta: { icon: ReactNode; label: string; value: string }[] = [
    { icon: <Wallet className="size-3.5" />, label: "Pay", value: pay },
    { icon: <MapPin className="size-3.5" />, label: "Location", value: role.location },
    { icon: <Users className="size-3.5" />, label: "Team", value: role.team },
    { icon: <Clock className="size-3.5" />, label: "Type", value: copy.type },
  ];

  return (
    <Page back>
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <header className="j-rise pb-8 pt-10 sm:pt-14">
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted">
            <Briefcase className="size-3.5 text-faint" /> {role.title}
          </p>
          <h1 className="mt-3 max-w-3xl text-balance text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[34px]">
            {listing.headline}
          </h1>
          <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-muted">{copy.summary}</p>

          <dl className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
            {meta.map((m) => (
              <div key={m.label} className="flex items-center gap-2.5 rounded-card bg-card px-3 py-2 shadow-card">
                <span className="text-faint">{m.icon}</span>
                <span className="min-w-0">
                  <dt className="text-[11px] leading-tight text-faint">{m.label}</dt>
                  <dd className="truncate text-[13px] font-medium leading-snug">{m.value}</dd>
                </span>
              </div>
            ))}
          </dl>

          {!closed && (
            <a href="#apply" className="mt-6 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-control bg-foreground px-5 text-[14.5px] font-medium text-background transition-colors hover:bg-foreground/90 sm:w-auto lg:hidden">
              Apply for this role <ArrowDown className="size-4" />
            </a>
          )}
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
          <article className="j-rise min-w-0 max-w-2xl" style={{ "--d": "60ms" } as CSSProperties}>
            <Section title="The role">
              {copy.description.map((p) => (
                <p key={p.slice(0, 24)} className="mt-3 text-[14.5px] leading-[1.7] text-foreground/85 first:mt-0">{p}</p>
              ))}
            </Section>
            <Section title="What you'll do"><Bullets items={copy.youllDo} /></Section>
            <Section title="What we look for"><Bullets items={copy.lookFor} /></Section>
            <Section title="Nice to have"><Bullets items={copy.niceToHave} /></Section>
            <Section title="How hiring works">
              <ol className="mt-3 grid gap-2 sm:grid-cols-3">
                {["A short read of your application and answers", "A 30-minute call, then a paid trial task", "A final conversation with the team"].map((t, i) => (
                  <li key={t} className="rounded-card bg-card px-3.5 py-3 text-[13px] leading-snug text-foreground/85 shadow-card">
                    <span className="block font-mono text-[11px] text-faint">0{i + 1}</span>
                    <span className="mt-1 block">{t}</span>
                  </li>
                ))}
              </ol>
            </Section>

            <div className="mt-12">
              {closed ? (
                <Card className="p-6">
                  <div className="flex items-start gap-3">
                    <PauseCircle className="mt-0.5 size-5 shrink-0 text-warning" />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[16px] font-semibold">This listing isn't taking applications</h2>
                      <p className="mt-1 text-[13.5px] text-muted">
                        The role is still open. Apply through {siblings.length === 1 ? "its live listing" : "one of its live listings"} instead.
                      </p>
                      <div className="mt-4 space-y-2">
                        {siblings.map((s) => (
                          <Link
                            key={s.id}
                            to={`/jobs/${s.id}?src=${s.board}&v=${s.variant}`}
                            className="flex min-w-0 items-center gap-2 rounded-control bg-card px-3 py-2 text-[13px] font-medium shadow-card hover:bg-inset"
                          >
                            <span className="min-w-0 flex-1 truncate">{s.headline}</span>
                            <ArrowRight className="size-3.5 shrink-0 text-muted" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <ApplyForm role={role} listing={listing} copy={copy} onSubmitted={setSent} />
              )}
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-6 space-y-3">
              <Card className="p-5">
                <p className="text-[12px] text-faint">{COMPANY.name}</p>
                <p className="mt-0.5 text-[15px] font-semibold leading-snug tracking-[-0.01em]">{role.title}</p>
                <dl className="mt-4 space-y-2.5">
                  {meta.map((m) => (
                    <div key={m.label} className="flex items-center justify-between gap-3 text-[13px]">
                      <dt className="flex items-center gap-2 text-muted"><span className="text-faint">{m.icon}</span>{m.label}</dt>
                      <dd className="truncate text-right font-medium">{m.value}</dd>
                    </div>
                  ))}
                </dl>
                {!closed && (
                  <a href="#apply" className="mt-5 flex h-10 w-full items-center justify-center gap-1.5 rounded-control bg-foreground text-[13.5px] font-medium text-background transition-colors hover:bg-foreground/90">
                    Apply for this role <ArrowDown className="size-3.5" />
                  </a>
                )}
              </Card>
              <p className="px-1 text-[12px] leading-relaxed text-faint">
                You found this on {board.name}. Applying takes about five minutes, and every application is read by a person.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </Page>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-[16px] font-semibold tracking-[-0.01em]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <Page back>
      <main className="mx-auto max-w-md px-4 pt-20 text-center sm:px-6">
        <p className="font-mono text-[12px] text-faint">/jobs/{id}</p>
        <h1 className="mt-3 text-[24px] font-semibold tracking-[-0.02em]">This listing isn't here</h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
          It may have been filled or taken down, or the link was cut short. The roles that are open now are all on one page.
        </p>
        <ButtonLink to="/jobs" variant="ink" size="lg" className="mt-7">
          See open roles <ArrowRight className="size-4" />
        </ButtonLink>
      </main>
    </Page>
  );
}
