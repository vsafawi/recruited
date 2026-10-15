/**
 * /demo/settings — workspace, job boards, team, scorecards, stages, email
 * templates, deploy and data. A left sub-nav on desktop, tabs on a phone.
 *
 * All state lives here so switching sections keeps your edits and the export
 * includes them. Nothing persists past the tab, like the rest of the demo.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, Check, Columns3, HardDrive, ListChecks, Mail, Plug, Users } from "lucide-react";
import { cx } from "@/components/ui";
import { ACTIVITY, BOARDS, LISTINGS, ROLES, SCORECARDS, TEAM } from "@/data/mock";
import { usePeople } from "@/data/store";
import { PageHeader } from "./Shell";
import WorkspaceSection, { INITIAL_WORKSPACE, type Workspace } from "./settings/workspace";
import Boards, { INITIAL_BOARDS, type BoardConn } from "./settings/boards";
import Team, { INITIAL_TEAM, type Member } from "./settings/team";
import Scorecards, { INITIAL_RUBRICS, INITIAL_TIERS, type Rubrics, type Tiers } from "./settings/scorecards";
import Stages, { INITIAL_STAGES, type StageRow } from "./settings/stages";
import Emails, { INITIAL_TEMPLATES, type Template } from "./settings/emails";
import Deploy from "./settings/deploy";

const TABS = [
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "boards", label: "Job boards", icon: Plug },
  { id: "team", label: "Team", icon: Users },
  { id: "scorecards", label: "Scorecards", icon: ListChecks },
  { id: "stages", label: "Pipeline stages", icon: Columns3 },
  { id: "emails", label: "Email templates", icon: Mail },
  { id: "data", label: "Deploy and data", icon: HardDrive },
] as const;
type TabId = (typeof TABS)[number]["id"];

type SaveState = "idle" | "saving" | "saved";

/** useState that also tells the page something changed. */
function useTracked<T>(initial: T, touch: () => void) {
  const [v, setV] = useState(initial);
  const set = useCallback((next: T) => { setV(next); touch(); }, [touch]);
  return [v, set] as const;
}

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const tab: TabId = TABS.some((t) => t.id === params.get("tab")) ? (params.get("tab") as TabId) : "workspace";
  const setTab = (id: TabId) => setParams(id === "workspace" ? {} : { tab: id }, { replace: true });

  const [save, setSave] = useState<SaveState>("idle");
  const timer = useRef<number | undefined>(undefined);
  const touch = useCallback(() => {
    setSave("saving");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSave("saved"), 450);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const [workspace, setWorkspace] = useTracked<Workspace>(INITIAL_WORKSPACE, touch);
  const [boards, setBoards] = useTracked<BoardConn[]>(INITIAL_BOARDS, touch);
  const [team, setTeam] = useTracked<Member[]>(INITIAL_TEAM, touch);
  const [rubrics, setRubrics] = useTracked<Rubrics>(INITIAL_RUBRICS, touch);
  const [tiers, setTiers] = useTracked<Tiers>(INITIAL_TIERS, touch);
  const [stages, setStages] = useTracked<StageRow[]>(INITIAL_STAGES, touch);
  const [templates, setTemplates] = useTracked<Template[]>(INITIAL_TEMPLATES, touch);
  const [people] = usePeople();

  const exportAll = () => {
    const data = {
      exportedFrom: "recruited.tools",
      exportedAt: new Date().toISOString(),
      workspace,
      boards: boards.map(({ id, name, cost, connected, method }) => ({ id, name, costPerMonth: cost ?? 0, connected, method: connected ? method : null })),
      team,
      scorecardTemplates: rubrics,
      tierThresholds: tiers,
      stages: stages.map(({ id, label }) => ({ id, label })),
      emailTemplates: templates,
      roles: ROLES,
      boardCatalogue: BOARDS,
      listings: LISTINGS,
      candidates: people,
      scorecards: SCORECARDS,
      interviewers: TEAM,
      activity: ACTIVITY,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recruited-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="pb-16">
      <PageHeader title="Settings" subtitle={`${workspace.name || "Your workspace"} · changes last until you close the tab`} actions={<SaveIndicator state={save} />} />

      <div className="grid min-w-0 gap-6 px-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10 md:px-8">
        {/* Sub-nav: a column on desktop, a scrolling tab row on a phone. */}
        <nav aria-label="Settings sections" className="-mx-4 min-w-0 border-b border-rim md:mx-0 md:border-0">
          <div className="flex gap-1 overflow-x-auto px-4 scroll-quiet md:sticky md:top-6 md:flex-col md:overflow-visible md:px-0">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = id === tab;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "flex shrink-0 items-center gap-2 whitespace-nowrap text-[13px] transition-colors",
                    "h-9 border-b-2 px-2 md:h-8 md:rounded-control md:border-b-0 md:px-2.5",
                    active
                      ? "border-foreground font-medium text-foreground md:bg-card md:shadow-card"
                      : "border-transparent text-muted hover:text-foreground md:hover:bg-[var(--wash)]",
                  )}
                >
                  <Icon className="hidden size-4 md:block" strokeWidth={1.75} />
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

        <div key={tab} className="min-w-0 max-w-[920px] motion-safe:animate-[settings-in_240ms_var(--enter)]">
          {tab === "workspace" && <WorkspaceSection value={workspace} onChange={setWorkspace} />}
          {tab === "boards" && <Boards value={boards} onChange={setBoards} />}
          {tab === "team" && <Team value={team} onChange={setTeam} />}
          {tab === "scorecards" && <Scorecards rubrics={rubrics} tiers={tiers} onRubrics={setRubrics} onTiers={setTiers} />}
          {tab === "stages" && <Stages value={stages} onChange={setStages} />}
          {tab === "emails" && <Emails value={templates} onChange={setTemplates} company={workspace.name || "your company"} />}
          {tab === "data" && <Deploy onExport={exportAll} counts={{ candidates: people.length, listings: LISTINGS.length, scorecards: SCORECARDS.length }} />}
        </div>
      </div>
      <style>{`@keyframes settings-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  return (
    <span aria-live="polite" className={cx("inline-flex h-7 items-center gap-1.5 rounded-control px-2 text-[12.5px] transition-colors", state === "saved" ? "text-success" : "text-faint")}>
      {state === "saving" ? (
        <>
          <span className="size-1.5 rounded-full bg-[var(--faint)]" /> Saving
        </>
      ) : state === "saved" ? (
        <>
          <Check className="size-3.5" /> Saved
        </>
      ) : (
        "Changes save as you go"
      )}
    </span>
  );
}
