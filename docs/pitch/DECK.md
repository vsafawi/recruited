# recruited.tools — pitch deck content (draft 2, investor and judge version)

Copy, data and visual direction only. Design comes from the design system thread.
Each slide has: **Headline**, **On the slide**, **Visual / data**, **Speaker notes**, **Sources**.

**What changed from draft 1:** the deck now argues a business, not a product. The order follows the
questions an investor or judge asks: what hurts, for whom, what we do about it, why it works, why
we win, how it makes money, how big it gets, who we are, what we want. The product walkthrough is
one slide plus an appendix, for a live demo if there's time (see `docs/DEMO.md`).

Ground rules from the repo: plain voice, no exclamation marks, no emoji, never mention any other
product of ours. Case-study numbers come from `src/data/mock.ts`, which is **demo sample data
modelled on a real hiring setup**, not measured results. Anything we assumed rather than measured is
marked *(assumption)*.

Running order (13 slides, about 4 minutes):

1. Cover
2. The customer and the problem
3. Why today's tools don't solve it
4. What we solve
5. Proof: 3.7× more A-tier candidates per dollar
6. Why we're different
7. Competition
8. How we make money
9. Unit economics
10. Market size
11. Why it scales
12. Roadmap and milestones
13. Team and the ask

Appendix: A. Product walkthrough · B. Case study table · C. Market sizing math · D. Method for
A-tier per dollar.

---

## 1. Cover

**Headline:** Hiring is the biggest bet a small company makes. Nobody tells them which listing
worked.

**On the slide:**
- recruited.tools
- Split-testing for job listings, inside an open-source applicant tracking system for startups and
  small teams.
- William Lee · Vanessa Safawi · [Hackathon name]

**Visual / data:** Dark full-bleed, the logo mark on the right. No chart.

**Speaker notes:** "Small companies spend real money on job boards and get back a pile of
applications. We tell them which listing, on which board, at which pay band, brought the person they
actually hired, and what that person cost to find."

**Sources:** —

---

## 2. The customer and the problem

**Headline:** Small teams pay for applications and get no answer on quality.

**On the slide:**
- **Who:** startups, small businesses, agencies and newly funded companies hiring several roles at
  once, without a recruiter or an HR team.
- **What they do today:** post the same role on 3–5 boards, at different pay bands and wordings,
  and track it in a spreadsheet.
- **What hurts:**
  1. They can't tell which listing or board brought the good candidates, so they keep paying for
     the wrong ones.
  2. Volume hides quality. The listing with the most applicants is often the worst.
  3. Interview feedback across several rounds and interviewers lives in Slack and people's heads,
     so good candidates stall.
- Three numbers: **$5,475** average cost per non-executive hire · only **20%** of organizations
  measure quality of hire · **$34.2B** spent on online job ads in 2025.

**Visual / data:** Left: the three pains as short lines. Right: three stat tiles. Optional: a
"before" sketch of the spreadsheet plus four board inboxes.

**Speaker notes:** Tell the origin in two sentences. "I run operations at a music marketing agency.
We had seven listings live on four boards, split-testing pay and wording by hand, and four interview
rounds per role, and we still couldn't answer which listing brought the person we hired." Then: this
isn't an agency problem, it's every small team that hires on more than one board.

**Sources:**
- SHRM 2025 Benchmarking Survey ($5,475 non-exec cost per hire; 20% track quality of hire; n=2,371):
  https://www.shrm.org/in/about/press-room/shrm-releases-2025-benchmarking-reports--how-does-your-organizat
- Staffing Industry Analysts, $34.2B global online job advertising revenue in 2025:
  https://www.staffingindustry.com/news/global-daily-news/global-online-job-advertising-revenue-to-reach-342b

---

## 3. Why today's tools don't solve it

**Headline:** Every tool in the stack measures the wrong thing.

**On the slide:** three columns.
- **Job boards** report views, clicks and applies, and only for themselves. Indeed won't tell you
  that a niche board brought a better candidate for less.
