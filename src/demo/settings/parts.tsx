/**
 * Small building blocks for the settings screen: the section frame, a labelled
 * row, the input style and a dialog. Local to settings so the shared ui.tsx
 * stays as it is during the hackathon.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "@/components/ui";

export const inputBase =
  "h-8.5 min-w-0 rounded-control bg-card px-2.5 text-[13px] text-foreground shadow-card outline-none placeholder:text-faint transition-shadow focus:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_color-mix(in_oklch,var(--primary)_16%,transparent)]";
export const inputCls = `${inputBase} w-full`;

export const labelCls = "text-[11px] font-medium uppercase tracking-[0.06em] text-faint";

export function Section({ title, description, actions, children }: { title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rim pb-4">
        <div className="min-w-0 max-w-[60ch]">
          <h2 className="text-[16px] font-semibold tracking-[-0.01em]">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}

/** A label on the left, the control on the right; stacks on a phone. */
export function Field({ label, hint, children, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:gap-6">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-[13px] font-medium">{label}</label>
        {hint && <p className="text-[12.5px] text-muted">{hint}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Pill({ tone = "muted", children }: { tone?: "success" | "muted" | "warning" | "primary"; children: ReactNode }) {
  const col = { success: "var(--success)", muted: "var(--muted)", warning: "var(--warning)", primary: "var(--primary)" }[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-chip px-1.5 py-0.5 text-[11.5px] font-medium"
      style={{ color: col, background: `color-mix(in oklch, ${col} 12%, transparent)` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: col }} />
      {children}
    </span>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-control bg-inset p-0.5 scroll-quiet">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cx(
            "h-7 shrink-0 whitespace-nowrap rounded-[6px] px-2.5 text-[12.5px] transition-colors",
            value === o.id ? "bg-card font-medium text-foreground shadow-card" : "text-muted hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Dialog({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>("input, textarea, button")?.focus());
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[440px] rounded-panel bg-card shadow-overlay motion-safe:animate-[settings-pop_220ms_var(--enter)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-rim px-4 py-3">
          <h3 className="text-[14px] font-semibold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-control p-1 text-muted hover:bg-[var(--wash)] hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-rim px-4 py-3">{footer}</div>}
      </div>
      <style>{`@keyframes settings-pop { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}
