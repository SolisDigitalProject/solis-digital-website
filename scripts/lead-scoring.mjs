#!/usr/bin/env node
/**
 * Solis Digital — Lead Scoring Script
 * Scores all leads based on website quality, industry, and location signals.
 * Adds/updates lead_score column and prioritises for outreach.
 *
 * Usage: node scripts/lead-scoring.mjs
 *
 * Scoring rules:
 *   No website:               +30
 *   Speed score < 50:         +20
 *   No SSL:                   +15
 *   Google rating < 4.0:      +15
 *   High-value industry:      +10
 *   London location:          +10
 */

const SB_URL = 'https://zqcpktpnfikmshqeqxlg.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY3BrdHBuZmlrbXNocWVxeGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg5MDIsImV4cCI6MjA4ODkyNDkwMn0.whtTwOyOihSqhjPPj8YMEV-T4-m_-jYTWJ2m6LtUYKE';
const sbHeaders = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

const HIGH_VALUE_INDUSTRIES = ['dentist', 'dental', 'cosmetic dentist', 'estate agent', 'orthodontist', 'pediatric dentist'];

function scoreLead(lead) {
  let score = 0;

  if (!lead.has_website || !lead.website) score += 30;
  if (lead.speed_score != null && lead.speed_score < 50) score += 20;
  if (lead.ssl_secure === false) score += 15;
  if (lead.google_rating != null && lead.google_rating < 4.0) score += 15;

  const industry = (lead.industry || '').toLowerCase();
  if (HIGH_VALUE_INDUSTRIES.some(i => industry.includes(i))) score += 10;

  const location = (lead.location || '').toLowerCase();
  if (location.includes('london')) score += 10;

  return score;
}

async function main() {
  // Fetch all leads
  const res = await fetch(`${SB_URL}/rest/v1/leads?select=id,business_name,website,has_website,speed_score,seo_score,ssl_secure,google_rating,industry,location`, {
    headers: sbHeaders
  });
  if (!res.ok) { console.error(`Failed to fetch: ${res.status}`); process.exit(1); }
  const leads = await res.json();

  console.log(`Scoring ${leads.length} leads...\n`);

  const scored = leads.map(l => ({ ...l, lead_score: scoreLead(l) })).sort((a, b) => b.lead_score - a.lead_score);

  // Update each lead in Supabase
  let updated = 0;
  for (const lead of scored) {
    const r = await fetch(`${SB_URL}/rest/v1/leads?id=eq.${lead.id}`, {
      method: 'PATCH',
      headers: { ...sbHeaders, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ lead_score: lead.lead_score })
    });
    if (r.ok) updated++;
  }

  // Print ranked list
  console.log('RANK | SCORE | BUSINESS                         | INDUSTRY           | LOCATION');
  console.log('-----|-------|----------------------------------|--------------------|----------');
  scored.forEach((l, i) => {
    console.log(
      `${String(i + 1).padStart(4)} | ${String(l.lead_score).padStart(5)} | ${(l.business_name || '').padEnd(32).substring(0, 32)} | ${(l.industry || '-').padEnd(18).substring(0, 18)} | ${l.location || '-'}`
    );
  });

  console.log(`\nUpdated ${updated}/${leads.length} leads. Top 10 leads for outreach:`);
  scored.slice(0, 10).forEach((l, i) => {
    console.log(`  ${i + 1}. [${l.lead_score}pts] ${l.business_name} — ${l.industry || 'Unknown'} (${l.location || 'Unknown'})`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
