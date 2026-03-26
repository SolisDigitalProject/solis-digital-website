# ZYPFLOW.CO.UK — Complete Build Blueprint

> Zypflow is its own product — an AI-powered automation platform for agencies and businesses. Solis Digital is a separate agency that happens to be built by the same founders. They are **independent businesses**.

---

## WHAT IS ZYPFLOW

Zypflow is an **AI workflow automation platform** that helps agencies and businesses automate lead generation, client acquisition, and operations — without writing code.

**It is NOT Solis Digital repackaged.** They are two separate companies:

| | Solis Digital | Zypflow |
|--|--------------|---------|
| **Type** | Web design agency (service business) | SaaS platform (product business) |
| **Customers** | Local UK businesses (dentists, salons, trades) | Agencies, freelancers, marketing consultants, SMBs |
| **Revenue model** | Project fees + monthly retainers | Monthly subscriptions |
| **What you sell** | "We build your website and get you clients" | "Software that automates your client acquisition" |
| **Delivery** | You do the work | The software does the work |
| **Domain** | solisdigital.co.uk | zypflow.co.uk |
| **Brand** | Premium dark/gold, agency feel | Modern, clean, SaaS feel |
| **Relationship** | Solis may use Zypflow internally | Zypflow has no mention of Solis |

---

## POSITIONING

**Tagline:** "Automate your entire client pipeline with AI."

**One-liner:** Zypflow is the AI automation platform that finds leads, qualifies them, runs outreach, and manages your pipeline — so you can focus on delivery.

**Category:** AI-powered workflow automation + CRM for small agencies and businesses. Sits between Make.com (too technical) and HubSpot (too expensive) — purpose-built for lead generation and client acquisition.

**Core value props:**
1. **Find leads automatically** — scrape Google Maps by industry + location, enrich with contact data
2. **Audit & qualify instantly** — AI analyses websites, scores leads, generates personalised insights
3. **Outreach on autopilot** — personalised cold email sequences using audit data as the hook
4. **Manage everything in one place** — pipeline, calls, proposals, projects, client portal
5. **Build custom workflows** — drag-and-drop automation builder for any business process

---

## TARGET CUSTOMERS

### Primary: Small Agencies (1-10 people)
- Web design agencies drowning in delivery but starving for leads
- Marketing consultants who offer website audits manually
- SEO freelancers who want to scale beyond referrals
- **Pain:** "I'm great at the work but terrible at finding clients consistently"

### Secondary: Local Business Owners
- Small businesses who want to manage their own marketing
- Companies tired of paying agencies but lacking the tools
- **Pain:** "I don't know where my next customer is coming from"

### Tertiary: Marketing Teams at SMBs
- In-house marketers who need automation without enterprise pricing
- Teams using 5+ disconnected tools (CRM, email, scraping, analytics)
- **Pain:** "I'm paying £500/mo for tools that don't talk to each other"

---

## PRODUCT FEATURES

### Core Platform (All Plans)

**Pipeline Dashboard**
- Real-time KPIs: leads, audited, outreach sent, replies, clients won
- Visual conversion funnel
- Revenue tracking (MRR, one-off, per-client)
- Activity feed showing all system actions

**Lead Management**
- Lead database with search, filters, bulk actions
- Status pipeline: New → Audited → Outreach → Replied → Call Booked → Won
- Lead scoring algorithm (0-130 based on website quality, industry, contact info)
- Import/export CSV
- Manual add or auto-scraped

**Website Audit Tool**
- Enter any URL → instant PageSpeed analysis (speed, SEO, mobile, SSL)
- AI-generated audit summary explaining issues in plain English
- PDF audit report generation (for sales meetings)
- Before/after comparison tracking

**Contact Management**
- Call priority list ranked by conversion likelihood
- Click-to-call with call status tracking
- Email/phone/website for each lead
- Notes and activity history

### Growth Features

**Lead Scraping Engine**
- Google Maps scraper (by industry + city)
- Email extraction from business websites
- Automatic deduplication
- Configurable scraping schedule (daily/weekly)
- Credit-based usage

**Cold Email Automation**
- Connect email accounts for sending
- Personalised email sequences with merge tags from audit data
- A/B testing subject lines
- Open/reply/bounce tracking
- Auto-pause on reply
- Domain warmup management

**Nurture Sequences**
- Multi-step email sequences (configurable 1-7 steps)
- Trigger-based: after audit, after reply, after X days
- Template library with proven sequences
- Sequence performance analytics

