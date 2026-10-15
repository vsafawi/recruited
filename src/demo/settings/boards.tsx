import { useState } from "react";
import { Check, Copy, KeyRound, Mail, Plug, Tag } from "lucide-react";
import { Button, cx } from "@/components/ui";
import { BOARDS, LISTINGS } from "@/data/mock";
import { Dialog, inputCls, labelCls, Pill, Section, Segmented } from "./parts";

export const FORWARD_ADDRESS = "apply+mma@in.recruited.tools";

export interface BoardConn {
  id: string;
  name: string;
  short: string;
  color: string;
  audience: string;
  /** USD per month, for boards that charge. */
  cost?: number;
  connected: boolean;
  synced?: string;
  method?: "api" | "email" | "native";
}

export const INITIAL_BOARDS: BoardConn[] = [
  ...BOARDS.map((b, i) => ({
    id: b.id, name: b.name, short: b.short, color: b.color, audience: b.audience, cost: b.costPerMonth,
    connected: true, synced: ["4 min ago", "11 min ago", "1 hr ago", "26 min ago"][i], method: (b.id === "roster" ? "email" : "api") as BoardConn["method"],
  })),
  { id: "linkedin", name: "LinkedIn", short: "LI", color: "oklch(0.52 0.13 245)", audience: "Professional network, paid promotion", connected: false },
  { id: "wellfound", name: "Wellfound", short: "WF", color: "oklch(0.3 0.01 265)", audience: "Startup roles and candidates", connected: false },
  { id: "upwork", name: "Upwork", short: "UP", color: "oklch(0.6 0.16 145)", audience: "Freelance and contract work", connected: false },
  { id: "craigslist", name: "Craigslist", short: "CL", color: "oklch(0.45 0.15 300)", audience: "Local, by city", connected: false },
  { id: "careers", name: "Your own careers page", short: "CP", color: "var(--primary)", audience: "recruited.tools/jobs, free", connected: false },
];

