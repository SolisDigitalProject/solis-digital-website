# Zypflow Integration Guide — Solis Digital

Everything built into the Solis Digital platform, structured for Zypflow (Make.com) automation scenarios.

---

## Quick Reference

| Service | Details |
|---------|---------|
| Supabase Project | `zqcpktpnfikmshqeqxlg` |
| REST API | `https://zqcpktpnfikmshqeqxlg.supabase.co/rest/v1` |
| Edge Functions | `https://zqcpktpnfikmshqeqxlg.supabase.co/functions/v1/` |
| Instantly Campaign ID | `591dbb42-a2ba-4ade-933a-ef3466584f67` |
| Instantly Campaign | "UK Website Speed Outreach" (5 steps over 14 days, 8am-11am + 2pm-4pm weekdays) |
| PageSpeed API Key | `AIzaSyCCd15XjzZE5aoAJ8zJjCLkkW9evdkuHj0` |
| Google Analytics | `G-V7ZVJZKH2W` |
| Tawk.to Widget | `69b9a21c7f0aa71c36e441e0/1jjui2gh9` |
| Dashboard | `https://www.solisdigital.co.uk/dashboard.html` |
| Client Portal | `https://www.solisdigital.co.uk/portal.html?token={token}` |

---

## Launch Checklist

### Code & Infrastructure (COMPLETE)
- [x] Supabase tables + RLS configured (13 tables)
- [x] pg_cron auto-scraper running (hourly check)
- [x] Edge functions deployed (apify-proxy, auto-scraper, scrape-callback)
- [x] Instantly campaign created ("UK Website Speed Outreach" — 5 steps)
- [x] Instantly API v2 key created (scopes: leads, campaigns)
- [x] Instantly open tracking enabled
- [x] Instantly campaign has all 5 email steps (Day 0, +3, +4, +3, +4 = 14 days)
- [x] 6 email accounts warming (alex@/zain@ x solisagency/solisdigital/team-solisdigital)
- [x] instantly-sync.mjs built (auto-push leads with personalised merge tags)
- [x] instantly-webhook.mjs built (track opens/replies/bounces, pause nurture on reply)
- [x] All 10 automation scripts verified — correct URLs, headers, data flow
- [x] Dashboard: GO LIVE button, scraper panel, admin requests, call list, email tracker
- [x] Client portal: token auth, scores, milestones, sign out, contact footer
- [x] Landing page: SEO meta tags, structured data, LCP optimised
- [x] Linden Grove demo: hero text, meta description, address consistency
- [x] System-wide audit: XSS fix, error handlers, mobile responsive

### Waiting On (External)
- [ ] Upgrade Apify to Starter ($49/mo) — scraper blocked at $5 free limit
- [ ] Email warmup complete (~14 days from March 13, target: March 27+)
- [ ] Create 6 Zypflow/Make.com scenarios (see Scenario Order table below)
- [ ] Set up Instantly webhook URL in Zypflow for event tracking
- [ ] First test run: push 5 leads to Instantly, verify emails render with merge tags
- [ ] Activate Instantly campaign (only after warmup scores hit 90%+)

---

## Supabase Tables (13 total, all RLS-enabled)

### Core Pipeline

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `leads` | Master lead database (scraped + manual) | business_name, website, industry, location, phone, email, lead_score, speed_score, seo_score, mobile_score, ssl_secure, audit_summary, status, revenue_loss_estimate |
| `audits` | Detailed PageSpeed audit results | lead_id, speed_score, seo_score, mobile_score, ssl_secure, ai_summary, issues_found |
| `outreach` | Email campaign tracking | lead_email, status (Sent/Opened/Replied/Interested/Call Booked), sequence_step, opens, subject |
| `nurture_sequences` | 4-step email automation | lead_id, email, sequence_step (1-4), status (active/completed/paused), next_send_at |
| `inquiries` | Website form submissions | email, name, business_url, message, source |

### Client & Revenue

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `clients` | Paying customers | business_name, contact_email, package_type, one_off_revenue, monthly_retainer, project_id |
| `projects` | Web dev project tracker | business_name, package, status, onboard_token, domain, dns_status, ssl_status, milestones (JSON), framer_preview_url, brief_data (JSON) |

