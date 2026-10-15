import { useRef } from "react";
import "./landing/landing.css";
import { Bento } from "./landing/Bento";
import { Hero } from "./landing/Hero";
import { BoardStrip, CaseStudy, Deploy, FinalCta, Footer, HowItWorks, Nav } from "./landing/Sections";
import { SplitTest } from "./landing/SplitTest";
import { useRevealAll } from "./landing/hooks";

/**
 * recruited.tools landing page. Ships in the first bundle, so it stays light:
 * no motion library, no images. The 3D is CSS transforms driven by one rAF
 * loop in the hero; everything else is one IntersectionObserver adding
 * `.is-in`. All the numbers come from src/data/mock.ts.
 */
export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  useRevealAll(root);
  return (
    <div id="top" ref={root} className="landing min-h-dvh overflow-x-clip bg-page">
      <Nav />
      <main>
        <Hero />
        <BoardStrip />
        <SplitTest />
        <Bento />
        <HowItWorks />
        <CaseStudy />
        <Deploy />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
