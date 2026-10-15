import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cx } from "@/components/ui";

/* Light, dark or follow the system. "system" removes data-theme from <html> so
   the prefers-color-scheme block in styles.css takes over. */

export type Theme = "light" | "dark" | "system";

const KEY = "recruited-theme";
const ORDER: Theme[] = ["light", "dark", "system"];

function read(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* storage blocked: fall through to the default */
  }
  return "dark";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}

/** Call once at startup, before the first render, so the page never flashes the wrong theme. */
export function initTheme() {
  if (typeof document === "undefined") return;
  apply(read());
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(read);

  useEffect(() => apply(theme), [theme]);

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label = theme === "system" ? "Theme: system" : `Theme: ${theme}`;

  const cycle = () => {
    const root = document.documentElement;
    const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!calm) {
      root.classList.add("theme-switching");
      window.setTimeout(() => root.classList.remove("theme-switching"), 220);
    }
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* not saved; the choice still applies for this visit */
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${label}. Switch to ${next}.`}
      title={`${label}. Switch to ${next}.`}
      className={cx(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-control text-muted transition-colors duration-150 hover:bg-[var(--wash)] hover:text-foreground",
        className,
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} aria-hidden />
    </button>
  );
}
