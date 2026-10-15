import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Compass, X } from "lucide-react";
import { Button, cx, GithubIcon, Kbd } from "@/components/ui";

/**
 * A six-step walk through the demo for someone who has two minutes.
 *
 * Mounted once in Shell, outside the keyed <main>, so it survives route
 * changes. Each step navigates and, when it can find its target, draws a soft
 * ring around it. Targets are found from markup that already exists on each
 * page (headings by text, landmarks by label) so no page has to know about the
 * tour. A target that isn't there just means no ring.
 */

const GITHUB_URL = "https://github.com/vsafawi/recruited";
const DISMISS_KEY = "rt-tour-dismissed";

type Target = { selector: string; text?: string; closest?: string; noScroll?: boolean };

type Step = {
  path?: string;
  title: string;
  body: string;
  /** Tried in order; the first one on the page gets the ring. */
  target?: Target | Target[];
};

const STEPS: Step[] = [
  {
    path: "/demo",
    title: "Everything you're hiring for, on one screen",
    body: "Board ROI shows what each job board costs against the A-tier candidates it brings. Below it, today's to-dos.",
    target: { selector: "h2", text: "Board ROI", closest: ".rounded-panel" },
  },
  {
    path: "/demo/listings",
    title: "The split test",
    body: "The same role posted as two variants. Judge them on A-tier candidates per dollar — here variant B brings 3.7× more.",
    target: { selector: 'section[id^="exp-"] .rounded-panel' },
  },
  {
    path: "/demo/pipeline",
    title: "Move people through the pipeline",
    body: "Drag a candidate to move them. Every card shows the board and variant they came from.",
    target: { selector: '[draggable="true"][role="button"]' },
  },
  {
    path: "/demo/candidates/c8",
    title: "One candidate, in full",
    body: "The summary is drawn only from her application and the interviewers' scorecards, and it's marked as a draft for you to check. Each round's scorecard sits under it.",
    target: [
      { selector: "h2", text: "Summary for the hiring team", closest: ".rounded-panel" },
      { selector: "h2", text: "Screening summary", closest: ".rounded-panel" },
    ],
  },
  {
    path: "/demo/interviews",
    title: "Book interviews",
    body: "Book interviews against everyone's real calendar. Open slots are the times every interviewer is free.",
    target: { selector: 'section[aria-label="This week"]' },
  },
  {
    title: "Try it as a candidate",
    body: "Open a live listing and apply the way a candidate would. The code is open source if you want to run your own.",
    target: { selector: `aside a[href="${GITHUB_URL}"]`, noScroll: true },
  },
];

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* storage blocked; the pill just comes back next visit */
  }
}

function findTarget(t: Target | Target[]): HTMLElement | null {
  if (Array.isArray(t)) {
    for (const x of t) {
      const el = findTarget(x);
      if (el) return el;
    }
    return null;
  }
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(t.selector));
  const hit = t.text ? nodes.find((n) => n.textContent?.trim() === t.text) : nodes[0];
  if (!hit) return null;
  return t.closest ? (hit.closest<HTMLElement>(t.closest) ?? hit) : hit;
}

type Box = { top: number; left: number; width: number; height: number };

/** Tracks the step's target: waits for lazy pages, follows resize and every scroll container. */
function useTargetBox(target: Target | Target[] | undefined, key: number, reduce: boolean) {
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    setBox(null);
    if (!target) return;
    let el: HTMLElement | null = null;
    let raf = 0;
    let tries = 0;
    let poll: number | undefined;

    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!el || !el.isConnected) return setBox(null);
        const r = el.getBoundingClientRect();
        const visible = r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth;
        setBox(visible ? { top: r.top, left: r.left, width: r.width, height: r.height } : null);
      });
    };

    const attach = () => {
      el = findTarget(target);
      if (!el) {
        if (tries++ < 30) poll = window.setTimeout(attach, 100);
        return;
      }
      const r = el.getBoundingClientRect();
      // Keep the target clear of the step card, which sits along the bottom.
      const reserve = 250;
      if (!(!Array.isArray(target) && target.noScroll) && (r.top < 0 || r.bottom > window.innerHeight - reserve)) {
        const prev = el.style.scrollMarginTop;
        el.style.scrollMarginTop = window.innerWidth < 768 ? "64px" : "24px";
        el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
        el.style.scrollMarginTop = prev;
      }
      measure();
      ro.observe(el);
    };

    const ro = new ResizeObserver(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    // Let the route's lazy page mount first.
    poll = window.setTimeout(attach, 60);

    return () => {
      window.clearTimeout(poll);
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [target, key, reduce]);

  return box;
}