### System & Config

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `admin_actions` | Full audit trail | action_type, description, target, result, details (JSON) |
| `admin_requests` | Internal task queue | request_text, priority, category, status, execution_notes |
| `health_checks` | Uptime monitoring | check_type, target_url, status (ok/warning/critical), response_time_ms |
| `config` | Key-value settings | key, value |
| `scraper_config` | Apify scraper settings | apify_token, industries (JSON), cities (JSON), auto_run_enabled, run_interval_hours |
| `scraper_runs` | Scraper execution history | run_id, status, leads_found, queries_total, started_at, completed_at |

---

## Lead Statuses (Pipeline Stages)

```
New → Audited → In Outreach → Replied → Call Booked → Client Won
```

---

## Zypflow Scenarios to Create

### 1. Daily KPI Report (8:00 AM)

**Trigger:** Schedule (daily at 08:00)
**Action:** HTTP Module → Run `node scripts/daily-kpi-report.mjs`

Or build natively in Zypflow:
```
1. HTTP GET → /leads?select=id,status,lead_score,created_at
2. HTTP GET → /outreach?select=id,status
3. HTTP GET → /clients?select=id,one_off_revenue,monthly_retainer
4. HTTP GET → /health_checks?select=*&order=created_at.desc&limit=10
5. Aggregate → Calculate KPIs
6. Email (Resend/Gmail) → Send formatted report
7. HTTP POST → /admin_actions → Log "kpi_report" action
```

**KPIs to calculate:**
- Total leads, new leads (24h), audited, with email/phone
- Outreach: sent, replied, interested, calls booked
- Revenue: one-off total, MRR total, per-package breakdown
- Top 5 leads to call (highest lead_score, status = Audited)

---

### 2. Health Monitor (Every 30 min)

**Trigger:** Schedule (every 30 minutes)
**Actions:**
```
1. HTTP GET → https://www.solisdigital.co.uk (check 200)
2. HTTP GET → /leads?select=id&limit=1 (Supabase health)
3. HTTP GET → PageSpeed API with test URL (API health)
4. HTTP GET → Tawk.to widget URL (chat health)
5. HTTP GET → /dashboard.html (dashboard health)
6. For each check → HTTP POST → /health_checks (log result)
7. IF any failed → Send alert email/Slack notification
8. HTTP POST → /admin_actions → Log "health_check" action
```

---

### 3. Lead Nurture Processor (Every 6 hours)

**Trigger:** Schedule (every 6 hours)

**Step A — Enqueue new leads:**
```
1. HTTP GET → /leads?status=eq.Audited&email=not.is.null&select=id,email,business_name
2. HTTP GET → /nurture_sequences?select=lead_id (get already enrolled)
3. Filter → Remove already enrolled
4. For each new lead:
   HTTP POST → /nurture_sequences
   Body: { lead_id, email, business_name, sequence_step: 1, status: "active", next_send_at: NOW }
```

**Step B — Process due emails:**
```
1. HTTP GET → /nurture_sequences?status=eq.active&next_send_at=lte.{now}
2. For each due sequence:
   a. Build email based on sequence_step (1-4):
      Step 1 (Day 1): Audit findings email
      Step 2 (Day 3): Competitor comparison
      Step 3 (Day 7): Value add + social proof
      Step 4 (Day 14): Final follow-up
   b. Send email via Resend/Gmail/Instantly
   c. HTTP POST → /outreach (log sent email)
   d. IF step < 4:
      HTTP PATCH → /nurture_sequences?id=eq.{id}
      Body: { sequence_step: step+1, next_send_at: +interval, last_sent_at: NOW }
   e. IF step = 4:
      HTTP PATCH → /nurture_sequences?id=eq.{id}
      Body: { status: "completed" }
3. HTTP POST → /admin_actions → Log "nurture_email" action
```

**Email schedule:**
| Step | Day | Subject Template |
|------|-----|-----------------|
| 1 | Day 1 | "{business_name} — your website is costing you customers" |
| 2 | Day 3 | "Your competitors are ranking higher on Google" |
| 3 | Day 7 | "2-3x increase in enquiries within first month" |
| 4 | Day 14 | "Last email — my door is always open" |

---

### 4. New Inquiry Handler (Webhook)

**Trigger:** Supabase webhook on `inquiries` table INSERT