**AI Content Generation**
- Blog post generator (SEO-optimised, per-client)
- Email copy generator
- Proposal copy generator
- Social media post generator

### Agency Features

**AI Chatbot Builder**
- Create chatbots for client websites
- Per-client knowledge base (services, FAQs, hours, contact)
- Embeddable widget with customisable colours/branding
- Conversation history and analytics
- Powered by Claude API

**Google Reviews Automation**
- Configure Google review URL per client
- Queue review request emails to customers
- Branded email templates
- Conversion tracking (sent → reviewed)

**Client Portal**
- Branded portal for each client
- Project milestones and status tracking
- Website performance scores (live)
- Change request system

**Website Refresh Monitoring**
- Automated monthly re-audits of client websites
- Score degradation alerts
- AI-generated recommendations
- Branded performance reports emailed to clients

**White-Label**
- Custom domain for the platform
- Custom branding (logo, colours)
- Branded client portals
- Branded email sending (your domain)
- Remove all Zypflow branding

**Workflow Builder**
- Visual drag-and-drop automation builder
- Triggers: schedule, webhook, database change, email event
- Actions: send email, update record, run audit, call API, AI generate
- Conditions and branching logic
- Pre-built templates for common workflows
- Connect external APIs (Zapier-style)

**API Access**
- RESTful API for all platform features
- Webhook endpoints for integrations
- API key management
- Rate limiting per plan

---

## PRICING

| | Free | Starter | Growth | Agency |
|--|------|---------|--------|--------|
| **Price** | £0/mo | £49/mo | £149/mo | £349/mo |
| **Leads** | 25 | 200 | 1,000 | Unlimited |
| **Scraping credits** | 0 | 100/mo | 500/mo | Unlimited |
| **Email accounts** | 0 | 1 | 5 | 25 |
| **Emails/month** | 0 | 500 | 5,000 | 50,000 |
| **Audit tool** | 5/mo | Unlimited | Unlimited | Unlimited |
| **AI generations** | 3/mo | 20/mo | 100/mo | Unlimited |
| **Chatbots** | — | — | 1 | Unlimited |
| **Review automation** | — | — | 1 client | Unlimited |
| **Client portals** | — | — | 3 | Unlimited |
| **Workflow builder** | — | Basic (3 workflows) | Full | Full + custom |
| **Team members** | 1 | 1 | 5 | 15 |
| **White-label** | — | — | — | Yes |
| **API access** | — | — | Read-only | Full |
| **Support** | Community | Email | Priority | Dedicated |

**Enterprise:** Custom pricing for 50+ seats, SLA, dedicated instance

---

## TECH STACK

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | **Next.js 14** (App Router) + **Tailwind CSS** | Fast, SEO-friendly, React ecosystem |
| Backend | **Supabase** (Postgres + Auth + Edge Functions + Realtime) | Full backend in one service, generous free tier |
| Hosting | **Vercel** | Zero-config deploys, edge network, preview deployments |
| Auth | **Supabase Auth** | Email/password, Google OAuth, magic links, MFA |
| Payments | **Stripe Billing** | Subscriptions, metered billing, customer portal |
| Email sending | **Resend** | Transactional + marketing emails, domain verification |
| AI | **Anthropic Claude API** | Audit summaries, content gen, chatbot, copy |
| Scraping | **Apify** | Google Maps actor, reliable, scalable |
| Cold email | **Instantly.ai API** (or build own) | Warmup, rotation, tracking |
| File storage | **Supabase Storage** | Audit PDFs, logos, uploads |
| Analytics | **PostHog** or **Plausible** | Product analytics, funnels, feature usage |
| Error tracking | **Sentry** | Catch bugs before users report them |

---

## DATABASE SCHEMA

### Multi-Tenant Architecture

Every table has an `org_id` column. RLS policies ensure users only see their own organisation's data.

