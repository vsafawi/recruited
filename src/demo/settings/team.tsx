import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { Avatar, Button, cx } from "@/components/ui";
import { ROLES } from "@/data/mock";
import { INTERVIEWERS, SCHEDULE, WEEKLY_BUDGET_MIN } from "../interviews/data";
import { inputBase, inputCls, Pill, Section } from "./parts";

export type Access = "Admin" | "Hiring manager" | "Interviewer";
const ACCESS: { id: Access; hint: string }[] = [
  { id: "Admin", hint: "Everything, including boards, billing and this page" },
  { id: "Hiring manager", hint: "Their roles: listings, stages, offers" },
  { id: "Interviewer", hint: "Candidates they are scheduled with, and scorecards" },
];

export interface Member {
  id: string;
  name: string;
  initials: string;
  hue: number;
  email: string;
  access: Access;
  pending?: boolean;
}

const EMAIL: Record<string, string> = { ops: "ops@musicmarket.agency", campaigns: "campaigns@musicmarket.agency", founder: "founder@musicmarket.agency" };

export const INITIAL_TEAM: Member[] = INTERVIEWERS.map((i) => ({
  id: i.id, name: i.name, initials: i.initials, hue: i.hue, email: EMAIL[i.id],
  access: i.id === "founder" ? "Admin" : "Hiring manager",
}));

export default function Team({ value, onChange }: { value: Member[]; onChange: (v: Member[]) => void }) {
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<Access>("Interviewer");
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const invite = () => {
    if (!validEmail) return;
    const local = email.split("@")[0];
    onChange([...value, { id: `inv-${Date.now()}`, name: email, initials: local.slice(0, 2).toUpperCase(), hue: 180, email, access, pending: true }]);
    setEmail("");
    setInviting(false);
  };

  return (
    <Section
      title="Team"
      description="Who can see candidates, and what each person can change. Interview load counts this week's booked interviews."
      actions={<Button variant="ink" size="sm" onClick={() => setInviting((v) => !v)}><UserPlus className="size-3.5" /> Invite</Button>}
    >
      {inviting && (
        <form
          onSubmit={(e) => { e.preventDefault(); invite(); }}
          className="flex flex-col gap-2 rounded-panel bg-card p-3.5 shadow-card sm:flex-row sm:items-center"
        >
          <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@musicmarket.agency" className={cx(inputBase, "w-full sm:flex-1")} aria-label="Email address" />
          <select value={access} onChange={(e) => setAccess(e.target.value as Access)} className={cx(inputBase, "w-full sm:w-44")} aria-label="Access">
            {ACCESS.map((a) => <option key={a.id}>{a.id}</option>)}
          </select>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={!validEmail} className="flex-1 sm:flex-none">Send invite</Button>
            <Button type="button" variant="ghost" onClick={() => setInviting(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-panel bg-card shadow-card">
        {value.map((m, i) => {
          const booked = SCHEDULE.filter((s) => (s.with as string[]).includes(m.id));
          const minutes = booked.reduce((s, b) => s + b.duration, 0);
          const share = Math.min(100, Math.round((minutes / WEEKLY_BUDGET_MIN) * 100));
          const owns = ROLES.filter((r) => r.hiringManager === m.name);
          return (
            <div key={m.id} className={cx("grid gap-3 p-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,170px)] sm:items-center", i > 0 && "border-t border-rim")}>
              <div className="flex min-w-0 items-center gap-3">
                <span className={cx(m.pending && "opacity-50")}><Avatar initials={m.initials} hue={m.hue} size={34} /></span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[13.5px] font-medium">{m.pending ? m.email : m.name}</span>
                    {m.pending && <Pill tone="warning">Invite sent</Pill>}
                  </div>
                  <div className="truncate text-[12.5px] text-muted">
                    {m.pending ? "Joins when they accept" : owns.length ? `Hiring for ${owns.map((r) => r.title).join(", ")}` : m.email}
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                {m.pending ? (
                  <span className="text-[12.5px] text-faint">No interviews yet</span>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                      <span><span className="tnum font-medium">{booked.length}</span> <span className="text-muted">interviews this week</span></span>
                      <span className="tnum text-faint">{Math.round(minutes / 6) / 10}h / {WEEKLY_BUDGET_MIN / 60}h</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-inset">
                      <div className="h-full rounded-full" style={{ width: `${share}%`, background: share > 80 ? "var(--warning)" : "var(--primary)" }} />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={m.access}
                  onChange={(e) => onChange(value.map((x) => (x.id === m.id ? { ...x, access: e.target.value as Access } : x)))}
                  className={inputCls}
                  aria-label={`Access for ${m.name}`}
                  title={ACCESS.find((a) => a.id === m.access)?.hint}
                >
                  {ACCESS.map((a) => <option key={a.id}>{a.id}</option>)}
                </select>
                {m.pending && (
                  <button type="button" aria-label="Cancel invite" onClick={() => onChange(value.filter((x) => x.id !== m.id))} className="rounded-control p-1.5 text-muted hover:bg-[var(--wash)] hover:text-foreground">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <dl className="grid gap-3 sm:grid-cols-3">
        {ACCESS.map((a) => (
          <div key={a.id} className="rounded-card bg-inset px-3 py-2.5">
            <dt className="text-[12.5px] font-medium">{a.id}</dt>
            <dd className="text-[12px] text-muted">{a.hint}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
