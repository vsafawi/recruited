import { useEffect, useRef } from "react";
import { cx } from "./ui";

/**
 * The recruited mark: a rounded tile with a head and a shoulder line cut out
 * of it — a person, shortlisted. Flat everywhere inside the app.
 */
export function Mark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="15" fill="currentColor" />
      <circle cx="32" cy="24" r="8" fill="var(--background)" />
      <rect x="16" y="37" width="32" height="7" rx="3.5" fill="var(--background)" />
      <rect x="22" y="47" width="20" height="5" rx="2.5" fill="var(--background)" opacity=".55" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2 font-semibold tracking-[-0.01em] text-foreground", className)}>
      <Mark size={22} />
      <span>
        recruited<span className="text-faint">.tools</span>
      </span>
    </span>
  );
}

/**
 * The mark as an object. No WebGL: LAYERS copies of the tile, each a fraction
 * of a pixel further back on a preserve-3d stage, give it a milled edge; the
 * cut-outs float above the face. It leans toward the pointer.
 */
const LAYERS = 22;

export function Mark3D({ size = 120, className }: { size?: number; className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stage.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      el.style.transform = `rotateX(${14 - cy * 14}deg) rotateY(${-24 + cx * 18}deg)`;
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const depth = size * 0.16;
  return (
    <div className={cx("relative", className)} style={{ width: size, height: size, perspective: size * 6 }} aria-hidden>
      <div
        ref={stage}
        className="relative size-full"
        style={{ transformStyle: "preserve-3d", transform: "rotateX(14deg) rotateY(-24deg)" }}
      >
        {Array.from({ length: LAYERS }, (_, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              borderRadius: size * 0.234,
              transform: `translateZ(${-(i / LAYERS) * depth}px)`,
              background:
                i === 0
                  ? "linear-gradient(150deg, oklch(0.3 0.01 265), oklch(0.16 0.006 265) 60%)"
                  : `linear-gradient(180deg, oklch(${0.42 - i * 0.008} 0.01 265), oklch(${0.2 - i * 0.003} 0.006 265))`,
              boxShadow: i === LAYERS - 1 ? `0 ${size * 0.25}px ${size * 0.4}px oklch(0 0 0 / 0.22)` : undefined,
            }}
          />
        ))}
        {/* Face sheen */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: size * 0.234,
            transform: "translateZ(0.5px)",
            background: "radial-gradient(120% 80% at 20% 0%, oklch(1 0 0 / 0.16), transparent 55%)",
          }}
        />
        {/* Cut-outs, floating */}
        {[
          { l: 24 / 64, t: 16 / 64, w: 16 / 64, h: 16 / 64, r: 1, z: 0.12, o: 1 },
          { l: 16 / 64, t: 37 / 64, w: 32 / 64, h: 7 / 64, r: 0.5, z: 0.09, o: 1 },
          { l: 22 / 64, t: 47 / 64, w: 20 / 64, h: 5 / 64, r: 0.5, z: 0.06, o: 0.6 },
        ].map((b, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: b.l * size,
              top: b.t * size,
              width: b.w * size,
              height: b.h * size,
              borderRadius: b.r === 1 ? "50%" : 999,
              transform: `translateZ(${b.z * size}px)`,
              background: "linear-gradient(180deg, oklch(0.99 0 0), oklch(0.9 0.004 265))",
              opacity: b.o,
              boxShadow: `0 ${size * 0.03}px ${size * 0.05}px oklch(0 0 0 / 0.35)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
