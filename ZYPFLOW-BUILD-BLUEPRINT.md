# ZYPFLOW.CO.UK — Complete Build Blueprint

> How to build Zypflow as a standalone SaaS product, reusing the proven Solis Digital architecture but rebranded and productised for scale.

---

## WHAT IS ZYPFLOW

Zypflow is the **automation platform** that powers Solis Digital — extracted, rebranded, and sold as a standalone product to other agencies and businesses.

**Solis Digital** = the agency (services company, you do the work)
**Zypflow** = the platform (SaaS product, the software does the work)

Think of it like this:
- Solis Digital is like a marketing agency that uses HubSpot
- Zypflow IS the HubSpot — but built specifically for small agencies and local businesses

---

## POSITIONING

**Tagline:** "The AI-powered client acquisition system for small agencies"

**One-liner:** Zypflow scrapes leads, audits their websites, sends personalised cold emails, nurtures replies, and tracks everything in one dashboard — on autopilot.

**Target customers:**
1. **Small web agencies** (1-5 people) who want the same system you built but don't have the tech skills
2. **Freelance web designers** who need a lead generation engine
3. **Marketing consultants** who want to offer website audits as a service
4. **Local business owners** who want to manage their own online presence

**Pricing model:**
| Plan | Price | What They Get |
|------|-------|---------------|
| Starter | £49/mo | Dashboard + lead management + manual audit tool |
| Growth | £149/mo | Everything + automated scraping + cold email + nurture sequences |
| Agency | £349/mo | Everything + white-label + multi-client + API access |

---

## ARCHITECTURE — WHAT TO REUSE VS REBUILD

### Reuse Directly (90% done)
| Component | Solis Version | Zypflow Version |
|-----------|--------------|-----------------|
| Supabase backend | Same tables, same RLS | New Supabase project, same schema + multi-tenant `org_id` column |
| Lead scoring algorithm | `lead-scoring.mjs` | Same logic, wrapped in edge function |
| PageSpeed audit engine | `bulk-audit.mjs` | Same, but triggered per-user not globally |
| AI summary generation | Claude API calls | Same prompts, same pattern |
| Email sending | Resend API | Same, but from user's own domain |
| Dashboard UI | `dashboard.html` | Rebuild in Next.js/React for proper auth + multi-tenant |
| Client portal | `portal.html` | Same concept, rebrand |
| Chatbot widget | `chatbot-widget.js` | Same, dynamically themed per user |
| Review automation | `review-automation.mjs` | Same logic, edge function |
| Blog generator | `seo-blog-generator.mjs` | Same, per-tenant |

### Rebuild for SaaS
| Component | Why |
|-----------|-----|
| **Authentication** | Supabase Auth (email/password + Google OAuth) — replaces the "Weetabix" password |
| **Multi-tenancy** | Every table gets an `org_id` column. RLS policies filter by authenticated user's org |
| **Billing** | Stripe Billing with subscription tiers. Usage-based for scraping credits |
| **Onboarding wizard** | Guide new users through: connect domain, set industry/location, configure emails |
| **API layer** | RESTful API for white-label integrations |
| **Admin panel** | Super-admin view to manage all tenants (you) |

---

## DATABASE SCHEMA (Multi-Tenant Version)

Every table from Solis gets an `org_id` column. Here's the upgraded schema:

```sql
-- Organisations (tenants)
CREATE TABLE organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id),
  plan text DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'agency', 'enterprise')),
  stripe_customer_id text,
  stripe_subscription_id text,
  scraping_credits_remaining integer DEFAULT 100,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Team members
CREATE TABLE org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Leads (same as Solis but with org_id)
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  website text,
  email text,
  phone text,
  industry text,
  location text,
  google_rating float,
  has_website boolean DEFAULT true,
  status text DEFAULT 'New',
  speed_score numeric,
  seo_score numeric,
  mobile_score numeric,
  ssl_secure boolean,
  audit_summary text,
  lead_score integer DEFAULT 0,
  notes text,
  review_count integer,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

-- Same pattern for: outreach, clients, projects, audits,
-- nurture_sequences, review_requests, blog_posts, chatbot_configs,
-- refresh_audits, health_checks, admin_actions, scraper_config
-- All get org_id column + RLS policy:

-- Example RLS policy (repeat for every table):
CREATE POLICY "users_own_org_data" ON leads
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));
```

---

## TECH STACK

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | **Next.js 14** (App Router) | SSR, auth middleware, API routes, React components |
| Hosting | **Vercel** | You already use it, zero-config deploys |
| Database | **Supabase** (new project) | Postgres, Auth, Edge Functions, Realtime |
| Auth | **Supabase Auth** | Email/password, Google OAuth, magic links |
| Payments | **Stripe Billing** | Subscriptions, usage metering, customer portal |
| Email | **Resend** | Transactional + cold outreach sending |
| AI | **Claude API** | Audit summaries, blog generation, chatbot |
| Scraping | **Apify** | Google Maps scraper (same actor) |
| Cold Email | **Instantly.ai API** | Campaign management, warmup, tracking |
| Styling | **Tailwind CSS** | Fast, consistent, dark theme |

