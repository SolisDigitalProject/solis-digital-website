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
 *   Has email:                +10
 *   Has phone:                +5
 *   High-value industry:      +10
 *   Target city:              +10
 *   Low review count (<20):   +5
 */

import { SB_URL, SB_KEY, sbHeaders } from './config.mjs';

// High-value industries — businesses that benefit most from a quality website
const HIGH_VALUE_INDUSTRIES = [
  // Healthcare & dental
  'dentist', 'dental', 'cosmetic dentist', 'orthodontist', 'pediatric dentist',
  'doctor', 'clinic', 'physiotherapist', 'chiropractor', 'optician', 'veterinary', 'vet',
  // Professional services
  'estate agent', 'letting agent', 'solicitor', 'law firm', 'lawyer', 'accountant', 'financial adviser',
  'mortgage broker', 'insurance broker', 'recruitment', 'consultant',
  // Beauty & wellness
  'salon', 'hair salon', 'barber', 'beauty', 'spa', 'nail', 'aesthetics', 'tattoo',
  'massage', 'gym', 'fitness', 'yoga', 'pilates', 'personal trainer',
  // Trades & home services
  'plumber', 'electrician', 'builder', 'roofing', 'landscaping', 'cleaning',
  'locksmith', 'pest control', 'garage', 'mechanic', 'handyman', 'painter',
  // Food & hospitality
  'restaurant', 'café', 'cafe', 'pub', 'bar', 'takeaway', 'catering', 'bakery', 'hotel',
  // Retail & ecommerce
  'florist', 'jeweller', 'boutique', 'shop', 'store', 'pet shop',
  // Education & childcare
  'nursery', 'tutor', 'driving school', 'dance school', 'music school',
  // Other profitable niches
  'photographer', 'videographer', 'wedding', 'event planner', 'funeral director',
  'car dealer', 'travel agent', 'removals', 'storage', 'print shop'
];

// Target cities — areas we actively scrape and prioritise
const TARGET_CITIES = [
  'london', 'nottingham', 'birmingham', 'manchester', 'leeds', 'liverpool',
  'sheffield', 'bristol', 'leicester', 'coventry', 'derby', 'cardiff',
  'newcastle', 'sunderland', 'brighton', 'reading', 'oxford', 'cambridge',
  'southampton', 'portsmouth', 'wolverhampton', 'stoke', 'croydon', 'bromley',
  'peckham', 'camberwell', 'nunhead', 'dulwich', 'lewisham', 'greenwich'
];

function scoreLead(lead) {
  let score = 0;

  // Website quality signals (higher = worse site = better prospect)
  if (!lead.has_website || !lead.website) score += 30;
  if (lead.speed_score != null && lead.speed_score < 50) score += 20;
  if (lead.ssl_secure === false) score += 15;
  if (lead.google_rating != null && lead.google_rating < 4.0) score += 15;

  // Contact availability (more contact info = easier to reach)
  if (lead.email) score += 10;
  if (lead.phone) score += 5;

  // Industry match
  const industry = (lead.industry || '').toLowerCase();
  if (HIGH_VALUE_INDUSTRIES.some(i => industry.includes(i))) score += 10;

  // Location match
  const location = (lead.location || '').toLowerCase();
  if (TARGET_CITIES.some(c => location.includes(c))) score += 10;

  // Low online presence = needs help
  if (lead.review_count != null && lead.review_count < 20) score += 5;

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
