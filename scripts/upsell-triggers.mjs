#!/usr/bin/env node
/**
 * Solis Digital — Automated Upsell Trigger System
 *
 * Checks active clients at 30/60/90 day milestones and triggers
 * upsell opportunities via email and Slack notifications.
 *
 * Run daily at 9am via Make.com/Zypflow scheduled scenario.
 *
 * Usage:
 *   node scripts/upsell-triggers.mjs
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_KEY — via config.mjs
 *   RESEND_API_KEY — for sending upsell emails (optional)
 *   SLACK_WEBHOOK_URL — for Slack notifications (optional)
 */

import { SB_REST as SB_URL, sbHeaders as HEADERS } from './config.mjs';
import { notify } from './notify.mjs';

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'alex@solisdigital.co.uk';

async function query(endpoint) {
  const res = await fetch(`${SB_URL}${endpoint}`, { headers: HEADERS });
  if (!res.ok) { console.error(`Query failed: ${endpoint}`); return []; }
  return res.json();
}

async function logAction(action) {
  await fetch(`${SB_URL}/admin_actions`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(action)
  });
}

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function getUpsellTarget(currentPackage) {
  if (currentPackage === 'Starter') return 'Growth';
  if (currentPackage === 'Growth') return 'Accelerator';
  return null;
}

const UPGRADE_LINKS = {
  Growth: 'https://buy.stripe.com/9B600iftuc4X9hcdbs2880c',
  Accelerator: 'https://buy.stripe.com/bJeaEW4OQ5GzeBw9Zg2880e'
};

