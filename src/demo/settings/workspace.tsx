import { ExternalLink } from "lucide-react";
import { cx } from "@/components/ui";
import { Field, inputBase, inputCls, Section } from "./parts";

export interface Workspace { name: string; monogram: string; hue: number; timezone: string }
export const INITIAL_WORKSPACE: Workspace = { name: "Music Market Agency", monogram: "MM", hue: 285, timezone: "America/New_York" };

const ZONES = [
  ["America/Los_Angeles", "Los Angeles (UTC−7)"],
  ["America/New_York", "New York (UTC−4)"],
  ["Europe/London", "London (UTC+1)"],
  ["Asia/Manila", "Manila (UTC+8)"],
  ["Australia/Sydney", "Sydney (UTC+11)"],
] as const;
const HUES = [285, 235, 152, 68, 25, 320];

export default function WorkspaceSection({ value, onChange }: { value: Workspace; onChange: (v: Workspace) => void }) {
  const set = (p: Partial<Workspace>) => onChange({ ...value, ...p });
  return (
    <Section title="Workspace" description="How your company shows up to candidates, on the careers page and in every email.">
      <Field label="Company name" htmlFor="ws-name">
        <input id="ws-name" value={value.name} onChange={(e) => set({ name: e.target.value })} className={cx(inputCls, "max-w-[360px]")} />
      </Field>

      <Field label="Logo" hint="A monogram until you upload a file. Two letters read best.">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-card text-[16px] font-semibold tracking-[-0.02em] text-white"
            style={{ background: `linear-gradient(140deg, oklch(0.62 0.15 ${value.hue}), oklch(0.45 0.16 ${value.hue + 25}))`, boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.25), 0 0 0 1px oklch(0 0 0 / 0.06)" }}
            aria-hidden
          >
            {value.monogram || "?"}
          </span>
          <input
            value={value.monogram}
            maxLength={2}
            onChange={(e) => set({ monogram: e.target.value.toUpperCase() })}
            className={cx(inputBase, "w-16 text-center font-medium")}
            aria-label="Monogram letters"
          />
          <div className="flex gap-1.5" role="radiogroup" aria-label="Logo colour">
            {HUES.map((h) => (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={value.hue === h}
                aria-label={`Hue ${h}`}
                onClick={() => set({ hue: h })}
                className={cx("size-6 rounded-full transition-shadow", value.hue === h && "shadow-[0_0_0_2px_var(--card),0_0_0_4px_var(--foreground)]")}
                style={{ background: `oklch(0.58 0.15 ${h})` }}
              />
            ))}
          </div>
        </div>
      </Field>

      <Field label="Careers page" hint="Every live listing, with an apply form. Applications from it are tagged like any board's.">
        <div className="flex min-w-0 max-w-[360px] items-center gap-2 rounded-control bg-inset px-2.5 py-1.5 text-[13px]">
          <span className="min-w-0 flex-1 truncate font-mono text-[12.5px]">recruited.tools/jobs</span>
          <a href="/jobs" target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-primary hover:underline">
            Open <ExternalLink className="size-3.5" />
          </a>
        </div>
      </Field>

      <Field label="Timezone" hint="Interview times, digests and 'applied today' use it." htmlFor="ws-tz">
        <select id="ws-tz" value={value.timezone} onChange={(e) => set({ timezone: e.target.value })} className={cx(inputCls, "max-w-[360px]")}>
          {ZONES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </Field>
    </Section>
  );
}