- **Small-business ATSs** (Breezy, Workable, Recruitee) organize applicants after they arrive. None
  treats the listing as something to test, and most charge more as the team grows.
- **Enterprise ATSs** (Greenhouse, Lever, Ashby) have quality-of-hire reporting, but they're
  sales-led, priced for HR departments and too heavy for a ten-person company.

Bottom line: **nobody connects what you spent on a listing to the quality of the people it
brought.**

**Visual / data:** Three columns with a grey "missing" mark against "cost per good candidate, per
listing variant".

**Speaker notes:** The gap is structural. Boards are paid on volume, so they have no reason to
report quality. ATSs start at the application, so they never see the listing as a variable. That
gap is where we sit.

**Sources:** Competitor pricing on slide 7.

---

## 4. What we solve

**Headline:** We turn every job listing into an experiment with a clear winner.

**On the slide:**
1. **Post once, as variants.** One role goes to every board as A/B variants: pay band, title,
   responsibilities, board.
2. **Attribute every applicant.** Each listing gets its own apply page, so every application is
   tagged with the variant that brought it.
3. **Score quality, not volume.** Each candidate is scored A, B or C against the role's rubric, and
   every interviewer adds a scorecard round by round.
4. **Get a verdict.** The number that decides it: **A-tier candidates per dollar**. Losing variants
   get paused, and spend moves to the winner.

**Visual / data:** A four-step horizontal flow: Listing variants → Attributed applicants → Tiered
and scored → Winner + spend shift. One product screenshot (Listings verdict) as a thumbnail.

**Speaker notes:** This is what we solve, in one sentence: small teams finally know where their
hiring money is working. The pipeline and the interview loop are what make the score trustworthy,
because the quality signal comes from the team's own scorecards.

**Sources:** README; live demo at recruited.tools/demo.

---

## 5. Proof

**Headline:** Half the applications, 3.7× more A-tier candidates per dollar.

**On the slide:**
- Same board, same $52 spend, two versions of one listing.
- Variant A, $600/mo, generic title: **186 applies, 3% A-tier, $9.32 per A-tier candidate.**
- Variant B, $950/mo, tools named in the title: **94 applies, 22% A-tier, $2.51 per A-tier
  candidate.**
- Across the agency's seven listings, the most-applied listing was never the best one. Hiding
  salary on Indeed brought 212 applicants, and 79% were Tier C.

**Visual / data:** Two side-by-side cards, each with a stacked A/B/C tier bar (A 3/31/66, B
22/51/27). The 3.7× is the hero number. Footnote: "Demo scenario modelled on Music Market Agency's
hiring."

**Speaker notes:** On an applications dashboard variant A wins by 2×. On the number that matters it
loses by 3.7×. That reversal is the business: every team running more than one listing has one of
these hiding in their spend. Be clear this is the demo scenario until real numbers replace it.

**Sources:** `src/data/mock.ts` listings l1–l7. Formula in appendix D. Full table in appendix B.

---

## 6. Why we're different

**Headline:** Five things the incumbents can't copy easily.

**On the slide:**
1. **A different metric.** Everyone else counts applicants. We price quality: cost per A-tier
   candidate, per listing variant.
2. **Neutral across boards.** Boards can't build this because they only see themselves and are paid
   on volume. We sit across all of them.
3. **Open source.** MIT licensed, self-hostable, so teams own their candidate data. The repo is our
   distribution: no sales team needed to get in the door.
4. **Priced for how small teams hire.** Per open role, unlimited interviewers. A four-round
   loop touches five people, and per-seat pricing punishes exactly that.
5. **A data advantage that compounds.** Every split test adds a data point on which board, pay band
   and wording works for which role. Across thousands of teams, that's a benchmark nobody else has.

And: **we're the customer.** We built it to run our own hiring.

**Visual / data:** Five numbered rows, each with a one-word label on the left (Metric, Neutral,
Open, Team pricing, Data). Or a 2×2 positioning map: x = "measures volume → measures quality per
dollar", y = "closed, per-seat → open, flat". We sit alone in the top right.

