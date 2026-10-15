import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, Check, Clock, FileText, Globe, MapPin, UploadCloud, Users, Wallet, X } from "lucide-react";
import { Button, ButtonLink, Card, cx } from "@/components/ui";
import { Mark } from "@/components/mark";
import { boardById, LISTINGS, ROLES, type Listing, type Role } from "@/data/mock";

/**
 * The candidate-facing job page, mounted at /jobs/:listingId. Each listing
 * variant has its own URL, so every application arrives already tagged with
 * the board and the variant it came from. Nothing uploads or saves: this is
 * the demo.
 */

const COMPANY = "Music Market Agency";

interface Question {
  id: string;
  label: string;
  hint: string;
}

interface RoleCopy {
  summary: string;
  doing: string[];
  lookingFor: string[];
  questions: [Question, Question];
}

const ROLE_COPY: Record<string, RoleCopy> = {
  "va-ops": {
    summary:
      "You keep our artist campaigns running on time. Our campaign managers plan the releases; you make sure every asset, deadline and handoff is where it should be, across Notion, Asana and Spotify for Artists.",
    doing: [
      "Build and maintain release checklists for each artist campaign.",
      "Upload assets, pitch forms and metadata to distributors and Spotify for Artists.",
      "Keep the campaign board in Asana current and chase overdue tasks.",
      "Prepare a short weekly status note for each active campaign.",
    ],
    lookingFor: [
      "Two or more years as a virtual assistant or operations coordinator.",
      "Daily, confident use of Notion and Asana, or tools like them.",
      "Written English clear enough to send to artists and their managers.",
      "Music or entertainment experience helps. It is not required.",
    ],
    questions: [
      { id: "q1", label: "Walk us through a release, launch or event you coordinated. What did you own, and what tools did you use?", hint: "A few sentences is enough." },
      { id: "q2", label: "Three tasks land at 5pm, all due tomorrow, and you can finish two. How do you decide what slips, and who do you tell?", hint: "Tell us what you would actually do." },
    ],
  },
  "campaign-mgr": {
    summary:
      "You run release campaigns for independent artists from the first plan to the week after release day. You own the strategy, the budget and the result, and you report it back to the artist in plain numbers.",
    doing: [
      "Plan release campaigns: timeline, budget, DSP pitching, paid social and press.",
      "Run Meta and TikTok ad spend and move budget to what is working.",
      "Be the main contact for four to six artists and their managers at a time.",
      "Write a post-campaign report: what we spent, what it returned, what we would change.",
    ],
    lookingFor: [
      "Three or more years marketing music releases, at a label, distributor or agency.",
      "Hands-on experience running paid social for artists.",
      "Comfort with Chartmetric, Spotify for Artists or similar data tools.",
      "Able to work US business hours.",
    ],
    questions: [
      { id: "q1", label: "Pick one release campaign you ran. What was the budget, what did you spend it on, and what changed because of it?", hint: "Numbers help more than adjectives." },
      { id: "q2", label: "An artist's single is two weeks out and pre-saves are well below plan. What do you do in those two weeks?", hint: "Be specific about channels and spend." },
    ],
  },
  playlist: {
    summary:
      "You get our artists' music in front of the playlist curators who matter for their genre. You keep the curator list, write the pitches, and track what got placed and what it did for streams.",
    doing: [
      "Pitch new releases to independent curators, blogs and editorial teams.",
      "Maintain our curator database: genres, contact history, placements.",
      "Submit tracks through Spotify for Artists and distributor pitch tools ahead of release.",
      "Report placements and the streams they drove after each release.",
    ],
    lookingFor: [
      "Experience pitching music to curators, radio or press.",
      "Working knowledge of SubmitHub, Groover or direct curator outreach.",
      "Organised enough to manage dozens of pitches a week without dropping one.",
      "You listen widely and can tell us where a track fits.",
    ],
    questions: [
      { id: "q1", label: "Tell us about a placement you landed, or a pitch you would send. Who was the curator, and why did the track fit their list?", hint: "Name the playlist if you can." },
      { id: "q2", label: "How do you decide which curators to pitch a new release to, and how many?", hint: "Describe the process, not the ideal." },
    ],
  },
};

const MIN_ANSWER = 30;
const MAX_FILE_MB = 10;
const FILE_TYPES = [".pdf", ".doc", ".docx"];

const inputCls =
  "h-10 w-full min-w-0 rounded-control bg-card px-3 text-[14px] shadow-[0_0_0_1px_var(--rim),0_1px_1px_oklch(0_0_0/0.03)] outline-none transition-shadow placeholder:text-faint focus:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_color-mix(in_oklch,var(--primary)_15%,transparent)]";