export default function Tour() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reduce = useReducedMotion() ?? false;

  const [dismissed, setDismissed] = useState(readDismissed);
  const [step, setStep] = useState<number | null>(null);
  const [pillReady, setPillReady] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const active = step != null;
  const current = active ? STEPS[step] : undefined;
  const box = useTargetBox(current?.target, step ?? -1, reduce);

  // The pill arrives a beat after the page so it doesn't compete with it.
  useEffect(() => {
    const t = window.setTimeout(() => setPillReady(true), reduce ? 0 : 900);
    return () => window.clearTimeout(t);
  }, [reduce]);

  const go = useCallback(
    (i: number) => {
      const s = STEPS[i];
      setStep(i);
      if (s.path && s.path !== pathname) navigate(s.path);
    },
    [navigate, pathname],
  );

  const end = useCallback(() => {
    setStep(null);
    setDismissed(true);
    writeDismissed();
  }, []);

  const tryAsCandidate = () => {
    end();
    navigate("/jobs/l2");
  };

  // Keyboard: arrows step, Esc ends. Stays out of the way of fields and dialogs.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]') && !cardRef.current?.contains(t)) return;
      if (e.key === "ArrowRight") {
        if (step! < STEPS.length - 1) go(step! + 1);
      } else if (e.key === "ArrowLeft") {
        if (step! > 0) go(step! - 1);
      } else if (e.key === "Escape") end();
      else return;
      // Pages have their own arrow keys (tabs, next candidate); the tour wins while it's open.
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [active, step, go, end]);

  // Move focus into the card when the tour opens, so the keyboard follows.
  useLayoutEffect(() => {
    if (active) cardRef.current?.focus({ preventScroll: true });
  }, [active]);

  const showPill = !active && !dismissed && pillReady && pathname.startsWith("/demo");
  const last = step === STEPS.length - 1;
  const pad = 6;

  return (
    <>
      {/* Spotlight ring */}
      <AnimatePresence>
        {active && box && (
          <motion.div
            key={step}
            aria-hidden
            className="pointer-events-none fixed z-[44] rounded-[16px]"
            initial={reduce ? false : { opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
              top: box.top - pad,
              left: box.left - pad,
              width: box.width + pad * 2,
              height: box.height + pad * 2,
              boxShadow:
                "0 0 0 2px var(--primary), 0 0 0 7px color-mix(in oklch, var(--primary) 18%, transparent), 0 10px 40px color-mix(in oklch, var(--primary) 22%, transparent)",
            }}
          />
        )}
      </AnimatePresence>

      {/* Pill */}
      <AnimatePresence>
        {showPill && (
          <motion.div
            className="fixed right-4 bottom-4 z-[45] flex items-center rounded-full bg-card shadow-overlay md:right-6 md:bottom-6"
            initial={reduce ? false : { opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={() => go(0)}
              className="flex h-10 items-center gap-2 rounded-full pr-2 pl-3.5 text-[13px] font-medium text-foreground transition-colors hover:text-primary"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-primary-tint text-primary">
                <Compass className="size-3.5" strokeWidth={2} />
              </span>
              Take the 2-minute tour
            </button>
            <span className="h-5 w-px bg-rim" aria-hidden />
            <button
              type="button"
              onClick={end}
              aria-label="Dismiss the tour"
              className="mr-1 flex size-8 items-center justify-center rounded-full text-faint transition-colors hover:bg-[var(--wash)] hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step card: bottom-right on desktop, bottom sheet on phones */}
      <AnimatePresence mode="wait">
        {active && current && (
          <motion.div
            key={step}
            ref={cardRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="false"
            aria-labelledby="tour-title"
            aria-describedby="tour-body"
            className={cx(
              "fixed z-[45] bg-card shadow-overlay outline-none",
              "inset-x-0 bottom-0 rounded-t-[18px] px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]",
              "sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[360px] sm:rounded-panel sm:p-4",
            )}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: reduce ? 0.12 : 0.34, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-rim-strong sm:hidden" aria-hidden />

            <div className="flex items-center gap-2">
              <span className="tnum text-[11.5px] font-medium text-primary">
                Step {step + 1} of {STEPS.length}
              </span>
              <div className="flex items-center gap-1" aria-hidden>
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={cx(
                      "h-1.5 rounded-full transition-[width,background] duration-300 ease-settle",
                      i === step ? "w-4 bg-primary" : i < step! ? "w-1.5 bg-primary/45" : "w-1.5 bg-rim-strong",
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={end}
                className="ml-auto -mr-1 rounded-control px-1.5 py-0.5 text-[12px] text-muted transition-colors hover:bg-[var(--wash)] hover:text-foreground"
              >
                End tour
              </button>
            </div>

            <h2 id="tour-title" className="mt-2.5 text-[15.5px] leading-snug font-semibold tracking-[-0.015em] text-balance">
              {current.title}
            </h2>
            <p id="tour-body" className="mt-1 text-[13px] leading-relaxed text-muted text-pretty">
              {current.body}
            </p>

            {last && (
              <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
                <Button variant="primary" onClick={tryAsCandidate} className="sm:flex-1">
                  Apply to a listing <ArrowRight className="size-3.5" />
                </Button>
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8.5 items-center whitespace-nowrap sm:flex-1 justify-center gap-1.5 rounded-control bg-card px-3.5 text-[13px] font-medium text-foreground shadow-card transition-colors hover:bg-inset"
                >
                  <GithubIcon className="size-3.5" /> Deploy your own
                </a>
              </div>
            )}

            <div className="mt-3.5 flex items-center gap-2 border-t border-rim pt-3">
              <span className="hidden items-center gap-1 text-[11px] text-faint sm:flex">
                <Kbd>←</Kbd>
                <Kbd>→</Kbd>
                <span className="ml-0.5">to step</span>
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
                  <ArrowLeft className="size-3.5" /> Back
                </Button>
                {last ? (
                  <Button size="sm" variant="ink" onClick={end}>
                    Done
                  </Button>
                ) : (
                  <Button size="sm" variant="ink" onClick={() => go(step + 1)}>
                    Next <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
