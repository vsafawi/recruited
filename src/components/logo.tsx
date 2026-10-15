import { useState } from "react";
import { boardById, BOARD_DOMAIN, type BoardId } from "@/data/mock";
import { cx } from "./ui";

/**
 * A company or platform logo from public/logos/<domain>.png, on a white tile so
 * it reads in both themes. No domain, or a missing file, shows initials instead.
 */
export function Logo({ name, domain, size = 20, className }: { name: string; domain?: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const showImg = !!domain && !failed;
  const initials = name.replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span
      title={name}
      className={cx("inline-grid shrink-0 place-items-center overflow-hidden shadow-[0_0_0_1px_var(--rim)]",
        // Favicons are drawn for a light background, so the tile stays white in dark mode too.
        showImg ? "bg-white" : "bg-inset text-muted",
        className,)}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.24) }}
    >
      {showImg ? (
        <img
          src={`/logos/${domain}.png`}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-[78%] object-contain"
        />
      ) : (
        <span className="font-mono font-semibold" style={{ fontSize: Math.max(8, size * 0.4) }}>
          {initials}
        </span>
      )}
    </span>
  );
}

/** A job board's logo, from BOARD_DOMAIN in mock.ts. */
export function BoardLogo({ id, size = 14, className }: { id: BoardId; size?: number; className?: string }) {
  return <Logo name={boardById(id).name} domain={BOARD_DOMAIN[id]} size={size} className={className} />;
}
