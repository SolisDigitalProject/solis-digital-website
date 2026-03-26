# Solis Digital — Launch & Operations Guide

> Everything you need to do manually to get the full system running.
> Last updated: 26 March 2026

---

## PART 1: IMMEDIATE MANUAL SETUP (Do These Now)

### 1. Upgrade Apify to Starter Plan ($49/mo)
**Why:** Your lead scraper is blocked at free tier limits. No scraping = no leads.
- Go to https://console.apify.com/billing
- Upgrade to **Starter** ($49/mo)
- This gives you 100 actor runs/day — enough for 500+ leads/week

### 2. Set Environment Variables
Your scripts need these env vars. Set them wherever you run scripts (your Mac terminal, or Make.com/cron):

```bash
# Required for all scripts
export SUPABASE_URL="https://zqcpktpnfikmshqeqxlg.supabase.co"
export SUPABASE_KEY="your-anon-key"

# Required for audits + blog generation + chatbot
export ANTHROPIC_API_KEY="sk-ant-..."

# Required for PageSpeed audits + quarterly refresh
export PAGESPEED_API_KEY="your-google-key"

# Required for email sending (proposals, reviews, upsells, nurture, reports)
export RESEND_API_KEY="re_..."

# Required for cold outreach
export INSTANTLY_API_KEY="your-instantly-key"
export INSTANTLY_CAMPAIGN_ID="your-campaign-id"

# Optional — Slack notifications
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

**Tip:** Create a `.env` file in the project root and use `source .env` before running scripts.

### 3. Set Up Resend Domain Verification
**Why:** Without this, emails land in spam.
- Go to https://resend.com/domains
- Add `solisdigital.co.uk`
- Add the DNS records they give you (SPF, DKIM, DMARC) to your domain registrar
- Wait for verification (usually 5-30 minutes)
- Also verify `reviews@solisdigital.co.uk` as a sender if using the Reviews add-on

### 4. Add ANTHROPIC_API_KEY to Supabase Edge Function Secrets
**Why:** The chatbot edge function needs it.
- Go to https://supabase.com/dashboard/project/zqcpktpnfikmshqeqxlg/settings/functions
- Under "Secrets", add: `ANTHROPIC_API_KEY` = your Claude API key
- The chatbot edge function will use this to answer questions

### 5. Get Your Instantly Campaign ID
```bash
# List your Instantly campaigns to find the ID
INSTANTLY_API_KEY=your-key node scripts/instantly-sync.mjs campaigns
```
Copy the campaign ID and set it as `INSTANTLY_CAMPAIGN_ID`.

---

## PART 2: APRIL 3 — COLD EMAIL ACTIVATION

### When Domain Warmup Hits 90%+
1. Log into Instantly.ai
2. Check warmup stats on both domains
3. Once both are 90%+, activate your campaign
4. Push leads to Instantly:
```bash
node scripts/instantly-sync.mjs push
```
5. Monitor replies in your dashboard under "Email Outreach Tracker"

### Daily Email Operations
- **Instantly** handles sending, warmup, and bounce management automatically
- **Replies** come back to your mailbox — check daily
- When someone replies interested, update their status in the dashboard (Replied → Call Booked)
- The `instantly-webhook.mjs` script can auto-update statuses if you set up the webhook in Instantly

---

## PART 3: WEEKLY OPERATIONS CHECKLIST

### Every Day (5 mins)
- [ ] Check dashboard KPIs
- [ ] Reply to any email responses in your inbox
- [ ] Check Instantly for bounces/spam warnings

### Every Week (30 mins)
- [ ] Run lead scoring: `node scripts/lead-scoring.mjs`
- [ ] Run bulk audit on new leads: `ANTHROPIC_API_KEY=sk-... node scripts/bulk-audit.mjs`
- [ ] Push new audited leads to Instantly: `node scripts/instantly-sync.mjs push`
- [ ] Process nurture sequences: `node scripts/lead-nurture.mjs process`
- [ ] Check upsell triggers: `node scripts/upsell-triggers.mjs`

### Every Month (1 hour)
- [ ] Run quarterly refresh on client sites: `node scripts/quarterly-refresh.mjs audit`
- [ ] Send refresh reports: `node scripts/quarterly-refresh.mjs report`
- [ ] Generate SEO blog posts for active clients
- [ ] Review Stripe MRR and churn
- [ ] Send any pending review request emails: `node scripts/review-automation.mjs send`

---

## PART 4: CLIENT ONBOARDING WORKFLOW

When a new client pays:

### Step 1: Create Project in Dashboard
- Open dashboard → "Active Projects" → "+ New Project"
- Enter business name, select package, add their old website URL
- This generates an onboard token automatically

### Step 2: Send Client Brief Link
- Click "Copy Client Brief Link" on the project card
- Send this link to the client via email/WhatsApp
- They fill in their brand info, services, colours, inspiration sites

### Step 3: Build in Framer
- Once brief is submitted (you'll see "Brief received" on the project card)
- Click "Copy Framer AI Prompt" → paste into Framer to generate the initial build
- Customise the design
- Paste the Framer preview URL back into the dashboard

### Step 4: DNS & Launch
- Buy/transfer the client's domain if needed
- Update DNS status in the dashboard (Not Started → Pending → Configured → Propagating → Live)
- SSL auto-activates when DNS goes live
- Update project status to "Launched"

### Step 5: Set Up Add-Ons (if purchased)

**AI Chatbot:**
```bash
node scripts/chatbot-manager.mjs setup --project <id>
node scripts/chatbot-manager.mjs update --project <id> --field "hours" --value "Mon-Fri 9am-6pm"
node scripts/chatbot-manager.mjs update --project <id> --field "booking_url" --value "https://calendly.com/their-link"
node scripts/chatbot-manager.mjs embed --project <id>
# Copy the <script> tag and add it to the client's Framer site before </body>
```

**Google Reviews Automation:**
```bash
# Get the client's Google review link from their Google Business Profile
node scripts/review-automation.mjs setup --project <id> --url "https://g.page/r/CxxxxEBM/review"
# Then when the client has customers to request reviews from:
node scripts/review-automation.mjs request --project <id> --name "John Smith" --email "john@gmail.com"
node scripts/review-automation.mjs send
```

**SEO Blog Posts:**
```bash
node scripts/seo-blog-generator.mjs generate --project <id> --topic "best dentist in nottingham"
node scripts/seo-blog-generator.mjs list --project <id>
# Review the draft, then approve:
node scripts/seo-blog-generator.mjs approve --id <post-uuid>
```

---

## PART 5: AUTOMATION SCRIPTS REFERENCE

| Script | What It Does | When to Run |
|--------|-------------|-------------|
| `lead-scoring.mjs` | Scores all leads 0-130 based on signals | After new leads scraped |
| `bulk-audit.mjs` | PageSpeed + Claude audit on "New" leads | Weekly |
| `instantly-sync.mjs push` | Push audited leads to Instantly campaign | Weekly after audit |
| `instantly-sync.mjs campaigns` | List Instantly campaigns | Once (to get ID) |
| `lead-nurture.mjs enqueue` | Add replied leads to nurture sequence | After replies come in |
| `lead-nurture.mjs process` | Send due nurture emails | Daily |
| `send-proposal.mjs` | Generate + send proposal to a lead | After discovery call |
| `upsell-triggers.mjs` | Check 30/60/90 day milestones | Daily |
| `daily-kpi-report.mjs` | Compile and send daily metrics | Daily (automate via cron) |
| `health-monitor.mjs` | Check all systems are up | Every 30 min (automate) |
| `review-automation.mjs` | Send Google review request emails | Per client, after appointments |
| `seo-blog-generator.mjs` | Generate SEO blog posts for clients | Monthly per client |
| `quarterly-refresh.mjs` | Re-audit launched client sites | Monthly/Quarterly |
| `chatbot-manager.mjs` | Manage per-client chatbot configs | Per client setup |
| `generate-copy.mjs` | Generate marketing copy variants | As needed |
| `generate-audit-report.mjs` | Detailed audit report for proposals | Before sales calls |

---

## PART 6: THINGS TO AUTOMATE NEXT

These are still manual but could be automated with Make.com or cron:

1. **Daily cron job** — Run `lead-scoring.mjs`, `lead-nurture.mjs process`, `upsell-triggers.mjs`, `daily-kpi-report.mjs`, `health-monitor.mjs` every day at 9am
2. **Weekly cron** — Run `bulk-audit.mjs` + `instantly-sync.mjs push` every Monday
3. **Monthly cron** — Run `quarterly-refresh.mjs audit` on the 1st of each month
4. **Stripe webhook** — Auto-create project + client record when someone pays (currently manual)
5. **Instantly webhook** — Auto-update lead statuses when emails are opened/replied

---

## PART 7: STRIPE PRODUCT SETUP (Already Done)

Your active Stripe products:

| Product | Type | Price |
|---------|------|-------|
| Starter | Core package | £995 setup + £195/mo |
| Growth | Core package | £1,995 setup + £395/mo |
| Accelerator | Core package | £2,997 setup + £997/mo |
| Google Reviews Automation | Add-on | Has 2 prices |
| AI Chatbot Add-On | Add-on | Has 2 prices |
| Quarterly Website Refresh | One-off | £297 |
| Google Ads Setup | One-off | £297 |
| Video Editing | One-off | £97 |
| Logo & Brand Kit | One-off | £497 |
| Landing Page | One-off | £297 |
| Email Template Design | One-off | £197 |
| SEO Blog Post | One-off | £147 |
| Extra Page | One-off | £97 |

**To create payment links:** Stripe Dashboard → Products → select product → "Create payment link"

---

## PART 8: EMERGENCY CONTACTS & ACCESS

| Service | URL | Notes |
|---------|-----|-------|
| Supabase Dashboard | https://supabase.com/dashboard/project/zqcpktpnfikmshqeqxlg | Database, edge functions, logs |
| Vercel Dashboard | https://vercel.com | Website hosting, deployments |
| Stripe Dashboard | https://dashboard.stripe.com | Payments, subscriptions, invoices |
| Instantly.ai | https://app.instantly.ai | Cold email campaigns |
| Resend | https://resend.com | Transactional email sending |
| Apify Console | https://console.apify.com | Lead scraper runs |
| Calendly | https://calendly.com | Discovery call scheduling |
| Tawk.to | https://tawk.to | Live chat widget |
| GitHub Repo | https://github.com/SolisDigitalProject/solis-digital-website | Source code |
