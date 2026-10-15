import { PlayCircle } from "lucide-react";

/**
 * The 81-second demo film. The files live in public/video, so nothing here
 * enters the bundle: preload="none" means the page fetches only the poster
 * until someone presses play. No autoplay and no loop, per the motion rules.
 * Captions are a WebVTT track, on by default, so it reads with the sound off.
 */
export function DemoVideo() {
  return (
    <section id="video" className="scroll-mt-20 px-4 pt-14 pb-6 sm:pt-20">
      <div className="mx-auto max-w-[1000px]">
        <div className="reveal mx-auto max-w-[640px] text-center">
          <div className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary">
            <PlayCircle className="size-3.5" /> Watch it work
          </div>
          <h2 className="mt-3 text-[1.75rem] sm:text-[2.2rem] leading-[1.05] font-semibold tracking-[-0.04em] text-balance">
            The whole product in 81 seconds.
          </h2>
        </div>
        <div className="reveal mt-8 rounded-[22px] bg-card/55 p-2 shadow-lift backdrop-blur-sm">
          <video
            className="block aspect-video w-full rounded-[16px] bg-canvas"
            controls
            playsInline
            preload="none"
            poster="/video/recruited-demo-poster.jpg"
            aria-label="Demo of recruited.tools: a split test, the pipeline, a candidate profile and posting a new role"
          >
            <source src="/video/recruited-demo.mp4" type="video/mp4" />
            <track kind="captions" src="/video/recruited-demo.vtt" srcLang="en" label="English" default />
          </video>
        </div>
        <p className="reveal mt-3 text-center text-[12.5px] text-muted">Sample data from the demo scenario. Sound on.</p>
      </div>
    </section>
  );
}