function BoardLogo({ b }: { b: BoardConn }) {
  return (
    <span
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-card font-mono text-[11.5px] font-semibold text-white"
      style={{ background: b.color, boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.2), 0 0 0 1px oklch(0 0 0 / 0.06)" }}
    >
      {b.short}
    </span>
  );
}

export default function Boards({ value, onChange }: { value: BoardConn[]; onChange: (v: BoardConn[]) => void }) {
  const [connecting, setConnecting] = useState<BoardConn | null>(null);
  const connected = value.filter((b) => b.connected);
  const available = value.filter((b) => !b.connected);
  const monthly = connected.reduce((s, b) => s + (b.cost ?? 0), 0);

  const set = (id: string, patch: Partial<BoardConn>) => onChange(value.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  return (
    <Section
      title="Job boards"
      description="Where your listings go out and where applications come back from. Connect a board once; every role you post can use it."
      actions={<span className="tnum text-[12.5px] text-muted">{connected.length} connected · ${monthly} / mo</span>}
    >
      <div className="flex items-start gap-3 rounded-card bg-primary-tint px-3.5 py-3 text-[12.5px] text-foreground">
        <Tag className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Every application is tagged with the listing and the variant it came from, whichever board or inbox it arrives
          through. That tag is what lets the split tests count A-tier candidates per dollar instead of applies.
        </p>
      </div>

      <div>
        <div className={labelCls}>Connected</div>
        <div className="mt-2 grid gap-3 lg:grid-cols-2">
          {connected.map((b) => {
            const listings = LISTINGS.filter((l) => l.board === b.id);
            const applies = listings.reduce((s, l) => s + l.applies, 0);
            return (
              <div key={b.id} className="flex min-w-0 flex-col gap-3 rounded-panel bg-card p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <BoardLogo b={b} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-[13.5px] font-medium">{b.name}</span>
                      <Pill tone="success">Connected</Pill>
                    </div>
                    <p className="truncate text-[12.5px] text-muted">{b.audience}</p>
                  </div>
                  {b.cost != null && <span className="tnum shrink-0 text-[13px] font-medium">${b.cost}<span className="font-normal text-faint"> / mo</span></span>}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rim pt-3 text-[12px] text-muted">
                  <span className="tnum">
                    {listings.length > 0 ? `${listings.length} listing${listings.length > 1 ? "s" : ""} · ${applies} applies` : "No listings yet"}
                    {" · "}
                    {b.method === "email" ? "by email" : b.method === "native" ? "built in" : "by API"} · synced {b.synced}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => set(b.id, { connected: false })}>Disconnect</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className={labelCls}>Available</div>
        {available.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted">Every board is connected.</p>
        ) : (
          <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {available.map((b) => (
              <div key={b.id} className="flex min-w-0 items-center gap-3 rounded-panel bg-card p-3.5 shadow-card">
                <BoardLogo b={b} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{b.name}</div>
                  <div className="truncate text-[12px] text-muted">{b.cost != null ? `$${b.cost} / mo · ` : ""}{b.audience}</div>
                </div>
                <Button size="sm" onClick={() => setConnecting(b)}><Plug className="size-3.5" /> Connect</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConnectDialog
        board={connecting}
        onClose={() => setConnecting(null)}
        onConnect={(method) => {
          if (connecting) set(connecting.id, { connected: true, method, synced: "just now" });
          setConnecting(null);
        }}
      />
    </Section>
  );
}

function ConnectDialog({ board, onClose, onConnect }: { board: BoardConn | null; onClose: () => void; onConnect: (m: BoardConn["method"]) => void }) {
  const [method, setMethod] = useState<"api" | "email">("api");
  const [key, setKey] = useState("");
  const [copied, setCopied] = useState(false);
  const native = board?.id === "careers";

  const close = () => {
    setKey("");
    setCopied(false);
    setMethod("api");
    onClose();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(FORWARD_ADDRESS);
    } catch {
      /* clipboard can be blocked; the address is on screen anyway */
    }
    setCopied(true);
  };
  const ready = native || method === "email" || key.trim().length >= 8;

  return (
    <Dialog
      open={!!board}
      onClose={close}
      title={board ? `Connect ${board.name}` : "Connect"}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!ready}
            onClick={() => {
              onConnect(native ? "native" : method);
              setKey("");
              setCopied(false);
              setMethod("api");
            }}
          >
            {native ? "Turn on" : "Connect"}
          </Button>
        </>
      }
    >
      {native ? (
        <p className="text-[13px] text-muted">
          Your careers page lists every live role at <a href="/jobs" target="_blank" rel="noreferrer" className="font-medium text-foreground underline decoration-rim-strong underline-offset-2">recruited.tools/jobs</a>.
          It costs nothing and its applications are tagged like any other board's.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          <Segmented
            label="How to connect"
            value={method}
            onChange={setMethod}
            options={[{ id: "api", label: "API key" }, { id: "email", label: "Forward by email" }]}
          />
          {method === "api" ? (
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-[12.5px] font-medium"><KeyRound className="size-3.5 text-muted" /> API key</span>
              <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Paste the key from your board account" className={cx(inputCls, "font-mono")} autoComplete="off" spellCheck={false} />
              <span className="text-[12px] text-muted">It stays in your own database. Listings post and applications sync every few minutes.</span>
            </label>
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-[12.5px] font-medium"><Mail className="size-3.5 text-muted" /> Forward applications to</span>
              <div className="flex min-w-0 items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-control bg-inset px-2.5 py-1.5 font-mono text-[12.5px]">{FORWARD_ADDRESS}</code>
                <Button size="sm" onClick={copy}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? "Copied" : "Copy"}</Button>
              </div>
              <span className="text-[12px] text-muted">Set this as the reply address on the board. Each listing gets its own tag, so forwarded mail still lands on the right variant.</span>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
