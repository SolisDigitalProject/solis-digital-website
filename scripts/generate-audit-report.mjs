#!/usr/bin/env node
/**
 * Solis Digital — Automated Audit Report Generator
 *
 * Generates a professional HTML audit report for a lead that can be:
 * 1. Sent as an email (via Resend API)
 * 2. Rendered as PDF (via Puppeteer or browser print)
 * 3. Hosted as a shareable link
 *
 * Usage:
 *   node scripts/generate-audit-report.mjs --email "client@example.com"
 *   node scripts/generate-audit-report.mjs --lead-id "uuid"
 *   node scripts/generate-audit-report.mjs --email "client@example.com" --send
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_KEY — via config.mjs
 *   RESEND_API_KEY — for sending (optional, only with --send flag)
 */

import { SB_REST as SB_URL, sbHeaders as HEADERS } from './config.mjs';

const RESEND_KEY = process.env.RESEND_API_KEY;

async function query(endpoint) {
  const res = await fetch(`${SB_URL}${endpoint}`, { headers: HEADERS });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

function scoreColor(score) {
  if (score == null) return '#999';
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#f59e0b';
  return '#dc2626';
}

function scoreLabel(score) {
  if (score == null) return 'N/A';
  if (score >= 70) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Critical';
}

function scoreGrade(score) {
  if (score == null) return '—';
  if (score >= 90) return 'A';
  if (score >= 70) return 'B';
  if (score >= 50) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

function buildRecommendations(lead) {
  const recs = [];

  if (lead.speed_score != null && lead.speed_score < 70) {
    recs.push({
      priority: lead.speed_score < 40 ? 'Critical' : 'High',
      title: 'Improve Page Speed',
      description: `Your site loads with a speed score of ${lead.speed_score}/100. Google research shows 53% of visitors leave if a page takes more than 3 seconds to load. This is directly costing you customers.`,
      fix: 'Optimise images, enable browser caching, minimise CSS/JavaScript, upgrade hosting.',
      impact: 'Could increase enquiries by 20-40% based on reduced bounce rate.'
    });
  }

  if (lead.seo_score != null && lead.seo_score < 70) {
    recs.push({
      priority: lead.seo_score < 40 ? 'Critical' : 'High',
      title: 'Fix SEO Issues',
      description: `Your SEO score is ${lead.seo_score}/100. This means Google can't properly index and rank your website. Your competitors who score higher are appearing above you in search results.`,
      fix: 'Add meta descriptions, fix heading structure, add schema markup, create a sitemap, fix broken links.',
      impact: 'Proper SEO typically leads to 3-5x more organic traffic within 90 days.'
    });
  }

  if (lead.mobile_score != null && lead.mobile_score < 70) {
    recs.push({
      priority: lead.mobile_score < 40 ? 'Critical' : 'High',
      title: 'Fix Mobile Experience',
      description: `Your mobile score is ${lead.mobile_score}/100. Over 60% of local searches happen on mobile devices. If your site doesn't work well on phones, you're losing the majority of potential customers.`,
      fix: 'Implement responsive design, optimise touch targets, ensure readable font sizes, fix viewport configuration.',
      impact: 'Mobile-optimised sites see 67% higher conversion rates on average.'
    });
  }

  if (lead.ssl_secure === false) {
    recs.push({
      priority: 'Critical',
      title: 'Install SSL Certificate',
      description: 'Your website does not have an SSL certificate. Google Chrome displays a "Not Secure" warning to every visitor. This destroys trust instantly.',
      fix: 'Install a free SSL certificate (Let\'s Encrypt) and redirect all HTTP traffic to HTTPS.',
      impact: 'Removes the security warning and provides a small SEO ranking boost.'
    });
  }

  // Always add these general recommendations
  if (recs.length < 3) {
    recs.push({
      priority: 'Medium',
      title: 'Add Local Business Schema',
      description: 'Your website is missing structured data markup. This tells Google exactly what your business does, where you are, and when you\'re open — helping you appear in rich search results and Google Maps.',
      fix: 'Add LocalBusiness schema markup with your business name, address, phone, opening hours, and services.',
      impact: 'Businesses with schema markup see up to 30% more clicks from search results.'
    });
  }

  if (recs.length < 4) {
    recs.push({
      priority: 'Medium',
      title: 'Optimise Google Business Profile',
      description: 'Most local businesses don\'t fully optimise their Google Business Profile. Adding photos, services, posts, and responding to reviews significantly increases visibility in local search.',
      fix: 'Add 10+ photos, list all services with descriptions, post weekly updates, respond to every review.',
      impact: 'Fully optimised profiles get 7x more clicks than incomplete ones.'
    });
  }

  return recs;
}

function estimateRevenueLoss(lead) {
  // Conservative estimate based on industry data
  const industry = (lead.industry || '').toLowerCase();
  let clientValue = 500; // Default annual client value
  let searchVolume = 100; // Default monthly searches

  if (industry.includes('dent')) { clientValue = 1500; searchVolume = 200; }
  else if (industry.includes('aesthet') || industry.includes('beauty') || industry.includes('skin')) { clientValue = 2000; searchVolume = 150; }
  else if (industry.includes('plumb') || industry.includes('electric') || industry.includes('build')) { clientValue = 800; searchVolume = 300; }

  const avgScore = ((lead.speed_score || 50) + (lead.seo_score || 50) + (lead.mobile_score || 50)) / 3;
  const lostPercentage = Math.max(0, (70 - avgScore) / 100); // % of traffic lost due to poor scores
  const lostVisitors = Math.round(searchVolume * lostPercentage);
  const conversionRate = 0.03; // 3% average
  const lostClients = Math.round(lostVisitors * conversionRate);
  const lostRevenue = lostClients * clientValue;

  return { lostVisitors, lostClients, lostRevenue, clientValue };
}

function generateReportHTML(lead) {
  const recs = buildRecommendations(lead);
  const revenue = estimateRevenueLoss(lead);
  const overallScore = Math.round(
    ((lead.speed_score || 0) + (lead.seo_score || 0) + (lead.mobile_score || 0)) / 3
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Website Audit Report — ${lead.business_name || 'Your Business'}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f8f9fa; color:#333; line-height:1.6; }
  .report { max-width:800px; margin:0 auto; background:#fff; }

  .header { background:linear-gradient(135deg,#0a0a0a,#1a1a2e); padding:48px 40px; color:#fff; }
  .header h1 { color:#d4af37; font-size:28px; letter-spacing:2px; margin-bottom:8px; }
  .header .subtitle { color:#999; font-size:14px; }
  .header .business { color:#fff; font-size:22px; margin-top:16px; font-weight:600; }
  .header .website { color:#d4af37; font-size:14px; margin-top:4px; }
  .header .date { color:#666; font-size:12px; margin-top:16px; }

  .scores { display:flex; gap:0; border-bottom:1px solid #eee; }
  .score-card { flex:1; padding:32px 24px; text-align:center; border-right:1px solid #eee; }
  .score-card:last-child { border-right:none; }
  .score-value { font-size:48px; font-weight:800; }
  .score-label { font-size:12px; color:#666; text-transform:uppercase; letter-spacing:1px; margin-top:4px; }
  .score-grade { font-size:14px; font-weight:600; margin-top:8px; padding:4px 12px; border-radius:20px; display:inline-block; }

  .overall { background:#0a0a0a; padding:32px 40px; text-align:center; }
  .overall-score { font-size:64px; font-weight:800; color:#d4af37; }
  .overall-label { color:#999; font-size:14px; text-transform:uppercase; letter-spacing:2px; }
  .overall-verdict { color:#fff; font-size:18px; margin-top:8px; }

  .section { padding:40px; }
  .section h2 { font-size:22px; margin-bottom:24px; padding-bottom:12px; border-bottom:2px solid #d4af37; }

  .revenue-box { background:#fef2f2; border:2px solid #fecaca; border-radius:12px; padding:32px; margin:24px 0; text-align:center; }
  .revenue-amount { font-size:42px; font-weight:800; color:#dc2626; }
  .revenue-label { color:#666; font-size:14px; margin-top:4px; }
  .revenue-detail { color:#999; font-size:13px; margin-top:16px; }

  .rec { background:#f8f9fa; border-radius:8px; padding:24px; margin-bottom:16px; border-left:4px solid; }
  .rec.Critical { border-color:#dc2626; }
  .rec.High { border-color:#f59e0b; }
  .rec.Medium { border-color:#3b82f6; }
  .rec-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
  .rec-title { font-size:18px; font-weight:600; }
  .rec-priority { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; padding:4px 10px; border-radius:20px; }
  .rec-priority.Critical { background:#fecaca; color:#dc2626; }
  .rec-priority.High { background:#fef3c7; color:#92400e; }
  .rec-priority.Medium { background:#dbeafe; color:#1e40af; }
  .rec-desc { color:#555; font-size:14px; margin-bottom:12px; }
  .rec-fix { background:#fff; padding:12px; border-radius:6px; margin-bottom:8px; }
  .rec-fix strong { color:#333; }
  .rec-impact { color:#16a34a; font-size:13px; font-weight:500; }

  .cta { background:linear-gradient(135deg,#0a0a0a,#1a1a2e); padding:48px 40px; text-align:center; }
  .cta h2 { color:#fff; font-size:24px; margin-bottom:8px; border:none; padding:0; }
  .cta p { color:#999; font-size:16px; margin-bottom:24px; }
  .cta-button { display:inline-block; background:#d4af37; color:#0a0a0a; text-decoration:none; padding:16px 40px; border-radius:6px; font-weight:700; font-size:18px; }
  .cta-or { color:#666; margin:16px 0; font-size:14px; }
  .cta-link { color:#d4af37; text-decoration:none; font-size:14px; }

  .footer { padding:24px 40px; background:#f8f9fa; text-align:center; border-top:1px solid #eee; }
  .footer p { color:#999; font-size:12px; }
  .footer a { color:#d4af37; text-decoration:none; }

  @media (max-width:600px) {
    .scores { flex-direction:column; }
    .score-card { border-right:none; border-bottom:1px solid #eee; }
    .header, .section, .cta { padding:24px; }
    .overall-score { font-size:48px; }
    .revenue-amount { font-size:32px; }
  }
  @media print {
    body { background:#fff; }
    .report { box-shadow:none; }
    .cta-button { border:2px solid #d4af37; }
  }
</style>
</head>
<body>
<div class="report">

  <!-- Header -->
  <div class="header">
    <h1>SOLIS DIGITAL</h1>
    <div class="subtitle">Website Performance Audit Report</div>
    <div class="business">${lead.business_name || 'Your Business'}</div>
    <div class="website">${lead.website || ''}</div>
    <div class="date">Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>

  <!-- Overall Score -->
  <div class="overall">
    <div class="overall-label">Overall Score</div>
    <div class="overall-score">${overallScore}/100</div>
    <div class="overall-verdict">${overallScore >= 70 ? 'Good — but room for improvement' : overallScore >= 40 ? 'Below Average — significant opportunities' : 'Critical — your website is actively losing you customers'}</div>
  </div>

  <!-- Individual Scores -->
  <div class="scores">
    <div class="score-card">
      <div class="score-value" style="color:${scoreColor(lead.speed_score)}">${lead.speed_score ?? '—'}</div>
      <div class="score-label">Page Speed</div>
      <div class="score-grade" style="background:${scoreColor(lead.speed_score)}22;color:${scoreColor(lead.speed_score)}">${scoreLabel(lead.speed_score)}</div>
    </div>
    <div class="score-card">
      <div class="score-value" style="color:${scoreColor(lead.seo_score)}">${lead.seo_score ?? '—'}</div>
      <div class="score-label">SEO</div>
      <div class="score-grade" style="background:${scoreColor(lead.seo_score)}22;color:${scoreColor(lead.seo_score)}">${scoreLabel(lead.seo_score)}</div>
    </div>
    <div class="score-card">
      <div class="score-value" style="color:${scoreColor(lead.mobile_score)}">${lead.mobile_score ?? '—'}</div>
      <div class="score-label">Mobile</div>
      <div class="score-grade" style="background:${scoreColor(lead.mobile_score)}22;color:${scoreColor(lead.mobile_score)}">${scoreLabel(lead.mobile_score)}</div>
    </div>
    <div class="score-card">
      <div class="score-value" style="color:${lead.ssl_secure ? '#16a34a' : '#dc2626'}">${lead.ssl_secure ? '✓' : '✗'}</div>
      <div class="score-label">SSL Secure</div>
      <div class="score-grade" style="background:${lead.ssl_secure ? '#16a34a' : '#dc2626'}22;color:${lead.ssl_secure ? '#16a34a' : '#dc2626'}">${lead.ssl_secure ? 'Secure' : 'Not Secure'}</div>
    </div>
  </div>

  <!-- Revenue Impact -->
  <div class="section">
    <h2>Estimated Revenue Impact</h2>
    <div class="revenue-box">
      <div class="revenue-amount">£${revenue.lostRevenue.toLocaleString()}/year</div>
      <div class="revenue-label">Estimated revenue you're leaving on the table</div>
      <div class="revenue-detail">
        Based on ~${revenue.lostVisitors} lost monthly visitors × 3% conversion rate × £${revenue.clientValue} average client value
      </div>
    </div>
    ${lead.audit_summary ? `<p style="color:#555;font-size:14px;font-style:italic;margin-top:16px;">"${lead.audit_summary}"</p>` : ''}
  </div>

  <!-- Recommendations -->
  <div class="section">
    <h2>Recommendations</h2>
    ${recs.map(r => `
    <div class="rec ${r.priority}">
      <div class="rec-header">
        <div class="rec-title">${r.title}</div>
        <span class="rec-priority ${r.priority}">${r.priority}</span>
      </div>
      <div class="rec-desc">${r.description}</div>
      <div class="rec-fix"><strong>Fix:</strong> ${r.fix}</div>
      <div class="rec-impact">📈 ${r.impact}</div>
    </div>
    `).join('')}
  </div>

  <!-- CTA -->
  <div class="cta">
    <h2>Ready to Fix These Issues?</h2>
    <p>Book a free 15-minute call and I'll walk you through exactly what needs to change and the expected results.</p>
    <a href="https://calendly.com/solisdigital-info/solis-digital-free-strategy-call" class="cta-button">Book Your Free Strategy Call</a>
    <div class="cta-or">or</div>
    <a href="https://www.solisdigital.co.uk" class="cta-link">Learn more at solisdigital.co.uk</a>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>Solis Digital — More Clients. More Revenue. All On Autopilot.</p>
    <p><a href="https://www.solisdigital.co.uk">solisdigital.co.uk</a> | alex@solisdigital.co.uk</p>
  </div>

</div>
</body>
</html>`;
}

async function main() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '');
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      flags[key] = val;
    }
  }

  if (!flags.email && !flags['lead-id']) {
    console.log('Usage:');
    console.log('  node scripts/generate-audit-report.mjs --email "client@example.com"');
    console.log('  node scripts/generate-audit-report.mjs --lead-id "uuid"');
    console.log('  node scripts/generate-audit-report.mjs --email "client@example.com" --send');
    console.log('\nFlags:');
    console.log('  --send    Send the report via email (requires RESEND_API_KEY)');
    console.log('  --output  Save HTML to file (e.g. --output report.html)');
    process.exit(0);
  }

  // Fetch lead data
  let lead;
  if (flags['lead-id']) {
    lead = await query(`/leads?id=eq.${flags['lead-id']}&select=*`);
  } else {
    lead = await query(`/leads?email=eq.${encodeURIComponent(flags.email)}&select=*&order=created_at.desc`);
  }

  if (!lead) {
    console.error('Lead not found.');
    process.exit(1);
  }

  console.log(`Generating audit report for: ${lead.business_name || lead.email}`);
  console.log(`  Speed: ${lead.speed_score ?? 'N/A'} | SEO: ${lead.seo_score ?? 'N/A'} | Mobile: ${lead.mobile_score ?? 'N/A'} | SSL: ${lead.ssl_secure ? 'Yes' : 'No'}\n`);

  const html = generateReportHTML(lead);

  // Output to file
  if (flags.output) {
    const { writeFileSync } = await import('fs');
    writeFileSync(flags.output, html);
    console.log(`✅ Report saved to ${flags.output}`);
  }

  // Send via email
  if (flags.send) {
    const toEmail = flags.email || lead.email;
    if (!toEmail) {
      console.error('No email address to send to.');
      process.exit(1);
    }
    if (!RESEND_KEY) {
      console.error('RESEND_API_KEY not set. Cannot send email.');
      process.exit(1);
    }

    console.log(`Sending report to ${toEmail}...`);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Alex — Solis Digital <alex@solisdigital.co.uk>',
        to: [toEmail],
        subject: `Your Website Audit Report — ${lead.business_name || 'Solis Digital'}`,
        html
      })
    });

    if (res.ok) {
      console.log('✅ Report sent!');
    } else {
      console.error(`❌ Send failed: ${res.status} ${await res.text()}`);
    }
  }

  // If no output or send, print to stdout
  if (!flags.output && !flags.send) {
    console.log(html);
  }
}

main().catch(console.error);
