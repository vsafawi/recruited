import { AlertCircle, Check, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button, cx } from "@/components/ui";
import type { Listing, Role } from "@/data/mock";
import type { Question, RoleCopy } from "./content";

/* ---------------------------------------------------------------------------
   The application form. Nothing is sent anywhere: on submit it validates,
   pauses for a beat and hands the answers up so the page can show what
   happens next. Errors show inline once a field has been left, or on submit.
   --------------------------------------------------------------------------- */

export interface Submission {
  name: string;
  email: string;
  location: string;
  link: string;
  pay: string;
  resume: { name: string; size: number } | null;
  answers: Record<string, string | string[]>;
}

const EMPTY: Submission = { name: "", email: "", location: "", link: "", pay: "", resume: null, answers: {} };
const RESUME_TYPES = /\.(pdf|docx?|rtf|txt)$/i;
const MAX_BYTES = 10 * 1024 * 1024;

function validate(v: Submission, questions: Question[]) {
  const e: Record<string, string> = {};
  if (v.name.trim().length < 2) e.name = "Enter your full name.";
  if (!v.email.trim()) e.email = "Enter an email address so we can reply.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = "That email address doesn't look complete.";
  if (!v.location.trim()) e.location = "Tell us where you're based. City and country is enough.";
  if (v.link.trim() && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v.link.trim()))
    e.link = "Enter a full link, like linkedin.com/in/yourname.";
  if (!v.resume) e.resume = "Attach a resume. PDF or Word, up to 10 MB.";
  if (!v.pay.trim()) e.pay = "Enter what you'd expect to be paid. A range is fine.";
  for (const q of questions) {
    const a = v.answers[q.id];
    if (q.kind === "choice" && !a) e[q.id] = "Pick one.";
    if (q.kind === "text") {
      const len = typeof a === "string" ? a.trim().length : 0;
      if (!len) e[q.id] = "Answer this one. A few sentences is plenty.";
      else if (len < q.min) e[q.id] = `A little more detail, please — at least ${q.min} characters.`;
    }
  }
  return e;
}

const ORDER = (questions: Question[]) => ["name", "email", "location", "link", "resume", ...questions.map((q) => q.id), "pay"];

const fmtBytes = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/* ------------------------------------------------------------------ fields */

const inputCls = (bad: boolean) =>
  cx(
    "block w-full rounded-control bg-card px-3 text-[14.5px] text-foreground placeholder:text-faint outline-none transition-shadow duration-150",
    "shadow-[0_0_0_1px_var(--rim-strong),0_1px_1px_oklch(0_0_0/0.03)] focus:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_color-mix(in_oklch,var(--primary)_16%,transparent)]",
    bad && "shadow-[0_0_0_1px_var(--destructive)] focus:shadow-[0_0_0_1px_var(--destructive),0_0_0_4px_color-mix(in_oklch,var(--destructive)_14%,transparent)]",
  );

function Field({
  id, label, optional, hint, error, children,
}: { id: string; label: string; optional?: boolean; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-[13.5px] font-medium">
        <span>{label}</span>
        {optional && <span className="text-[12px] font-normal text-faint">Optional</span>}
      </label>
      {hint && <p id={`${id}-hint`} className="mt-0.5 text-[12.5px] text-muted">{hint}</p>}
      <div className="mt-2">{children}</div>
      <ErrorLine id={id} error={error} />
    </div>
  );
}

function ErrorLine({ id, error }: { id: string; error?: string }) {
  return (
    <p id={`${id}-error`} role={error ? "alert" : undefined} className={cx("flex items-center gap-1.5 text-[12.5px] text-destructive", error ? "mt-1.5" : "sr-only")}>
      {error && <><AlertCircle className="size-3.5 shrink-0" /> {error}</>}
    </p>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-4 text-[12px] font-medium uppercase tracking-[0.06em] text-faint">{title}</legend>
      {children}
    </fieldset>
  );
}