---

## PAGE STRUCTURE (zypflow.co.uk)

### Marketing Site (public)
```
/                     → Landing page (hero, features, pricing, testimonials)
/pricing              → Detailed pricing with feature comparison
/features             → Feature deep-dive (scraping, auditing, email, chatbot)
/blog                 → SEO content (agency growth tips, lead gen strategies)
/login                → Auth page
/signup               → Registration + plan selection
```

### App (authenticated)
```
/dashboard            → KPI overview (same layout as Solis Command Centre)
/leads                → Lead management table with filters, scoring, bulk actions
/leads/[id]           → Individual lead detail + audit results + outreach history
/outreach             → Email campaign tracker (sent, opened, replied)
/outreach/sequences   → Nurture sequence builder
/clients              → Client management + project tracker
/clients/[id]         → Client detail + portal preview
/audits               → Audit tool (scan any URL, save results)
/scraper              → Scraper configuration (industries, cities, schedule)
/chatbot              → Chatbot knowledge base manager
/reviews              → Review automation dashboard
/blog-generator       → AI blog post generator
/settings             → Organisation settings, team, billing, API keys
/settings/billing     → Stripe customer portal embed
```

---

## LANDING PAGE CONTENT (zypflow.co.uk)

### Hero
**Headline:** "Stop chasing clients. Let AI find them for you."
**Subline:** "Zypflow scrapes leads, audits their websites, sends personalised emails, and books calls — while you focus on delivery."
**CTA:** "Start Free Trial" / "See It In Action"
**Trust badges:** "AI-Powered", "GDPR Compliant", "UK Built", "Cancel Anytime"

### How It Works (4 steps)
1. **Set Your Targets** — Choose industries + locations. Zypflow finds businesses with bad websites.
2. **Auto-Audit** — AI analyses their site speed, SEO, and mobile experience. Generates a personalised report.
3. **Smart Outreach** — Personalised emails sent automatically with their audit results. Nurture sequences follow up.
4. **Close Deals** — Replies appear in your dashboard. Book calls, send proposals, onboard clients — all in one place.

### Features Grid
| Feature | Description |
|---------|------------|
| Lead Scraping | Google Maps scraper finds businesses in your target industries + cities |
| Website Auditing | PageSpeed + AI analysis generates detailed audit reports |
| Lead Scoring | Algorithm ranks leads 0-130 based on website quality, industry, contact info |
| Cold Email | Personalised outreach with merge tags from audit data |
| Nurture Sequences | 4-step automated follow-up over 14 days |
| AI Chatbot | Embeddable widget for your clients' sites, powered by Claude |
| Review Automation | Automated Google review request emails |
| SEO Blog Generator | AI-written, SEO-optimised blog posts for clients |
| Client Portal | Branded portal where clients track their project |
| Dashboard | Real-time KPIs, funnel, call list, health monitoring |

### Social Proof
Use the same case studies from Solis but reframe:
- "Agencies using Zypflow close 3x more clients"
- "Built on the same system that generated 47 leads in its first week"
- Show the dashboard screenshot as proof of the product

### Pricing Section
| | Starter | Growth | Agency |
|--|---------|--------|--------|
| Price | £49/mo | £149/mo | £349/mo |
| Leads/month | 100 | 500 | Unlimited |
| Scraping credits | 100 | 500 | Unlimited |
| Email sending | Manual | Automated | Automated + white-label |
| Audit tool | Yes | Yes | Yes |
| AI chatbot | - | 1 client | Unlimited clients |
| Review automation | - | 1 client | Unlimited clients |
| Blog generator | - | 5/month | Unlimited |
| Team members | 1 | 3 | 10 |
| White-label | - | - | Yes |
| API access | - | - | Yes |

### FAQ
- "Is this legal?" — Yes. We scrape publicly available Google Maps data. Emails comply with UK ICO guidelines.
- "Do I need technical skills?" — No. Everything is point-and-click. Set your industries and cities, the system handles the rest.
- "Can I white-label it?" — Agency plan includes full white-labelling — your brand, your domain.
- "What about GDPR?" — All data processing is UK-based. Opt-out links included in every email. Data retention policies built in.

---

## BUILD ORDER (Phase by Phase)

### Phase 1: MVP (Week 1-2) — £0 revenue target
**Goal:** Landing page + waitlist + core dashboard

1. Set up Next.js project with Tailwind
2. Create Supabase project (new, separate from Solis)
3. Set up Supabase Auth (email/password)
4. Create organisations + org_members tables
5. Build landing page (hero, features, pricing, FAQ)
6. Build signup flow (create account → create org → redirect to dashboard)
7. Build dashboard shell (sidebar nav, KPI cards, empty states)
8. Build lead management page (table, filters, add lead form)
9. Build audit tool (enter URL → run PageSpeed → show results → save)
10. Deploy to Vercel at zypflow.co.uk

### Phase 2: Automation (Week 3-4) — First paying users
**Goal:** Scraping + email + nurture working

