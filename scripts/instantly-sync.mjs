#!/usr/bin/env node
/**
 * Solis Digital — Instantly.ai Integration
 *
 * Automatically pushes audited leads into an Instantly campaign
 * with personalised merge tags from audit data.
 *
 * Modes:
 *   node scripts/instantly-sync.mjs push      — Push new audited leads to Instantly campaign
 *   node scripts/instantly-sync.mjs campaigns  — List all Instantly campaigns (to find campaign_id)
 *
 * Required env vars:
 *   INSTANTLY_API_KEY  — Instantly API v2 Bearer token
 *   INSTANTLY_CAMPAIGN_ID — Target campaign ID (get via 'campaigns' mode)
 */

import { SB_REST as SB_URL, sbHeaders as HEADERS } from './config.mjs';

const API_KEY = process.env.INSTANTLY_API_KEY;
const CAMPAIGN_ID = process.env.INSTANTLY_CAMPAIGN_ID;
const INSTANTLY_BASE = 'https://api.instantly.ai/api/v2';

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
 * Push audited leads to Instantly campaign with personalised variables
 */
async function pushLeads() {
  if (!API_KEY) {
    console.error('Missing INSTANTLY_API_KEY env var');
    process.exit(1);
  }
  if (!CAMPAIGN_ID) {
    console.error('Missing INSTANTLY_CAMPAIGN_ID env var. Run with "campaigns" mode first to find it.');
    process.exit(1);
  }

  console.log('Fetching audited leads to push to Instantly...\n');

  // Get audited leads with emails
  const leads = await query(
    '/leads?select=id,email,business_name,website,industry,location,speed_score,seo_score,mobile_score,ssl_secure,audit_summary,lead_score&status=eq.Audited&email=not.is.null&order=lead_score.desc'
  );

  // Get leads already pushed (tracked via outreach table with source=instantly)
  const pushed = await query('/outreach?select=contact_email&status=eq.Sent');
  const pushedEmails = new Set((pushed || []).map(p => p.contact_email));

  // Filter to only new leads
  const newLeads = leads.filter(l => l.email && !pushedEmails.has(l.email));

  if (newLeads.length === 0) {
    console.log('No new leads to push. All audited leads already in Instantly.');
    return;
  }

  console.log(`Found ${newLeads.length} new leads to push to Instantly.\n`);

  // Build Instantly lead objects with custom variables (merge tags)
  const instantlyLeads = newLeads.map(lead => {
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

  // STEP 1: Record outreach FIRST (status=Pending) to prevent duplicates on crash
  for (const lead of newLeads) {
    const oRes = await fetch(`${SB_URL}/outreach`, {
      method: 'POST',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        email: lead.email,
        contact_email: lead.email,
        status: 'Pending',
        sequence_step: 1,
        sent_at: new Date().toISOString(),
        subject: `${lead.business_name} — pushing to Instantly campaign`
      })
    });
    if (!oRes.ok) console.warn(`  Failed to pre-record outreach for ${lead.email}: ${oRes.status}`);
  }

  // STEP 2: Push to Instantly in batches of 100
  const batchSize = 100;
  let totalPushed = 0;

  for (let i = 0; i < instantlyLeads.length; i += batchSize) {
    const batch = instantlyLeads.slice(i, i + batchSize);

    const res = await fetch(`${INSTANTLY_BASE}/leads`, {
      method: 'POST',
      headers: instantlyHeaders(),
      body: JSON.stringify({
        campaign_id: CAMPAIGN_ID,
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
  }

  // STEP 3: Update outreach records from Pending → Sent
  for (const lead of newLeads) {
    await fetch(`${SB_URL}/outreach?contact_email=eq.${encodeURIComponent(lead.email)}&status=eq.Pending`, {
      method: 'PATCH',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'Sent' })
    });
  }

  // Update lead statuses to "In Outreach"
  for (const lead of newLeads) {
    const lRes = await fetch(`${SB_URL}/leads?id=eq.${lead.id}`, {
      method: 'PATCH',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'In Outreach' })
    });
    if (!lRes.ok) console.warn(`  Failed to update lead ${lead.id}: ${lRes.status}`);
  }

  await logAction({
    action_type: 'instantly_push',
    description: `Pushed ${totalPushed} leads to Instantly campaign`,
    target: 'outreach',
    result: 'success',
    details: { count: totalPushed, campaign_id: CAMPAIGN_ID }
  });

  console.log(`\n✅ Pushed ${totalPushed} leads to Instantly campaign ${CAMPAIGN_ID}`);
  console.log(`   Lead statuses updated to "In Outreach"`);
}

// CLI
const mode = process.argv?.[2] || 'push';
if (mode === 'campaigns') {
  listCampaigns().catch(console.error);
} else {
  pushLeads().catch(console.error);
}
