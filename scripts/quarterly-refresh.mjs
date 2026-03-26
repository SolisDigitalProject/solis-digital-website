#!/usr/bin/env node
/**
 * Solis Digital — Quarterly Website Refresh Automation
 *
 * Audits all active client websites, compares against their last known scores,
 * flags degradations, and generates a refresh report with recommendations.
 *
 * Modes:
 *   node scripts/quarterly-refresh.mjs audit    — Audit all active client sites
 *   node scripts/quarterly-refresh.mjs report   — Generate & email refresh reports
 *   node scripts/quarterly-refresh.mjs list     — List recent refresh audits
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_KEY — via config.mjs
 *   PAGESPEED_API_KEY — Google PageSpeed API key
 *   RESEND_API_KEY — for sending reports (optional)
 *   ANTHROPIC_API_KEY — for AI recommendations (optional)
 */

import { SB_REST as SB_URL, PAGESPEED_KEY, sbHeaders as HEADERS } from './config.mjs';

const RESEND_KEY = process.env.RESEND_API_KEY;
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;
const FROM_EMAIL = 'alex@solisdigital.co.uk';

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

async function runPageSpeed(website) {
  let url = website;
  if (!url.startsWith('http')) url = 'https://' + url;
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${PAGESPEED_KEY}&strategy=mobile&category=performance&category=seo&category=accessibility`;
  const res = await fetch(apiUrl);
  if (!res.ok) { console.warn(`  PageSpeed failed for ${website}: ${res.status}`); return null; }
  const data = await res.json();
  const cats = data.lighthouseResult?.categories || {};
  return {
    speed_score: Math.round((cats.performance?.score || 0) * 100),
    seo_score: Math.round((cats.seo?.score || 0) * 100),
    mobile_score: Math.round((cats.accessibility?.score || 0) * 100)
  };
}

async function generateRecommendations(businessName, scores, prevScores) {
  if (!CLAUDE_KEY) return ['Review website performance', 'Check for broken links', 'Update content for freshness'];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `You are a website optimisation expert for Solis Digital. Generate 3-5 specific, actionable recommendations for a quarterly website refresh.

Business: ${businessName}
Current scores: Speed ${scores.speed_score}/100, SEO ${scores.seo_score}/100, Mobile ${scores.mobile_score}/100
Previous scores: Speed ${prevScores?.speed || 'N/A'}, SEO ${prevScores?.seo || 'N/A'}, Mobile ${prevScores?.mobile || 'N/A'}

Output ONLY a JSON array of strings, each being one short recommendation. Example: ["Compress hero images to improve LCP","Add structured data for local SEO"]`
      }]
    })
  });

  if (!res.ok) return ['Review website performance', 'Update content', 'Check mobile experience'];
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  try {
    return JSON.parse(text);
  } catch {
    return text.split('\n').filter(l => l.trim()).slice(0, 5);
  }
}

async function auditClientSites() {
  console.log('Auditing active client websites...\n');

  // Get active projects with websites
  const projects = await query('/projects?select=id,business_name,new_website_url,client_id&status=eq.launched');
  const activeProjects = projects.filter(p => p.new_website_url);

  if (!activeProjects.length) {
    console.log('No launched projects with live URLs found.');
    return;
  }

  console.log(`Found ${activeProjects.length} launched client websites to audit.\n`);

  let audited = 0, degraded = 0;

  for (const project of activeProjects) {
    console.log(`[${audited + 1}/${activeProjects.length}] ${project.business_name} — ${project.new_website_url}`);

    const scores = await runPageSpeed(project.new_website_url);
    if (!scores) { console.log('  Skipped (PageSpeed failed)\n'); continue; }

    console.log(`  Scores: Speed=${scores.speed_score} SEO=${scores.seo_score} Mobile=${scores.mobile_score}`);

    // Get previous audit for comparison
    const prevAudits = await query(`/refresh_audits?project_id=eq.${project.id}&select=speed_score,seo_score,mobile_score&order=created_at.desc&limit=1`);
    const prev = prevAudits[0] || {};

    // Check for degradation
    const issues = [];
    if (prev.speed_score && scores.speed_score < prev.speed_score - 10) {
      issues.push(`Speed dropped from ${prev.speed_score} to ${scores.speed_score}`);
    }
    if (prev.seo_score && scores.seo_score < prev.seo_score - 5) {
      issues.push(`SEO dropped from ${prev.seo_score} to ${scores.seo_score}`);
    }
    if (prev.mobile_score && scores.mobile_score < prev.mobile_score - 5) {
      issues.push(`Mobile dropped from ${prev.mobile_score} to ${scores.mobile_score}`);
    }
    if (scores.speed_score < 50) issues.push('Speed score below 50 — needs attention');
    if (scores.seo_score < 70) issues.push('SEO score below 70 — optimisation needed');
    if (scores.mobile_score < 70) issues.push('Mobile score below 70 — responsive issues');

    if (issues.length) {
      degraded++;
      console.log(`  \u26a0\ufe0f Issues: ${issues.join(', ')}`);
    } else {
      console.log(`  \u2705 All scores healthy`);
    }

    // Generate AI recommendations
    const recommendations = await generateRecommendations(
      project.business_name,
      scores,
      { speed: prev.speed_score, seo: prev.seo_score, mobile: prev.mobile_score }
    );

    // Save refresh audit
    await fetch(`${SB_URL}/refresh_audits`, {
      method: 'POST',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        project_id: project.id,
        client_id: project.client_id,
        website_url: project.new_website_url,
        speed_score: scores.speed_score,
        seo_score: scores.seo_score,
        mobile_score: scores.mobile_score,
        previous_speed: prev.speed_score || null,
        previous_seo: prev.seo_score || null,
        previous_mobile: prev.mobile_score || null,
        issues_found: issues,
        recommendations,
        status: 'pending'
      })
    });

    audited++;
    console.log(`  Saved.\n`);

    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  await logAction({
    action_type: 'quarterly_refresh_audit',
    description: `Audited ${audited} client websites. ${degraded} need attention.`,
    target: 'refresh_audits',
    result: degraded === 0 ? 'success' : 'warning',
    details: { audited, degraded }
  });

  console.log(`\n=== Complete ===`);
  console.log(`Audited: ${audited} | Degraded: ${degraded}`);
}

async function sendRefreshReports() {
  if (!RESEND_KEY) {
    console.log('No RESEND_API_KEY set — would send reports to:');
  }

  const pendingAudits = await query('/refresh_audits?status=eq.pending&select=*&order=created_at.desc');
  if (!pendingAudits.length) { console.log('No pending refresh reports to send.'); return; }

  console.log(`Sending ${pendingAudits.length} refresh reports...\n`);

  for (const audit of pendingAudits) {
    const projects = await query(`/projects?id=eq.${audit.project_id}&select=business_name,client_email`);
    const project = projects[0];
    if (!project?.client_email) {
      console.log(`  Skipping ${audit.website_url} — no client email`);
      continue;
    }

    const issues = audit.issues_found || [];
    const recs = audit.recommendations || [];

    const scoreColor = (s) => s >= 80 ? '#34d399' : s >= 50 ? '#e8a23a' : '#f87171';
    const arrow = (curr, prev) => {
      if (!prev) return '';
      if (curr > prev) return `<span style="color:#34d399">\u25b2 +${curr - prev}</span>`;
      if (curr < prev) return `<span style="color:#f87171">\u25bc ${curr - prev}</span>`;
      return '<span style="color:#999">= same</span>';
    };

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0a0a0a,#1a1a2e);padding:32px;text-align:center;">
    <h1 style="color:#d4af37;margin:0;font-size:20px;">Website Performance Report</h1>
    <p style="color:#999;margin:8px 0 0;font-size:14px;">${project.business_name} — ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
  </div>
  <div style="padding:32px;">
    <div style="display:flex;gap:12px;margin-bottom:24px;text-align:center;">
      <div style="flex:1;background:#f9fafb;padding:16px;border-radius:8px;">
        <p style="color:${scoreColor(audit.speed_score)};font-size:28px;font-weight:700;margin:0;">${audit.speed_score}</p>
        <p style="color:#666;font-size:12px;margin:4px 0 0;">Speed ${arrow(audit.speed_score, audit.previous_speed)}</p>
      </div>
      <div style="flex:1;background:#f9fafb;padding:16px;border-radius:8px;">
        <p style="color:${scoreColor(audit.seo_score)};font-size:28px;font-weight:700;margin:0;">${audit.seo_score}</p>
        <p style="color:#666;font-size:12px;margin:4px 0 0;">SEO ${arrow(audit.seo_score, audit.previous_seo)}</p>
      </div>
      <div style="flex:1;background:#f9fafb;padding:16px;border-radius:8px;">
        <p style="color:${scoreColor(audit.mobile_score)};font-size:28px;font-weight:700;margin:0;">${audit.mobile_score}</p>
        <p style="color:#666;font-size:12px;margin:4px 0 0;">Mobile ${arrow(audit.mobile_score, audit.previous_mobile)}</p>
      </div>
    </div>

    ${issues.length ? `
    <h3 style="color:#333;font-size:16px;margin:0 0 12px;">Issues Found</h3>
    <ul style="padding-left:20px;color:#666;font-size:14px;line-height:1.8;">
      ${issues.map(i => `<li>${i}</li>`).join('')}
    </ul>` : '<p style="color:#34d399;font-weight:700;">All scores are healthy! No issues detected.</p>'}

    ${recs.length ? `
    <h3 style="color:#333;font-size:16px;margin:24px 0 12px;">Recommendations</h3>
    <ol style="padding-left:20px;color:#666;font-size:14px;line-height:1.8;">
      ${recs.map(r => `<li>${r}</li>`).join('')}
    </ol>` : ''}

    <div style="text-align:center;margin:24px 0;">
      <a href="https://calendly.com/solisdigital-info/solis-digital-free-strategy-call" style="display:inline-block;background:#d4af37;color:#0a0a0a;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:700;font-size:14px;">Book a Review Call</a>
    </div>

    <p style="color:#333;font-size:14px;">Best,<br><strong>Alex</strong><br>Solis Digital</p>
  </div>
</div>
</body></html>`;

    if (RESEND_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `Alex — Solis Digital <${FROM_EMAIL}>`,
          to: [project.client_email],
          subject: `${project.business_name} — Website Performance Report`,
          html
        })
      });

      if (emailRes.ok) {
        console.log(`  \u2705 Report sent to ${project.client_email}`);
        await fetch(`${SB_URL}/refresh_audits?id=eq.${audit.id}`, {
          method: 'PATCH',
          headers: { ...HEADERS, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ status: 'sent', report_sent_at: new Date().toISOString() })
        });
      } else {
        console.log(`  \u274c Failed to send to ${project.client_email}: ${emailRes.status}`);
      }
    } else {
      console.log(`  Would send to: ${project.client_email}`);
    }
  }
}