const invalidCls =
  "aria-invalid:shadow-[0_0_0_1px_var(--destructive)] aria-invalid:focus:shadow-[0_0_0_1px_var(--destructive),0_0_0_4px_color-mix(in_oklch,var(--destructive)_15%,transparent)]";

type Values = { name: string; email: string; linkedin: string; portfolio: string; q1: string; q2: string };
type Errors = Partial<Record<keyof Values | "resume" | "links", string>>;

const EMPTY: Values = { name: "", email: "", linkedin: "", portfolio: "", q1: "", q2: "" };

function isUrl(v: string) {
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.hostname.includes(".");
  } catch {
    return false;
  }
}

function validate(v: Values, file: File | null): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "Enter an email address we can reply to.";
  if (v.linkedin.trim() && !isUrl(v.linkedin.trim())) e.linkedin = "That doesn't look like a link.";
  if (v.portfolio.trim() && !isUrl(v.portfolio.trim())) e.portfolio = "That doesn't look like a link.";
  if (!v.linkedin.trim() && !v.portfolio.trim()) e.links = "Add at least one link: LinkedIn or a portfolio.";
  if (!file) e.resume = "Attach your resume.";
  for (const q of ["q1", "q2"] as const) {
    const n = v[q].trim().length;
    if (!n) e[q] = "Answer this question.";
    else if (n < MIN_ANSWER) e[q] = `A little more, please. ${MIN_ANSWER - n} more characters.`;
  }
  return e;
}

function fileProblem(f: File) {
  const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
  if (!FILE_TYPES.includes(ext)) return "Use a PDF or Word document.";
  if (f.size > MAX_FILE_MB * 1024 * 1024) return `Keep it under ${MAX_FILE_MB} MB.`;
  return null;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const STYLE = `
@keyframes apply-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes apply-pop { from { opacity: 0; transform: scale(.6); } to { opacity: 1; transform: none; } }
.apply-rise { animation: apply-rise .5s var(--enter) both; }
.apply-pop { animation: apply-pop .45s var(--enter) .1s both; }
@media (prefers-reduced-motion: reduce) { .apply-rise, .apply-pop { animation: none; } }
`;

export default function Apply() {
  const { listingId = "" } = useParams();
  const listing = LISTINGS.find((l) => l.id === listingId);
  const role = listing && ROLES.find((r) => r.id === listing.roleId);
  const copy = role && ROLE_COPY[role.id];

  useEffect(() => {
    document.title = role ? `${role.title} · ${COMPANY}` : `Job not found · ${COMPANY}`;
  }, [role]);

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-page">
      <style>{STYLE}</style>
      <CompanyBar />
      <main className="flex-1">
        {listing && role && copy ? <JobPage listing={listing} role={role} copy={copy} /> : <NotFound />}
      </main>
      <PoweredBy />
    </div>
  );
}

function CompanyMonogram() {
  return (
    <svg width={30} height={30} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="8" fill="var(--foreground)" />
      {[7, 11, 15, 19, 23].map((x, i) => {
        const h = [6, 12, 16, 10, 5][i];
        return <rect key={x} x={x} y={16 - h / 2} width="2.4" height={h} rx="1.2" fill="var(--background)" />;
      })}
    </svg>
  );
}

function CompanyBar() {
  return (
    <header className="border-b border-rim bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <CompanyMonogram />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{COMPANY}</div>
            <div className="text-[11.5px] text-muted">Careers</div>
          </div>
        </div>
        <span className="hidden rounded-chip bg-inset px-2 py-1 text-[11.5px] text-muted sm:inline">Demo page. Nothing you enter is sent.</span>
      </div>
    </header>
  );
}

function PoweredBy() {
  return (
    <footer className="border-t border-rim">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-[12.5px] text-muted sm:px-6">
        <span>© {COMPANY}</span>
        <Link to="/" className="inline-flex items-center gap-1.5 rounded-chip hover:text-foreground">
          <Mark size={14} />
          Powered by <span className="font-medium text-foreground">recruited.tools</span>
        </Link>
      </div>
    </footer>
  );
}

