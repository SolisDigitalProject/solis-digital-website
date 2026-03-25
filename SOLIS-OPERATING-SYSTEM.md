# SOLIS DIGITAL — FINAL SCALABLE OPERATING SYSTEM

**Version:** 1.0
**Date:** 25 March 2026
**Prepared by:** Executive Leadership Simulation (CEO, COO, CMO, Head of Sales, CTO, Investor Board)

---

## EXECUTIVE SUMMARY

Solis Digital has built a surprisingly mature automation stack for an early-stage agency. The core pipeline — scrape leads, audit websites, push to cold email, track engagement, nurture, close — is fully scripted and ready for orchestration. The website, niche landing pages, client dashboard, onboarding flow, and client portal are all functional.

**The honest assessment:** You have built 80% of what a £100k/month agency needs. The remaining 20% is what separates a side project from a sellable business.

This document is the blueprint to close that gap.

---

## STEP 1 — SYSTEM AUDIT

### What You Have (Component-by-Component Verdict)

| Component | Verdict | Action |
|-----------|---------|--------|
| **index.html** (main site) | KEEP | Strong positioning. "More Clients. More Revenue. All On Autopilot" is clear. 4 services, 3 tiers, audit form — all correct. |
| **dental.html** | KEEP + IMPROVE | Good niche copy. Needs real case study data and dental-specific social proof. |
| **aesthetics.html** | KEEP + IMPROVE | Same as dental — good copy, needs real proof points. |
| **trades.html** | KEEP + IMPROVE | Checkatrade comparison angle is strong. Needs more specific ROI math. |
| **dashboard.html** | KEEP + IMPROVE | Functional command centre. Missing: export, historical trends, automated alerts. |
| **onboard.html** | KEEP | 5-step wizard is comprehensive. Risk of drop-off but acceptable for high-ticket clients. |
| **portal.html** | KEEP + IMPROVE | Client-facing portal is a differentiator. Needs: deliverables section, feedback mechanism, invoice history. |
| **lead-scoring.mjs** | KEEP | 130-point algorithm is solid. Covers website quality, industry, location. |
| **bulk-audit.mjs** | KEEP + IMPROVE | Core engine. Needs retry logic and error alerting. |
| **instantly-sync.mjs** | KEEP | Clean Instantly integration with 10 merge tags. |
| **instantly-webhook.mjs** | KEEP + IMPROVE | Tracks opens/replies/bounces. Needs webhook signature verification. |
| **lead-nurture.mjs** | IMPROVE | Templates are generic, not niche-specific. Move templates to database. |
| **health-monitor.mjs** | KEEP + IMPROVE | Monitoring exists but alerts are commented out. Implement Slack/email alerts. |
| **daily-kpi-report.mjs** | KEEP + IMPROVE | Good metrics. Needs auto-send via Resend API instead of depending on Make.com. |
| **export-leads.mjs** | REMOVE | Superseded by instantly-sync.mjs. Dead code. |
| **generate-copy.mjs** | KEEP | AI copy generation for client websites. Saves 4-6 hours per project. |
| **config.mjs** | IMPROVE | Hardcoded credentials. Move to .env immediately. |
| **vercel.json** | KEEP | cleanUrls, noindex on scripts, rewrites to 404. Correct. |
| **robots.txt** | KEEP | Blocks dashboard, onboard, portal, scripts. Correct. |
| **sitemap.xml** | KEEP | 6 URLs indexed with correct priorities. |
| **Stripe products** | KEEP | 3 tiers with setup + monthly. Payment links working. |
| **Stripe webhook** | KEEP | Auto-assigns package and delivery timeline. |
| **3 Instantly campaigns** | KEEP | Dental, Aesthetics, Trades with 5-email niche sequences. |
| **AGENCY-BLUEPRINT.md** | REMOVE from repo | 15k+ lines of strategy. Useful reference but bloats the codebase. Move to Notion. |
| **ZYPFLOW-INTEGRATION.md** | KEEP | Automation orchestration guide. Critical reference. |

### Strengths
1. **Full pipeline exists in code.** Scrape → Score → Audit → Push → Track → Nurture → Close. Most agencies at this stage have none of this.
2. **Niche positioning is correct.** Three verticals with specific pain points, not generic "we do websites."
3. **Audit-led selling model.** Leading with free value (website audit) instead of cold pitching services. This is what agencies billing £50k+/month do.
4. **Client infrastructure exists.** Dashboard, onboarding, portal — these are assets that increase valuation.
5. **Merge tag personalisation.** Cold emails reference specific audit data (speed score, issues found). This is not spray-and-pray.

### Weaknesses
1. **No orchestration.** Scripts exist but nothing runs them automatically. The 6 Make.com/Zypflow scenarios described in ZYPFLOW-INTEGRATION.md are not built yet.
2. **No sending infrastructure.** Instantly campaigns exist but no sending accounts are connected. You need warmed domains and mailboxes.
3. **No social proof.** Zero case studies, testimonials, or proof points. Every landing page references hypothetical results.
4. **Credentials exposed.** Supabase key, PageSpeed key hardcoded in frontend HTML and config.mjs.
5. **No CRM.** Supabase tables act as a pseudo-CRM but there's no deal pipeline, task management, or follow-up automation beyond email.
6. **Apify blocked.** Monthly usage limit exceeded. Cannot scrape leads until resolved.

### Redundancies
- `export-leads.mjs` duplicates `instantly-sync.mjs` functionality
- `lead-nurture.mjs` runs a parallel 4-email sequence alongside Instantly's 5-email sequence — leads could receive 9 emails in 14 days from two systems
- AGENCY-BLUEPRINT.md (15k lines) and this document overlap

### Missing Components
1. **Email sending infrastructure** (domains, mailboxes, warming)
2. **Make.com/Zypflow scenario automation** (the glue that runs everything)
3. **Proposal/contract automation** (currently manual)
4. **Client reporting automation** (monthly performance reports)
5. **Upsell trigger automation** (30/60/90 day automated nudges)
6. **Slack or notification system** (founders need real-time alerts)

---

## STEP 2 — FINAL SERVICE MODEL

### The Problem With Your Current Pricing

Your pricing is correct for the market, but the packaging has a delivery problem:

| Package | Setup | Monthly | What You Promised | Actual Delivery Effort |
|---------|-------|---------|-------------------|----------------------|
| Starter | £995 | £195/mo | 5-page website, basic SEO, contact form | 8-12 hours build + 2 hrs/mo maintenance |
| Growth | £1,995 | £395/mo | 10-page website, AI chatbot, reviews, SEO, analytics, dashboard | 20-30 hours build + 8 hrs/mo ongoing |
| Accelerator | £2,997 | £997/mo | Unlimited pages, ads management, social media, dedicated strategist | 40+ hours build + 20+ hrs/mo ongoing |

**The issue:** Accelerator at £997/month with Google Ads management, social media management, AND a dedicated account manager is underpriced. You're selling a £2,500/month service for £997.

### Revised Service Model

**Principle:** Every tier should be deliverable in under 15 hours of founder time per month. Anything beyond that must be automated or outsourced.

#### STARTER — "Get Found Online"
**£995 setup + £195/month**

Deliverables:
- 5-page templated website (Framer or custom HTML)
- Mobile optimisation
- Basic on-page SEO (meta tags, schema, sitemap)
- Google Business Profile setup
- Contact form with email notifications
- SSL + hosting + domain management
- Monthly uptime monitoring

Delivery effort: **6-8 hours build, 1 hour/month**
Margin: ~85%

What makes this profitable: Template-based. You build 3 industry templates (dental, aesthetics, trades) and customise colours/copy. generate-copy.mjs handles the content.