```sql
-- Core: Organisations
CREATE TABLE organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid REFERENCES auth.users(id),
  plan text DEFAULT 'free' CHECK (plan IN ('free','starter','growth','agency','enterprise')),
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text,
  settings jsonb DEFAULT '{"brand_color":"#e8a23a","logo_url":null}',
  scraping_credits integer DEFAULT 0,
  email_credits integer DEFAULT 0,
  ai_credits integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Core: Team
CREATE TABLE org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner','admin','member','viewer')),
  invited_email text,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Pipeline: Leads
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  website text,
  email text,
  phone text,
  industry text,
  location text,
  google_rating float,
  review_count integer,
  has_website boolean DEFAULT true,
  status text DEFAULT 'New',
  lead_score integer DEFAULT 0,
  speed_score numeric,
  seo_score numeric,
  mobile_score numeric,
  ssl_secure boolean,
  audit_summary text,
  notes text,
  source text DEFAULT 'manual',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pipeline: Outreach
CREATE TABLE outreach (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id),
  contact_email text,
  subject text,
  sequence_step integer DEFAULT 1,
  status text DEFAULT 'Queued',
  opens integer DEFAULT 0,
  clicked boolean DEFAULT false,
  replied_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Pipeline: Clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id),
  business_name text,
  contact_name text,
  email text,
  package text,
  one_off_revenue numeric DEFAULT 0,
  monthly_retainer numeric DEFAULT 0,
  start_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'Active',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  business_name text NOT NULL,
  package text,
  status text DEFAULT 'discovery',
  milestones jsonb DEFAULT '[]',
  domain text,
  dns_status text DEFAULT 'not_started',
  ssl_status text DEFAULT 'pending',
  preview_url text,
  live_url text,
  portal_token text UNIQUE,
  brief_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Audits
CREATE TABLE audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id),
  url text NOT NULL,
  speed_score integer,
  seo_score integer,
  mobile_score integer,
  ssl_secure boolean,
  ai_summary text,
  full_report jsonb,
  created_at timestamptz DEFAULT now()
);

-- Nurture Sequences
CREATE TABLE nurture_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id),
  email text NOT NULL,
  business_name text,
  sequence_step integer DEFAULT 1,
  total_steps integer DEFAULT 4,
  status text DEFAULT 'active',
  next_send_at timestamptz,
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Chatbot Configs (per client)
CREATE TABLE chatbot_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  business_name text NOT NULL,
  business_description text,
  services jsonb DEFAULT '[]',
  faqs jsonb DEFAULT '[]',
  hours text,
  phone text,
  email text,
  booking_url text,
  custom_instructions text,
  widget_color text DEFAULT '#e8a23a',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Review Requests
CREATE TABLE review_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  customer_name text,
  customer_email text,
  google_review_url text NOT NULL,
  status text DEFAULT 'pending',
  sent_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Blog Posts
CREATE TABLE blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  title text NOT NULL,
  slug text,
  content text NOT NULL,
  meta_description text,
  keywords text[],
  status text DEFAULT 'draft',
  word_count integer,
  created_at timestamptz DEFAULT now()
);

-- Workflows (automation builder)
CREATE TABLE workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('schedule','webhook','db_change','manual','email_event')),
  trigger_config jsonb DEFAULT '{}',
  steps jsonb DEFAULT '[]',
  is_active boolean DEFAULT false,
  last_run_at timestamptz,
  run_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Workflow Runs (execution history)
CREATE TABLE workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  status text DEFAULT 'running' CHECK (status IN ('running','completed','failed','cancelled')),
  steps_completed integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Scraper Config (per org)
CREATE TABLE scraper_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  industries text[] DEFAULT '{}',
  cities text[] DEFAULT '{}',
  max_results integer DEFAULT 20,
  auto_enabled boolean DEFAULT false,
  schedule_cron text,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Activity Log
CREATE TABLE activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  description text,
  target_type text,
  target_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS: Enable on ALL tables
-- Example policy (apply to every table above):
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON leads FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
```

---

## PAGE STRUCTURE

### Marketing Site (zypflow.co.uk — public)
```
/                     → Landing page
/features             → Feature deep-dive with screenshots
/pricing              → Pricing table with feature comparison + FAQ
/blog                 → SEO content (lead gen tips, agency growth, automation)
/blog/[slug]          → Individual blog post
/changelog            → Product updates
/docs                 → API documentation + guides
/login                → Sign in
/signup               → Create account → select plan → onboarding
```

### App (app.zypflow.co.uk — authenticated)
```
/dashboard            → KPI overview, funnel, recent activity
/leads                → Lead table with filters, scoring, bulk actions
/leads/[id]           → Lead detail: audit, outreach history, notes
/audit                → Website audit tool (enter URL → results)
/outreach             → Email campaigns: sequences, templates, analytics
/outreach/sequences   → Nurture sequence builder
/outreach/templates   → Email template library
/clients              → Client management
/clients/[id]         → Client detail, project, portal
/projects             → Active website builds tracker
/projects/[id]        → Project milestones, DNS, SSL, preview
/scraper              → Lead scraper config (industries, cities, schedule)
/chatbot              → Chatbot builder (per client knowledge bases)
/reviews              → Review automation dashboard
/content              → AI content generator (blogs, emails, social)
/workflows            → Workflow automation builder
/workflows/[id]       → Workflow editor (visual builder)
/portal/[token]       → Client-facing portal (no auth needed)
/settings             → Org settings
/settings/team        → Team members, invites, roles
/settings/billing     → Stripe customer portal
/settings/api         → API keys
/settings/whitelabel  → White-label config (Agency plan)
```