```
1. Receive new inquiry (email, name, business_url)
2. IF business_url exists:
   a. HTTP GET → PageSpeed API → Get scores
   b. HTTP POST → /leads (create lead with scores)
   c. Run lead scoring logic
3. Send confirmation email to inquirer
4. Send Slack/email notification to sales team
5. HTTP POST → /admin_actions → Log "inquiry_received"
```

---

### 5. Apify Scraper (Weekly or On-Demand)

**Trigger:** Schedule (weekly) or Webhook (from dashboard GO LIVE button)

```
1. HTTP GET → /scraper_config?select=* (get config)
2. Build queries: industries × cities
3. Split into batches of 50
4. For each batch:
   HTTP POST → https://api.apify.com/v2/acts/compass~crawler-google-places/runs
   Headers: { Authorization: Bearer {apify_token} }
   Body: { queries: [...], maxResultsPerQuery: 20, extractEmails: true }
5. Poll run status until SUCCEEDED
6. HTTP GET → Apify dataset results
7. For each result:
   a. Check if lead already exists (by business_name + location)
   b. IF new → HTTP POST → /leads
8. HTTP POST → /scraper_runs (log run)
9. HTTP POST → /admin_actions → Log "scraper_run"
```

**Target Industries (26):**
dentist, plumber, electrician, restaurant, estate agent, solicitor, accountant, gym, salon, barber, physiotherapy, veterinary, hotel, cafe, car mechanic, locksmith, florist, photographer, architect, cleaning service, tutor, personal trainer, tattoo studio, optician, chiropractor, nursery

**Target Cities (19):**
London, Manchester, Birmingham, Leeds, Liverpool, Bristol, Sheffield, Newcastle, Nottingham, Leicester, Brighton, Edinburgh, Glasgow, Cardiff, Oxford, Cambridge, Southampton, Reading, York

---

### 6. Lead Scoring (After Scrape or Audit)

**Trigger:** After scraper run completes OR after bulk audit

```
For each lead:
  score = 0
  IF no website        → +30
  IF speed_score < 50  → +20
  IF no SSL            → +15
  IF rating < 4.0      → +15
  IF has email          → +10
  IF has phone          → +5
  IF high-value industry → +10
  IF target city        → +10
  IF review_count < 20  → +5

  HTTP PATCH → /leads?id=eq.{id}
  Body: { lead_score: score }
```

---

### 7. Outreach Tracker (Email Events)

**Trigger:** Instantly.ai webhook (email opened/replied)

```
1. Receive event (email, event_type: opened/replied/bounced)
2. HTTP GET → /outreach?lead_email=eq.{email}&order=created_at.desc&limit=1
3. HTTP PATCH → /outreach?id=eq.{id}
   Body: { status: event_type, opens: opens+1 }
4. IF replied:
   HTTP PATCH → /leads?email=eq.{email}
   Body: { status: "Replied" }
5. HTTP POST → /admin_actions → Log event
```

---

### 8. Project Status Notifier

**Trigger:** Supabase webhook on `projects` table UPDATE (status column change)

```
1. Detect status change (e.g., "development" → "review")
2. HTTP GET → /projects?id=eq.{id}&select=*,onboard_token
3. Build email:
   Subject: "Your website is ready for review!"
   Body: Include portal link with token
4. Send email to client
5. HTTP POST → /admin_actions → Log "project_status_update"
```

---

### 9. DNS/SSL Monitor (Every 4 hours)

**Trigger:** Schedule (every 4 hours)

```
1. HTTP GET → /projects?dns_status=neq.Live&domain=not.is.null&select=*
2. For each project with pending DNS:
   a. DNS lookup on domain
   b. IF resolving → Update dns_status to "Live"
   c. HTTPS check → IF secure → Update ssl_status to "Active"
3. HTTP PATCH → /projects?id=eq.{id} (update statuses)
4. IF newly live → Send notification email to team
```

---

## Edge Functions (3 deployed)

| Function | URL | Auth | Purpose |
|----------|-----|------|---------|
| `apify-proxy` | `.../functions/v1/apify-proxy` | None (CORS) | Browser→Apify proxy to bypass CORS |
| `auto-scraper` | `.../functions/v1/auto-scraper` | JWT | Triggered by pg_cron for auto-scraping |
| `scrape-callback` | `.../functions/v1/scrape-callback` | None | Processes Apify results webhook |

