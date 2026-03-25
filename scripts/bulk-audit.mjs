#!/usr/bin/env node
/**
 * Solis Digital — Bulk Audit Script
 * Audits all leads with status "New" and a website using PageSpeed API + Claude API.
 * Writes audit scores + summary back to Supabase.
 *
 * Usage: ANTHROPIC_API_KEY=sk-... node scripts/bulk-audit.mjs
 *
 * Env vars:
 *   ANTHROPIC_API_KEY  — Claude API key (required)
 *   PAGESPEED_API_KEY  — Google PageSpeed API key (defaults to built-in)
 */

import { SB_URL, SB_KEY, PAGESPEED_KEY, sbHeaders } from './config.mjs';
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;

if (!CLAUDE_KEY) {
  console.error('ERROR: Set ANTHROPIC_API_KEY env var.\nUsage: ANTHROPIC_API_KEY=sk-... node scripts/bulk-audit.mjs');
  process.exit(1);
}

async function fetchLeads() {
  const url = `${SB_URL}/rest/v1/leads?status=eq.New&website=not.is.null&has_website=eq.true&select=id,business_name,website,industry,location,google_rating,review_count`;
  const res = await fetch(url, { headers: sbHeaders });
  if (!res.ok) throw new Error(`Failed to fetch leads: ${res.status}`);
  return res.json();
}

async function runPageSpeed(website) {
  let url = website;
  if (!url.startsWith('http')) url = 'https://' + url;
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${PAGESPEED_KEY}&strategy=mobile&category=performance&category=seo&category=accessibility`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    console.warn(`  PageSpeed failed for ${website}: ${res.status}`);
    return null;
  }
  const data = await res.json();
  const cats = data.lighthouseResult?.categories || {};
  return {
    speed_score: Math.round((cats.performance?.score || 0) * 100),
    seo_score: Math.round((cats.seo?.score || 0) * 100),
    mobile_score: Math.round((cats.accessibility?.score || 0) * 100),
    ssl_secure: url.startsWith('https') && !(data.lighthouseResult?.audits?.['is-on-https']?.details?.items?.length > 0)
  };
}

async function generateAuditSummary(lead, scores) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are a website auditor for Solis Digital, a marketing agency. Write a short, professional 2-3 sentence audit summary for a cold email. Be specific about the issues found.

Business: ${lead.business_name}
Industry: ${lead.industry || 'Unknown'}
Location: ${lead.location || 'Unknown'}
Website: ${lead.website}
Speed Score: ${scores.speed_score}/100
SEO Score: ${scores.seo_score}/100
Mobile Score: ${scores.mobile_score}/100
SSL Secure: ${scores.ssl_secure ? 'Yes' : 'No'}

Write ONLY the summary text, no greetings or sign-offs. Focus on the weakest scores and what it costs them in lost customers.`
      }]
    })
  });
  if (!res.ok) {
    console.warn(`  Claude API failed: ${res.status}`);
    return 'Audit completed — manual review recommended.';
  }
  const data = await res.json();
  return data.content?.[0]?.text || 'Audit completed — manual review recommended.';
}

async function updateLead(id, scores, summary) {
  const res = await fetch(`${SB_URL}/rest/v1/leads?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...sbHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      speed_score: scores.speed_score,
      seo_score: scores.seo_score,
      mobile_score: scores.mobile_score,
      ssl_secure: scores.ssl_secure,
      audit_summary: summary,
      status: 'Audited'
    })
  });
  if (!res.ok) console.warn(`  Failed to update lead ${id}: ${res.status}`);
}

async function insertAudit(leadId, scores, summary) {
  await fetch(`${SB_URL}/rest/v1/audits`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      lead_id: leadId,
      speed_score: scores.speed_score,
      seo_score: scores.seo_score,
      mobile_score: scores.mobile_score,
      ssl_secure: scores.ssl_secure,
      ai_summary: summary,
      issues_found: [scores.speed_score < 50, scores.seo_score < 50, scores.mobile_score < 50, !scores.ssl_secure].filter(Boolean).length
    })
  });
}

async function main() {
  console.log('🔍 Fetching unaudited leads...');
  const leads = await fetchLeads();
  console.log(`Found ${leads.length} leads to audit.\n`);

  if (!leads.length) { console.log('Nothing to audit.'); return; }

  let success = 0, failed = 0;
  for (const lead of leads) {
    console.log(`[${success + failed + 1}/${leads.length}] ${lead.business_name} — ${lead.website}`);
    try {
      const scores = await runPageSpeed(lead.website);
      if (!scores) { failed++; continue; }
      console.log(`  Scores: Speed=${scores.speed_score} SEO=${scores.seo_score} Mobile=${scores.mobile_score} SSL=${scores.ssl_secure}`);

      const summary = await generateAuditSummary(lead, scores);
      console.log(`  Summary: ${summary.substring(0, 80)}...`);

      await updateLead(lead.id, scores, summary);
      await insertAudit(lead.id, scores, summary);
      success++;
      console.log(`  ✓ Done\n`);

      // Rate limit: small delay between requests
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Audited: ${success} | Failed: ${failed} | Total: ${leads.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