#### GROWTH — "Get Booked Out"
**£1,995 setup + £395/month**

Everything in Starter plus:
- 10-page custom website
- Advanced SEO (monthly keyword tracking, content optimisation)
- Google Business Profile optimisation (weekly posts, review responses)
- AI chatbot deployment (Tawk.to or custom)
- Review automation system (email/SMS review requests)
- White-label performance dashboard (portal.html)
- Monthly analytics report (automated)
- Priority support

Delivery effort: **12-15 hours build, 4 hours/month**
Margin: ~75%

What makes this profitable: The chatbot is a one-time setup (2 hours). Review automation is a one-time setup (1 hour). Monthly reporting is automated via daily-kpi-report.mjs adapted per client. The £395/month is mostly recurring revenue for maintenance work.

#### ACCELERATOR — "Dominate Your Area"
**£2,997 setup + £997/month**

Everything in Growth plus:
- Unlimited pages
- Google Ads management (you manage £500 included ad budget)
- Retargeting pixel setup
- Monthly SEO campaign (link building, content creation)
- Social media content calendar (4 posts/week — AI-generated, founder-approved)
- Dedicated Slack channel
- Quarterly strategy call
- White-glove onboarding

Delivery effort: **20-25 hours build, 10 hours/month**
Margin: ~65%

**REMOVE from Accelerator (compared to current):**
- "Meta Ads management" — Too broad. Keep it to Google Ads only until you hire.
- "Social media management" — Replace with "social media content calendar." You provide the content plan and AI-generated posts. Client posts them OR you post 4x/week (not daily).
- "Dedicated account manager" — Replace with "dedicated Slack channel + quarterly strategy call." You are the account managers. Don't promise a person you don't have.

### The Upgrade Ladder

```
STARTER (£195/mo) → GROWTH (£395/mo)
Trigger: 30-day ROI report shows they're getting enquiries but not converting.
Pitch: "You're getting traffic but your site doesn't convert. Growth adds chatbot + review automation + SEO to turn visitors into bookings."
Upsell value: +£200/mo recurring

GROWTH (£395/mo) → ACCELERATOR (£997/mo)
Trigger: 90-day report shows strong organic but competitor is running ads.
Pitch: "You're ranking well organically. Your competitor is running Google Ads and capturing the paid traffic too. Accelerator adds ads management to dominate both."
Upsell value: +£602/mo recurring

ADD-ONS (any tier):
- Extra landing page: £297 one-off
- Blog content (4 posts/month): £197/month
- Additional location page: £197 one-off
- Logo & brand kit: £497 one-off
```

### Why This Model Works for Exit

An acquirer values:
1. **Recurring revenue predictability** — Monthly retainers, not one-off projects
2. **Low delivery cost per client** — Template-based, automated reporting
3. **Clear upgrade path** — Built-in revenue expansion without new client acquisition
4. **Niche expertise** — Dental/aesthetics/trades positioning commands premium

---

## STEP 3 — AUTOMATED LEAD GENERATION ENGINE

### Current State
- Apify Google Maps scraper configured for 3 niches × 19 cities
- Apify account blocked (monthly usage limit exceeded)
- No alternative scraper in place

### Target: 500-1,000 Leads Per Day

This is achievable but requires multiple sources, not just Google Maps.

### The Lead Generation Stack

#### Source 1: Google Maps (Primary — 60% of leads)
**Tool:** Apify `compass/crawler-google-places`
**Cost:** $49/month (Starter plan) = ~12,000 results/month at $0.004/place
**Configuration already built:**
- Dental: ["dentist", "dental practice", "dental clinic"]
- Aesthetics: ["aesthetics clinic", "skin clinic", "Botox", "lip filler", "cosmetic clinic"]
- Trades: ["plumber", "electrician", "builder", "roofer"]
- 19 UK cities, contact enrichment enabled, website filter on

**Scaling strategy:** Run each niche across 19 cities = 57 scraper runs. At 50 results per search term per city:
- Dental: 3 terms × 19 cities × 50 = 2,850 leads
- Aesthetics: 5 terms × 19 cities × 50 = 4,750 leads
- Trades: 4 terms × 19 cities × 50 = 3,800 leads
- **Total first batch: ~11,400 leads**

After initial scrape, run weekly with `maxCrawledPlacesPerSearch: 20` to catch new businesses. That's ~2,280 new leads/week.

**Action required:** Upgrade Apify to Starter plan ($49/month). Current free tier is exhausted.

#### Source 2: Yell.com / Thomson Local (Secondary — 20% of leads)
**Tool:** Apify `drobnikj/crawler-google-places` or custom Apify actor for directory scraping
**What to scrape:**
- yell.com/ucs/UcsSearchAction.do?keywords=dentist&location=London
- thomsonlocal.com/dentist/london
- yelp.co.uk/search?find_desc=dentist&find_loc=London

**Data points:** Business name, address, phone, website, category
**Volume:** ~200-400 leads per directory per city per niche

#### Source 3: Industry-Specific Directories (Supplementary — 10% of leads)
**Dental:**
- nhs.uk/service-search/find-a-dentist (every NHS dental practice in UK)
- bda.org/find-a-dentist
- dentalphobia.co.uk/find-a-dentist

**Aesthetics:**
- treatwell.co.uk (search by area)
- glowday.com/practitioners
- consultingroom.com/find-a-practitioner

**Trades:**
- checkatrade.com/trades (scrape their listings — these are businesses already paying for leads)
- mybuilder.com/search
- ratedpeople.com/find-tradespeople
- trustatrader.com

**Why Checkatrade is gold:** Every business on Checkatrade is already paying £100-600/month for leads. They're pre-qualified as businesses that invest in marketing. Your pitch ("stop paying Checkatrade") resonates because they're already feeling the cost.

#### Source 4: Google Search Results (Supplementary — 10% of leads)
**Tool:** Apify `apify/google-search-scraper`
**Queries:**
- "dentist [city] website" — Find dental practices with websites to audit
- "plumber [city]" — Organic results show businesses investing in SEO
- "aesthetics clinic [city] reviews" — Find clinics with review presence

**Purpose:** Catch businesses not on Google Maps but ranking organically.