---

## LANDING PAGE CONTENT

### Hero
**Headline:** "Automate Your Entire Client Pipeline With AI"
**Subline:** "Find leads. Audit their websites. Send personalised outreach. Close deals. All on autopilot."
**CTA primary:** "Start Free — No Card Required"
**CTA secondary:** "Watch Demo"
**Trust bar:** "Used by 500+ agencies" | "AI-Powered" | "GDPR Compliant" | "Cancel Anytime"

### How It Works
1. **Connect** — Set your target industries and locations. Connect your email. Takes 5 minutes.
2. **Discover** — Zypflow finds businesses with poor websites, scores them, and builds a prioritised pipeline.
3. **Engage** — AI writes personalised emails using each lead's actual website issues. Sequences run automatically.
4. **Close** — Replies, call bookings, and proposals managed in one dashboard. Track everything from first touch to signed contract.

### Feature Sections (with screenshots)
- **Smart Lead Scraping** — "Stop manually searching Google Maps. Zypflow finds hundreds of qualified leads in minutes."
- **AI Website Auditor** — "Instant speed, SEO, and mobile analysis with AI-written summaries. Use as a sales weapon."
- **Automated Outreach** — "Personalised cold emails that reference each lead's actual website problems. 3x higher reply rates than generic templates."
- **Workflow Builder** — "Build custom automations without code. If-this-then-that logic for your entire business."
- **Client Management** — "From lead to paying client to ongoing project — everything in one place."

### Social Proof
- "Agencies using Zypflow generate 47 qualified leads per week on average"
- "Our users report 3x faster client acquisition vs manual prospecting"
- Testimonial cards from beta users (even internal — Solis Digital can be a testimonial)

### Comparison Table
| | Zypflow | HubSpot | GoHighLevel | Make.com |
|--|---------|---------|-------------|---------|
| Price | From £49/mo | From £800/mo | From £97/mo | From £9/mo |
| AI lead scoring | Yes | Add-on | No | No |
| Website auditing | Built-in | No | No | No |
| Cold email | Built-in | Add-on | Yes | No |
| Workflow builder | Yes | Yes | Yes | Yes (complex) |
| Made for agencies | Yes | No (enterprise) | Yes | No (developers) |

---

## BUILD ORDER

### Phase 1: Foundation (Week 1-2)
- [ ] Init Next.js 14 project + Tailwind + Supabase
- [ ] Set up Supabase Auth (email/password, Google OAuth)
- [ ] Create organisations + org_members tables
- [ ] Build auth flow: signup → create org → onboarding
- [ ] Build marketing landing page
- [ ] Build dashboard shell (sidebar, KPI cards, empty states)
- [ ] Build lead management (table, filters, add, edit, delete)
- [ ] Build audit tool (URL input → PageSpeed → AI summary → save)
- [ ] Deploy to Vercel

### Phase 2: Pipeline (Week 3-4)
- [ ] Build lead scoring (edge function, runs on insert/update)
- [ ] Build scraper integration (Apify actor, per-org config)
- [ ] Build outreach system (connect email, sequence builder, sending)
- [ ] Build nurture sequences (multi-step, trigger-based)
- [ ] Integrate Stripe Billing (checkout, subscription management)
- [ ] Add usage metering (scraping credits, email credits, AI credits)

### Phase 3: Client Tools (Week 5-6)
- [ ] Build client management (CRUD, link to leads)
- [ ] Build project tracker (milestones, DNS, SSL, preview URL)
- [ ] Build client portal (token auth, scores, milestones, support)
- [ ] Build chatbot builder (per-client config, widget embed code)
- [ ] Build review automation (queue, send, track)
- [ ] Build AI content generator (blog posts, email copy)
- [ ] Deploy chatbot edge function