**Speaker notes:** If a judge asks "what stops Workable adding a split-test tab?": the tab is easy,
the rest isn't. They'd have to change their metric, give up per-seat pricing, and open their code.
And they'd start with zero cross-board benchmarks.

**Sources:** —

---

## 7. Competition

**Headline:** Other ATSs organize applicants. We tell you which listing to pay for.

**On the slide:**

| | Spreadsheet + board inboxes | Breezy / Workable / Recruitee | Greenhouse / Lever / Ashby | **recruited.tools** |
| --- | --- | --- | --- | --- |
| Built for | Anyone, badly | SMBs | Mid-market, enterprise | Startups and SMBs |
| Split-test listings | By hand | No | No | **Built in** |
| Cost per good candidate, per variant | No | No | Reporting, not per variant | **The core metric** |
| Multi-round scorecards | No | Yes | Yes | Yes, with next-round briefs |
| Price | Free | Breezy from $189/mo, Workable from $299/mo, Recruitee by quote | Sales-led, higher | **Free self-host; $49 per open role hosted** |
| Own your data / open source | — | No | No | **MIT licensed** |

**Visual / data:** The table, with our column highlighted. Keep the 2×2 from slide 6 if that slide
uses rows instead.

**Speaker notes:** Our real competitor is the spreadsheet. Most small teams have no ATS at all, which
is why the bottom-up market on slide 10 is bigger than what the ATS category earns today.

