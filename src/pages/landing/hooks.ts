import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

export const prefersReducedMotion = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** One observer for the whole page: every `.reveal` under root gets `.is-in` once. */
export function useRevealAll(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const nodes = el.querySelectorAll<HTMLElement>(".reveal");
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [root]);
}

/** True once the element has been on screen. */
export function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) return setSeen(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

/** Counts from 0 to `to` once `run` turns true. */
export function useCountUp(to: number, run: boolean, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion()) return setV(to);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, ms]);
  return v;
}

/** The id of the section currently in the middle of the viewport. */
export function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join(",");
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    key.split(",").forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [key]);
  return active;
}

/**
 * Fits a fixed-size design into its container by scaling it. Below 640px the
 * design is laid out narrower so text stays legible.
 */
export function useFit(designW: number, narrowW: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, w: designW });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = (cw: number) => {
      const w = cw < 640 ? narrowW : designW;
      setFit({ scale: Math.min(1, cw / w), w });
    };
    measure(el.clientWidth);
    const ro = new ResizeObserver(([e]) => measure(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [designW, narrowW]);
  return [ref, fit] as const;
}
