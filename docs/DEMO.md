# recruited.tools — live demo script (about 2½ minutes)

Run it at **recruited.tools/demo** (or the deploy URL), at 1440px, in a fresh tab. Everything is
sample data and nothing saves, so it is safe to click anything. Say "this is the demo scenario"
once, early.

The app is split tests (the home screen, opening with four headline numbers), pipeline,
candidates and the candidate profile, the new-role wizard, and the careers index with an apply page
per listing. Old links redirect to the home screen.

Before you start: open the landing page in tab 1 and `/jobs/l2` in tab 2. Set the theme to light;
you'll switch it on stage.

---

### 0:00 — The hook (landing page, 15s)

**Show:** recruited.tools.

**Say:** "Small teams post the same job on four boards and get a pile of applications back. They
never find out which listing brought the person they hired. recruited answers that. This is our own
agency's hiring: three roles, seven listings, four boards."

**Click:** Open the demo.

### 0:15 — The answer first: split tests (55s)

**Show:** `/demo`, the split-test home screen. Point at the headline numbers first.

**Say:** "The home screen doesn't lead with applications. It leads with what an A-tier candidate
cost."

**Point at:** the Operations VA experiment, variant A against variant B on OnlineJobs.ph, the tier
mix bars and the A-tier per dollar column.

**Say:** "Same board, same spend. Variant A got twice the applications. Variant B paid more and
named the tools in the title, and it brought 3.7 times more A-tier candidates per dollar. On a
board's dashboard A wins. Here B wins, and the offer went to someone B brought."

**Optional:** the Indeed campaign manager experiment. "Hiding salary brought 212 applicants. 79%
were Tier C, so we paused it."

### 1:10 — Attribution: the apply page (15s)

**Click:** tab 2, `/jobs/l2` (or `/jobs`, then the Operations VA listing).

**Say:** "Every variant gets its own apply page. That's how each application knows which listing it
came from, with no tracking pixels and no board integration needed."

### 1:25 — The team side: pipeline and the candidate profile (45s)

**Click:** back to the demo, Pipeline. Drag one candidate from Screen to Assessment.

**Say:** "Every applicant from every board on one board, tagged with the variant that brought
them."

**Click:** Candidates, then **Daniel Mercer** (Campaign Manager).

**Show:** the team summary, the interview rounds and the approval card for the next decision.

**Say:** "Four rounds, four different people. Each interviewer scores before seeing anyone else's
score, and the next interviewer gets a brief built only from what earlier rounds flagged. The
summary is drawn only from what the candidate sent and what the team wrote. In the demo it shows
sample output, so we don't spend API credits. The quality score that drives the split test comes
from here, from the team's own judgement."

### 2:10 — Posting the next role (10s)

**Click:** New role. Step through the wizard to the variants step.

**Say:** "Posting a role means writing two variants and picking the boards. The test starts the
moment it's live."

### 2:20 — Close (10s)

**Click:** the theme toggle to dark, if it's in the build.

**Say:** "It's open source, and you can deploy it in five minutes. Small teams spend real money on
job ads. We tell them which part of it works." Then go back to the deck's last slide.

---

## If something breaks

- A page doesn't load: refresh. Everything is static, so a refresh fixes it.
- Drag doesn't work on a trackpad: skip the drag and open Candidates.
- No wifi: play the screen recording of this exact path, kept next to the deck file.

## Recording the backup

Record this exact path once at 1440px, with the cursor visible and no audio.
