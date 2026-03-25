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

// Add-ons to suggest at different milestones
const ADDON_SUGGESTIONS = {
  30: {  // 30-day: suggest chatbot + reviews for Starter clients
    Starter: [
      { name: 'AI Chatbot', price: '£197 + £47/mo', link: 'https://buy.stripe.com/4gMfZg6WY1qj50W0oG2880g', pitch: 'Capture leads 24/7 — even while you sleep' },
      { name: 'Google Reviews Automation', price: '£97 + £27/mo', link: 'https://buy.stripe.com/4gM14m3KM3yr1OKfjA2880i', pitch: 'Your competitors have 50+ reviews — automate yours' }
    ],
    Growth: [
      { name: 'Landing Page', price: '£297 one-off', link: 'https://buy.stripe.com/eVqaEWa9ad91alggnE2880n', pitch: 'Convert more paid traffic with a dedicated landing page' },
      { name: 'SEO Blog Post', price: '£147 one-off', link: 'https://buy.stripe.com/fZu5kCftu9WPdxs1sK2880l', pitch: 'Rank for more keywords with optimised content' }
    ]
  },
  60: {  // 60-day: suggest content + ads
    Starter: [
      { name: 'Google Ads Setup', price: '£297 one-off', link: 'https://buy.stripe.com/dRmfZg9565Gz7949Zg2880q', pitch: 'Start getting leads from Google Ads today' },
      { name: 'Logo & Brand Kit', price: '£497 one-off', link: 'https://buy.stripe.com/7sYdR85SU8SL1OK4EW2880o', pitch: 'Professional branding builds trust and recognition' }
    ],
    Growth: [
      { name: 'Video Editing', price: '£97 one-off', link: 'https://buy.stripe.com/cNi28q0yA2unalg1sK2880p', pitch: 'Social clips get 3x more engagement than static posts' },
      { name: 'Quarterly Website Refresh', price: '£297 one-off', link: 'https://buy.stripe.com/fZu5kC6WY2un9hc7R82880r', pitch: 'Keep your site fresh and performing' }
    ]
  },
  90: {  // 90-day: suggest premium add-ons
    Growth: [
      { name: 'Extra Pages (x3)', price: '£97 each', link: 'https://buy.stripe.com/5kQeVc5SUc4X1OKc7o2880k', pitch: 'Expand your service pages to rank for more terms' },
      { name: 'Email Template Design', price: '£197 one-off', link: 'https://buy.stripe.com/eVq4gy4OQ7OH1OK8Vc2880m', pitch: 'Professional email campaigns to re-engage past customers' }
    ]
  }
};

