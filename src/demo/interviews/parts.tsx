import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { Avatar, cx } from "@/components/ui";
import { interviewerById, type InterviewerId } from "./data";

/** Overlapping interviewer faces. */
export function Faces({ ids, size = 20, className }: { ids: InterviewerId[]; size?: number; className?: string }) {
  return (
    <span className={cx("flex -space-x-1", className)}>
      {ids.map((id) => {
        const p = interviewerById(id);
        return (
          <span key={id} title={p.name} className="rounded-full ring-[1.5px] ring-card">
            <Avatar initials={p.initials} hue={p.hue} size={size} />
          </span>
        );
      })}
    </span>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.06em] text-faint">{children}</h2>
      {aside}
    </div>
  );
}

/**
 * A layer above the page: a sheet from the right on desktop, from the bottom on
 * phones (`variant="sheet"`), or a centred dialog (`variant="dialog"`).
 * Escape and the backdrop close it; focus moves in on open and back on close.
 */
export function Layer({
  open, onClose, label, variant, children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  variant: "sheet" | "dialog";
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => ref.current?.focus());
    return () => {
      window.removeEventListener("keydown", onKey);
      back?.focus?.();
    };
  }, [open, onClose]);

  const sheet = variant === "sheet";
  return (
    <AnimatePresence>
      {open && (
        <div className={cx("fixed inset-0 z-50 flex", sheet ? "items-end md:items-stretch md:justify-end" : "items-end justify-center sm:items-center sm:p-6")}>
          <motion.div
            className="absolute inset-0 bg-black/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={reduce ? { opacity: 0 } : sheet ? { opacity: 0, y: 24, x: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, transition: { duration: 0.14 } }}
            transition={{ duration: reduce ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={cx(
              "relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-card shadow-lift outline-none",
              sheet
                ? "rounded-t-panel md:m-2 md:max-h-none md:w-[440px] md:rounded-panel"
                : "rounded-t-panel sm:max-w-[560px] sm:rounded-panel",
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-control text-muted hover:bg-[var(--wash)] hover:text-foreground"
    >
      <X className="size-4" />
    </button>
  );
}