function NotFound() {
  return (
    <div className="apply-rise mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="mb-5 inline-flex size-12 items-center justify-center rounded-panel bg-card text-muted shadow-card">
        <Briefcase className="size-5" />
      </span>
      <h1 className="text-[22px] font-semibold tracking-[-0.02em]">This job isn't open</h1>
      <p className="mt-2 text-[14px] text-muted">
        The link may be old, or the role may already be filled. Check the board you came from for the current listing.
      </p>
      <ButtonLink to="/" variant="ink" className="mt-6">
        <ArrowLeft className="size-3.5" /> Go to the home page
      </ButtonLink>
    </div>
  );
}

function Meta({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
      <span className="text-faint [&>svg]:size-3.5">{icon}</span>
      {children}
    </span>
  );
}

function JobPage({ listing, role, copy }: { listing: Listing; role: Role; copy: RoleCopy }) {
  const board = boardById(listing.board);
  const [submitted, setSubmitted] = useState<{ name: string; email: string } | null>(null);
  const asideRef = useRef<HTMLElement>(null);

  const others = ROLES.filter((r) => r.id !== role.id)
    .map((r) => LISTINGS.find((l) => l.roleId === r.id && l.status !== "paused"))
    .filter((l): l is Listing => !!l);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <section className="apply-rise">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="rounded-chip bg-primary-tint px-2 py-0.5 font-medium text-primary">{role.team}</span>
          <span className="text-faint">Posted on {board.name}</span>
        </div>
        <h1 className="max-w-3xl text-balance text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[34px]">
          {listing.headline}
        </h1>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <Meta icon={<Briefcase />}>{role.title}</Meta>
          <Meta icon={<MapPin />}>{role.location}</Meta>
          <Meta icon={<Wallet />}>
            <span className="tnum font-medium text-foreground">{listing.payBand === "Not shown" ? "Pay discussed at interview" : listing.payBand}</span>
          </Meta>
          <Meta icon={<Clock />}>Posted {listing.daysLive} days ago</Meta>
        </div>
        {!submitted && (
          <Button
            variant="primary"
            size="lg"
            className="mt-5 w-full sm:w-auto lg:hidden"
            onClick={() => asideRef.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" })}
          >
            Apply now
          </Button>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-10">
        <article className="apply-rise min-w-0 space-y-8 text-[14.5px] leading-relaxed" style={{ animationDelay: "60ms" }}>
          <section>
            <h2 className="mb-2 text-[15px] font-semibold">The role</h2>
            <p className="text-foreground/85">{copy.summary}</p>
          </section>
          <section>
            <h2 className="mb-2.5 text-[15px] font-semibold">What you'll do</h2>
            <List items={copy.doing} />
          </section>
          <section>
            <h2 className="mb-2.5 text-[15px] font-semibold">What we look for</h2>
            <List items={copy.lookingFor} />
          </section>
          <section>
            <h2 className="mb-2 text-[15px] font-semibold">About {COMPANY}</h2>
            <p className="text-foreground/85">
              We are a small, remote music marketing agency. We plan and run release campaigns for independent artists:
              playlist pitching, paid social, press and the operations that hold it together.
            </p>
          </section>
          <section>
            <h2 className="mb-3 text-[15px] font-semibold">How hiring works</h2>
            <ol className="grid gap-2 sm:grid-cols-4">
              {["Apply here", "Short screening call", "Paid trial task", "Interview and offer"].map((s, i) => (
                <li key={s} className="flex items-center gap-2.5 rounded-card bg-card px-3 py-2.5 text-[13px] shadow-card sm:flex-col sm:items-start sm:gap-1.5">
                  <span className="tnum font-mono text-[11px] text-faint">0{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[13px] text-muted">
              Hiring manager: {role.hiringManager}. You hear back from a person either way, usually within a week.
            </p>
          </section>
        </article>

        <aside ref={asideRef} className="min-w-0 scroll-mt-4 lg:sticky lg:top-6 lg:self-start">
          {submitted ? (
            <Confirmation listing={listing} role={role} name={submitted.name} email={submitted.email} />
          ) : (
            <ApplyForm
              copy={copy}
              role={role}
              onDone={(v) => {
                setSubmitted(v);
                requestAnimationFrame(() => {
                  if (window.innerWidth < 1024) asideRef.current?.scrollIntoView({ block: "start" });
                });
              }}
            />
          )}
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mt-14 border-t border-rim pt-8">
          <h2 className="mb-3 text-[15px] font-semibold">Other open roles</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((l) => {
              const r = ROLES.find((x) => x.id === l.roleId)!;
              return (
                <Link
                  key={l.id}
                  to={`/jobs/${l.id}`}
                  onClick={() => window.scrollTo({ top: 0 })}
                  className="group flex min-w-0 items-center justify-between gap-3 rounded-card bg-card px-4 py-3 shadow-card transition-shadow hover:shadow-raised"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium">{r.title}</span>
                    <span className="block truncate text-[12.5px] text-muted">
                      {r.team} · {r.location}
                    </span>
                  </span>
                  <span className="tnum shrink-0 text-[12.5px] text-muted group-hover:text-foreground">{l.payBand}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5 text-foreground/85">
          <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-primary/60" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium leading-snug">
        {label}
        {optional && <span className="ml-1.5 font-normal text-faint">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-err`} className="text-[12.5px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12.5px] text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

function ApplyForm({ copy, role, onDone }: { copy: RoleCopy; role: Role; onDone: (v: { name: string; email: string }) => void }) {
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const [v, setV] = useState<Values>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [fileErr, setFileErr] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const [drag, setDrag] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const set = (k: keyof Values) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = { ...v, [k]: e.target.value };
    setV(next);
    if (tried) setErrors(validate(next, file));
  };

  const pick = (f: File | undefined) => {
    if (!f) return;
    const p = fileProblem(f);
    setFileErr(p);
    const nf = p ? null : f;
    setFile(nf);
    if (tried) setErrors(validate(v, nf));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    pick(e.dataTransfer.files?.[0]);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    const errs = validate(v, file);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      const target = first === "links" ? "linkedin" : first;
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(target))}`)?.focus();
      return;
    }
    setSending(true);
    setTimeout(() => onDone({ name: v.name.trim(), email: v.email.trim() }), 650);
  };

  const err = (k: keyof Errors) => errors[k];
  const aria = (k: keyof Values) => ({
    id: id(k),
    "aria-invalid": !!err(k) || ((k === "linkedin" || k === "portfolio") && !!err("links")) || undefined,
    "aria-describedby": err(k) ? `${id(k)}-err` : undefined,
  });
  const resumeError = fileErr ?? err("resume");
  const errorCount = Object.keys(errors).length;

  return (
    <Card className="apply-rise p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Apply for this role</h2>
        <p className="mt-1 text-[13px] text-muted">{role.title}. Takes about five minutes.</p>
      </div>

      <form ref={formRef} noValidate onSubmit={submit} className="space-y-4">
        <Field label="Full name" htmlFor={id("name")} error={err("name")}>
          <input {...aria("name")} className={cx(inputCls, invalidCls)} value={v.name} onChange={set("name")} autoComplete="name" />
        </Field>
        <Field label="Email" htmlFor={id("email")} error={err("email")}>
          <input {...aria("email")} type="email" inputMode="email" className={cx(inputCls, invalidCls)} value={v.email} onChange={set("email")} autoComplete="email" />
        </Field>

        <div className="space-y-3">
          <Field label="LinkedIn" htmlFor={id("linkedin")} error={err("linkedin")}>
            <input
              {...aria("linkedin")}
              type="url"
              inputMode="url"
              placeholder="linkedin.com/in/your-name"
              className={cx(inputCls, invalidCls)}
              value={v.linkedin}
              onChange={set("linkedin")}
            />
          </Field>
          <Field label="Portfolio or website" htmlFor={id("portfolio")} error={err("portfolio")}>
            <input
              {...aria("portfolio")}
              type="url"
              inputMode="url"
              placeholder="A site, a playlist, a case study"
              className={cx(inputCls, invalidCls)}
              value={v.portfolio}
              onChange={set("portfolio")}
            />
          </Field>
          {err("links") ? (
            <p className="text-[12.5px] text-destructive">{err("links")}</p>
          ) : (
            <p className="text-[12.5px] text-faint">One of the two is enough.</p>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <span id={id("resume-label")} className="text-[13px] font-medium">
            Resume
          </span>
          {file ? (
            <div className="flex min-w-0 items-center gap-3 rounded-control bg-inset px-3 py-2.5 shadow-[0_0_0_1px_var(--rim)]">
              <FileText className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{file.name}</span>
                <span className="block text-[12px] text-muted">{formatSize(file.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInput.current) fileInput.current.value = "";
                  if (tried) setErrors(validate(v, null));
                }}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-control text-muted hover:bg-[var(--wash)] hover:text-foreground"
                aria-label="Remove file"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={id("resume")}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              className={cx(
                "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-card border border-dashed px-4 py-6 text-center transition-colors",
                drag ? "border-primary bg-primary-tint" : resumeError ? "border-destructive bg-card" : "border-rim-strong bg-inset hover:bg-card",
              )}
            >
              <UploadCloud className={cx("size-5", drag ? "text-primary" : "text-muted")} />
              <span className="text-[13px]">
                <span className="font-medium text-primary">Choose a file</span> or drag it here
              </span>
              <span className="text-[12px] text-faint">PDF or Word, up to {MAX_FILE_MB} MB</span>
            </label>
          )}
          <input
            ref={fileInput}
            id={id("resume")}
            type="file"
            accept={FILE_TYPES.join(",")}
            className="sr-only"
            aria-labelledby={id("resume-label")}
            aria-invalid={!!resumeError || undefined}
            onChange={(e) => pick(e.target.files?.[0])}
          />
          {resumeError && <p className="text-[12.5px] text-destructive">{resumeError}</p>}
        </div>

        <div className="space-y-4 border-t border-rim pt-4">
          <p className="text-[12.5px] text-muted">Two questions from the hiring manager. Plain answers are best.</p>
          {copy.questions.map((q, i) => {
            const k = q.id as "q1" | "q2";
            return (
              <Field key={q.id} label={`${i + 1}. ${q.label}`} htmlFor={id(k)} error={err(k)} hint={q.hint}>
                <textarea
                  {...aria(k)}
                  rows={4}
                  className={cx(inputCls, invalidCls, "h-auto resize-y py-2.5 leading-relaxed")}
                  value={v[k]}
                  onChange={set(k)}
                />
              </Field>
            );
          })}
        </div>

        <div className="pt-1">
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={sending}>
            {sending ? "Sending application" : "Submit application"}
          </Button>
          <p className="mt-2.5 text-center text-[12px] text-faint" aria-live="polite">
            {tried && errorCount > 0
              ? `${errorCount} ${errorCount === 1 ? "thing needs" : "things need"} fixing above.`
              : "Your answers go only to the hiring team."}
          </p>
        </div>
      </form>
    </Card>
  );
}

function Confirmation({ listing, role, name, email }: { listing: Listing; role: Role; name: string; email: string }) {
  const board = boardById(listing.board);
  const first = name.split(/\s+/)[0];
  const rows: [ReactNode, string, string][] = [
    [<Globe key="b" />, "Board", board.name],
    [<Users key="v" />, "Variant", listing.variant],
    [<FileText key="h" />, "Listing", listing.headline],
  ];
  return (
    <Card className="apply-rise overflow-hidden">
      <div className="p-5 sm:p-6" role="status">
        <span className="apply-pop mb-4 inline-flex size-10 items-center justify-center rounded-full bg-success text-white">
          <Check className="size-5" strokeWidth={2.5} />
        </span>
        <h2 className="text-[18px] font-semibold tracking-[-0.01em]">Thanks, {first}. Your application is in.</h2>
        <p className="mt-1.5 text-[13.5px] text-muted">
          The {role.team.toLowerCase()} team reads every application for the {role.title} role. You will hear back at{" "}
          <span className="font-medium text-foreground">{email}</span> either way.
        </p>
      </div>

      <div className="border-t border-rim bg-inset p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <Mark size={14} className="text-foreground" />
          <h3 className="text-[13px] font-semibold">How this application is attributed</h3>
        </div>
        <dl className="space-y-2">
          {rows.map(([icon, k, val]) => (
            <div key={k} className="flex min-w-0 items-start gap-2.5 text-[13px]">
              <span className="mt-0.5 text-faint [&>svg]:size-3.5">{icon}</span>
              <dt className="w-16 shrink-0 text-muted">{k}</dt>
              <dd className="min-w-0 flex-1 font-medium">
                {k === "Variant" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex size-5 items-center justify-center rounded-[5px] bg-primary-tint font-mono text-[11px] text-primary">{listing.variant}</span>
                    <span className="font-normal text-muted">of a two-variant split test</span>
                  </span>
                ) : (
                  val
                )}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
          {COMPANY} posts the same role as more than one listing, with different wording, pay bands or boards. Each
          listing has its own link, so your application is tagged with the board and variant you applied through. That tag
          is what powers their split tests: once your application is scored, it counts toward variant {listing.variant} on{" "}
          {board.name}, and they keep the listings that bring the strongest candidates for the money. It doesn't change
          how your application is read.
        </p>
        <p className="mt-3 text-[12px] text-faint">This is a demo. Nothing was uploaded or sent.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ButtonLink to="/demo/listings" variant="secondary" size="sm">
            See the split test
          </ButtonLink>
          <ButtonLink to="/" variant="ghost" size="sm">
            About recruited.tools
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}