async function listAudits() {
  const audits = await query('/refresh_audits?select=id,website_url,speed_score,seo_score,mobile_score,status,created_at&order=created_at.desc&limit=20');
  if (!audits.length) { console.log('No refresh audits found.'); return; }

  console.log('\nRecent Refresh Audits:\n');
  console.log('URL'.padEnd(35) + 'Speed'.padEnd(8) + 'SEO'.padEnd(8) + 'Mobile'.padEnd(8) + 'Status'.padEnd(12) + 'Date');
  console.log('-'.repeat(90));

  for (const a of audits) {
    console.log(
      `${(a.website_url || '').substring(0, 33).padEnd(35)}${String(a.speed_score || '-').padEnd(8)}${String(a.seo_score || '-').padEnd(8)}${String(a.mobile_score || '-').padEnd(8)}${(a.status || '').padEnd(12)}${new Date(a.created_at).toLocaleDateString('en-GB')}`
    );
  }
}

// ── CLI ──
const mode = process.argv[2] || 'audit';
switch (mode) {
  case 'audit': auditClientSites().catch(console.error); break;
  case 'report': sendRefreshReports().catch(console.error); break;
  case 'list': listAudits().catch(console.error); break;
  default: console.log('Usage: node scripts/quarterly-refresh.mjs <audit|report|list>');
}