11. Port scraper config UI from Solis dashboard
12. Build Apify integration (same actor, triggered per-org)
13. Port lead scoring algorithm (edge function)
14. Build cold email integration (Instantly API)
15. Build nurture sequence builder UI
16. Add Stripe Billing (subscription checkout, customer portal)
17. Add usage metering (scraping credits per plan)

### Phase 3: Add-Ons (Week 5-6) — Expand feature set
**Goal:** Chatbot, reviews, blog, portal

18. Port chatbot widget + edge function (per-org configs)
19. Port review automation (per-org, per-client)
20. Port blog generator (per-org)
21. Build client portal (per-org branding)
22. Build project tracker (same as Solis projects section)

### Phase 4: Scale (Week 7-8) — Agency features
**Goal:** White-label, API, team management

23. Build white-label system (custom domains, branded emails)
24. Build API (REST endpoints for lead/audit/outreach CRUD)
25. Build team management (invite members, roles)
26. Build admin panel (super-admin view of all orgs)
27. Add Stripe webhooks (subscription lifecycle, failed payments)

---

## WHAT YOU CAN COPY DIRECTLY

These files from Solis can be copied with minimal changes:

| Solis File | Zypflow Equivalent | Changes Needed |
|------------|-------------------|----------------|
| `scripts/lead-scoring.mjs` | `lib/scoring.ts` | Convert to TypeScript, add org_id filter |
| `scripts/bulk-audit.mjs` | `lib/audit.ts` | Same logic, edge function wrapper |
| `scripts/review-automation.mjs` | `app/api/reviews/route.ts` | Next.js API route, auth check |
| `scripts/seo-blog-generator.mjs` | `app/api/blog/generate/route.ts` | Same Claude prompts |
| `scripts/quarterly-refresh.mjs` | `app/api/refresh/route.ts` | Same PageSpeed logic |
| `scripts/chatbot-manager.mjs` | `app/api/chatbot/route.ts` | Same config structure |
| `chatbot-widget.js` | `public/widget.js` | Dynamic theming per org |
| `scripts/instantly-sync.mjs` | `lib/instantly.ts` | Same API calls |
| `scripts/health-monitor.mjs` | `app/api/health/route.ts` | Per-org health checks |
| Dashboard CSS/layout | `components/Dashboard.tsx` | React components, same design system |

**The dark theme, gold accent colour scheme, KPI cards, funnel visualisation, call list, email tracker — all of this transfers directly.**

---

## REVENUE MODEL

| Revenue Stream | How |
|---------------|-----|
| Monthly subscriptions | £49-349/mo per user |
| Usage overages | Extra scraping credits at £0.05/lead |
| White-label setup fee | £500 one-time for Agency plan |
| Done-for-you setup | £297 to configure their account (upsell) |
| Solis Digital referral | Offer Zypflow users who want "done for you" → refer to Solis |

### Revenue Projections
| Month | Users | MRR | ARR |
|-------|-------|-----|-----|
| 3 | 20 | £2,000 | £24,000 |
| 6 | 80 | £8,000 | £96,000 |
| 12 | 250 | £25,000 | £300,000 |
| 24 | 1,000 | £100,000 | £1,200,000 |

---

## MARKETING STRATEGY

### Launch (Week 1-2)
1. Landing page with waitlist
2. Post on Twitter/X, LinkedIn, IndieHackers, Reddit (r/webdev, r/marketing, r/SaaS)
3. Product Hunt launch
4. Cold email to web agencies (use Solis's own cold email system to sell Zypflow)

### Growth (Month 2-6)
1. SEO blog content: "How to get web design clients", "Best lead generation for agencies"
2. YouTube tutorials showing the dashboard
3. Affiliate programme: agencies refer other agencies for 20% recurring
4. Integration partnerships: Framer, Webflow, WordPress communities

### Retention
1. Weekly email digest of their pipeline stats
2. In-app notifications for high-score leads
3. Quarterly business reviews for Agency plan customers
4. Community (Discord or Slack) for users to share strategies

---

## DOMAIN & BRANDING

| Element | Recommendation |
|---------|---------------|
| Domain | `zypflow.co.uk` (also get `.com` if available) |
| Colours | Keep the dark theme + gold accent from Solis — it's proven and premium |
| Font | DM Sans (same as Solis) or Inter |
| Logo | "Zypflow" wordmark with a lightning bolt or flow icon |
| Tone | Professional but accessible. "We built this for agencies like us." |

---

## DAY 1 CHECKLIST (What To Do Right Now)

- [ ] Buy `zypflow.com` if available (check `.co.uk` too)
- [ ] Create new Supabase project for Zypflow
- [ ] Create new Vercel project
- [ ] Init Next.js project with Tailwind + Supabase Auth
- [ ] Copy the database schema (with org_id additions)
- [ ] Build landing page
- [ ] Set up Stripe products (Starter/Growth/Agency)
- [ ] Deploy v0.1 to zypflow.co.uk

The entire Solis Digital system is your proof-of-concept. Zypflow is that system productised. You've already built the hard part — now it's just packaging.