function buildAddonSuggestionsHTML(milestone, pkg) {
  const suggestions = ADDON_SUGGESTIONS[milestone]?.[pkg];
  if (!suggestions || suggestions.length === 0) return '';

  const rows = suggestions.map(s => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;">
        <strong style="color:#333;font-size:14px;">${s.name}</strong><br/>
        <span style="color:#666;font-size:12px;">${s.pitch}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;white-space:nowrap;">${s.price}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">
        <a href="${s.link}" style="display:inline-block;background:#d4af37;color:#0a0a0a;text-decoration:none;padding:8px 16px;border-radius:4px;font-weight:600;font-size:13px;">Add</a>
      </td>
    </tr>`).join('');

  return `
    <div style="margin:24px 0;padding:16px;background:#faf5ff;border-radius:8px;">
      <h3 style="margin:0 0 12px;color:#333;font-size:15px;">Or boost your results with an add-on:</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>${rows}
        </tbody>
      </table>
    </div>`;
}

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

    ${buildAddonSuggestionsHTML(30, pkg)}

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

    // 60-day milestone (reminder if didn't upgrade at 30 + add-on suggestions)
    if (days >= 58 && days <= 62) {
      console.log(`📧 60-day trigger: ${name} (${pkg} → ${target})`);
      triggers++;

      const addons60 = ADDON_SUGGESTIONS[60]?.[pkg] || [];
      const addonNames = addons60.map(a => a.name).join(', ');

      await notify('upsell_trigger', {
        name,
        current_package: pkg,
        target_package: target,
        reason: `60-day milestone. Still on ${pkg}. Suggested add-ons: ${addonNames || 'none'}. Schedule a check-in call.`
      });

      // Send 60-day email with add-on suggestions
      if (email) {
        const addonHTML = buildAddonSuggestionsHTML(60, pkg);
        const html60 = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0a0a0a,#1a1a2e);padding:32px;text-align:center;">
    <h1 style="color:#d4af37;margin:0;font-size:22px;">Your 60-Day Check-In</h1>
    <p style="color:#999;margin:8px 0 0;font-size:14px;">${name}</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:16px;line-height:1.6;">It's been 60 days since your website launched. How are things going?</p>
    <p style="color:#333;font-size:16px;line-height:1.6;">I'd love to jump on a quick 10-minute call to review your results and discuss what's working — and what we can improve.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://calendly.com/solisdigital-info/solis-digital-free-strategy-call" style="display:inline-block;background:#d4af37;color:#0a0a0a;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:700;font-size:16px;">Book a Check-In Call</a>
    </div>
    ${addonHTML}
    <p style="color:#333;font-size:16px;line-height:1.6;">Best,<br/><strong>Alex</strong><br/>Solis Digital</p>
  </div>
</div></body></html>`;
        await sendEmail(email, `60-day check-in — ${name}`, html60);
      }

      await logAction({
        action_type: 'upsell_trigger',
        description: `60-day upsell trigger for ${name}: ${pkg} → ${target}`,
        target: 'clients',
        result: 'triggered',
        details: { client_id: client.id, days, current: pkg, target, suggested_addons: addonNames }
      });
    }

    // 90-day milestone (quarterly review for Growth → Accelerator + premium add-ons)
    if (days >= 88 && days <= 92 && pkg === 'Growth') {
      console.log(`📧 90-day trigger: ${name} (Growth → Accelerator)`);
      triggers++;

      const addons90 = ADDON_SUGGESTIONS[90]?.['Growth'] || [];
      const addonNames90 = addons90.map(a => a.name).join(', ');

      await notify('upsell_trigger', {
        name,
        current_package: 'Growth',
        target_package: 'Accelerator',
        reason: `90-day quarterly review due. Suggested add-ons: ${addonNames90 || 'none'}. Client ready for ads + social media expansion.`
      });

      // Send 90-day email with upgrade + add-on suggestions
      if (email) {
        const addonHTML = buildAddonSuggestionsHTML(90, 'Growth');
        const html90 = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#0a0a0a,#1a1a2e);padding:32px;text-align:center;">
    <h1 style="color:#d4af37;margin:0;font-size:22px;">Your Quarterly Review</h1>
    <p style="color:#999;margin:8px 0 0;font-size:14px;">${name} — 90 Days In</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#333;font-size:16px;line-height:1.6;">It's been 3 months since we launched your website. Your Growth package has been doing the heavy lifting — now it's time to think bigger.</p>
    <p style="color:#333;font-size:16px;line-height:1.6;">With the <strong>Accelerator</strong> package, we add Google Ads, social media management, and monthly SEO campaigns — everything you need to dominate your local area.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${UPGRADE_LINKS['Accelerator']}" style="display:inline-block;background:#d4af37;color:#0a0a0a;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:700;font-size:16px;">Upgrade to Accelerator</a>
    </div>
    ${addonHTML}
    <p style="color:#666;font-size:14px;line-height:1.6;">Or <a href="https://calendly.com/solisdigital-info/solis-digital-free-strategy-call" style="color:#d4af37;">book a quarterly review call</a> to discuss your growth plan.</p>
    <p style="color:#333;font-size:16px;line-height:1.6;">Best,<br/><strong>Alex</strong><br/>Solis Digital</p>
  </div>
</div></body></html>`;
        await sendEmail(email, `Quarterly review — ${name}`, html90);
      }

      await logAction({
        action_type: 'upsell_trigger',
        description: `90-day quarterly review trigger for ${name}: Growth → Accelerator`,
        target: 'clients',
        result: 'triggered',
        details: { client_id: client.id, days, current: pkg, target: 'Accelerator', suggested_addons: addonNames90 }
      });
    }
  }

  console.log(`\n✅ Checked ${clients.length} clients. ${triggers} upsell trigger(s) fired.`);
}

checkUpsellTriggers().catch(console.error);
