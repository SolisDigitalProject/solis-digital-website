#!/usr/bin/env node
/**
 * Solis Digital — Google Reviews Automation
 *
 * Sends automated review request emails to a client's customers after
 * appointments/visits. Each email contains a direct link to their Google
 * Business Profile review page.
 *
 * Modes:
 *   node scripts/review-automation.mjs send --project <id>  — Send pending review requests
 *   node scripts/review-automation.mjs request --project <id> --name "John" --email "john@example.com"  — Queue a review request
 *   node scripts/review-automation.mjs stats --project <id>  — Show review request stats
 *   node scripts/review-automation.mjs setup --project <id> --url "https://g.page/r/..."  — Set Google review URL
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_KEY — via config.mjs
 *   RESEND_API_KEY — for sending review request emails
 */

import { SB_REST as SB_URL, sbHeaders as HEADERS } from './config.mjs';

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'reviews@solisdigital.co.uk';

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

function buildReviewEmail(customerName, businessName, googleReviewUrl, widgetColor = '#e8a23a') {
  const firstName = customerName ? customerName.split(' ')[0] : 'there';
  return {
    subject: `How was your visit to ${businessName}?`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:500px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0a0a0a,#1a1a2e);padding:32px;text-align:center;">
    <div style="font-size:48px;margin-bottom:8px;">⭐</div>
    <h1 style="color:${widgetColor};margin:0;font-size:20px;">How was your experience?</h1>
    <p style="color:#999;margin:8px 0 0;font-size:14px;">${businessName}</p>
  </div>
  <div style="padding:32px;text-align:center;">
    <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px;">
      Hi ${firstName},<br><br>
      Thank you for visiting <strong>${businessName}</strong>! We'd love to hear about your experience.
    </p>
    <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 24px;">
      Your feedback helps other people discover us and helps us keep improving. It only takes 30 seconds.
    </p>
    <a href="${googleReviewUrl}" target="_blank" style="display:inline-block;background:${widgetColor};color:#0a0a0a;text-decoration:none;padding:16px 40px;border-radius:8px;font-weight:700;font-size:16px;">
      Leave a Review ⭐
    </a>
    <p style="color:#999;font-size:12px;margin:24px 0 0;">
      Thank you for your support — it means the world to us.
    </p>
  </div>
</div>
</body></html>`
  };
}

async function sendEmail(to, subject, html) {
  if (!RESEND_KEY) {
    console.log(`  [email] Would send to ${to}: "${subject}" (no RESEND_API_KEY)`);
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `Reviews <${FROM_EMAIL}>`, to: [to], subject, html })
  });
  return res.ok;
}

// ── COMMANDS ──

async function setupGoogleUrl(projectId, googleUrl) {
  // Store the Google review URL in the project
  const res = await fetch(`${SB_URL}/projects?id=eq.${projectId}`, {
    method: 'PATCH',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      add_ons: { google_review_url: googleUrl },
      addon_reviews_status: 'active'
    })
  });
  if (res.ok) {
    console.log(`\u2705 Google review URL saved for project ${projectId}`);
    console.log(`   URL: ${googleUrl}`);
  } else {
    console.error(`Failed to save: ${res.status}`);
  }
}

async function queueReviewRequest(projectId, customerName, customerEmail) {
  // Get project details for the Google review URL
  const projects = await query(`/projects?id=eq.${projectId}&select=business_name,add_ons`);
  if (!projects.length) { console.error('Project not found'); return; }

  const project = projects[0];
  const googleUrl = project.add_ons?.google_review_url;
  if (!googleUrl) {
    console.error('No Google review URL set. Run: node scripts/review-automation.mjs setup --project <id> --url "https://g.page/r/..."');
    return;
  }

  const res = await fetch(`${SB_URL}/review_requests`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify({
      project_id: projectId,
      customer_name: customerName,
      customer_email: customerEmail,
      google_review_url: googleUrl,
      status: 'pending'
    })
  });

  if (res.ok) {
    console.log(`\u2705 Review request queued for ${customerName} (${customerEmail})`);
  } else {
    console.error(`Failed: ${res.status}`);
  }
}

async function sendPendingRequests(projectId) {
  const filter = projectId ? `&project_id=eq.${projectId}` : '';
  const requests = await query(`/review_requests?status=eq.pending${filter}&select=*`);

  if (!requests.length) {
    console.log('No pending review requests to send.');
    return;
  }

  console.log(`Sending ${requests.length} review request(s)...\n`);

  // Get project details for business name
  const projectIds = [...new Set((requests || []).map(r => r.project_id).filter(Boolean))];
  const projectsData = {};
  for (const pid of projectIds) {
    const p = await query(`/projects?id=eq.${pid}&select=business_name,add_ons`);
    if (p.length) projectsData[pid] = p[0];
  }

  let sent = 0, failed = 0;

  for (const req of requests) {
    const project = projectsData[req.project_id] || {};
    const businessName = project.business_name || 'our business';
    const widgetColor = '#e8a23a';

    const { subject, html } = buildReviewEmail(
      req.customer_name,
      businessName,
      req.google_review_url,
      widgetColor
    );

    const ok = await sendEmail(req.customer_email, subject, html);

    if (ok) {
      sent++;
      console.log(`  \u2705 Sent to ${req.customer_name} (${req.customer_email})`);

      await fetch(`${SB_URL}/review_requests?id=eq.${req.id}`, {
        method: 'PATCH',
        headers: { ...HEADERS, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'sent', sent_at: new Date().toISOString() })
      });
    } else {
      failed++;
      console.log(`  \u274c Failed for ${req.customer_email}`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  await logAction({
    action_type: 'review_requests_sent',
    description: `Sent ${sent} review request emails (${failed} failed)`,
    target: 'review_requests',
    result: failed === 0 ? 'success' : 'partial',
    details: { sent, failed, project_id: projectId }
  });

  console.log(`\n\u2705 Sent: ${sent} | Failed: ${failed}`);
}

async function showStats(projectId) {
  const filter = projectId ? `&project_id=eq.${projectId}` : '';
  const requests = await query(`/review_requests?select=status${filter}`);

  const stats = { pending: 0, sent: 0, opened: 0, reviewed: 0, expired: 0 };
  (requests || []).forEach(r => { stats[r.status] = (stats[r.status] || 0) + 1; });

  console.log('\n\u2b50 Review Automation Stats\n');
  console.log(`  Pending:  ${stats.pending}`);
  console.log(`  Sent:     ${stats.sent}`);
  console.log(`  Opened:   ${stats.opened}`);
  console.log(`  Reviewed: ${stats.reviewed}`);
  console.log(`  Expired:  ${stats.expired}`);
  console.log(`  Total:    ${requests.length}`);

  const convRate = requests.length > 0 ? Math.round(stats.reviewed / requests.length * 100) : 0;
  console.log(`\n  Conversion rate: ${convRate}%`);
}

// ── CLI ──
const args = process.argv.slice(2);
const mode = args[0] || 'send';
const flags = {};
for (let i = 1; i < args.length; i += 2) {
  const key = args[i]?.replace(/^--/, '');
  const val = args[i + 1];
  if (key && val) flags[key] = val;
}

switch (mode) {
  case 'setup':
    if (!flags.project || !flags.url) { console.error('Usage: --project <id> --url "https://g.page/r/..."'); process.exit(1); }
    setupGoogleUrl(Number(flags.project), flags.url).catch(console.error);
    break;
  case 'request':
    if (!flags.project || !flags.email) { console.error('Usage: --project <id> --name "John" --email "john@example.com"'); process.exit(1); }
    queueReviewRequest(Number(flags.project), flags.name || '', flags.email).catch(console.error);
    break;
  case 'send':
    sendPendingRequests(flags.project ? Number(flags.project) : null).catch(console.error);
    break;
  case 'stats':
    showStats(flags.project ? Number(flags.project) : null).catch(console.error);
    break;
  default:
    console.log('Usage: node scripts/review-automation.mjs <send|request|stats|setup> [--project <id>]');
}