**Sources** (each vendor's own pricing page):
- Breezy HR, checked on its own pricing page 2026-10-15: free plan with one active position; Startup
  $189, Growth $329, Business $529 per month billed monthly ($157 / $273 / $439 billed annually):
  https://breezy.hr/pricing
- Workable, checked 2026-10-15: no free plan; Standard $299, Premier $599, Enterprise $719 per month
  for 1–20 employees, rising with headcount: https://www.workable.com/pricing
- Recruitee, checked 2026-10-15: no public prices; tiered by plan, employee count and billing period,
  one-year minimum: https://recruitee.com/pricing

---

## 8. How we make money

**Headline:** Open source to get in the door. Paid when you're hiring, and paid again to move your ad spend.

**On the slide:** the pricing, then three revenue streams in the order they arrive.

| | Self-host | Hosted Free | Hosted Team | Hosted Annual |
| --- | --- | --- | --- | --- |
| Price | Free forever | Free | **$49 per open role per month**, capped at $249 | $1,490/year, unlimited roles |
| For | Teams with someone technical | Trying it on one role | Teams hiring in bursts | Teams that always have a role open |
| Includes | Every core feature, open source | 1 open role, "Hiring with recruited" on the apply page | Hosting, backups, email-in, unlimited interviewers, pause anytime with data kept | Everything in Team |

Paid add-ons on any hosted plan: AI screening summaries (usage-based), board connectors.

1. **Hosted plans (from launch).** You pay while a role is open, not per seat and not in months you
   aren't hiring.
2. **Managed job-ad spend (year 2+).** Teams route their board budget through us. We shift it to the
   winning variant automatically and take **10%** of spend managed *(assumption)*. A team spending
   $300 a month on boards adds $30.
3. **Benchmarks (year 3+).** Anonymized "what an A-tier candidate costs for this role on this board",
   sold to customers, recruiters and boards.

**Visual / data:** The pricing table, and next to it a stacked bar of revenue mix: year 1 hosted only
→ year 3 hosted + managed spend + benchmarks.

**Speaker notes:** Why price per open role: small teams hire in bursts. A flat monthly ATS gets
cancelled the month hiring stops, which is why small-business ATS churn is high. Pricing on open roles
matches what we charge to the moment the customer gets value. When they hire again they come back to
their history, rubrics and benchmarks, and that history is the switching cost. Unlimited interviewers
because a four-round loop touches five people, and per-seat pricing punishes exactly that. Self-hosting
stays free with every core feature. We make money on running it, AI, connectors and spend, not on
locking features away. This is the open-core model Cal.com and Plausible use. Plausible reached $1M
ARR as a self-funded team of four. Cal.com reportedly grew from $0 to about $10M ARR in five years
from a GitHub start. Prices are a proposal and haven't been tested yet.

**Sources:**
- Plausible, $1M ARR open-source SaaS, team of four: https://ingest.plausible.io/blog/open-source-saas
- Cal.com ARR path (third-party estimate, Sacra): https://sacra.com/c/cal
- Indeed sponsored jobs are pay-per-click; SMBs commonly spend ~$150–$300+/month (third-party
  estimate; verify): https://www.noon.ai/blog/articles/86-indeed-pricing-2026

---

## 9. Unit economics

**Headline:** A role costs $49 a month to run. The average hire costs $5,475.

**On the slide:**
- **Customer ROI:** a role open for two months costs $98, about 2% of the $5,475 average cost of a
  non-executive hire. Avoiding one bad listing pays for it. In the demo, moving spend from variant A
  to B cut the cost of an A-tier candidate from $9.32 to $2.51.
- **Our side** *(all targets and assumptions, to be replaced by pilot data)*:
  - Blended revenue per paying team: **~$120/month**, averaged across hiring and quiet months
  - Gross margin: **85%+**. It's a static frontend on Postgres with no per-customer infrastructure.
    AI is priced by usage, so it can't eat the margin.
  - Monthly churn: **3%**, modelled conservatively for small business
  - Lifetime value: $120 × 85% ÷ 3% ≈ **$3,400**
  - Customer acquisition cost target: **under $400**. Free hosting, the open repo and the apply-page
    badge do the acquiring, not paid ads.
  - LTV:CAC ≈ **8.5:1** at target

**Visual / data:** Left: one comparison bar, "$98 to run a role for two months vs $5,475 per hire".
Right: a small unit-economics table. Every assumed figure carries an "assumption" tag.

**Speaker notes:** Say plainly which numbers are measured (cost per hire, demo results) and which are
targets (churn, CAC, margin). Judges respect that. The pilot exists to replace the targets with real
numbers.

**Sources:** SHRM 2025 (cost per hire, link on slide 2). Everything else on the right is our
assumption.

---

## 10. Market size

**Headline:** A $3.3B software market, sitting on $34B of job ad spend nobody measures.

**On the slide:** three nested circles.
- **TAM: $3.3B.** Global applicant tracking software in 2025, growing to $4.9B by 2030 (8.2% CAGR).
  Next to it, the **$34.2B** online job ad pool that revenue stream 2 taps.
- **SAM: ~$950M.** US employers with 20–499 employees (~660k firms) at ~$120/month.
- **SOM: ~$9.5M ARR.** 1% of those firms (~6,600 teams) within 3–5 years, from hosted plans alone.

**Visual / data:** Nested circles (TAM > SAM > SOM), with the $34.2B ad pool drawn as a larger
separate ring labelled "the spend we steer". A small footnote points to appendix C.

**Speaker notes:** Two honest framings. Top-down, the ATS category is about $3.3B and growing about 8%
a year. Bottom-up, the US alone has about 2.4 million employer firms with 5+ people, and most small
ones run hiring on spreadsheets, so they don't show up in ATS revenue yet. That's headroom. The SAM
is deliberately conservative: only US firms with 20–499 employees. The ~1.7M firms with 5–19 people
and everyone outside the US are upside we aren't counting. The SOM counts hosted plans only. The
ad-spend take rate and benchmarks come on top.

**Sources:**
- MarketsandMarkets, ATS market $3.28B (2025) → $4.88B (2030), 8.2% CAGR:
  https://vapt.marketsandmarkets.com/PressReleases/applicant-tracking-system.asp
- Cross-checks, $2.8B–$3.1B for 2025: https://www.gminsights.com/industry-analysis/applicant-tracking-system-market ·
  https://www.imarcgroup.com/report/en/applicant-tracking-system-market
- SIA, $34.2B (link on slide 2)
- SBA Office of Advocacy, United States 2025 State Profile:
  https://advocacy.sba.gov/wp-content/uploads/2025/06/United_States_2025-State-Profile.pdf

---

## 11. Why it scales

**Headline:** Every hire makes the next recommendation better.

**On the slide:**
- **Cheap to serve.** Static frontend plus Postgres. Margin improves with scale.
- **Distribution is the repo.** One-click deploys to Cloudflare, Railway, Vercel, Netlify and Docker
  already exist. Self-hosters become hosted customers when they stop wanting to run it.
- **Board-agnostic and global.** Any board with a link works on day one. OnlineJobs.ph (Philippines)
  is already in the first customer's mix.
- **The flywheel.** More teams → more split tests → better benchmarks → better default listings for
  new teams → cheaper A-tier hires → more teams.
- **The apply page sells for us.** Every free hosted team's apply pages carry "Hiring
  with recruited", seen by every candidate who applies.
- **Expansion inside each account.** Hosted plan → managed ad spend → benchmarks. Revenue per
  customer grows without a new sale.

**Visual / data:** The flywheel as a circle diagram, plus one line about expanding revenue per
customer.

**Speaker notes:** The data advantage is the long-term answer to "why won't a big player crush you".
A board sees only itself and an enterprise ATS sees only its own enterprises. We see small-team
hiring across every board.

**Sources:** Deploy configs in the repo (README "Deploy").

---

## 12. Roadmap and milestones

**Headline:** From demo, to our own hiring, to a hosted business.

**On the slide:** three stages, each with a milestone that proves something.

- **Now, built at this hackathon:** split tests as the home screen, pipeline, candidates and
  profiles with the interview loop and a screening summary, an apply page per listing, and the
  new-role wizard. *Proves:* the workflow and the metric.
- **Next, pilot [Q4 2026 – Q1 2027]:** backend and team accounts, inbound email and board imports,
  calendar scheduling, AI screening summaries drawn only from what the candidate sent. Run the
  agency's real hiring through it, then 10 design partners. *Proves:* real A-tier-per-dollar
  results, retention, willingness to pay.
- **Later, scale [2027]:** hosted plans, statistical significance on split tests, auto-pause and
  spend shifting, cross-team benchmarks. *Proves:* the revenue streams on slide 8.

**Visual / data:** A horizontal timeline with three stages and a "proves" line under each.

**Speaker notes:** Investors care less about features than about what each stage de-risks. Say what
each milestone proves. Dates are placeholders until the team agrees them.

**Sources:** README "Roadmap".

---

## 13. Team and the ask

**Headline:** We have the problem, and we built the fix.

**On the slide:**
- **William Lee, ops and tech.** Head of operations at a music marketing agency. Runs the
  seven-listing, four-board hiring this came from, and built the product.
  linkedin.com/in/bywilliaml
- **Vanessa Safawi, marketing and sales.** Master's in AI management at Georgetown. BA in political
  economy from USC. linkedin.com/in/vanessasafawi
- **The ask: $500K pre-seed for 18 months**, and 10 design partners hiring 3+ roles this quarter.
- **Use of funds:** 55% product and engineering (backend, board imports, AI screening), 30% go-to-market
  (design partners, agencies, startup communities), 15% infrastructure, legal and operations.
- **Milestones it buys:** 10 design partners within 90 days · 100 paying teams and ~$12K MRR by month
  12 · managed ad spend live by month 18.
- recruited.tools/demo · github.com/vsafawi/recruited · [contact email]

**Visual / data:** Two headshot cards on the left. On the right, the ask as a big number, a use-of-funds
bar split 55 / 30 / 15, and the three milestones on a short timeline. A QR code to the demo.
Optional line: "Built in [N] hours at [Hackathon name]."

**Speaker notes:** Product and distribution, covered by two founders who live the problem. William
owns the build and is the first customer. Vanessa brings marketing and sales, and a graduate focus on
managing AI, which matters as hiring tools add AI screening. $500K is about $28K a month: two founders
on modest salaries, one engineer, and enough to run the pilot. If the room is judges rather than
investors, lead with the design-partner ask and keep the funding line. End on the 3.7× and the ask.

**Sources:** LinkedIn profiles above. The amount, split and milestones are our proposal.

---

## Appendix A. Product walkthrough (for a live demo or a judge's questions)

- **Split tests:** pay band, wording and board as variants, with a verdict on A-tier per dollar.
- **Pipeline:** every applicant from every board on one kanban, tagged with its variant.
- **Interview loop:** rounds, owners and scorecards on one profile. Each interviewer scores before
  seeing the others, and the next round gets a brief compiled only from what earlier rounds flagged.
- **Apply page:** one per listing variant (/jobs/l2), which is how attribution works.
- **Post once:** a four-step wizard drafts a variant per board.
- Full click path in `docs/DEMO.md`. Screenshot:
  `/mnt/project-files/screenshots/candidate-profile-1440.png`.

## Appendix B. Case study table (demo scenario)

| Role | Board · variant | Applies | A-tier | $ per A-tier |
| --- | --- | ---: | ---: | ---: |
| Operations VA | OnlineJobs.ph · B ($950/mo) | 94 | 22% | **$2.51** winner |
| Operations VA | OnlineJobs.ph · A ($600/mo) | 186 | 3% | $9.32 |
| Playlist Coordinator | Roster · A | 41 | 27% | **$4.43** |
| Playlist Coordinator | Indeed · B | 77 | 5% | $29.09 |
| Campaign Manager | Indeed · B, salary shown | 131 | 9% | $10.86 |
| Campaign Manager | Music Business Worldwide | 38 | 34% | $15.09 |
| Campaign Manager | Indeed · A, salary hidden | 212 | 3% | $20.13 paused |

Takeaways: naming pay and tools won by 3.7×; the niche board beat Indeed by 6.6× for playlist
coordinators; hiding salary drew the most applicants and the worst mix.

## Appendix C. Market sizing math

- Measured: the ATS market at $2.8B–$3.3B in 2025 across three research firms; 6,395,635 US employer
  firms (SBA, from 2022 Census data); $34.2B in online job ad revenue (SIA).
- Firm size: 89.4% of employer firms have fewer than 20 employees, so 20+ ≈ 10.6% ≈ 678k firms, or
  ≈ 660k excluding 500+. 63% have fewer than 5, so 5–19 ≈ 1.69M. Source is a secondary summary of
  Census data (https://clearvaluelending.com/reports/stats/small-business-count-us-2026); **check
  it against the SBA/Census table before presenting.**
- Assumed: $120/month blended revenue per paying team (from $49 per open role, capped at $249, and
  the $1,490 annual plan, averaged across hiring and quiet months), the 20–499 band as SAM, 1% share
  in 3–5 years.
- SAM = 660k × $1,440 ≈ $950M. SOM = 6,600 × $1,440 ≈ $9.5M ARR.

## Appendix D. How A-tier per dollar is calculated

- Each application is scored against the role's rubric (role skills, music-industry context,
  communication, ownership) into tier A, B or C.
- A-tier per dollar = (applies × A-tier share) ÷ spend, where spend is the board's cost over the
  listing's time live.
- The demo shows a fixed confidence figure; real significance testing is on the roadmap.
- Screening summaries are drawn only from what the candidate sent.

---

## Open questions before the final deck

1. **Case-study numbers:** not confirmed as real, so they stay labelled "demo scenario" on slide 5 and
   appendix B. If the agency's actual figures turn up, swap them in and drop the label.
2. **Pricing, the ask and the unit economics** are Claude's proposal (per open role, $500K pre-seed).
   Change anything you disagree with.
3. **Verify before presenting:** the firm-size split against the Census Statistics of US
   Businesses table. Competitor prices were checked on the vendors' own pages on 2026-10-15.
