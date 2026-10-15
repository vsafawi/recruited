# recruited.tools — judge and investor Q&A prep

Each answer is short enough to say in 20 seconds. Lead with the answer sentence, then one line of
support. Numbers marked *(assumption)* are proposals, so say that if pushed.

---

## Competition and difference

**Why wouldn't a small team just use Greenhouse, Ashby or Lever?**
Those are built for companies with an HR team and a sales-led contract. A ten-person company hiring
three roles doesn't need them and won't pay for them. More importantly, none of them treats the
listing as something to test. They start at the application.

**Breezy and Workable already serve small businesses. What stops them adding split tests?**
The tab is easy; the rest isn't. They'd have to change their core metric from applicants to cost
per good candidate, give up per-seat pricing, and they'd start with zero cross-board data. We're
built around that metric from the start.

**Isn't this just a feature?**
The feature is the wedge. The business is that we sit between small teams and their job-ad spend,
across every board. That position gives us the spend-management revenue and the benchmark data,
and a feature inside a single board or a single ATS can't get either.

**What's your moat?**
Three things that grow over time. Cross-board benchmarks no single board can see. Distribution
through the open-source repo. And neutrality: boards are paid on volume, so they'll never tell a
customer that another board worked better.

**Who's your real competitor?**
The spreadsheet. Most small teams have no ATS at all, and that's who we're built for.

## Data and the job boards

**How do you get data out of Indeed and the other boards?**
We don't need to, to start. Each listing variant points to its own apply page on recruited, so the
application lands with us already attributed. Spend is the board's price, which the team enters
once. Board imports and email-in are on the roadmap to cover boards that keep applicants on-site.

**Won't the boards block you?**
They have no reason to. We send them more listings, not fewer. The apply-page approach works with
any board that accepts a link, which is nearly all of them.

**How do you decide what an "A-tier" candidate is? Isn't that subjective?**
Each role has a rubric the team writes, and each interviewer scores against it, independently,
before seeing others' scores. That's standard structured hiring. We use the team's own judgement as
the quality signal instead of inventing one.

**Is 94 applications enough to call a winner?**
Not always, which is why significance testing is on the roadmap. The demo shows a fixed confidence
figure. The bigger point is the direction: on applicant counts alone, teams pick the wrong listing.

## AI

**Do you use AI to screen candidates?**
Screening summaries, yes, as a paid-tier feature. They're drawn only from what the candidate sent
and are labelled that way. They never invent experience. In the demo they run on sample output so
we don't spend API credits.

**What about bias and AI hiring laws (for example NYC Local Law 144)?**
The AI summarizes, it doesn't decide. Tiering comes from the team's rubric and human scorecards.
That keeps humans making the decision. We'd still run a bias audit before selling AI screening in
places that require one.

## Business model and numbers

**How do you make money if it's open source?**
Open core, the model Cal.com and Plausible use. Every core feature is free to self-host. Most small
teams don't want to run servers, so they pay us to host it: $49 per open role per month, capped at
$249, or $1,490 a year *(assumption)*. On top of that come usage-based AI summaries, board
connectors, later a 10% cut of the job-ad spend we manage, and benchmarks.

**Why would someone pay when they can self-host for free?**
The same reason people pay for hosted Plausible and Cal.com: a small team has no one to run
servers, backups and updates. Self-hosters are also our best leads: when they outgrow running it,
they convert.

**Why price per open role instead of per seat or a flat monthly fee?**
Small teams hire in bursts. A flat monthly ATS gets cancelled the month hiring stops, and per-seat
pricing punishes the five people in a four-round loop. Per open role, you pay while you're getting
value, with unlimited interviewers.

**Doesn't per-role pricing make revenue lumpy?**
Somewhat, and that's deliberate. A team that pauses keeps its history, rubrics and benchmarks, so
the next hire comes back to us rather than to a competitor. The annual plan smooths it for teams
that always have a role open, and managed ad spend adds revenue that doesn't depend on seat counts.

**Can't someone take your MIT code and host it themselves as a competitor?**
They can, which is the tradeoff of a permissive license. The code isn't the moat. The cross-board
benchmarks and the managed-spend relationship are. If hosted clones become a real problem, the
common answer is AGPL for the core, which Plausible and Cal.com both use. That's a decision for
later.

**What's the market size?**
About $3.3B for applicant tracking software worldwide in 2025, growing about 8% a year to around
$4.9B by 2030 (MarketsandMarkets). Next to it there's $34.2B of online job-ad spend (SIA), which is
the money our split tests steer. Our conservative serviceable market is about $950M: 660k US firms
with 20–499 employees at about $120 a month.

**What are your unit economics?**
Targets, not measurements yet: about $120 a month per paying team averaged across hiring and quiet
months, 85%+ gross margin because it's a static frontend on Postgres, and 3% monthly churn. That's
roughly $3,400 lifetime value against a CAC target under $400. The pilot is how we replace those
targets with real numbers.

**Why will customers pay?**
The average non-executive hire costs $5,475 (SHRM, 2025). Running a role on recruited for two
months costs $98. Avoiding one bad listing pays for it.

**How much traction do you have?**
Honest answer: it's a hackathon build, and our own agency is the first customer. The next milestone
is running our real hiring through it, then 10 design partners. *[Update if anything has changed.]*

## Why now, and why you

**Why now?**
Three things. Small teams hire across more boards than ever, including global remote boards like
OnlineJobs.ph. Pay transparency laws are making pay band a variable every listing has to choose.
And the cost to build and host software like this has dropped, so an open-source tool can match a
paid one on day one.

**Why you two?**
We're the customer. William runs the seven-listing, four-board hiring this came from and built the
product. Vanessa leads marketing and sales, with a master's in AI management at Georgetown and a
political economy degree from USC. That covers both halves: building it, and getting it in front of
the next thousand teams, as AI screening becomes part of hiring.

**What would you do with funding?**
We're raising $500K pre-seed for 18 months. 55% goes to product and engineering (the backend,
board imports, AI screening), 30% to go-to-market, and 15% to infrastructure, legal and operations.
It buys 10 design partners within 90 days, 100 paying teams and about $12K MRR by month 12, and
managed ad spend live by month 18.

## Tough curveballs

**Isn't "hire who pays more" an obvious result?**
Sometimes. Sometimes the cheaper niche board wins, and sometimes hiding salary looks like a win
until you see the tier mix. Teams don't know which applies to them until they measure it. That's
the product.

**What if a team only hires twice a year?**
They're not our core customer. We're built for teams running several roles at once: agencies,
startups after a raise, growing small businesses. The free self-host tier covers occasional hirers.

**What happens to candidate data?**
Self-hosted, it never leaves the team's own infrastructure. Hosted, it's isolated per team. That's
a selling point against closed tools.