### Phase 4: Workflows + Scale (Week 7-8)
- [ ] Build visual workflow builder (drag-and-drop, triggers, actions)
- [ ] Build workflow execution engine (edge functions)
- [ ] Build team management (invite, roles, permissions)
- [ ] Build white-label system (custom domain, branding, emails)
- [ ] Build API (REST + API keys + rate limiting)
- [ ] Build admin panel (super-admin view of all orgs)
- [ ] Stripe webhooks (subscription lifecycle, failed payments, usage alerts)

### Phase 5: Polish + Launch (Week 9-10)
- [ ] Onboarding wizard (guided setup for new users)
- [ ] Email notifications (weekly digest, high-score lead alerts)
- [ ] Documentation site (API docs, user guides)
- [ ] Product Hunt launch prep
- [ ] Beta user programme (invite 20 agencies)

---

## BRANDING

| Element | Zypflow | Solis Digital |
|---------|---------|--------------|
| Domain | zypflow.co.uk / zypflow.com | solisdigital.co.uk |
| Colour | Blue/purple gradient + dark bg | Gold + dark bg |
| Font | Inter or Geist | DM Sans |
| Logo | "Zypflow" + lightning/flow icon | Sun icon + "Solis" |
| Tone | "We built this tool for agencies like ours" | "We build websites for local businesses" |
| Target | Agencies, freelancers, marketers | Dentists, salons, plumbers |
| Price point | £49-349/mo (SaaS) | £995-2997 setup + £195-997/mo (service) |

**No cross-branding.** Zypflow never mentions Solis. Solis never mentions Zypflow to clients. They share founders but are separate brands, separate domains, separate Stripe accounts, separate Supabase projects.

---

## REVENUE MODEL

| Stream | Description |
|--------|------------|
| Subscriptions | £49-349/mo per organisation |
| Usage overages | Scraping credits: £0.05/lead over limit |
| | Email credits: £0.01/email over limit |
| | AI credits: £0.02/generation over limit |
| Enterprise | Custom pricing, SLA, dedicated support |
| Marketplace | Pre-built workflow templates (future) |
| Partner programme | Agency referrals earn 20% recurring for 12 months |

### Projections
| Month | Free Users | Paid Users | MRR | ARR |
|-------|-----------|-----------|-----|-----|
| 3 | 100 | 15 | £1,500 | £18,000 |
| 6 | 400 | 60 | £6,000 | £72,000 |
| 12 | 1,500 | 200 | £20,000 | £240,000 |
| 24 | 5,000 | 800 | £80,000 | £960,000 |

---

## GO-TO-MARKET

### Launch Strategy
1. **Week 1:** Landing page + waitlist live at zypflow.co.uk
2. **Week 2:** Share on Twitter/X, LinkedIn, IndieHackers, Reddit (r/webdev, r/entrepreneur, r/SaaS, r/marketing)
3. **Week 3:** Product Hunt launch
4. **Week 4:** Cold email campaign to UK web agencies (use Zypflow's own system to sell Zypflow)
5. **Month 2:** YouTube walkthrough videos, SEO blog content
6. **Month 3:** Affiliate/referral programme launch

### Content Marketing
- Blog: "How to get web design clients in 2026", "Cold email templates that actually work", "AI tools for agencies"
- YouTube: Dashboard walkthrough, "Watch me generate 50 leads in 10 minutes"
- Twitter/X: Daily tips on agency growth, automation, AI workflows

### Partnerships
- **Framer community** — template marketplace integration
- **Webflow community** — "Zypflow for Webflow agencies"
- **WordPress agencies** — largest market segment
- **Make.com / Zapier users** — migration path (visual builder alternative)

---

## DAY 1 CHECKLIST

- [ ] Register zypflow.com and zypflow.co.uk
- [ ] Create new Supabase project (separate from Solis)
- [ ] Create new Vercel project
- [ ] Create new Stripe account
- [ ] Init Next.js project: `npx create-next-app@latest zypflow --typescript --tailwind --app`
- [ ] Set up Supabase Auth
- [ ] Run the database schema SQL above
- [ ] Build landing page with waitlist
- [ ] Deploy v0.1
- [ ] Share waitlist link on socials

---

## RELATIONSHIP TO SOLIS DIGITAL

- Solis Digital is **customer #1** of Zypflow (dogfooding)
- The Solis dashboard eventually migrates to run ON Zypflow
- Solis team members get free Agency plan access
- Revenue from each is tracked separately
- Separate Stripe accounts, separate bank accounts
- If either business is sold, the other is unaffected
- No shared branding, no shared domains, no cross-linking on public pages
