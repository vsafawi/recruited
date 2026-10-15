import { ArrowRight, Clock, MapPin, Wallet } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { boardById, LISTINGS, ROLES, type Listing, type Role } from "@/data/mock";
import { COMPANY, ROLE_COPY } from "./apply/content";
import { Monogram, Page } from "./apply/parts";

/* ---------------------------------------------------------------------------
   /jobs — Music Market Agency's hosted careers page. One card per role; under
   it, each live listing of that role, because each is a separate arm of a
   split test and a separate address a board links to.
   --------------------------------------------------------------------------- */

const liveListings = (r: Role) => LISTINGS.filter((l) => l.roleId === r.id && l.status !== "paused");

/** "$55–65k" and "$55–65k" collapse; different bands show as a range of bands. */
function payRange(ls: Listing[]) {
  const bands = [...new Set(ls.map((l) => l.payBand).filter((b) => b !== "Not shown"))];
  return bands.length ? bands.join(" or ") : "Shared at interview";
}

export default function Careers() {
  const open = ROLES.filter((r) => liveListings(r).length);
  return (
    <Page>
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="j-rise pb-10 pt-12 sm:pt-16">
          <Monogram size={56} />
          <h1 className="mt-6 text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[40px]">
            Work at {COMPANY.name}
          </h1>
          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-muted">{COMPANY.about}</p>
          <p className="mt-4 max-w-2xl text-[14.5px] leading-relaxed text-foreground/80">{COMPANY.long}</p>
          <dl className="mt-7 grid max-w-lg grid-cols-3 gap-3">
            {COMPANY.facts.map((f) => (
              <div key={f.label} className="rounded-card bg-card px-3 py-2.5 shadow-card">
                <dt className="text-[11.5px] text-faint">{f.label}</dt>
                <dd className="mt-0.5 text-[13.5px] font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="open-roles" className="j-rise" style={{ "--d": "80ms" } as CSSProperties}>
          <div className="flex items-baseline justify-between gap-3 border-b border-rim pb-3">
            <h2 id="open-roles" className="text-[17px] font-semibold tracking-[-0.01em]">
              Open roles <span className="ml-1 font-normal text-faint tnum">{open.length}</span>
            </h2>
            <span className="text-[12.5px] text-faint">All remote</span>
          </div>

          <ul className="mt-5 space-y-4">
            {open.map((r) => {
              const ls = liveListings(r);
              const copy = ROLE_COPY[r.id];
              return (
                <li key={r.id} className="overflow-hidden rounded-panel bg-card shadow-card">
                  <Link to={`/jobs/${ls[0].id}`} className="group block px-5 pb-4 pt-5 transition-colors hover:bg-inset/60">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-faint">{r.team}</p>
                        <h3 className="mt-1 text-[18px] font-semibold leading-snug tracking-[-0.015em]">{r.title}</h3>
                        {copy && <p className="mt-1.5 text-[14px] text-muted">{copy.summary}</p>}
                      </div>
                      <ArrowRight className="mt-6 size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </div>
                    <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-muted">
                      <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5 text-faint" />{r.location}</span>
                      <span className="inline-flex items-center gap-1.5"><Wallet className="size-3.5 text-faint" />{payRange(ls)}</span>
                      <span className="inline-flex items-center gap-1.5"><Clock className="size-3.5 text-faint" />{copy?.type ?? "Full time"}</span>
                    </div>
                  </Link>
                  <div className="border-t border-rim bg-inset/50 px-5 py-3">
                    <p className="text-[11.5px] text-faint">
                      {ls.length === 1 ? "1 live listing" : `${ls.length} live listings`} · candidates usually arrive on one from a job board
                    </p>
                    <ul className="mt-2 space-y-1">
                      {ls.map((l) => (
                        <li key={l.id}>
                          <Link
                            to={`/jobs/${l.id}?src=${l.board}&v=${l.variant}`}
                            className="group -mx-2 flex items-center gap-3 rounded-control px-2 py-1.5 text-[13px] hover:bg-card"
                          >
                            <span className="min-w-0 flex-1 truncate text-foreground/90 group-hover:text-foreground">{l.headline}</span>
                            <span className="hidden shrink-0 text-[12px] text-faint sm:inline">{boardById(l.board).name}</span>
                            <span className="shrink-0 rounded-chip bg-card px-1.5 py-0.5 font-mono text-[10.5px] text-muted shadow-[0_0_0_1px_var(--rim)]">
                              {l.variant}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="mt-6 text-[13px] text-muted">
            Every application is read by the hiring manager for that role, and you'll hear back either way within ten working days.
          </p>
        </section>
      </main>
    </Page>
  );
}