/* -------------------------------------------------------------------- form */

export function ApplyForm({
  role, listing, copy, onSubmitted,
}: { role: Role; listing: Listing; copy: RoleCopy; onSubmitted: (s: Submission) => void }) {
  const [v, setV] = useState<Submission>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const errors = validate(v, copy.questions);
  const show = (k: string) => (tried || touched[k] ? errors[k] : undefined);
  const touch = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));
  const set = (k: keyof Omit<Submission, "answers" | "resume">) => (e: { target: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.target.value }));
  const answer = (id: string, a: string | string[]) => setV((s) => ({ ...s, answers: { ...s.answers, [id]: a } }));
  const aria = (k: string, hint = false) => ({
    "aria-invalid": !!show(k) || undefined,
    "aria-describedby": [hint && `${k}-hint`, `${k}-error`].filter(Boolean).join(" "),
  });

  const takeFile = (f: File | undefined) => {
    if (!f) return;
    setTouched((t) => ({ ...t, resume: true }));
    if (!RESUME_TYPES.test(f.name)) return setFileError("That file type won't open here. Use PDF or Word.");
    if (f.size > MAX_BYTES) return setFileError(`That file is ${fmtBytes(f.size)}. The limit is 10 MB.`);
    setFileError(null);
    setV((s) => ({ ...s, resume: { name: f.name, size: f.size } }));
  };
  const resumeError = fileError ?? show("resume");

  const fillSample = () => {
    const sample: Submission = {
      name: "Sam Rivera",
      email: "sam.rivera@example.com",
      location: role.id === "va-ops" ? "Cebu, Philippines" : "Austin, TX",
      link: "linkedin.com/in/samrivera",
      pay: listing.payBand === "Not shown" ? "$58k" : listing.payBand,
      resume: { name: "Sam-Rivera-resume.pdf", size: 184_320 },
      answers: Object.fromEntries(
        copy.questions.map((q) => [
          q.id,
          q.kind === "choice" ? q.options[2] ?? q.options[0]
            : q.kind === "multi" ? q.options.slice(0, 3)
            : q.placeholder?.startsWith("http") ? "https://open.spotify.com/playlist/sample"
            : `${(q.placeholder ?? "").replace(/\.\.\.$/, "")} — sample answer for the demo, written to pass the length check.`,
        ]),
      ),
    };
    setV(sample);
    setFileError(null);
    setTouched({});
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    const first = ORDER(copy.questions).find((k) => errors[k] || (k === "resume" && fileError));
    if (first) {
      const el = document.getElementById(first === "resume" ? "resume-drop" : first) ?? document.querySelector<HTMLElement>(`[name="${first}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
      return;
    }
    setSending(true);
    window.setTimeout(() => onSubmitted(v), 750);
  };

  const errorCount = Object.keys(errors).length + (fileError ? 1 : 0);

  return (
    <form id="apply" noValidate onSubmit={submit} className="scroll-mt-6 rounded-panel bg-card p-5 shadow-card sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold tracking-[-0.015em]">Apply for this role</h2>
          <p className="mt-1 text-[13px] text-muted">About five minutes. Every application is read by a person.</p>
        </div>
        <button
          type="button"
          onClick={fillSample}
          className="inline-flex h-7 items-center gap-1.5 rounded-control bg-primary-tint px-2.5 text-[12px] font-medium text-primary hover:brightness-[0.98]"
        >
          Demo: fill with sample answers
        </button>
      </div>

      <div className="mt-7 space-y-9">
        <Group title="About you">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="name" label="Full name" error={show("name")}>
              <input id="name" autoComplete="name" value={v.name} onChange={set("name")} onBlur={touch("name")} className={cx(inputCls(!!show("name")), "h-10.5")} {...aria("name")} />
            </Field>
            <Field id="email" label="Email" error={show("email")}>
              <input id="email" type="email" inputMode="email" autoComplete="email" value={v.email} onChange={set("email")} onBlur={touch("email")} className={cx(inputCls(!!show("email")), "h-10.5")} {...aria("email")} />
            </Field>
          </div>
          <Field id="location" label="Where you're based" error={show("location")}>
            <input id="location" autoComplete="address-level2" placeholder="City, country" value={v.location} onChange={set("location")} onBlur={touch("location")} className={cx(inputCls(!!show("location")), "h-10.5")} {...aria("location")} />
          </Field>
          <Field id="link" label="Portfolio or LinkedIn" optional error={show("link")}>
            <input id="link" type="url" inputMode="url" autoComplete="url" placeholder="linkedin.com/in/yourname" value={v.link} onChange={set("link")} onBlur={touch("link")} className={cx(inputCls(!!show("link")), "h-10.5")} {...aria("link")} />
          </Field>

          <div>
            <p className="text-[13.5px] font-medium">Resume</p>
            {v.resume ? (
              <div className="mt-2 flex items-center gap-3 rounded-card bg-inset px-3 py-3 shadow-[0_0_0_1px_var(--rim)]">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-card shadow-card">
                  <FileText className="size-4 text-primary" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium">{v.resume.name}</span>
                  <span className="flex items-center gap-1 text-[12px] text-muted">
                    <Check className="size-3 text-success" /> {fmtBytes(v.resume.size)} · ready to send
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setV((s) => ({ ...s, resume: null }))}
                  className="flex size-8 shrink-0 items-center justify-center rounded-control text-muted hover:bg-[var(--wash)] hover:text-foreground"
                  aria-label="Remove resume"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <div
                id="resume-drop"
                role="button"
                tabIndex={0}
                aria-describedby="resume-error"
                onClick={() => fileInput.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), fileInput.current?.click())}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); takeFile(e.dataTransfer.files[0]); }}
                className={cx(
                  "mt-2 flex cursor-pointer flex-col items-center justify-center rounded-card border border-dashed px-4 py-7 text-center transition-colors duration-150",
                  dragging ? "border-primary bg-primary-tint" : resumeError ? "border-destructive bg-card" : "border-rim-strong bg-inset/60 hover:bg-inset",
                )}
              >
                <UploadCloud className={cx("size-5", dragging ? "text-primary" : "text-muted")} />
                <p className="mt-2 text-[13.5px]">
                  <span className="font-medium text-primary">Choose a file</span> <span className="text-muted">or drag it here</span>
                </p>
                <p className="mt-0.5 text-[12px] text-faint">PDF or Word, up to 10 MB</p>
              </div>
            )}
            <input ref={fileInput} type="file" accept=".pdf,.doc,.docx,.rtf,.txt" className="hidden" onChange={(e) => { takeFile(e.target.files?.[0]); e.target.value = ""; }} />
            <ErrorLine id="resume" error={resumeError ?? undefined} />
          </div>
        </Group>

        <Group title={`About the ${role.title.toLowerCase()} role`}>
          {copy.questions.map((q) => (
            <QuestionField key={q.id} q={q} value={v.answers[q.id]} error={show(q.id)} onBlur={touch(q.id)} onChange={(a) => answer(q.id, a)} />
          ))}
        </Group>

        <Group title="Pay">
          <Field
            id="pay"
            label="Expected pay"
            error={show("pay")}
            hint={<>{copy.payHint}. This listing's band is <span className="font-medium text-foreground">{listing.payBand === "Not shown" ? "shared at interview" : listing.payBand}</span>.</>}
          >
            <input id="pay" inputMode="text" placeholder={listing.payBand === "Not shown" ? "$55k" : listing.payBand} value={v.pay} onChange={set("pay")} onBlur={touch("pay")} className={cx(inputCls(!!show("pay")), "h-10.5 sm:max-w-60")} {...aria("pay", true)} />
          </Field>
        </Group>
      </div>

      <div className="mt-9 flex flex-col-reverse gap-3 border-t border-rim pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-faint">
          {tried && errorCount ? (
            <span className="text-destructive">{errorCount === 1 ? "One field needs a look." : `${errorCount} fields need a look.`}</span>
          ) : (
            "We use what you send only to consider you for this role."
          )}
        </p>
        <Button type="submit" variant="primary" size="lg" disabled={sending} className="w-full sm:w-auto">
          {sending ? <><Loader2 className="size-4 animate-spin" /> Sending</> : "Submit application"}
        </Button>
      </div>
    </form>
  );
}

function QuestionField({
  q, value, error, onChange, onBlur,
}: { q: Question; value: string | string[] | undefined; error?: string; onChange: (a: string | string[]) => void; onBlur: () => void }) {
  if (q.kind === "text") {
    const text = typeof value === "string" ? value : "";
    const len = text.trim().length;
    return (
      <Field id={q.id} label={q.label} hint={q.hint} error={error}>
        <textarea
          id={q.id}
          rows={q.min > 20 ? 4 : 2}
          value={text}
          placeholder={q.placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={cx(inputCls(!!error), "resize-y py-2.5 leading-relaxed")}
          aria-invalid={!!error || undefined}
          aria-describedby={`${q.hint ? `${q.id}-hint ` : ""}${q.id}-error`}
        />
        {q.min > 20 && (
          <p className={cx("mt-1 text-right text-[11.5px] tnum", len >= q.min ? "text-faint" : "text-muted")}>
            {len >= q.min ? <span className="inline-flex items-center gap-1"><Check className="size-3 text-success" />{len} characters</span> : `${len} / ${q.min} minimum`}
          </p>
        )}
      </Field>
    );
  }
  const multi = q.kind === "multi";
  const picked = multi ? (Array.isArray(value) ? value : []) : value;
  const toggle = (o: string) => {
    if (!multi) return onChange(o);
    const cur = Array.isArray(value) ? value : [];
    onChange(cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o]);
  };
  return (
    <fieldset aria-describedby={`${q.id}-error`} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && onBlur()}>
      <legend className="text-[13.5px] font-medium">
        {q.label}
        {multi && <span className="ml-2 text-[12px] font-normal text-faint">Optional</span>}
      </legend>
      {q.hint && <p className="mt-0.5 text-[12.5px] text-muted">{q.hint}</p>}
      <div className={cx("mt-2.5 flex flex-wrap gap-2", error && "rounded-card")}>
        {q.options.map((o, i) => {
          const on = multi ? (picked as string[]).includes(o) : picked === o;
          return (
            <label
              key={o}
              className={cx(
                "relative inline-flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-control px-3 py-1.5 text-[13px] transition-[background,box-shadow,color] duration-150",
                on
                  ? "bg-primary-tint text-foreground shadow-[0_0_0_1px_var(--primary)]"
                  : error
                    ? "bg-card shadow-[0_0_0_1px_var(--destructive)] hover:bg-inset"
                    : "bg-card shadow-[0_0_0_1px_var(--rim-strong)] hover:bg-inset",
              )}
            >
              <input
                type={multi ? "checkbox" : "radio"}
                name={q.id}
                id={i === 0 ? q.id : undefined}
                value={o}
                checked={on}
                onChange={() => toggle(o)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={cx(
                  "flex size-3.5 shrink-0 items-center justify-center transition-colors",
                  multi ? "rounded-[4px]" : "rounded-full",
                  on ? "bg-primary text-on-primary" : "shadow-[inset_0_0_0_1px_var(--rim-strong)]",
                )}
              >
                {on && (multi ? <Check className="size-2.5" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-on-primary" />)}
              </span>
              {o}
              <span className="pointer-events-none absolute inset-0 rounded-control peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary" />
            </label>
          );
        })}
      </div>
      <ErrorLine id={q.id} error={error} />
    </fieldset>
  );
}
