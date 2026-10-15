import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { Button, cx } from "@/components/ui";
import { STAGES, type StageId } from "@/data/mock";
import { usePeople } from "@/data/store";
import { inputCls, Section } from "./parts";

export interface StageRow { id: StageId; label: string; color: string }
export const INITIAL_STAGES: StageRow[] = STAGES.map((s) => ({ ...s }));

/** The stage hues, in order. Clicking a dot moves to the next one. */
const PALETTE = STAGES.map((s) => s.color);

export default function Stages({ value, onChange }: { value: StageRow[]; onChange: (v: StageRow[]) => void }) {
  const [people] = usePeople();
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const changed = value.some((s, i) => s.id !== STAGES[i].id || s.label !== STAGES[i].label || s.color !== STAGES[i].color);

  return (
    <Section
      title="Pipeline stages"
      description="The columns on the pipeline board, in order. Rename a stage to match how your team talks; candidates keep their place."
      actions={changed && <Button size="sm" variant="ghost" onClick={() => onChange(INITIAL_STAGES)}><RotateCcw className="size-3.5" /> Restore defaults</Button>}
    >
      <ol className="overflow-hidden rounded-panel bg-card shadow-card">
        {value.map((s, i) => {
          const count = people.filter((p) => p.stage === s.id).length;
          return (
            <li key={s.id} className={cx("flex items-center gap-3 px-3 py-2.5 sm:px-4", i > 0 && "border-t border-rim")}>
              <span className="tnum w-4 shrink-0 text-right text-[12px] text-faint">{i + 1}</span>
              <button
                type="button"
                onClick={() => onChange(value.map((x) => (x.id === s.id ? { ...x, color: PALETTE[(PALETTE.indexOf(x.color) + 1) % PALETTE.length] } : x)))}
                className="flex size-6 shrink-0 items-center justify-center rounded-full hover:bg-[var(--wash)]"
                aria-label={`Change colour of ${s.label}`}
                title="Change colour"
              >
                <span className="size-2.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 0 3px color-mix(in oklch, ${s.color} 18%, transparent)` }} />
              </button>
              <input
                value={s.label}
                onChange={(e) => onChange(value.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))}
                className={cx(inputCls, "max-w-[280px] bg-transparent shadow-none hover:shadow-card focus:bg-card")}
                aria-label={`Name of stage ${i + 1}`}
              />
              <span className="tnum ml-auto hidden shrink-0 text-[12px] text-muted sm:inline">{count} {count === 1 ? "candidate" : "candidates"}</span>
              <div className="flex shrink-0 gap-0.5">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${s.label} up`} className="rounded-control p-1.5 text-muted hover:bg-[var(--wash)] hover:text-foreground disabled:opacity-30">
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={`Move ${s.label} down`} className="rounded-control p-1.5 text-muted hover:bg-[var(--wash)] hover:text-foreground disabled:opacity-30">
                  <ArrowDown className="size-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-[12.5px] text-muted">Hired and Rejected close a candidate out. They stay on the board so the reports can count them.</p>
    </Section>
  );
}
