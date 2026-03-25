#!/usr/bin/env node
/**
 * Solis Digital — Instantly.ai Integration (Multi-Campaign)
 *
 * Automatically pushes audited leads into the correct niche Instantly campaign
 * based on their industry. Routes dental → dental campaign, aesthetics → aesthetics
 * campaign, trades → trades campaign, everything else → generic campaign.
 *
 * Modes:
 *   node scripts/instantly-sync.mjs push      — Push new audited leads to niche campaigns
 *   node scripts/instantly-sync.mjs campaigns  — List all Instantly campaigns
 *
 * Required env vars:
 *   INSTANTLY_API_KEY  — Instantly API v2 Bearer token
 */

import { SB_REST as SB_URL, sbHeaders as HEADERS } from './config.mjs';

const API_KEY = process.env.INSTANTLY_API_KEY;
const INSTANTLY_BASE = 'https://api.instantly.ai/api/v2';

// Niche campaign routing — maps industry keywords to campaign IDs
const CAMPAIGN_MAP = {
  dental: 'ef020206-24f1-4d6a-8233-d52b9b5dd177',
  aesthetics: 'a5493fd5-835b-4a5f-a085-7c91aa7acfb5',
  trades: 'f27305ec-12be-4b76-b399-762dd7dcd584',
  generic: '591dbb42-a2ba-4ade-933a-ef3466584f67'
};

// Industry keywords → niche mapping
const INDUSTRY_NICHE = {
  // Dental
  'dentist': 'dental', 'dental': 'dental', 'dental practice': 'dental',
  'dental clinic': 'dental', 'orthodontist': 'dental', 'oral surgeon': 'dental',
  // Aesthetics
  'aesthetics': 'aesthetics', 'aesthetics clinic': 'aesthetics', 'skin clinic': 'aesthetics',
  'beauty salon': 'aesthetics', 'cosmetic clinic': 'aesthetics', 'botox': 'aesthetics',
  'lip filler': 'aesthetics', 'dermatology': 'aesthetics', 'med spa': 'aesthetics',
  'beauty': 'aesthetics', 'cosmetic': 'aesthetics', 'salon': 'aesthetics',
  // Trades
  'plumber': 'trades', 'plumbing': 'trades', 'electrician': 'trades',
  'electrical': 'trades', 'builder': 'trades', 'building': 'trades',
  'roofer': 'trades', 'roofing': 'trades', 'carpenter': 'trades',
  'painter': 'trades', 'decorator': 'trades', 'handyman': 'trades',
  'locksmith': 'trades', 'gas engineer': 'trades', 'heating': 'trades',
  'hvac': 'trades', 'landscaper': 'trades', 'gardener': 'trades'
};

function getNiche(industry) {
  if (!industry) return 'generic';
  const lower = industry.toLowerCase().trim();
  if (INDUSTRY_NICHE[lower]) return INDUSTRY_NICHE[lower];
  // Partial match — check if industry contains any keyword
  for (const [keyword, niche] of Object.entries(INDUSTRY_NICHE)) {
    if (lower.includes(keyword) || keyword.includes(lower)) return niche;
  }
  return 'generic';
}

function getCampaignId(niche) {
  return CAMPAIGN_MAP[niche] || CAMPAIGN_MAP.generic;
}

function instantlyHeaders() {
  return {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };
}

async function query(endpoint) {
  const res = await fetch(`${SB_URL}${endpoint}`, { headers: HEADERS });
  if (!res.ok) { console.error(`Query failed: ${endpoint} (${res.status})`); return []; }
  return res.json();
}

async function logAction(action) {
  await fetch(`${SB_URL}/admin_actions`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(action)
  });
}

