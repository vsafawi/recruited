import { useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";
import { cx } from "@/components/ui";
import { CANDIDATES, ROLES } from "@/data/mock";
import { inputBase, inputCls, labelCls, Section } from "./parts";

export interface Template { id: string; name: string; when: string; subject: string; body: string }

export const INITIAL_TEMPLATES: Template[] = [
  {
    id: "screen", name: "Invite to screen", when: "Moving to Screen",
    subject: "{{role}} at {{company}}: a 20-minute call",
    body: "Hi {{first_name}},\n\nThanks for applying for the {{role}} role. We'd like to set up a 20-minute call to hear more about your work.\n\nPick any time that suits you here: {{booking_link}}\n\n{{sender}}\n{{company}}",
  },
  {
    id: "trial", name: "Trial task", when: "Moving to Assessment",
    subject: "A short paid trial for {{role}}",
    body: "Hi {{first_name}},\n\nThanks for the call. The next step is a short trial task, paid at your asking rate. It should take about two hours.\n\nThe brief is attached. Send it back by {{due_date}}, and tell us if that date doesn't work.\n\n{{sender}}",
  },
  {
    id: "offer", name: "Offer", when: "Moving to Offer",
    subject: "Your offer for {{role}}",
    body: "Hi {{first_name}},\n\nWe'd like to offer you the {{role}} role at {{company}}. The written offer is attached, including pay, start date and hours.\n\nTake the time you need to read it. If you have questions, reply here or book a call: {{booking_link}}\n\n{{sender}}",
  },
  {
    id: "no", name: "Polite no", when: "Moving to Rejected",
    subject: "Your application for {{role}}",
    body: "Hi {{first_name}},\n\nThanks for applying for the {{role}} role and for the time you put in. We've decided to move ahead with other candidates this time.\n\nWe'll keep your details on file and get in touch if a role opens that fits.\n\n{{sender}}\n{{company}}",
  },
];

const VARS = ["first_name", "role", "company", "sender", "booking_link", "due_date"] as const;

export default function Emails({ value, onChange, company }: { value: Template[]; onChange: (v: Template[]) => void; company: string }) {
  const [activeId, setActiveId] = useState(value[0].id);
  const [sampleId, setSampleId] = useState(CANDIDATES[0].id);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const t = value.find((x) => x.id === activeId)!;
  const sample = CANDIDATES.find((c) => c.id === sampleId)!;

  const vars: Record<string, string> = useMemo(() => ({
    first_name: sample.name.split(" ")[0],
    role: ROLES.find((r) => r.id === sample.roleId)?.title ?? "",
    company,
    sender: ROLES.find((r) => r.id === sample.roleId)?.hiringManager ?? "Founder",
    booking_link: "recruited.tools/book/mma",
    due_date: "Friday 23 October",
  }), [sample, company]);

  const patch = (p: Partial<Template>) => onChange(value.map((x) => (x.id === t.id ? { ...x, ...p } : x)));

  const insert = (v: string) => {
    const el = bodyRef.current;
    const token = `{{${v}}}`;
    if (!el) return patch({ body: t.body + token });
    const { selectionStart: a, selectionEnd: b } = el;
    patch({ body: t.body.slice(0, a) + token + t.body.slice(b) });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + token.length, a + token.length); });
  };

  return (
    <Section title="Email templates" description="Sent from your own address when you move a candidate. You review each one before it goes.">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex min-w-0 gap-1 overflow-x-auto scroll-quiet lg:flex-col lg:overflow-visible">
          {value.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setActiveId(x.id)}
              className={cx(
                "shrink-0 rounded-control px-3 py-2 text-left transition-colors",
                x.id === activeId ? "bg-card shadow-card" : "hover:bg-[var(--wash)]",
              )}
            >
              <div className={cx("text-[13px]", x.id === activeId ? "font-medium" : "text-muted")}>{x.name}</div>
              <div className="whitespace-nowrap text-[11.5px] text-faint">{x.when}</div>
            </button>
          ))}
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Subject</span>
              <input value={t.subject} onChange={(e) => patch({ subject: e.target.value })} className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelCls}>Body</span>
              <textarea
                ref={bodyRef}
                value={t.body}
                onChange={(e) => patch({ body: e.target.value })}
                rows={12}
                className={cx(inputCls, "h-auto resize-y py-2 font-mono text-[12.5px] leading-relaxed")}
              />
            </label>
            <div>
              <div className={labelCls}>Insert a variable</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {VARS.map((v) => (
                  <button key={v} type="button" onClick={() => insert(v)} className="rounded-chip bg-primary-tint px-1.5 py-0.5 font-mono text-[11.5px] text-primary hover:brightness-95">
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className={labelCls}>Preview</span>
              <select value={sampleId} onChange={(e) => setSampleId(e.target.value)} className={cx(inputBase, "h-7 max-w-[60%] text-[12px]")} aria-label="Preview as candidate">
                {CANDIDATES.slice(0, 12).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="min-w-0 rounded-panel bg-card shadow-card">
              <div className="border-b border-rim px-4 py-3 text-[12.5px]">
                <div className="truncate text-muted">To <span className="text-foreground">{sample.name}</span></div>
                <div className="mt-0.5 font-medium [overflow-wrap:anywhere]"><Filled text={t.subject} vars={vars} /></div>
              </div>
              <div className="whitespace-pre-wrap px-4 py-3 text-[13px] leading-relaxed [overflow-wrap:anywhere]"><Filled text={t.body} vars={vars} /></div>
            </div>
            <p className="flex items-start gap-1.5 text-[12px] text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0" /> Highlighted words come from the candidate and role. An unknown variable shows in red and won't send.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Filled({ text, vars }: { text: string; vars: Record<string, string> }) {
  const parts = text.split(/(\{\{\s*[a-z_]+\s*\}\})/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\{\{\s*([a-z_]+)\s*\}\}$/);
        if (!m) return <span key={i}>{p}</span>;
        const v = vars[m[1]];
        return v != null ? (
          <mark key={i} className="rounded-[4px] bg-primary-tint px-0.5 text-foreground">{v}</mark>
        ) : (
          <mark key={i} className="rounded-[4px] px-0.5 text-destructive" style={{ background: "color-mix(in oklch, var(--destructive) 12%, transparent)" }}>{p}</mark>
        );
      })}
    </>
  );
}