---

## Supabase Auth Headers (for all REST calls)

```json
{
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY3BrdHBuZmlrbXNocWVxeGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNDE1NTIsImV4cCI6MjA1NzgxNzU1Mn0.whtTwOyOihSqhjPPj8YMEV-T4-m_-jYTWJ2m6LtUYKE",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY3BrdHBuZmlrbXNocWVxeGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNDE1NTIsImV4cCI6MjA1NzgxNzU1Mn0.whtTwOyOihSqhjPPj8YMEV-T4-m_-jYTWJ2m6LtUYKE",
  "Content-Type": "application/json"
}
```

---

## Scripts Reference (run via Zypflow HTTP/CLI module)

| Script | Command | Schedule | Status |
|--------|---------|----------|--------|
| Lead Scoring | `node scripts/lead-scoring.mjs` | After scrape/audit | ✅ Ready |
| Bulk Audit | `ANTHROPIC_API_KEY=sk-... node scripts/bulk-audit.mjs` | After scrape | ✅ Ready |
| Instantly Push | `INSTANTLY_API_KEY=... INSTANTLY_CAMPAIGN_ID=... node scripts/instantly-sync.mjs push` | After audit | ✅ Ready |
| Instantly Campaigns | `INSTANTLY_API_KEY=... node scripts/instantly-sync.mjs campaigns` | One-time setup | ✅ Ready |
| Instantly Webhook | `echo '{"event_type":"email_replied","email":"..."}' \| node scripts/instantly-webhook.mjs` | On event | ✅ Ready |
| Lead Nurture (enqueue) | `node scripts/lead-nurture.mjs enqueue` | Every 6h | ✅ Ready |
| Lead Nurture (process) | `node scripts/lead-nurture.mjs process` | Every 6h | ✅ Ready |
| Daily KPI Report | `node scripts/daily-kpi-report.mjs` | Daily 8am | ✅ Ready |
| Health Monitor | `node scripts/health-monitor.mjs` | Every 30min | ✅ Ready |
| Export Leads CSV | `node scripts/export-leads.mjs` | On-demand (legacy) | Replaced by instantly-sync |
| Generate Copy | `ANTHROPIC_API_KEY=sk-... node scripts/generate-copy.mjs --name "X" --industry "Y"` | On-demand | ✅ Ready |

---

## Instantly.ai Integration (NEW)

### Setup Steps

1. **Get API key**: Instantly dashboard → Settings → API → Create V2 key with `leads:all` + `campaigns:all` scopes
2. **Find campaign ID**: `INSTANTLY_API_KEY=xxx node scripts/instantly-sync.mjs campaigns`
3. **Set env vars**: `INSTANTLY_API_KEY` and `INSTANTLY_CAMPAIGN_ID`

### How Emails Get Personalised

`instantly-sync.mjs` pushes leads with these merge tags (custom_variables):

| Merge Tag | Source | Example |
|-----------|--------|---------|
| `{{business_name}}` | leads.business_name | "Smith's Plumbing" |
| `{{website}}` | leads.website | "smithplumbing.co.uk" |
| `{{first_name}}` | Extracted from email | "John" |
| `{{industry}}` | leads.industry | "plumber" |
| `{{location}}` | leads.location | "Manchester" |
| `{{speed_score}}` | leads.speed_score | "34" |
| `{{issue_1}}` | Auto-generated from scores | "Site speed score is 34/100 — visitors leave before the page loads" |
| `{{issue_2}}` | Auto-generated from scores | "SEO score is 28/100 — you're invisible on Google" |
| `{{issue_3}}` | Auto-generated from scores | "No SSL certificate — Google marks your site as 'Not Secure'" |
| `{{number_of_issues}}` | Count of issues | "3" |
| `{{calendly_link}}` | Hardcoded | "https://calendly.com/solisdigital/strategy-call" |

### Email Templates (in Instantly campaign)