function extractFirstName(email) {
  if (!email) return 'there';
  const local = email.split('@')[0];
  const name = local.split(/[._-]/)[0];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function buildIssues(lead) {
  const issues = [];
  if (lead.speed_score != null && lead.speed_score < 50) {
    issues.push(`Site speed score is ${lead.speed_score}/100 — visitors leave before the page loads`);
  }
  if (lead.seo_score != null && lead.seo_score < 50) {
    issues.push(`SEO score is ${lead.seo_score}/100 — you're invisible on Google for key search terms`);
  }
  if (lead.mobile_score != null && lead.mobile_score < 50) {
    issues.push(`Mobile score is ${lead.mobile_score}/100 — 60% of customers browse on phones`);
  }
  if (lead.ssl_secure === false) {
    issues.push(`No SSL certificate — Google marks your site as 'Not Secure'`);
  }
  if (issues.length === 0) {
    issues.push('Your website could be faster and rank higher on Google');
    issues.push('Mobile experience needs improvement for modern visitors');
    issues.push('Several SEO opportunities are being missed');
  }
  while (issues.length < 3) issues.push('Additional optimisation opportunities identified');
  return issues;
}

function buildEmailBody(lead, issues) {
  const name = lead.business_name || 'your business';
  const site = lead.website || 'your website';
  return `Hi,\n\nI was looking at local ${lead.industry || 'businesses'} in ${lead.location || 'your area'} and ran a quick audit on ${site}.\n\nI found a few things that might be costing you customers:\n\n1. ${issues[0]}\n2. ${issues[1]}\n3. ${issues[2]}\n\nYour site scored ${lead.speed_score || 'below average'}/100 on Google's speed test — anything below 50 means visitors are leaving before the page even loads.\n\nI put together a full audit report with specific fixes. Want me to send it over?\n\nNo cost, no strings — just thought it might be useful.`;
}

/**
 * List all Instantly campaigns to find the target campaign_id
 */
async function listCampaigns() {
  if (!API_KEY) {
    console.error('Missing INSTANTLY_API_KEY env var');
    process.exit(1);
  }

  console.log('Fetching Instantly campaigns...\n');

  const res = await fetch(`${INSTANTLY_BASE}/campaigns?limit=50`, {
    headers: instantlyHeaders()
  });

  if (!res.ok) {
    console.error(`Instantly API error: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const campaigns = data.items || data.data || data;

  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    console.log('No campaigns found. Create one in Instantly first.');
    return;
  }

  console.log('Your Instantly Campaigns:\n');
  console.log('ID'.padEnd(40) + 'Name'.padEnd(50) + 'Status');
  console.log('-'.repeat(100));

  for (const c of campaigns) {
    const id = c.id || c.campaign_id || 'unknown';
    const name = c.name || c.campaign_name || 'Untitled';
    const status = c.status || 'unknown';
    console.log(`${id.padEnd(40)}${name.padEnd(50)}${status}`);
  }

  console.log(`\nCopy the campaign ID and set it as INSTANTLY_CAMPAIGN_ID env var.`);
}

/**
 * Push audited leads to the correct niche Instantly campaign
 * Routes automatically: dental → dental campaign, aesthetics → aesthetics, etc.
 */
async function pushLeads() {
  if (!API_KEY) {
    console.error('Missing INSTANTLY_API_KEY env var');
    process.exit(1);
  }

  console.log('Fetching audited leads to push to Instantly...\n');

  // Get audited leads with emails (score 60+ threshold for quality)
  const leads = await query(
    '/leads?select=id,email,business_name,website,industry,location,speed_score,seo_score,mobile_score,ssl_secure,audit_summary,lead_score&status=eq.Audited&email=not.is.null&lead_score=gte.60&order=lead_score.desc'
  );

  // Get leads already pushed (tracked via outreach table)
  const pushed = await query('/outreach?select=contact_email');
  const pushedEmails = new Set(pushed.map(p => p.contact_email));

  // Filter to only new leads
  const newLeads = leads.filter(l => l.email && !pushedEmails.has(l.email));

  if (newLeads.length === 0) {
    console.log('No new leads to push. All qualifying leads already in Instantly.');
    return;
  }

  console.log(`Found ${newLeads.length} new leads to push to Instantly.\n`);

  // Group leads by niche for campaign routing
  const nicheGroups = { dental: [], aesthetics: [], trades: [], generic: [] };
  for (const lead of newLeads) {
    const niche = getNiche(lead.industry);
    nicheGroups[niche].push(lead);
  }

  let totalPushed = 0;

  for (const [niche, nicheLeads] of Object.entries(nicheGroups)) {
    if (nicheLeads.length === 0) continue;

    const campaignId = getCampaignId(niche);
    console.log(`\n📧 ${niche.toUpperCase()} campaign: ${nicheLeads.length} leads → ${campaignId}`);

    // Build Instantly lead objects with custom variables (merge tags)
    const instantlyLeads = nicheLeads.map(lead => {
      const issues = buildIssues(lead);
      return {
        email: lead.email,
        first_name: extractFirstName(lead.email),
        company_name: lead.business_name || '',
        website: lead.website || '',
        custom_variables: {
          business_name: lead.business_name || '',
          company_name: lead.business_name || '',
          website: lead.website || '',
          industry: lead.industry || '',
          location: lead.location || '',
          speed_score: String(lead.speed_score || 'N/A'),
          seo_score: String(lead.seo_score || 'N/A'),
          mobile_score: String(lead.mobile_score || 'N/A'),
          lead_score: String(lead.lead_score || 0),
          issue_1: issues[0],
          issue_2: issues[1],
          issue_3: issues[2],
          number_of_issues: String(issues.length),
          audit_summary: lead.audit_summary || '',
          email_body: buildEmailBody(lead, issues),
          calendly_link: 'https://calendly.com/solisdigital-info/solis-digital-free-strategy-call'
        }
      };
    });

    // Push in batches of 100
    const batchSize = 100;
    for (let i = 0; i < instantlyLeads.length; i += batchSize) {
      const batch = instantlyLeads.slice(i, i + batchSize);

      const res = await fetch(`${INSTANTLY_BASE}/leads`, {
        method: 'POST',
        headers: instantlyHeaders(),
        body: JSON.stringify({
          campaign_id: campaignId,
          skip_if_in_campaign: true,
          leads: batch
        })
      });

      if (res.ok) {
        totalPushed += batch.length;
        console.log(`  Batch ${Math.floor(i / batchSize) + 1}: pushed ${batch.length} leads`);
      } else {
        const err = await res.text();
        console.error(`  Batch ${Math.floor(i / batchSize) + 1} failed: ${res.status} ${err}`);
      }

      // Rate limit: 100ms delay between batches
      if (i + batchSize < instantlyLeads.length) await new Promise(r => setTimeout(r, 100));
    }

    // Record in outreach table so we don't push duplicates
    for (const lead of nicheLeads) {
      const oRes = await fetch(`${SB_URL}/outreach`, {
        method: 'POST',
        headers: { ...HEADERS, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          email: lead.email,
          contact_email: lead.email,
          status: 'Sent',
          sequence_step: 1,
          sent_at: new Date().toISOString(),
          subject: `${lead.business_name} — pushed to ${niche} campaign`
        })
      });
      if (!oRes.ok) console.warn(`  Failed to record outreach for ${lead.email}: ${oRes.status}`);
    }

    // Update lead statuses to "In Outreach"
    for (const lead of nicheLeads) {
      const lRes = await fetch(`${SB_URL}/leads?id=eq.${lead.id}`, {
        method: 'PATCH',
        headers: { ...HEADERS, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'In Outreach' })
      });
      if (!lRes.ok) console.warn(`  Failed to update lead ${lead.id}: ${lRes.status}`);
    }

    await logAction({
      action_type: 'instantly_push',
      description: `Pushed ${nicheLeads.length} ${niche} leads to Instantly`,
      target: 'outreach',
      result: 'success',
      details: { count: nicheLeads.length, campaign_id: campaignId, niche }
    });
  }

  // Summary
  console.log(`\n✅ Pushed ${totalPushed} leads across ${Object.entries(nicheGroups).filter(([,v]) => v.length > 0).length} campaigns`);
  for (const [niche, nicheLeads] of Object.entries(nicheGroups)) {
    if (nicheLeads.length > 0) console.log(`   ${niche}: ${nicheLeads.length} leads`);
  }
  console.log(`   All lead statuses updated to "In Outreach"`);
}

// CLI
const mode = process.argv?.[2] || 'push';
if (mode === 'campaigns') {
  listCampaigns().catch(console.error);
} else {
  pushLeads().catch(console.error);
}
