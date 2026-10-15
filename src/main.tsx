import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./styles.css";
import Landing from "./pages/Landing";
import { initTheme } from "./components/ThemeToggle";

initTheme();

// The landing page ships in the first bundle; the demo app loads on demand
// and is prefetched when someone hovers a link into it.
const DemoShell = lazy(() => import("./demo/Shell"));
const Overview = lazy(() => import("./demo/Overview"));
const Pipeline = lazy(() => import("./demo/Pipeline"));
const Candidates = lazy(() => import("./demo/Candidates"));
const CandidateDetail = lazy(() => import("./demo/CandidateDetail"));
const Listings = lazy(() => import("./demo/Listings"));
const NewRole = lazy(() => import("./demo/NewRole"));
const Inbox = lazy(() => import("./demo/Inbox"));
const Interviews = lazy(() => import("./demo/Interviews"));
const Careers = lazy(() => import("./pages/Careers"));
const Apply = lazy(() => import("./pages/Apply"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-dvh bg-background" />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/demo" element={<DemoShell />}>
            <Route index element={<Overview />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="candidates" element={<Candidates />} />
            <Route path="candidates/:id" element={<CandidateDetail />} />
            <Route path="listings" element={<Listings />} />
            <Route path="roles/new" element={<NewRole />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="interviews" element={<Interviews />} />
          </Route>
          <Route path="/jobs" element={<Careers />} />
          <Route path="/jobs/:listingId" element={<Apply />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
