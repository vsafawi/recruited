import { Suspense, useState } from "react";
import { motion } from "motion/react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3, CalendarDays, LineChart, Settings as SettingsIcon, Columns3, Inbox as InboxIcon, FlaskConical, LayoutDashboard, Menu, Plus, Search, Users, X,
} from "lucide-react";
import { Wordmark } from "@/components/mark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ButtonLink, cx, GithubIcon, Kbd } from "@/components/ui";
import { CANDIDATES, LISTINGS, ROLES } from "@/data/mock";
import CommandPalette, { openPalette } from "./CommandPalette";
import Tour from "./Tour";
import { resetDemo } from "@/data/store";

const NAV = [
  { to: "/demo", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/demo/inbox", label: "Inbox", icon: InboxIcon, count: 6 },
  { to: "/demo/pipeline", label: "Pipeline", icon: Columns3, count: CANDIDATES.filter((c) => !["hired", "rejected"].includes(c.stage)).length },
  { to: "/demo/candidates", label: "Candidates", icon: Users, count: CANDIDATES.length },
  { to: "/demo/listings", label: "Listings & split tests", icon: FlaskConical, count: LISTINGS.length },
  { to: "/demo/interviews", label: "Interviews", icon: CalendarDays },
  { to: "/demo/reports", label: "Reports", icon: LineChart },
  { to: "/demo/settings", label: "Settings", icon: SettingsIcon },
];

export const GITHUB_URL = "https://github.com/vsafawi/recruited";

export default function Shell() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="hatch flex min-h-dvh text-foreground">
      {/* Rail */}
      <aside
        className={cx(
          "rule-dashed fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r bg-background px-3 py-3 transition-transform duration-200 ease-settle md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-9 items-center justify-between px-2">
          <NavLink to="/"><Wordmark className="text-[14px]" /></NavLink>
          <ThemeToggle className="ml-auto mr-1 md:mr-0" />
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-4" /></button>
        </div>

        <button
          type="button"
          onClick={openPalette}
          className="mt-3 flex w-full items-center gap-2 rounded-[10px] bg-inset px-2.5 py-1.5 text-left text-[12.5px] text-faint shadow-[inset_0_0_0_1px_var(--rim)] hover:text-muted"
        >
          <Search className="size-3.5" /> Search candidates
          <span className="ml-auto"><Kbd>⌘K</Kbd></span>
        </button>

        <nav className="mt-4 flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon, end, count }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cx(
                  "relative flex h-8 items-center gap-2.5 rounded-control px-2.5 text-[13px] transition-colors",
                  isActive ? "font-medium text-foreground" : "text-muted hover:bg-[var(--wash)] hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="rail-active"
                      className="absolute inset-0 rounded-control bg-inset shadow-[inset_0_0_0_1px_var(--rim)]"
                      transition={{ type: "spring", stiffness: 520, damping: 42 }}
                    />
                  )}
                  <Icon className="relative size-4" strokeWidth={1.75} />
                  <span className="relative">{label}</span>
                  {count != null && <span className="tnum relative ml-auto text-[11.5px] text-faint">{count}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 px-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-faint">Open roles</div>
        <div className="mt-1.5 flex flex-col gap-0.5">
          {ROLES.map((r) => (
            <NavLink
              key={r.id}
              to={`/demo/pipeline?role=${r.id}`}
              onClick={() => setOpen(false)}
              className="flex h-7.5 items-center gap-2 truncate rounded-control px-2.5 text-[12.5px] text-muted hover:bg-[var(--wash)] hover:text-foreground"
            >
              <BarChart3 className="size-3.5 shrink-0 text-faint" />
              <span className="truncate">{r.title}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <ButtonLink to="/demo/roles/new" variant="ink" className="w-full"><Plus className="size-4" /> New role</ButtonLink>
          <div className="rule-dashed rounded-card border p-3 text-[12px] text-muted">
            <div className="font-medium text-foreground">This is a demo.</div>
            Sample data for a music agency hiring three roles across four boards. Changes last until you close the tab.
            <button type="button" onClick={resetDemo} className="mt-1 block text-[12px] text-muted underline decoration-rim-strong underline-offset-2 hover:text-foreground">
              Reset the sample data
            </button>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1.5 font-medium text-foreground hover:underline">
              <GithubIcon className="size-3.5" /> Deploy your own
            </a>
          </div>
        </div>
      </aside>

      <CommandPalette />
      <Tour />
      {open && <div className="fixed inset-0 z-30 bg-black/20 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        <header className="rule-dashed sticky top-0 z-20 flex h-12 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          <Wordmark className="text-[14px]" />
        </header>
        <main key={pathname} className="rule-dashed mx-auto w-full min-w-0 max-w-[1320px] flex-1 bg-background xl:border-x">
          <Suspense fallback={<div className="p-8 text-muted">Loading…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

/** The header every demo page opens with. */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-6 pb-4 md:px-8 md:pt-8">
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold tracking-[-0.015em]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13.5px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
