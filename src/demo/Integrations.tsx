/**
 * /demo/integrations — every platform recruited connects to, read from
 * INTEGRATIONS in mock.ts (the landing page's logo row reads the same list).
 * "Add integration" connects Claude over MCP, an OpenAI key or any custom MCP
 * server. It is a demo: nothing is sent anywhere and nothing saves.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, Copy, Plus, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button, cx, Tag } from "@/components/ui";
import { INTEGRATIONS, type Integration, type IntegrationGroup } from "@/data/mock";
import { PageHeader } from "./Shell";

const GROUPS: IntegrationGroup[] = ["Job boards", "AI and MCP", "Meeting notes", "Calendar and video", "Email and chat", "Workflow"];

/** The MCP address this workspace would hand to Claude. Illustrative only. */
const MCP_URL = "https://mma.recruited.tools/mcp";

type Kind = "claude" | "openai" | "custom-mcp";

export default function Integrations() {
  const [items, setItems] = useState<Integration[]>(INTEGRATIONS);
  // The boards are what the sample data runs on, so they start connected.
  const [connected, setConnected] = useState<Set<string>>(() => new Set(INTEGRATIONS.filter((i) => i.group === "Job boards" && i.status === "live").map((i) => i.id)));
  const [adding, setAdding] = useState<Kind | "pick" | null>(null);

  const connect = (id: string, extra?: Integration) => {
    if (extra) setItems((xs) => [...xs, extra]);
    setConnected((s) => new Set(s).add(id));
    setAdding(null);
  };
  const disconnect = (id: string) => setConnected((s) => { const n = new Set(s); n.delete(id); return n; });

  const live = items.filter((i) => i.status === "live").length;

  return (
    <div className="pb-16">
      <PageHeader
        title="Integrations"
        subtitle={`${connected.size} connected · ${live} available · ${items.length - live} coming soon`}
        actions={<Button variant="ink" onClick={() => setAdding("pick")}><Plus className="size-4" /> Add integration</Button>}
      />

      <div className="flex flex-col gap-8 px-4 md:px-8">
        {GROUPS.map((g) => {
          const list = items.filter((i) => i.group === g);
          if (!list.length) return null;
          return (
            <section key={g}>
              <h2 className="text-[13px] font-medium text-muted">{g}</h2>
              <ul className="mt-2.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((i) => (
                  <li key={i.id} className={cx("flex min-w-0 items-start gap-3 rounded-panel bg-card p-3.5 shadow-card", i.status === "soon" && "opacity-75")}>
                    <Logo name={i.name} domain={i.domain} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="truncate text-[13.5px] font-medium">{i.name}</span>
                        {i.status === "soon" && <Tag>Coming soon</Tag>}
                        {connected.has(i.id) && <Tag color="var(--success)"><Check className="size-3" /> Connected</Tag>}
                      </div>
                      <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{i.blurb}</p>
                    </div>
                    {i.status === "live" && (
                      connected.has(i.id) ? (
                        <Button size="sm" variant="ghost" onClick={() => disconnect(i.id)}>Disconnect</Button>
                      ) : (
                        <Button size="sm" onClick={() => (i.group === "AI and MCP" ? setAdding(i.id.startsWith("custom") ? "custom-mcp" : (i.id as Kind)) : connect(i.id))}>
                          Connect
                        </Button>
                      )
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        <p className="text-[12px] text-faint">
          This is a demo. Connecting stores nothing and calls nothing. Keys you type stay in this tab.
        </p>
      </div>

      {adding && <AddDialog start={adding} onClose={() => setAdding(null)} onConnect={connect} />}
    </div>
  );
}

const KINDS: { id: Kind; name: string; domain: string; blurb: string }[] = [
  { id: "claude", name: "Claude", domain: "claude.ai", blurb: "Add recruited to Claude as an MCP connector" },
  { id: "openai", name: "OpenAI", domain: "openai.com", blurb: "Use your own API key" },
  { id: "custom-mcp", name: "Custom MCP server", domain: "modelcontextprotocol.io", blurb: "Any MCP server, by URL" },
];

const inputCls =
  "h-8.5 w-full rounded-control bg-background px-2.5 text-[13px] shadow-[inset_0_0_0_1px_var(--rim)] outline-none placeholder:text-faint focus:shadow-[inset_0_0_0_1.5px_var(--primary)]";

function AddDialog({ start, onClose, onConnect }: { start: Kind | "pick"; onClose: () => void; onConnect: (id: string, extra?: Integration) => void }) {
  const [kind, setKind] = useState<Kind | "pick">(start);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => { window.removeEventListener("keydown", k); window.clearTimeout(timer.current); };
  }, [onClose]);
  useEffect(() => { first.current?.focus(); }, [kind]);

  const valid = kind === "claude" || (kind === "openai" && key.trim().length > 6) || (kind === "custom-mcp" && name.trim() && /^https?:\/\/\S+$/.test(url.trim()));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    timer.current = window.setTimeout(() => {
      if (kind === "custom-mcp") {
        const id = `mcp-${Date.now()}`;
        onConnect(id, { id, name: name.trim(), domain: "modelcontextprotocol.io", group: "AI and MCP", status: "live", blurb: url.trim() });
      } else onConnect(kind);
    }, 600);
  };

  const copy = () => {
    navigator.clipboard?.writeText(MCP_URL).catch(() => {});
    setCopied(true);
  };

  const meta = KINDS.find((k) => k.id === kind);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Add integration"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-panel bg-card p-5 shadow-overlay"
      >
        <div className="flex items-center gap-2.5">
          {meta && <Logo name={meta.name} domain={meta.domain} size={24} />}
          <h2 className="flex-1 text-[15px] font-semibold">{meta ? `Connect ${meta.name}` : "Add integration"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-faint hover:text-foreground"><X className="size-4" /></button>
        </div>

        {kind === "pick" && (
          <ul className="mt-4 flex flex-col gap-1.5">
            {KINDS.map((k) => (
              <li key={k.id}>
                <button type="button" onClick={() => setKind(k.id)} className="flex w-full items-center gap-3 rounded-card p-2.5 text-left shadow-[inset_0_0_0_1px_var(--rim)] hover:bg-[var(--wash)]">
                  <Logo name={k.name} domain={k.domain} size={28} />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium">{k.name}</span>
                    <span className="block text-[12px] text-muted">{k.blurb}</span>
                  </span>
                </button>
              </li>
            ))}
            <li className="mt-1 text-[12px] text-faint">Wispr Flow, Granola, Fireflies, Otter and Fathom are coming soon.</li>
          </ul>
        )}

        {kind === "claude" && (
          <div className="mt-4 space-y-3 text-[13px]">
            <p className="text-muted">In Claude, open Settings, then Connectors, add a custom connector and paste this URL. Claude can then read your roles, listings and pipeline.</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-control bg-inset px-2.5 py-2 font-mono text-[12px]">{MCP_URL}</code>
              <Button type="button" size="sm" onClick={copy}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? "Copied" : "Copy"}</Button>
            </div>
          </div>
        )}

        {kind === "openai" && (
          <label className="mt-4 block text-[12.5px] text-muted">
            API key
            <input ref={first} value={key} onChange={(e) => setKey(e.target.value)} type="password" autoComplete="off" placeholder="sk-..." className={cx(inputCls, "mt-1")} />
          </label>
        )}

        {kind === "custom-mcp" && (
          <div className="mt-4 space-y-3">
            <label className="block text-[12.5px] text-muted">
              Name
              <input ref={first} value={name} onChange={(e) => setName(e.target.value)} placeholder="Our candidate database" className={cx(inputCls, "mt-1")} />
            </label>
            <label className="block text-[12.5px] text-muted">
              Server URL
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/mcp" className={cx(inputCls, "mt-1")} />
            </label>
            <label className="block text-[12.5px] text-muted">
              Bearer token <span className="text-faint">(optional)</span>
              <input value={key} onChange={(e) => setKey(e.target.value)} type="password" autoComplete="off" className={cx(inputCls, "mt-1")} />
            </label>
          </div>
        )}

        {kind !== "pick" && (
          <div className="mt-5 flex items-center justify-between gap-2">
            {start === "pick" ? (
              <Button type="button" variant="ghost" onClick={() => setKind("pick")}>Back</Button>
            ) : <span />}
            <Button type="submit" variant="primary" disabled={!valid || busy}>
              {busy ? "Connecting…" : kind === "claude" ? "I've added it" : "Connect"}
            </Button>
          </div>
        )}
        <p className="mt-3 text-[11.5px] text-faint">Demo only. Nothing is sent and nothing saves.</p>
      </form>
    </div>
  );
}
