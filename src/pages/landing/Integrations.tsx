import { Logo } from "@/components/logo";
import { INTEGRATIONS, type Integration } from "@/data/mock";

/**
 * What recruited works with today and what is planned. Driven entirely by
 * INTEGRATIONS in src/data/mock.ts: flip an entry's status to move it between
 * the two rows.
 */
export function Integrations() {
  const live = INTEGRATIONS.filter((i) => i.status === "live");
  const soon = INTEGRATIONS.filter((i) => i.status === "soon");
  return (
    <section id="integrations" className="scroll-mt-20 px-4 pt-10 pb-6 sm:pt-16">
      <div className="reveal mx-auto max-w-[1000px] space-y-6 text-center">
        <Row label="Works with today" items={live} />
        <Row label="Coming soon" items={soon} soon />
      </div>
    </section>
  );
}

function Row({ label, items, soon }: { label: string; items: Integration[]; soon?: boolean }) {
  return (
    <div>
      <div className="text-[12px] font-medium text-muted">{label}</div>
      <ul className="mt-3 flex flex-wrap justify-center gap-1.5">
        {items.map((i) => (
          <li
            key={i.name}
            className={
              soon
                ? "inline-flex h-7.5 items-center gap-1.5 rounded-full pr-2.5 pl-1 text-[12.5px] text-muted shadow-[inset_0_0_0_1px_var(--rim)]"
                : "inline-flex h-7.5 items-center gap-1.5 rounded-full bg-card pr-2.5 pl-1 text-[12.5px] font-medium shadow-card"
            }
          >
            <Logo name={i.name} domain={i.domain} size={20} className={soon ? "rounded-full! opacity-80 grayscale-[35%]" : "rounded-full!"} />
            {i.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