function build30DayEmail(client, lead) {
  const pkg = client.package || 'Starter';
  const target = getUpsellTarget(pkg);
  if (!target) return null;

  const speedImproved = lead?.speed_score ? lead.speed_score > 50 : false;
  const hasTraffic = true; // Assume after 30 days

  return {
    subject: `Your 30-day results — ${client.business_name || 'Performance Update'}`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0a0a0a,#1a1a2e);padding:32px;text-align:center;">
    <h1 style="color:#d4af37;margin:0;font-size:22px;">Your 30-Day Performance Report</h1>
    <p style="color:#999;margin:8px 0 0;font-size:14px;">${client.business_name || 'Your Business'}</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:16px;line-height:1.6;">
      It's been 30 days since we launched your new website. Here's how things are looking:
    </p>

    ${lead ? `
    <div style="display:flex;gap:16px;margin:24px 0;text-align:center;">
      <div style="flex:1;background:#f0fdf4;padding:16px;border-radius:8px;">
        <p style="color:#16a34a;font-size:28px;font-weight:700;margin:0;">${lead.speed_score || '—'}</p>
        <p style="color:#666;font-size:12px;margin:4px 0 0;">Speed Score</p>
      </div>
      <div style="flex:1;background:#eff6ff;padding:16px;border-radius:8px;">
        <p style="color:#2563eb;font-size:28px;font-weight:700;margin:0;">${lead.seo_score || '—'}</p>
        <p style="color:#666;font-size:12px;margin:4px 0 0;">SEO Score</p>
      </div>
      <div style="flex:1;background:#faf5ff;padding:16px;border-radius:8px;">
        <p style="color:#7c3aed;font-size:28px;font-weight:700;margin:0;">${lead.mobile_score || '—'}</p>
        <p style="color:#666;font-size:12px;margin:4px 0 0;">Mobile Score</p>
      </div>
    </div>
    ` : ''}

    <p style="color:#333;font-size:16px;line-height:1.6;">
      Your website is performing well, but there's more we can do to turn visitors into paying customers.
    </p>

    ${pkg === 'Starter' ? `
    <div style="background:#fefce8;border-left:4px solid #d4af37;padding:16px;margin:24px 0;border-radius:0 8px 8px 0;">
      <h3 style="margin:0 0 8px;color:#92400e;font-size:16px;">What You're Missing</h3>
      <ul style="margin:0;padding-left:20px;color:#333;font-size:14px;line-height:1.8;">
        <li><strong>AI Chatbot</strong> — Visitors are leaving without asking questions. A chatbot captures them 24/7.</li>
        <li><strong>Review Automation</strong> — Your competitors have 50+ Google reviews. Automated review requests fix this.</li>
        <li><strong>Advanced SEO</strong> — You're on page 2 for key terms. Monthly SEO work pushes you to page 1.</li>
      </ul>
      <p style="margin:16px 0 0;font-size:14px;color:#666;">
        Upgrading to <strong>Growth</strong> adds all of this for just £200/month more.
      </p>
    </div>
    ` : `
    <div style="background:#fefce8;border-left:4px solid #d4af37;padding:16px;margin:24px 0;border-radius:0 8px 8px 0;">
      <h3 style="margin:0 0 8px;color:#92400e;font-size:16px;">Next Level Opportunity</h3>
      <ul style="margin:0;padding-left:20px;color:#333;font-size:14px;line-height:1.8;">
        <li><strong>Google Ads</strong> — Your competitors are running ads and capturing paid traffic you're missing.</li>
        <li><strong>Social Media</strong> — 4 posts/week keeps you visible between searches.</li>
        <li><strong>Monthly SEO Campaigns</strong> — Ongoing link building and content to maintain page 1 rankings.</li>
      </ul>
      <p style="margin:16px 0 0;font-size:14px;color:#666;">
        Upgrading to <strong>Accelerator</strong> adds all of this — including £500/month ad budget.
      </p>
    </div>
    `}

    <div style="text-align:center;margin:24px 0;">
      <a href="${UPGRADE_LINKS[target] || '#'}" style="display:inline-block;background:#d4af37;color:#0a0a0a;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:700;font-size:16px;">Upgrade to ${target}</a>
    </div>

    <p style="color:#666;font-size:14px;line-height:1.6;">
      Or <a href="https://calendly.com/solisdigital-info/solis-digital-free-strategy-call" style="color:#d4af37;">book a call</a> to discuss your options.
    </p>

    <p style="color:#333;font-size:16px;line-height:1.6;">Best,<br/><strong>Alex</strong><br/>Solis Digital</p>
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
    body: JSON.stringify({
      from: `Alex — Solis Digital <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html
    })
  });

  if (res.ok) {
    console.log(`  ✅ Email sent to ${to}`);
    return true;
  } else {
    console.error(`  ❌ Email failed for ${to}: ${res.status}`);
    return false;
  }
}

async function checkUpsellTriggers() {
  console.log('Checking upsell triggers...\n');

  // Get all active clients with their start dates
  const clients = await query('/clients?select=*&status=eq.Active');
  if (!clients.length) {
    console.log('No active clients found.');
    return;
  }

  console.log(`Found ${clients.length} active clients.\n`);

  let triggers = 0;

  for (const client of clients) {
    const days = daysSince(client.start_date || client.created_at);
    const email = client.email || client.contact_email;
    const pkg = client.package || client.plan || 'Starter';
    const target = getUpsellTarget(pkg);
    const name = client.business_name || client.name || 'Client';

    // Skip if no upgrade path (already on Accelerator)
    if (!target) continue;

    // Get latest audit scores for this client
    const lead = await query(`/leads?business_name=eq.${encodeURIComponent(name)}&select=speed_score,seo_score,mobile_score&limit=1`);
    const leadData = Array.isArray(lead) ? lead[0] : lead;

    // 30-day milestone
    if (days >= 28 && days <= 32) {
      console.log(`📧 30-day trigger: ${name} (${pkg} → ${target})`);
      triggers++;

      if (email) {
        const emailData = build30DayEmail(client, leadData);
        if (emailData) await sendEmail(email, emailData.subject, emailData.html);
      }

      await notify('upsell_trigger', {
        name,
        current_package: pkg,
        target_package: target,
        reason: `30-day milestone reached. Client has been on ${pkg} for ${days} days.`
      });

      await logAction({
        action_type: 'upsell_trigger',
        description: `30-day upsell trigger for ${name}: ${pkg} → ${target}`,
        target: 'clients',
        result: 'triggered',
        details: { client_id: client.id, days, current: pkg, target }
      });
    }

    // 60-day milestone (reminder if didn't upgrade at 30)
    if (days >= 58 && days <= 62) {
      console.log(`📧 60-day trigger: ${name} (${pkg} → ${target})`);
      triggers++;

      await notify('upsell_trigger', {
        name,
        current_package: pkg,
        target_package: target,
        reason: `60-day milestone. Still on ${pkg}. Schedule a check-in call.`
      });

      await logAction({
        action_type: 'upsell_trigger',
        description: `60-day upsell trigger for ${name}: ${pkg} → ${target}`,
        target: 'clients',
        result: 'triggered',
        details: { client_id: client.id, days, current: pkg, target }
      });
    }

    // 90-day milestone (quarterly review for Growth → Accelerator)
    if (days >= 88 && days <= 92 && pkg === 'Growth') {
      console.log(`📧 90-day trigger: ${name} (Growth → Accelerator)`);
      triggers++;

      await notify('upsell_trigger', {
        name,
        current_package: 'Growth',
        target_package: 'Accelerator',
        reason: `90-day quarterly review due. Client ready for ads + social media expansion.`
      });

      await logAction({
        action_type: 'upsell_trigger',
        description: `90-day quarterly review trigger for ${name}: Growth → Accelerator`,
        target: 'clients',
        result: 'triggered',
        details: { client_id: client.id, days, current: pkg, target: 'Accelerator' }
      });
    }
  }

  console.log(`\n✅ Checked ${clients.length} clients. ${triggers} upsell trigger(s) fired.`);
}

checkUpsellTriggers().catch(console.error);
