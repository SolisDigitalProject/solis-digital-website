#!/usr/bin/env node
/**
 * Solis Digital — Lead Export Tool
 * Exports audited leads with emails as CSV for Instantly.ai import.
 *
 * Usage: node scripts/export-leads.mjs > leads-instantly.csv
 */

const SB_URL = 'https://zqcpktpnfikmshqeqxlg.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY3BrdHBuZmlrbXNocWVxeGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg5MDIsImV4cCI6MjA4ODkyNDkwMn0.whtTwOyOihSqhjPPj8YMEV-T4-m_-jYTWJ2m6LtUYKE';

function escapeCSV(val) {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function extractFirstName(email) {
  if (!email) return '';
  const local = email.split('@')[0];
  // Try common patterns: first.last, first_last, firstlast
  const name = local.split(/[._-]/)[0];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

async function main() {
  const url = `${SB_URL}/rest/v1/leads?status=eq.Audited&email=not.is.null&select=email,business_name,website,industry,speed_score,seo_score,audit_summary`;
  const res = await fetch(url, {
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
  });
  if (!res.ok) { console.error(`Failed to fetch leads: ${res.status}`); process.exit(1); }

  const leads = await res.json();
  if (!leads.length) { console.error('No audited leads with emails found.'); process.exit(0); }

  // Instantly.ai CSV columns
  const header = 'email,first_name,company_name,website,industry,speed_score,seo_score,email_body';
  console.log(header);

  for (const lead of leads) {
    const row = [
      lead.email,
      extractFirstName(lead.email),
      lead.business_name,
      lead.website,
      lead.industry,
      lead.speed_score,
      lead.seo_score,
      lead.audit_summary
    ].map(escapeCSV).join(',');
    console.log(row);
  }

  console.error(`\nExported ${leads.length} leads to CSV.`);
}

main().catch(err => { console.error(err); process.exit(1); });