### Lead Deduplication
Your `lead-scoring.mjs` doesn't deduplicate. Add this logic:
- Before inserting any lead, check Supabase for matching `website` OR `phone` OR `email`
- If match found, update existing record (don't create duplicate)
- Track `source` field: "google_maps", "yell", "checkatrade", "google_search"

### Daily Volume Target

| Source | Daily Volume | Monthly Volume |
|--------|-------------|----------------|
| Google Maps (weekly batch ÷ 7) | 325 | 9,750 |
| Yell/Thomson (weekly batch ÷ 7) | 100 | 3,000 |
| Niche directories (monthly batch ÷ 30) | 50 | 1,500 |
| Google Search (weekly batch ÷ 7) | 25 | 750 |
| **Total** | **500** | **15,000** |

**Cost:** ~$49/month (Apify Starter) + $0 (free tier scrapers for directories)

---

## STEP 4 — AUTOMATED COLD EMAIL ENGINE

### Email Infrastructure (This Is the Part Most Agencies Get Wrong)

Cold email deliverability is 90% infrastructure, 10% copy. Your Instantly campaigns have great copy. But without proper infrastructure, those emails go to spam.

#### Domain Setup
Buy 3 secondary domains per niche (9 total). Never send cold email from your main domain.

**Dental domains:**
- solisdentaldigital.co.uk
- solisdentalmarketing.co.uk
- solisdentalpractice.co.uk

**Aesthetics domains:**
- solisaestheticsdigital.co.uk
- solisclinicmarketing.co.uk
- solisaestheticsgrowth.co.uk

**Trades domains:**
- solistradesdigital.co.uk
- solistradesmarketing.co.uk
- solistradesgrowth.co.uk

**Cost:** ~£5-10/domain/year × 9 = ~£70/year

**DNS setup per domain:**
- SPF record: `v=spf1 include:_spf.google.com ~all`
- DKIM: via Google Workspace
- DMARC: `v=DMARC1; p=none; rua=mailto:dmarc@solisdigital.co.uk`
- Custom tracking domain in Instantly

#### Mailbox Setup
3 mailboxes per domain × 9 domains = 27 mailboxes.

**Provider:** Google Workspace ($6/user/month) or Outlook 365 ($6/user/month)
**Cost:** 27 × $6 = $162/month

**Naming convention:**
- alex@solisdentaldigital.co.uk
- team@solisdentaldigital.co.uk
- hello@solisdentaldigital.co.uk

**Why 27 mailboxes?** Each mailbox sends max 30-40 emails/day to stay under radar. 27 mailboxes × 35 emails/day = 945 emails/day = ~20,000 emails/month.

#### Warming Schedule
**Tool:** Instantly's built-in warmup (included in plan)
**Timeline:**
- Week 1-2: Warming only (send 5/day, increase by 2/day)
- Week 3: Start sending 10 cold emails/day per mailbox
- Week 4: Ramp to 20/day per mailbox
- Week 5+: Full volume at 30-35/day per mailbox

**Critical rule:** Never exceed 50 emails/day per mailbox. 30-35 is the safe zone.

#### Sending Allocation Per Campaign

| Campaign | Mailboxes | Daily Volume | Monthly Volume |
|----------|-----------|-------------|----------------|
| Dental | 9 (3 domains × 3) | 315 | 9,450 |
| Aesthetics | 9 (3 domains × 3) | 315 | 9,450 |
| Trades | 9 (3 domains × 3) | 315 | 9,450 |
| **Total** | **27** | **945** | **28,350** |

#### The 5-Email Sequences (Already Built)

Your 3 Instantly campaigns are already configured with niche-specific 5-email sequences:

**Dental Campaign** (`ef020206-24f1-4d6a-8233-d52b9b5dd177`):
1. Day 0: "Your website might be turning patients away" — Audit findings
2. Day 3: Follow-up with case study (page 3 → top 3 ranking)
3. Day 7: "When did you last Google 'dentist in [location]'?"
4. Day 10: Competitor analysis angle
5. Day 14: File closing (breakup email)

**Aesthetics Campaign** (`a5493fd5-835b-4a5f-a085-7c91aa7acfb5`):
1. Day 0: "Are you relying on Instagram for new clients?"
2. Day 3: Case study (Instagram-only → 25+ Google enquiries/month)
3. Day 7: "The clients you're missing at 10pm"
4. Day 10: Top clinics comparison
5. Day 14: File closing

**Trades Campaign** (`f27305ec-12be-4b76-b399-762dd7dcd584`):
1. Day 0: "Paying too much for Checkatrade leads?"
2. Day 3: £7,200/year Checkatrade maths
3. Day 7: "How '[trade] in [location]' could be your best lead source"
4. Day 10: Competitor comparison
5. Day 14: File closing

### REMOVE: Lead Nurture Duplicate

**Critical decision:** Your `lead-nurture.mjs` runs a SEPARATE 4-email sequence alongside Instantly's 5-email sequence. This means a lead could receive 9 emails in 14 days from two different systems.

**Action:** DISABLE `lead-nurture.mjs` for cold outreach leads. Only use it for inbound leads (website audit form submissions) who are NOT in an Instantly campaign.

Set the rule:
- **Cold leads (scraped):** Instantly campaigns only (5 emails)
- **Inbound leads (audit form):** lead-nurture.mjs only (4 emails)
- **Never both.**

---

## STEP 5 — AUTOMATED WEBSITE AUDIT ENGINE

### Current State
`bulk-audit.mjs` runs PageSpeed API + Claude AI to generate audit summaries. This is your core differentiator.

### The Full Audit Engine

#### What It Analyses (Current)
- Speed score (0-100) via Google PageSpeed
- SEO score (0-100) via Lighthouse
- Mobile score (0-100) via Lighthouse
- SSL certificate check
- AI-generated 2-3 sentence summary via Claude

#### What It Should Also Analyse (Add These)
1. **Google Business Profile completeness** — Use Google Places API to check if the business has: photos (>5), services listed, opening hours, description, Q&A
2. **Review score and count** — Already captured from Google Maps scraper. Flag businesses with <4.0 stars or <20 reviews.
3. **Competitor gap** — For each lead, run the same audit on the top 3 competitors in their area. Show the gap. "Your speed: 35. Top competitor: 89."
4. **Missing conversion elements** — Check for: phone number visible, booking/contact form, live chat widget, clear CTA above the fold. This can be done with a simple page scrape checking for common patterns.
5. **Schema markup** — Check if structured data exists (LocalBusiness schema, FAQ schema, Review schema)

#### How Audits Drive Inbound

The audit is not just a sales tool — it IS the product at the top of the funnel.

**Flow:**
1. Lead visits landing page (dental/aesthetics/trades)
2. Enters website URL in audit form
3. Instant PageSpeed scan runs in browser (already built in your HTML)
4. Results displayed immediately
5. Lead captured in Supabase with scores
6. `bulk-audit.mjs` enriches with Claude AI summary
7. If lead provided email → send full PDF audit report automatically
8. If no email → retarget with "Your full report is ready" via cold email

**The PDF audit report** (not yet built — high priority):
- 1-page executive summary with red/amber/green scores
- Speed analysis with specific recommendations
- SEO gap analysis vs. competitors
- Mobile usability issues
- Revenue impact estimate ("At your current speed score, you're losing approximately X visitors per month")
- Clear CTA: "Book a 15-minute call to walk through these findings"

**Tool to build this:** Use Claude API to generate the report content, then Puppeteer/Playwright to render it as PDF. Or simpler: generate an HTML report and use Vercel's `@vercel/og` to create a shareable image.

---

## STEP 6 — AUTOMATED SALES SYSTEM

### Current Sales Process (What You Have)
1. Lead comes in (scraper or audit form)
2. Gets scored (lead-scoring.mjs)
3. Gets audited (bulk-audit.mjs)
4. Gets pushed to cold email (instantly-sync.mjs)
5. Replies tracked (instantly-webhook.mjs)
6. Dashboard shows top leads to call
7. Founders manually call and close

### The Optimised Sales System

#### Stage 1: Qualification (100% Automated)
- Lead scraped or submitted audit form
- Audit runs automatically
- Lead scored 0-130
- Only leads scoring 60+ enter the email sequence
- Leads scoring 90+ flagged as "Priority" in dashboard

**Why 60+ threshold:** Below 60 means the business likely doesn't have a website, doesn't have email, isn't in a target industry, or isn't in a target city. Not worth the email.

#### Stage 2: Outreach (100% Automated)
- Instantly sends 5-email niche sequence over 14 days
- Webhook tracks opens, clicks, replies
- Replies automatically update lead status to "Replied"
- Dashboard surfaces replied leads at the top

#### Stage 3: Response Handling (Semi-Automated)
When a lead replies:
1. **Positive reply** ("Yes, send the report" / "Interested") →
   - Auto-send the PDF audit report via email (use Resend API)
   - Auto-send Calendly booking link
   - Move to "Call Booked" status when Calendly confirms

2. **Question reply** ("How much does this cost?" / "What do you do?") →
   - Founder responds within 2 hours (set Slack notification)
   - Use saved reply templates (not AI — keep it human)

3. **Negative reply** ("Not interested" / "Remove me") →
   - Auto-remove from sequence
   - Mark as "Not Interested" in Supabase
   - Never contact again

#### Stage 4: Discovery Call (Founder-Led, 15 Minutes)
**Structure:**
1. (2 min) "Tell me about your practice/business"
2. (3 min) Walk through audit findings on screen share
3. (3 min) "Here's what we'd fix and the expected outcome"
4. (2 min) Show the relevant package (Growth for most, Starter for price-sensitive)
5. (3 min) Handle objections
6. (2 min) "I'll send the proposal now. Payment link is included."

**Key insight:** The audit does the selling. By the time you're on the call, they've already seen their problems. You're just confirming and presenting the solution.

#### Stage 5: Proposal & Close (Semi-Automated)
After the call:
1. Send a 1-page proposal via email (template with merge fields: business name, package, price, timeline, key fixes)
2. Include Stripe payment link for the selected package
3. If no payment within 48 hours → automated follow-up: "Just checking — did you have any questions about the proposal?"
4. If no payment within 7 days → final follow-up: "The offer stands whenever you're ready. Here's the link again."

**Proposal template fields:**
- {{business_name}}
- {{package_name}} (Starter/Growth/Accelerator)
- {{setup_fee}}
- {{monthly_fee}}
- {{delivery_days}}
- {{key_fix_1}}, {{key_fix_2}}, {{key_fix_3}} (from audit)
- {{expected_outcome}} (3-5 enquiries / 8-12 enquiries / dominate your area)
- {{payment_link}}

#### Stage 6: Payment & Onboarding (100% Automated)
1. Client pays via Stripe payment link
2. Stripe webhook fires → creates project in Supabase
3. Auto-email with onboarding form link (onboard.html with pre-filled token)
4. Client completes onboarding form
5. Project appears in dashboard with status "Onboarding"
6. Portal access token sent to client

**This entire flow from payment to onboarding should take zero founder time.**

### Two-Founder Sales Capacity

| Activity | Time Per Lead | Weekly Volume | Weekly Hours |
|----------|--------------|---------------|--------------|
| Review replied leads | 2 min | 30 | 1 hr |
| Respond to positive replies | 3 min | 15 | 0.75 hr |
| Discovery calls | 15 min | 10 | 2.5 hr |
| Send proposals | 5 min | 8 | 0.67 hr |
| Follow up on proposals | 3 min | 5 | 0.25 hr |
| **Total sales time per week** | | | **5.2 hrs** |

Split between two founders = **2.6 hours each per week on sales.**

With a 25% close rate on calls (10 calls → 2.5 new clients/week → 10 clients/month), this is achievable.

---

## STEP 7 — DELIVERY AUTOMATION

### Starter Package Delivery (Target: 6-8 hours)

| Task | Tool | Time | Automated? |
|------|------|------|-----------|
| Generate website copy | generate-copy.mjs (Claude API) | 0.5 hr | Yes |
| Build 5-page site from template | Framer template or custom HTML | 3-4 hrs | Partially (template) |
| Mobile optimisation | Built into template | 0 hr | Yes |
| Basic SEO setup | Checklist + generate-copy.mjs meta tags | 0.5 hr | Partially |
| Google Business Profile setup | Manual (requires client access) | 1 hr | No |
| Contact form + Google Maps | Template component | 0.5 hr | Yes |
| SSL + hosting + domain | Vercel auto-SSL, domain transfer | 0.5 hr | Mostly |
| Client portal setup | Auto-created by Stripe webhook | 0 hr | Yes |
| **Total** | | **6-7 hrs** | |

### Growth Package Delivery (Target: 12-15 hours)

| Task | Tool | Time | Automated? |
|------|------|------|-----------|
| Everything in Starter | As above | 6-7 hrs | |
| Additional 5 pages | Template + AI copy | 2-3 hrs | Partially |
| Advanced SEO setup | Ahrefs/SEMrush audit → implementation | 2 hrs | No |
| Google Business optimisation | Manual + template posts | 1 hr | No |
| AI chatbot deployment | Tawk.to setup with custom responses | 1 hr | Template |
| Review automation setup | Email/SMS templates in CRM | 0.5 hr | Template |
| Dashboard setup | Auto-created | 0 hr | Yes |
| **Total** | | **12-14 hrs** | |

### Accelerator Package Delivery (Target: 20-25 hours)

| Task | Tool | Time | Automated? |
|------|------|------|-----------|
| Everything in Growth | As above | 12-14 hrs | |
| Additional pages | Template + AI copy | 3-4 hrs | Partially |
| Google Ads setup | Campaign structure + keywords + ad copy | 3-4 hrs | No |
| Retargeting pixel | Google Tag Manager | 0.5 hr | Template |
| Social media content calendar | Claude API batch generation | 1-2 hrs | Mostly |
| White-glove onboarding call | Founder call (30 min) | 0.5 hr | No |
| **Total** | | **20-25 hrs** | |

### Industry Templates (Build Once, Use Forever)

Create 3 master templates:

**Dental Template:**
- Hero with dental imagery
- Treatment menu page
- Before/after gallery
- Patient testimonials section
- Emergency dental CTA
- Insurance/NHS accepted badges

**Aesthetics Template:**
- Treatment menu with pricing
- Before/after gallery (consent-compliant)
- Practitioner profiles
- Treatment FAQ
- Online booking integration
- Instagram feed embed

**Trades Template:**
- Service area map
- Project gallery
- Accreditation badges (Gas Safe, NICEIC, etc.)
- Instant quote form
- Click-to-call mobile CTA
- Reviews widget

**Time to build each template:** 8-10 hours (one-time)
**Time saved per client using template:** 4-6 hours

### Onboarding Automation Timeline

```
Day 0: Payment received
  → Stripe webhook fires
  → Project created in Supabase
  → Welcome email sent with onboarding form link
  → Client portal token generated

Day 1: Onboarding form reminder (if not completed)
  → Automated email: "Complete your brief so we can start building"

Day 2: Onboarding form completed
  → generate-copy.mjs runs automatically
  → Copy draft stored in project record
  → Founder notified via Slack: "New project ready to build"

Day 3-7 (Starter) / Day 3-10 (Growth) / Day 3-14 (Accelerator):
  → Founder builds site using template + generated copy
  → Updates project status in dashboard

Launch day:
  → Site goes live
  → Client notified via email: "Your new website is live"
  → Portal updated with live URL and performance scores
  → First audit scores recorded as baseline

Day 30:
  → Automated 30-day performance report
  → Comparison: baseline scores vs. current scores
  → If improvement > 20%: "Great results! Here's what Growth/Accelerator would add"
  → If improvement < 10%: "Here's what we recommend to accelerate results"
```

---

## STEP 8 — SERVICE AUTOMATION

### Website Creation
**Current:** Manual build per client
**Automation path:**
1. Build 3 industry templates (dental, aesthetics, trades) — ONE TIME
2. generate-copy.mjs produces all page content from onboarding brief — AUTOMATED
3. Founder customises template with client's brand colours, logo, images — 2-3 HOURS
4. Deploy to Vercel with client's domain — 15 MINUTES

**Net time per website:** 3-4 hours (down from 8-10 without templates)

### SEO Auditing
**Current:** bulk-audit.mjs runs PageSpeed + Claude analysis — FULLY AUTOMATED
**Improvement:** Add scheduled monthly re-audits for all active clients. Store historical scores. Generate trend reports showing improvement.

### Google Business Optimisation
**Current:** Manual
**Automation path:**
1. Use Google Business Profile API to monitor: review count, rating, photo count, post recency
2. Auto-generate weekly GBP posts using Claude API (news, tips, seasonal content)
3. Auto-flag when reviews drop below threshold or new negative review appears
4. Send client automated review request links after appointments

### Analytics Reporting
**Current:** daily-kpi-report.mjs for internal metrics
**Automation path:**
1. Connect Google Analytics and Google Search Console via API
2. Generate monthly client reports: traffic, top keywords, conversion rate, lead sources
3. Auto-send as PDF to client with "Here's your monthly performance update"
4. Include specific recommendations from Claude AI based on data

### Chatbot Deployment
**Current:** Manual Tawk.to setup
**Automation path:**
1. Create 3 industry chatbot templates with pre-built FAQ responses
2. Dental: "Do you accept NHS patients?", "What are your opening hours?", "How much is a check-up?"
3. Aesthetics: "How much is lip filler?", "Do you offer free consultations?", "What's the recovery time?"
4. Trades: "Do you cover my area?", "Can I get a free quote?", "Are you Gas Safe registered?"
5. Deployment: Copy template, customise business name and answers, embed script — 30 minutes

### Review Automation
**Current:** Not implemented
**Automation path:**
1. After appointment/project completion → auto-send SMS/email: "How was your experience with [business]? Leave a review: [Google review link]"
2. Tool: Use Supabase scheduled function to send via Twilio (SMS) or Resend (email)
3. If 4-5 star review → "Thank you! We'd love it if you shared on Google"
4. If 1-3 star review → redirect to private feedback form (don't send to Google)
5. Monthly report to client showing review growth

### Social Media
**Current:** Not implemented
**Automation path:**
1. Use Claude API to batch-generate 16 social posts per month (4/week) per client
2. Content types: tips, behind-the-scenes, testimonials, industry news
3. Store in a content calendar (Supabase table or Notion)
4. Client approves → schedule via Buffer or Publer ($15/month per client — charge £197/month)
5. Or provide content pack to client for self-posting (included in Accelerator)

---

## STEP 9 — REVENUE EXPANSION ENGINE

### Automated Upsell Triggers

#### 30-Day ROI Report (Starter → Growth)
**Trigger:** 30 days after website launch
**Content:**
- Current speed/SEO/mobile scores vs. baseline
- Estimated monthly visitors
- Comparison to competitors
- "You're getting found, but you're not converting. Here's why:"
  - No chatbot (visitors leave without asking questions)
  - No review automation (prospects can't see social proof)
  - Basic SEO (you're on page 2, competitors are on page 1)
- CTA: "Upgrade to Growth and we'll add chatbot + review automation + advanced SEO for just £200/month more."
- Include Stripe upgrade payment link

**Expected conversion:** 15-25% of Starter clients upgrade within 60 days

#### 90-Day Performance Report (Growth → Accelerator)
**Trigger:** 90 days after website launch
**Content:**
- Traffic growth chart (month 1 → month 3)
- Keyword ranking improvements
- Review score changes
- Lead/enquiry volume
- "You're growing organically. Here's the opportunity you're missing:"
  - Competitors running Google Ads are capturing paid traffic
  - Social media presence could amplify your reach
  - Monthly SEO campaigns could push you to #1
- CTA: "Upgrade to Accelerator — we'll manage your ads, social, and SEO campaigns for £602/month more."
- Include Stripe upgrade payment link

**Expected conversion:** 10-15% of Growth clients upgrade

#### Quarterly Business Reviews (Accelerator Retention)
**Trigger:** Every 90 days for Accelerator clients
**Content:**
- Full performance review (SEO, ads, social, reviews)
- ROI calculation: "You invested £X, we generated Y enquiries worth £Z"
- Strategy recommendations for next quarter
- Expansion opportunities: additional locations, new service pages, increased ad budget

**Purpose:** Justify the £997/month and prevent churn. Clients who see clear ROI don't cancel.

### Revenue Per Client Over Time

| Timeline | Starter | Growth | Accelerator |
|----------|---------|--------|-------------|
| Month 1 | £995 + £195 = £1,190 | £1,995 + £395 = £2,390 | £2,997 + £997 = £3,994 |
| Month 2-12 | £195/mo × 11 = £2,145 | £395/mo × 11 = £4,345 | £997/mo × 11 = £10,967 |
| **Year 1 total** | **£3,335** | **£6,735** | **£14,961** |
| **+ Upgrade revenue** | +£200/mo if → Growth | +£602/mo if → Accelerator | +£197/mo add-ons |

### Automated Add-On Offers

| Trigger | Offer | Price | Automation |
|---------|-------|-------|-----------|
| Client gets 10+ enquiries/month | "You need a second location page" | £197 one-off | Email at milestone |
| Client's blog has 0 posts | "4 monthly blog posts for SEO" | £197/month | Email at Day 60 |
| Client's competitor runs ads | "Let us manage your Google Ads" | +£500/month | Quarterly review |
| Client opens second location | "Multi-location SEO expansion" | £497 + £197/mo per location | Manual (flag in dashboard) |

---

## STEP 10 — OPERATIONS FOR TWO FOUNDERS

### CRM Structure (Supabase Tables — Already Partially Built)

| Table | Purpose | Status |
|-------|---------|--------|
| `leads` | All scraped + inbound leads with scores and audit data | Built |
| `audits` | Detailed audit records per lead | Built |
| `outreach` | Email tracking (sent, opened, replied, bounced) | Built |
| `nurture_sequences` | Follow-up sequence tracking | Built |
| `inquiries` | Inbound form submissions | Built |
| `clients` | Paying clients with package, revenue, dates | Built |
| `projects` | Delivery tracking (status, milestones, deliverables) | Built |
| `health_checks` | System uptime monitoring | Built |
| `admin_actions` | Audit log of all automated actions | Built |
| `proposals` | **NEW — Sent proposals with status tracking** | To Build |
| `upsell_triggers` | **NEW — Automated upsell event tracking** | To Build |
| `client_reports` | **NEW — Monthly report snapshots** | To Build |

### Lead Pipeline Stages

```
NEW → SCORED → AUDITED → IN OUTREACH → REPLIED → CALL BOOKED → PROPOSAL SENT → CLIENT WON
                                          ↓
                                    NOT INTERESTED
                                          ↓
                                       BOUNCED
```

### Weekly Founder Schedule

#### Founder 1 (CEO / Sales Focus)
| Day | Morning (9am-12pm) | Afternoon (1pm-5pm) |
|-----|-------------------|---------------------|
| Mon | Review dashboard KPIs, prioritise call list | Discovery calls (3-4 calls) |
| Tue | Respond to email replies, send proposals | Discovery calls (3-4 calls) |
| Wed | Follow up on open proposals | Client delivery (website builds) |
| Thu | Client delivery (website builds) | Client delivery (website builds) |
| Fri | Review weekly metrics, plan next week | Content creation / marketing |

#### Founder 2 (CTO / Delivery Focus)
| Day | Morning (9am-12pm) | Afternoon (1pm-5pm) |
|-----|-------------------|---------------------|
| Mon | Review system health, fix any automation issues | Client delivery (website builds) |
| Tue | Client delivery (website builds) | Client delivery (website builds) |
| Wed | Client delivery (website builds) | SEO work for existing clients |
| Thu | Google Ads management (Accelerator clients) | Client support / revisions |
| Fri | Automation improvements, new features | Client onboarding calls |

### Communication Systems

| Channel | Purpose | Tool |
|---------|---------|------|
| Internal comms | Founder-to-founder | Slack (free tier) or WhatsApp |
| Client comms (Accelerator) | Dedicated channel | Slack Connect |
| Client comms (Starter/Growth) | Async | Email (Resend) |
| Sales pipeline | Lead management | Supabase dashboard (built) |
| Project management | Delivery tracking | Supabase dashboard (built) |
| Notifications | Real-time alerts | Slack webhooks |

### Notification System (Not Yet Built — Priority)

Set up Slack incoming webhooks for:
- New lead scored 90+ → "High-priority lead: [business name] in [city]"
- Lead replied to email → "Reply from [business name]: [first line of reply]"
- New payment received → "New client! [business name] purchased [package]"
- System health alert → "WARNING: [system] is down"
- Daily KPI summary → 8am auto-post to #metrics channel

---

## STEP 11 — PATH TO £20K/MONTH PROFIT

### Financial Model

#### Revenue Target: £20,000/month profit

**Assumptions:**
- Operating costs: ~£2,000/month (tools, hosting, domains, email infrastructure)
- Founder time cost: £0 (owners, not employees)
- Therefore: £20,000 profit = £22,000 revenue needed

#### Client Mix for £22,000/month Revenue

| Package | Clients | Setup Revenue | Monthly Revenue | Total Monthly |
|---------|---------|---------------|-----------------|---------------|
| Starter | 5 | — (already onboarded) | 5 × £195 = £975 | £975 |
| Growth | 8 | — (already onboarded) | 8 × £395 = £3,160 | £3,160 |
| Accelerator | 3 | — (already onboarded) | 3 × £997 = £2,991 | £2,991 |
| **Recurring total** | **16** | | | **£7,126/mo** |

That's only £7,126 in recurring. You need setup fees flowing too.

#### Including New Client Acquisition (Steady State)

| Activity | Monthly | Revenue |
|----------|---------|---------|
| New Starter clients | 3 | 3 × £995 = £2,985 setup + £585 monthly |
| New Growth clients | 2 | 2 × £1,995 = £3,990 setup + £790 monthly |
| New Accelerator clients | 1 | 1 × £2,997 = £2,997 setup + £997 monthly |
| Existing Starter recurring | 10 | 10 × £195 = £1,950 |
| Existing Growth recurring | 6 | 6 × £395 = £2,370 |
| Existing Accelerator recurring | 2 | 2 × £997 = £1,994 |
| **Total** | | **£18,658/mo** |

**Plus add-ons and upgrades:** ~£2,000-3,000/month
**Total target:** ~£20,000-22,000/month

#### Required Client Base: ~24 Active Clients

| Metric | Number |
|--------|--------|
| Active Starter clients | 13 |
| Active Growth clients | 8 |
| Active Accelerator clients | 3 |
| **Total active clients** | **24** |
| Monthly recurring revenue | £9,449 |
| Monthly new client revenue | £9,972 |
| Monthly add-on revenue | ~£2,500 |
| **Total monthly revenue** | **~£22,000** |
| Monthly costs | ~£2,000 |
| **Monthly profit** | **~£20,000** |

#### Operating Costs Breakdown

| Item | Monthly Cost |
|------|-------------|
| Google Workspace (27 mailboxes) | £130 |
| Instantly.ai (Growth plan) | £25 |
| Apify (Starter plan) | £40 |
| Supabase (Pro plan) | £20 |
| Vercel (Pro plan) | £16 |
| Domains (9 cold email + client domains) | £15 |
| Claude API (audits + copy generation) | £30 |
| Tawk.to | Free |
| Make.com / Zypflow | £15 |
| Google Ads management tools | £30 |
| Buffer/Publer (social scheduling) | £30 |
| Slack | Free |
| Misc (Ahrefs, SEMrush, etc.) | £100 |
| **Total** | **~£450** |

Wait — that's only £450, not £2,000.

**Revised: At 24 clients, your operating costs are ~£450/month.**

**That means £22,000 revenue - £450 costs = £21,550 profit.**

**Margin: 98%.** This is why productised agencies are valuable.

(At scale with Accelerator clients needing £500 ad budget included, costs rise. Budget £500 × 3 Accelerator clients = £1,500 in pass-through ad spend. Total costs: ~£1,950. Margin still >90%.)

#### Timeline to £20k/month Profit

| Month | New Clients | Total Active | Monthly Revenue | Monthly Profit |
|-------|-------------|-------------|-----------------|---------------|
| **Month 1** | 2 (Starter) | 2 | £2,380 | £1,930 |
| **Month 2** | 3 (2 Starter, 1 Growth) | 5 | £5,355 | £4,905 |
| **Month 3** | 3 (1 Starter, 1 Growth, 1 Accel) | 8 | £10,057 | £9,607 |
| **Month 4** | 4 (2 Starter, 1 Growth, 1 Accel) | 12 | £14,844 | £14,394 |
| **Month 5** | 4 (2 Starter, 1 Growth, 1 Accel) | 16 | £19,031 | £18,581 |
| **Month 6** | 4 (1 Starter, 2 Growth, 1 Accel) | 20 | £22,616 | £22,166 |

**£20k/month profit achievable by Month 5-6.**

This assumes:
- Email infrastructure warmed and sending by Week 4
- 945 cold emails/day generating 1-2% reply rate = 10-20 replies/day
- 25% of replies book a call
- 25% of calls close
- = 0.6-1.2 new clients per day = 4-6 new clients per week

**Conservative estimate:** 2-3 new clients/week (assuming lower reply rates initially)

---

## STEP 12 — SCALE TO £100K/MONTH

### Revenue Model at £100k/month

| Package | Clients | Monthly Recurring |
|---------|---------|-------------------|
| Starter | 40 | 40 × £195 = £7,800 |
| Growth | 30 | 30 × £395 = £11,850 |
| Accelerator | 15 | 15 × £997 = £14,955 |
| New client setup fees | 8/month | ~£12,000 |
| Add-ons & upgrades | — | ~£5,000 |
| **Total** | **85 clients** | **£51,605 recurring + £17,000 new = ~£68,000** |

Hmm, 85 clients still only gets £68k. To hit £100k:

**Revised: You need to raise prices OR add high-margin add-ons.**

#### Price Increase at Scale (Month 12+)

| Package | Current | At Scale |
|---------|---------|----------|
| Starter | £995 + £195/mo | £1,495 + £295/mo |
| Growth | £1,995 + £395/mo | £2,995 + £595/mo |
| Accelerator | £2,997 + £997/mo | £4,997 + £1,497/mo |

**With scaled pricing:**

| Package | Clients | Monthly Recurring |
|---------|---------|-------------------|
| Starter | 30 | £8,850 |
| Growth | 25 | £14,875 |
| Accelerator | 15 | £22,455 |
| New client setup fees | 8/month | ~£20,000 |
| Add-ons & upgrades | — | ~£8,000 |
| **Total** | **70 clients** | **£74,180 recurring + £28,000 new/add-ons = ~£102,000** |

### Hiring Triggers

| Revenue | Hire | Role | Cost | Why |
|---------|------|------|------|-----|
| £15k/mo | Hire 1 | Junior Web Developer (freelance) | £2,000/mo | Takes over Starter builds. Template-based, easy to train. |
| £30k/mo | Hire 2 | SEO Specialist (freelance) | £2,500/mo | Manages monthly SEO for Growth + Accelerator clients. |
| £50k/mo | Hire 3 | Account Manager (part-time) | £2,000/mo | Handles all client comms, onboarding, support. Frees founders entirely. |
| £50k/mo | Hire 4 | Google Ads Manager (freelance) | £2,500/mo | Manages ads for all Accelerator clients. |
| £75k/mo | Hire 5 | Sales Closer (commission-based) | 10% of setup fees | Takes all discovery calls. Founders focus on strategy. |
| £100k/mo | Hire 6 | Operations Manager (full-time) | £3,500/mo | Runs daily operations. Founders become strategic-only. |

### Team Structure at £100k/month

```
FOUNDERS (Strategy + Business Development)
  ├── Operations Manager
  │     ├── Account Manager (client comms)
  │     └── Junior Developer (website builds)
  ├── SEO Specialist (freelance)
  ├── Google Ads Manager (freelance)
  └── Sales Closer (commission-based)
```

**Total team cost:** ~£15,000/month
**Revenue:** £100,000/month
**Tool costs:** ~£2,000/month
**Ad spend pass-through:** ~£7,500/month (15 Accelerator × £500)
**Net profit:** ~£75,500/month (75.5% margin)

### Operational Scaling Strategy

1. **Months 1-6 (£0 → £20k):** Founders do everything. Build templates, close deals, deliver sites.
2. **Months 7-9 (£20k → £40k):** Hire junior developer for Starter builds. Hire freelance SEO specialist. Founders focus on Growth/Accelerator delivery and sales.
3. **Months 10-12 (£40k → £60k):** Hire account manager. Hire Google Ads freelancer. Founders focus on sales and strategy only.
4. **Months 13-18 (£60k → £100k):** Hire sales closer. Hire ops manager. Founders become pure strategy — business development, partnerships, new products.

### Maintaining High Margins

The key to margins at scale:
1. **Never hire full-time until £75k+/month.** Freelancers scale up and down.
2. **Templates save 50% of delivery time.** Every new client gets a template, not a custom build.
3. **Automation handles all repetitive work.** Lead gen, auditing, outreach, reporting — none of this needs humans.
4. **Price increases absorb hiring costs.** When you hire at £30k/month, raise prices. Your proven results justify it.
5. **Recurring revenue compounds.** Every month, your baseline grows. By Month 12, recurring alone could be £40-50k.

---

## STEP 13 — EXIT STRATEGY

### What Makes an Agency Sellable

Private equity firms and strategic acquirers value:

1. **Recurring revenue** (>60% of total revenue)
2. **Low owner dependence** (business runs without founders)
3. **Documented systems** (SOPs, playbooks, automation)
4. **Client concentration** (no single client >10% of revenue)
5. **Niche expertise** (commands premium, defensible positioning)
6. **Growth trajectory** (month-over-month revenue growth)
7. **Clean financials** (separate business accounts, proper bookkeeping)

### Valuation Multiples for Agencies

| Revenue Type | Multiple | Your Target |
|---|---|---|
| Project-based (one-off) | 1-2x annual revenue | Avoid heavy reliance |
| Retainer-based (monthly recurring) | 3-5x annual revenue | Primary focus |
| SaaS-like (automated, recurring) | 6-10x annual revenue | Long-term goal |

**At £100k/month with 70% recurring:**
- Monthly recurring: £70,000
- Annual recurring: £840,000
- Valuation at 4x recurring: **£3,360,000**
- Valuation at 6x recurring (if highly automated): **£5,040,000**

**At £200k/month with 80% recurring:**
- Annual recurring: £1,920,000
- Valuation at 5x: **£9,600,000**

**That's your 7-8 figure exit path.**

### Building Toward Exit (Start Now)

#### 1. Recurring Revenue Structure
- Already in place: Monthly retainers on all 3 tiers
- Improve: Add annual contracts with 10% discount (improves predictability and reduces churn)
- Track: Monthly Recurring Revenue (MRR), Net Revenue Retention (NRR), churn rate

#### 2. Client Retention Strategy
- **Months 1-3:** Deliver fast results. First 90 days determines if they stay.
- **Monthly reports:** Automated. Show value every month so clients never wonder "what am I paying for?"
- **Quarterly reviews (Accelerator):** Strategic calls that deepen the relationship
- **Exit barriers:** The longer a client stays, the more data you have, the better your SEO results, the harder it is to leave
- **Target churn:** <5%/month. At 3% monthly churn, average client lifetime = 33 months = £6,400 (Starter) to £32,900 (Accelerator)

#### 3. Operational Documentation
Create SOPs for everything:
- Client onboarding process
- Website build process (per template)
- SEO setup checklist
- Google Ads setup checklist
- Chatbot deployment process
- Review automation setup
- Monthly reporting process
- Lead generation maintenance
- Cold email system maintenance

**Format:** Loom video + written checklist. Any new hire should be able to follow the SOP without training.

**Start documenting NOW.** Don't wait until you're at £100k/month. Every time you do something more than once, document it.

#### 4. Valuation Drivers You Can Control

| Driver | Action | Impact |
|--------|--------|--------|
| Revenue growth | 10%+ month-over-month | Higher multiple |
| Recurring % | Push clients to monthly retainers | Higher multiple |
| Client diversity | No client >10% of revenue | Reduces risk premium |
| Owner independence | Hire and systematise | Makes business transferable |
| Technology assets | Your automation stack is proprietary IP | Increases asset value |
| Brand & reputation | Google reviews, case studies, awards | Increases perceived value |
| Data assets | Lead database, industry benchmarks, audit data | Unique competitive advantage |

#### 5. Exit Timeline

| Year | Revenue | Action |
|------|---------|--------|
| Year 1 | £20-60k/mo | Build systems, prove model, acquire clients |
| Year 2 | £60-150k/mo | Scale team, raise prices, build recurring base |
| Year 3 | £150-250k/mo | Optimise operations, reduce owner dependence |
| Year 4 | Ready for exit | Engage M&A advisor, prepare data room, run process |

---

## FINAL OUTPUT — THE COMPLETE SOLIS DIGITAL OPERATING SYSTEM

### Technology Stack

| Layer | Tool | Cost/Month | Purpose |
|-------|------|-----------|---------|
| **Website** | Vercel + HTML/Framer | £16 | Hosting, deployment, CDN |
| **Database** | Supabase | £20 | Leads, clients, projects, all data |
| **Cold Email** | Instantly.ai | £25 | 3 niche campaigns, 27 mailboxes |
| **Email Infra** | Google Workspace | £130 | 27 sending mailboxes |
| **Lead Scraping** | Apify | £40 | Google Maps + directories |
| **Orchestration** | Make.com/Zypflow | £15 | Runs scripts on schedule |
| **AI** | Claude API | £30 | Audits, copy generation, reports |
| **Audit** | Google PageSpeed API | Free | Speed, SEO, mobile scores |
| **Payments** | Stripe | 1.4% + 20p/txn | Setup fees + subscriptions |
| **Chat** | Tawk.to | Free | Live chat widget |
| **Comms** | Slack | Free | Internal + client (Accelerator) |
| **Transactional Email** | Resend | Free tier | Automated emails to clients |
| **SEO Tools** | Ahrefs Lite | £80 | Keyword tracking, competitor analysis |
| **Social** | Buffer/Publer | £30 | Social scheduling (Accelerator) |
| **Domains** | Namecheap | £15 | 9 cold email + client domains |
| **Total** | | **~£400/mo** | |

### Automation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LEAD GENERATION LAYER                      │
│                                                               │
│  Apify Scrapers (Google Maps + Directories)                  │
│  → 500+ leads/day across 3 niches × 19 cities               │
│  → Auto-insert to Supabase leads table                       │
│                                                               │
│  Inbound Audit Forms (dental.html, aesthetics.html, etc.)    │
│  → Instant PageSpeed scan in browser                         │
│  → Auto-insert to Supabase leads table                       │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    QUALIFICATION LAYER                        │
│                                                               │
│  lead-scoring.mjs (130-point algorithm)                      │
│  → Scores: website quality + industry + location + signals   │
│  → Only 60+ leads proceed                                    │
│                                                               │
│  bulk-audit.mjs (PageSpeed + Claude AI)                      │
│  → Speed, SEO, Mobile, SSL scores                            │
│  → AI-generated audit summary                                │
│  → Status: New → Audited                                     │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    OUTREACH LAYER                             │
│                                                               │
│  Cold leads → instantly-sync.mjs → Instantly.ai campaigns   │
│  → 3 niche campaigns (dental/aesthetics/trades)              │
│  → 5-email sequences with 10 merge tags                      │
│  → 945 emails/day across 27 warmed mailboxes                │
│                                                               │
│  Inbound leads → lead-nurture.mjs → 4-email follow-up       │
│  → Audit results + competitor data + social proof + close    │
│                                                               │
│  instantly-webhook.mjs tracks engagement                     │
│  → Opens, clicks, replies, bounces → Supabase               │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    SALES LAYER                               │
│                                                               │
│  Dashboard surfaces top leads (replied, high-score)          │
│  → Founder responds within 2 hours                           │
│  → Sends PDF audit report + Calendly link                    │
│  → 15-min discovery call                                     │
│  → Proposal sent with Stripe payment link                    │
│  → Auto follow-up at 48 hours and 7 days                    │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    DELIVERY LAYER                             │
│                                                               │
│  Stripe webhook → project created → onboarding email sent   │
│  → Client completes onboard.html                             │
│  → generate-copy.mjs creates all content                     │
│  → Founder builds from industry template                     │
│  → Site deployed to Vercel                                   │
│  → Client portal (portal.html) activated                     │
│  → Chatbot, reviews, SEO deployed per package                │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    RETENTION & EXPANSION LAYER                │
│                                                               │
│  30-day automated ROI report → Starter upsell trigger        │
│  90-day performance report → Growth upsell trigger           │
│  Monthly client reports (automated) → retention              │
│  Quarterly business reviews (Accelerator) → expansion        │
│  Add-on offers triggered by usage milestones                 │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    MONITORING LAYER                           │
│                                                               │
│  health-monitor.mjs → every 30 min system checks            │
│  daily-kpi-report.mjs → 8am dashboard + email               │
│  Slack notifications → real-time alerts                      │
│  Dashboard (dashboard.html) → live pipeline view             │
└─────────────────────────────────────────────────────────────┘
```

### Weekly Tasks for Two Founders

#### Combined Weekly Time Budget: 60 hours (30 each)

| Task | Hours/Week | Owner |
|------|-----------|-------|
| **Sales: Review replies & respond** | 3 | Founder 1 |
| **Sales: Discovery calls (8-10/week)** | 3 | Founder 1 |
| **Sales: Send proposals & follow up** | 2 | Founder 1 |
| **Delivery: Build new client websites** | 12 | Split |
| **Delivery: Monthly SEO work (existing clients)** | 4 | Founder 2 |
| **Delivery: Google Ads management** | 3 | Founder 2 |
| **Delivery: Client support & revisions** | 3 | Split |
| **Operations: System monitoring & fixes** | 2 | Founder 2 |
| **Operations: Review KPIs & plan** | 2 | Founder 1 |
| **Marketing: Content & brand building** | 2 | Founder 1 |
| **Admin: Invoicing, bookkeeping** | 1 | Either |
| **Buffer / learning** | 3 | Split |
| **Total** | **40 hrs** | |

**20 hours of slack per week.** This is intentional. You need capacity headroom to handle spikes (3 new clients in one week) without burning out.

### Immediate Action Items (Next 7 Days)

| Priority | Action | Time | Impact |
|----------|--------|------|--------|
| 1 | **Buy 9 cold email domains** and set up DNS (SPF, DKIM, DMARC) | 2 hrs | Unlocks cold email |
| 2 | **Create 27 Google Workspace mailboxes** across 9 domains | 1 hr | Unlocks cold email |
| 3 | **Connect mailboxes to Instantly** and start warming | 1 hr | 2-3 week warmup before sending |
| 4 | **Upgrade Apify to Starter plan** ($49/month) | 10 min | Unlocks lead scraping |
| 5 | **Run first 3 Apify scraper jobs** (dental/aesthetics/trades) | 30 min | First 11,000+ leads |
| 6 | **Build 6 Make.com/Zypflow scenarios** per ZYPFLOW-INTEGRATION.md | 3 hrs | Automates entire pipeline |
| 7 | **Move credentials to .env file** | 30 min | Security fix |
| 8 | **Delete export-leads.mjs** | 5 min | Remove dead code |
| 9 | **Disable lead-nurture.mjs for cold leads** (only use for inbound) | 30 min | Prevents double-emailing |
| 10 | **Build 3 industry website templates** (dental, aesthetics, trades) | 15 hrs | Speeds up all future delivery |

### Timeline Summary

| Milestone | Target Date | Revenue |
|-----------|-------------|---------|
| Email infrastructure warmed | Week 4 (April 22) | £0 |
| First cold emails sent | Week 5 (April 29) | £0 |
| First replies coming in | Week 6 (May 6) | £0 |
| First client closed from outreach | Week 7-8 (May 13-20) | £995-2,997 |
| 5 active clients | Month 3 (June) | £5,000/mo |
| 10 active clients | Month 4 (July) | £10,000/mo |
| £20k/month profit | Month 5-6 (Aug-Sep) | £20,000/mo |
| First hire (junior developer) | Month 7 (Oct) | £25,000/mo |
| 30 active clients | Month 9 (Dec) | £40,000/mo |
| £100k/month revenue | Month 15-18 (2027 Q2-Q3) | £100,000/mo |
| Exit-ready | Year 3-4 (2029-2030) | £200k+/mo |
| Exit valuation | Year 4 | **£5-10M** |

---

## INVESTOR BOARD ASSESSMENT

### Strengths That Make This Business Investable
1. **High margins (>90% at current scale).** Tool costs are negligible relative to revenue.
2. **Recurring revenue model.** Monthly retainers compound. At 24 clients with <5% churn, MRR baseline grows every month.
3. **Automation moat.** The lead scoring, auditing, outreach, and reporting automation is genuine IP. Most agencies at this stage have none of this.
4. **Niche defensibility.** Dental/aesthetics/trades positioning means you're not competing with every Fiverr freelancer.
5. **Low capital requirements.** Total tool stack is £400/month. No office, no equipment, no inventory.
6. **Scalable lead generation.** 945 emails/day is a machine. Most agencies rely on referrals and networking.

### Risks an Investor Would Flag
1. **Zero revenue today.** All of this is potential. The model is sound but unproven.
2. **Two-person dependency.** If one founder leaves, the business loses 50% of capacity immediately.
3. **No social proof.** Zero case studies, testimonials, or track record. First 5 clients are the hardest.
4. **Cold email regulatory risk.** UK GDPR and PECR regulations on B2B cold email. Ensure compliance: legitimate interest basis, easy opt-out, business emails only (no personal).
5. **Platform dependency.** Heavy reliance on Instantly, Apify, and Supabase. If any goes down, the pipeline stops.

### Investor Recommendation
**FUND.** The infrastructure-to-revenue ratio is exceptional. Most agencies at pre-revenue stage have a WordPress site and a spreadsheet. This business has a fully automated lead-to-client pipeline that just needs to be turned on (email warming + Apify upgrade).

**The gap between current state and first revenue is 4-5 weeks** (email warming time). That's not a strategy problem — it's a calendar problem.

**The single most important thing to do right now:** Buy the domains, set up the mailboxes, start warming. Every day of delay pushes first revenue back by a day.

---

*This document is the operating system. Execute it sequentially. Do not skip steps. Do not add complexity. Turn it on and let it run.*
