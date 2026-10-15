import { useRef } from "react";
import "./landing/landing.css";
import { Intro } from "./landing/Hero";
import { ApplyPage, Closing, Deploy, Footer, InterviewLoop, Pipeline, Scenario, SplitTests } from "./landing/Sections";
import { Integrations } from "./landing/Integrations";
import { useRevealAll } from "./landing/hooks";

/**
 * recruited.tools landing page, laid out as a catalogue: a centred column with
 * dashed side rules over a hatched ground, the pitch in a sticky sidebar, and
 * one numbered entry per part of the product, each with a small live mock.
 * Ships in the first bundle, so it stays light: no motion library, no images
 * beyond the small bundled logos in public/logos,
 * nothing imported from the demo screens. All the numbers come from
 * src/data/mock.ts.
 */
export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  useRevealAll(root);
  return (
    <div id="top" ref={root} className="hatch min-h-dvh overflow-x-clip">
      <div className="mx-auto grid min-h-dvh max-w-[1160px] bg-background sm:border-x sm:rule-dashed lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="border-b rule-dashed lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-r lg:border-b-0">
          <Intro />
        </aside>
        <main className="min-w-0">
          <Scenario />
          <Integrations />
          <SplitTests />
          <Pipeline />
          <InterviewLoop />
          <ApplyPage />
          <Deploy />
          <Closing />
          <Footer />
        </main>
      </div>
    </div>
  );
}