Use the templates from `templates/outreach-emails.md`:
- **Email 1 (Day 0)**: "I found {{number_of_issues}} issues with {{website}}"
- **Email 2 (Day 3)**: "Quick thought about {{business_name}}'s website"
- **Email 3 (Day 7)**: "How a {{industry}} in {{location}} got 280% more enquiries"
- **Email 4 (Day 10)**: "Re: {{business_name}} website"
- **Email 5 (Day 14)**: "Should I close your file?"

### Webhook Handler (instantly-webhook.mjs)

Receives events from Instantly and updates Supabase:

| Instantly Event | → Outreach Status | → Lead Status | → Nurture Action |
|----------------|-------------------|---------------|------------------|
| `email_opened` | Opened (opens +1) | — | — |
| `email_replied` | Replied | Replied | Pause sequence |
| `email_bounced` | Bounced | Bounced | — |

**Zypflow setup**: Create a webhook scenario → receive Instantly event → HTTP module calls `instantly-webhook.mjs`

---

## Full Pipeline (End-to-End) — FULLY AUTOMATED

```
SCRAPE (Apify + pg_cron — runs every 24h automatically)
  │  26 industries × 19 cities → leads table (status: New)
  │  Trigger: pg_cron → auto-scraper edge function
  ↓
SCORE (lead-scoring.mjs — runs after scrape)
  │  Algorithm: 0-130 points based on website quality + industry + location
  │  Trigger: Zypflow scenario after scrape completes
  ↓
AUDIT (bulk-audit.mjs — runs after scoring)
  │  PageSpeed API + Claude AI summary → status: Audited
  │  Trigger: Zypflow scenario (every 15 min for new leads)
  ↓
PUSH TO INSTANTLY (instantly-sync.mjs — runs after audit)
  │  Audited leads + merge tags → Instantly campaign
  │  Trigger: Zypflow scenario after audit batch
  │  Dedup: skips leads already in outreach table
  ↓
EMAIL SEQUENCE (Instantly.ai — fully automated)
  │  5 personalised emails over 14 days
  │  Email 1 (Day 0) → Email 2 (Day 3) → Email 3 (Day 7) → Email 4 (Day 10) → Email 5 (Day 14)
  │  Sends from 6 warmed accounts, rotates automatically
  ↓
TRACK EVENTS (instantly-webhook.mjs — on each event)
  │  Opens → update outreach table
  │  Replies → update lead status, pause nurture sequence
  │  Bounces → mark lead as bounced
  │  Trigger: Instantly webhook → Zypflow → script
  ↓
CALL (Dashboard call list — sales team)
  │  Top leads ranked by score + reply status
  │  Track: Called, Callback, Interested, Call Booked
  ↓
CLOSE → Create project + send portal token
ONBOARD → Client brief form → Framer AI prompt
BUILD → Design → Development → Review
LAUNCH → DNS + SSL → Go live
MONITOR (health-monitor.mjs — every 30 min)
REPORT (daily-kpi-report.mjs — 8am daily)
```

### Zypflow Scenario Order (create these 6 scenarios)

| # | Scenario | Trigger | Actions |
|---|----------|---------|---------|
| 1 | Health Monitor | Every 30 min | Run health-monitor.mjs |
| 2 | Daily KPI Report | Daily 8am | Run daily-kpi-report.mjs → send email |
| 3 | Audit & Score Pipeline | Every 15 min | Run bulk-audit.mjs → run lead-scoring.mjs |
| 4 | Push to Instantly | Every 1h | Run instantly-sync.mjs push |
| 5 | Instantly Webhook | On event | Receive webhook → run instantly-webhook.mjs |
| 6 | Nurture Tracker | Every 6h | Run lead-nurture.mjs enqueue → process |

---

## Subscriptions Needed

| Service | Plan | Cost | Why |
|---------|------|------|-----|
| **Supabase** | Pro | $25/mo | More API calls, daily backups, no pause |
| **Apify** | Starter | $49/mo | Scraper runs (currently blocked at $5 free limit) |
| **Instantly.ai** | Growth | $30/mo | Email sending + tracking |
| **Make.com/Zypflow** | Core | $10/mo+ | Scenario orchestration |
| **Vercel** | Hobby (free) | $0 | Static site hosting |
| **Google PageSpeed** | Free | $0 | Built-in quota sufficient |
| **Tawk.to** | Free | $0 | Live chat |
| **Claude API** | Pay-as-you-go | ~$5/mo | AI summaries + copy gen |
