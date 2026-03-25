#!/usr/bin/env node
/**
 * Solis Digital — Automated Proposal Generator
 *
 * Generates and sends a personalised proposal email after a discovery call.
 * Pulls audit data from Supabase and sends via Resend API.
 *
 * Usage:
 *   node scripts/send-proposal.mjs --email "client@example.com" --package "Growth"
 *   node scripts/send-proposal.mjs --lead-id "uuid" --package "Starter"
 *   node scripts/send-proposal.mjs --email "client@example.com" --package "Growth" --addons "chatbot,reviews"
 *   node scripts/send-proposal.mjs --email "client@example.com" --package "Starter" --addons "landing_page,logo"
 *
 * Required env vars:
 *   RESEND_API_KEY — Resend transactional email API key
 *   SUPABASE_URL, SUPABASE_KEY — via config.mjs
 */

import { SB_REST as SB_URL, sbHeaders as HEADERS } from './config.mjs';

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'alex@solisdigital.co.uk';
const FROM_NAME = 'Alex — Solis Digital';

// ── Recurring Add-Ons (setup + monthly) ──────────────────────────────────
const RECURRING_ADDONS = {
  chatbot: {
    name: 'AI Chatbot',
    description: '24/7 AI assistant trained on your services. Captures leads, books appointments, answers FAQs.',
    setup: 197,
    monthly: 47,
    setup_link: 'https://buy.stripe.com/4gMfZg6WY1qj50W0oG2880g',
    monthly_link: 'https://buy.stripe.com/00w00ibde0mfalg1sK2880h'
  },
  reviews: {
    name: 'Google Reviews Automation',
    description: 'Automated review requests after every appointment. SMS + email follow-ups. Bad reviews flagged privately.',
    setup: 97,
    monthly: 27,
    setup_link: 'https://buy.stripe.com/4gM14m3KM3yr1OKfjA2880i',
    monthly_link: 'https://buy.stripe.com/3cI8wO4OQ6KD2SOgnE2880j'
  }
};

// ── One-Off Add-Ons ──────────────────────────────────────────────────────
const ONEOFF_ADDONS = {
  extra_page:   { name: 'Extra Page',               price: 97,  link: 'https://buy.stripe.com/5kQeVc5SUc4X1OKc7o2880k' },
  blog_post:    { name: 'SEO Blog Post (1,000 words)', price: 147, link: 'https://buy.stripe.com/fZu5kCftu9WPdxs1sK2880l' },
  email_template: { name: 'Email Template Design',   price: 197, link: 'https://buy.stripe.com/eVq4gy4OQ7OH1OK8Vc2880m' },
  landing_page: { name: 'Landing Page',              price: 297, link: 'https://buy.stripe.com/eVqaEWa9ad91alggnE2880n' },
  logo:         { name: 'Logo & Brand Kit',          price: 497, link: 'https://buy.stripe.com/7sYdR85SU8SL1OK4EW2880o' },
  video:        { name: 'Video Editing (30s clip)',   price: 97,  link: 'https://buy.stripe.com/cNi28q0yA2unalg1sK2880p' },
  google_ads:   { name: 'Google Ads Setup',          price: 297, link: 'https://buy.stripe.com/dRmfZg9565Gz7949Zg2880q' },
  quarterly_refresh: { name: 'Quarterly Website Refresh', price: 297, link: 'https://buy.stripe.com/fZu5kC6WY2un9hc7R82880r' }
};

// ── Core Packages ────────────────────────────────────────────────────────
const PACKAGES = {
  Starter: {
    name: 'Starter',
    tagline: 'Get Found Online',
    setup: 995,
    monthly: 195,
    delivery: '5–7 days',
    includes: [
      '5-page responsive website',
      'Mobile optimisation',
      'Basic SEO setup (meta tags, schema, sitemap)',
      'Google Business Profile setup',
      'Contact form + Google Maps integration',
      'SSL certificate + managed hosting',
      'Monthly uptime monitoring'
    ],
    outcome: '3–5 new enquiries per month',
    payment_link: 'https://buy.stripe.com/4gM3cu5SU2unalg1sK2880a'
  },
  Growth: {
    name: 'Growth',
    tagline: 'Get Booked Out',
    setup: 1995,
    monthly: 395,
    delivery: '7–10 days',
    includes: [
      'Everything in Starter',
      '10-page custom website',
      'Advanced SEO optimisation',
      'Google Business Profile optimisation',
      'AI chatbot deployment',
      'Review automation system',
      'White-label performance dashboard',
      'Monthly analytics report',
      'Priority support'
    ],
    outcome: '8–12 new enquiries per month within 90 days',
    payment_link: 'https://buy.stripe.com/9B600iftuc4X9hcdbs2880c'
  },
  Accelerator: {
    name: 'Accelerator',
    tagline: 'Dominate Your Area',
    setup: 2997,
    monthly: 997,
    delivery: '10–14 days',
    includes: [
      'Everything in Growth',
      'Unlimited pages',
      'Google Ads management (£500 ad budget included)',
      'Retargeting pixel setup',
      'Monthly SEO campaigns',
      'Social media content calendar (4 posts/week)',
      'Dedicated Slack channel',
      'Quarterly strategy call',
      'White-glove onboarding'
    ],
    outcome: 'Dominate your local area — Google Ads + organic + social',
    payment_link: 'https://buy.stripe.com/bJeaEW4OQ5GzeBw9Zg2880e'
  }
};

async function query(endpoint) {
  const res = await fetch(`${SB_URL}${endpoint}`, { headers: HEADERS });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function logAction(action) {
  await fetch(`${SB_URL}/admin_actions`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(action)
  });
}

function buildAddonsHTML(addonKeys) {
  if (!addonKeys || addonKeys.length === 0) return '';

  const rows = [];
  for (const key of addonKeys) {
    const recurring = RECURRING_ADDONS[key];
    const oneoff = ONEOFF_ADDONS[key];
    if (recurring) {
      rows.push(`
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${recurring.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">£${recurring.setup} setup + £${recurring.monthly}/mo</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">
            <a href="${recurring.setup_link}" style="color:#d4af37;font-size:13px;text-decoration:none;font-weight:600;">Pay Setup</a> ·
            <a href="${recurring.monthly_link}" style="color:#d4af37;font-size:13px;text-decoration:none;font-weight:600;">Subscribe</a>
          </td>
        </tr>`);
    } else if (oneoff) {
      rows.push(`
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">${oneoff.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;color:#333;">£${oneoff.price} one-off</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">
            <a href="${oneoff.link}" style="color:#d4af37;font-size:13px;text-decoration:none;font-weight:600;">Pay Now</a>
          </td>
        </tr>`);
    }
  }

  if (rows.length === 0) return '';

  return `
      <!-- Add-Ons -->
      <div style="margin:24px 0;">
        <h3 style="color:#333;font-size:16px;margin:0 0 12px;">Optional Add-Ons</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Add-On</th>
              <th style="padding:10px 12px;text-align:left;font-size:13px;color:#666;font-weight:600;">Price</th>
              <th style="padding:10px 12px;text-align:center;font-size:13px;color:#666;font-weight:600;">Action</th>
            </tr>
          </thead>
          <tbody>${rows.join('')}
          </tbody>
        </table>
        <p style="color:#999;font-size:12px;margin:8px 0 0;">Add-ons can be purchased at any time — no commitment required.</p>
      </div>`;
}

function buildProposalHTML(lead, pkg, addonKeys) {
  const issues = [];
  if (lead.speed_score != null && lead.speed_score < 70) issues.push(`Speed score: ${lead.speed_score}/100`);
  if (lead.seo_score != null && lead.seo_score < 70) issues.push(`SEO score: ${lead.seo_score}/100`);
  if (lead.mobile_score != null && lead.mobile_score < 70) issues.push(`Mobile score: ${lead.mobile_score}/100`);
  if (lead.ssl_secure === false) issues.push('No SSL certificate');
  if (issues.length === 0) issues.push('Multiple optimisation opportunities identified');

  const issuesList = issues.map(i => `<li style="margin-bottom:6px;color:#dc2626;">${i}</li>`).join('');
  const includesList = pkg.includes.map(i => `<li style="margin-bottom:6px;">${i}</li>`).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0a0a0a,#1a1a2e);padding:32px;text-align:center;">
      <h1 style="color:#d4af37;margin:0;font-size:24px;letter-spacing:1px;">SOLIS DIGITAL</h1>
      <p style="color:#999;margin:8px 0 0;font-size:14px;">Proposal for ${lead.business_name || 'Your Business'}</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">

      <p style="color:#333;font-size:16px;line-height:1.6;">
        Hi${lead.business_name ? '' : ''},
      </p>
      <p style="color:#333;font-size:16px;line-height:1.6;">
        Thanks for taking the time to chat. As discussed, here's your personalised proposal based on the audit I ran on <strong>${lead.website || 'your website'}</strong>.
      </p>

      <!-- Audit Findings -->
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <h3 style="margin:0 0 12px;color:#dc2626;font-size:16px;">Issues Found</h3>
        <ul style="margin:0;padding-left:20px;color:#333;font-size:14px;line-height:1.8;">
          ${issuesList}
        </ul>
        ${lead.audit_summary ? `<p style="margin:12px 0 0;color:#666;font-size:13px;font-style:italic;">${lead.audit_summary}</p>` : ''}
      </div>

      <!-- Package -->
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <h3 style="margin:0 0 4px;color:#16a34a;font-size:16px;">${pkg.name} — ${pkg.tagline}</h3>
        <p style="margin:0 0 12px;color:#666;font-size:13px;">Delivered in ${pkg.delivery}</p>
        <ul style="margin:0;padding-left:20px;color:#333;font-size:14px;line-height:1.8;">
          ${includesList}
        </ul>
      </div>

      <!-- Pricing -->
      <div style="background:#0a0a0a;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
        <p style="color:#999;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Your Investment</p>
        <p style="color:#d4af37;margin:0;font-size:32px;font-weight:700;">£${pkg.setup.toLocaleString()}</p>
        <p style="color:#999;margin:4px 0 16px;font-size:14px;">one-off setup + £${pkg.monthly}/month</p>
        <a href="${pkg.payment_link}" style="display:inline-block;background:#d4af37;color:#0a0a0a;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:700;font-size:16px;">Get Started Now</a>
      </div>

      ${buildAddonsHTML(addonKeys)}

      <!-- Expected Outcome -->
      <div style="text-align:center;margin:24px 0;padding:16px;background:#f8f9fa;border-radius:8px;">
        <p style="color:#666;margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Expected Outcome</p>
        <p style="color:#333;margin:0;font-size:18px;font-weight:600;">${pkg.outcome}</p>
      </div>

      <p style="color:#333;font-size:16px;line-height:1.6;">
        Click the button above to get started — your project will begin within 24 hours of payment.
      </p>
      <p style="color:#333;font-size:16px;line-height:1.6;">
        If you have any questions, just reply to this email or <a href="https://calendly.com/solisdigital-info/solis-digital-free-strategy-call" style="color:#d4af37;">book another call</a>.
      </p>
      <p style="color:#333;font-size:16px;line-height:1.6;">
        Best,<br/>
        <strong>Alex</strong><br/>
        Solis Digital
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8f9fa;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;margin:0;">Solis Digital — More Clients. More Revenue. All On Autopilot.</p>
      <p style="color:#999;font-size:12px;margin:4px 0 0;">
        <a href="https://www.solisdigital.co.uk" style="color:#d4af37;text-decoration:none;">solisdigital.co.uk</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendProposal(email, packageName, leadId, addonStr) {
  const pkg = PACKAGES[packageName];
  if (!pkg) {
    console.error(`Unknown package: ${packageName}. Use: Starter, Growth, or Accelerator`);
    process.exit(1);
  }

  // Parse add-ons (comma-separated keys)
  const addonKeys = addonStr
    ? addonStr.split(',').map(k => k.trim()).filter(k => RECURRING_ADDONS[k] || ONEOFF_ADDONS[k])
    : [];

  // Fetch lead data
  let lead;
  if (leadId) {
    lead = await query(`/leads?id=eq.${leadId}&select=*`);
  } else if (email) {
    lead = await query(`/leads?email=eq.${encodeURIComponent(email)}&select=*`);
  }

  if (!lead) {
    console.log('Lead not found in database. Using minimal data.');
    lead = { email, business_name: '', website: '', industry: '' };
  }

  const toEmail = email || lead.email;
  if (!toEmail) {
    console.error('No email address provided or found for lead.');
    process.exit(1);
  }

  const html = buildProposalHTML(lead, pkg, addonKeys);
  const subject = `Your ${pkg.name} proposal — ${lead.business_name || 'Solis Digital'}`;

  if (!RESEND_KEY) {
    // No Resend key — output HTML to stdout for manual sending
    console.log('⚠️  No RESEND_API_KEY set. Outputting proposal HTML to stdout.\n');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Package: ${pkg.name} (£${pkg.setup} + £${pkg.monthly}/mo)`);
    console.log(`Payment link: ${pkg.payment_link}\n`);
    console.log('--- HTML START ---');
    console.log(html);
    console.log('--- HTML END ---');
    console.log('\nCopy the HTML above into your email client, or set RESEND_API_KEY to send automatically.');
    return;
  }

  // Send via Resend API
  console.log(`Sending ${pkg.name} proposal to ${toEmail}...`);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [toEmail],
      subject,
      html
    })
  });

  if (res.ok) {
    const data = await res.json();
    console.log(`✅ Proposal sent! Resend ID: ${data.id}`);

    // Log to admin actions
    await logAction({
      action_type: 'proposal_sent',
      description: `Sent ${pkg.name} proposal to ${toEmail}`,
      target: 'proposals',
      result: 'success',
      details: { email: toEmail, package: pkg.name, setup: pkg.setup, monthly: pkg.monthly }
    });

    // Update lead status
    if (lead.id) {
      await fetch(`${SB_URL}/leads?id=eq.${lead.id}`, {
        method: 'PATCH',
        headers: { ...HEADERS, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'Proposal Sent' })
      });
      console.log(`   Lead status updated to "Proposal Sent"`);
    }
  } else {
    const err = await res.text();
    console.error(`❌ Failed to send: ${res.status} ${err}`);
  }
}

// CLI
const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i]?.replace(/^--/, '');
  const val = args[i + 1];
  if (key && val) flags[key] = val;
}

if (!flags.package) {
  console.log('Usage: node scripts/send-proposal.mjs --email "client@example.com" --package "Growth"');
  console.log('       node scripts/send-proposal.mjs --lead-id "uuid" --package "Starter"');
  console.log('       node scripts/send-proposal.mjs --email "x@y.com" --package "Growth" --addons "chatbot,reviews"');
  console.log('\nPackages: Starter, Growth, Accelerator');
  console.log('\nRecurring add-ons: ' + Object.keys(RECURRING_ADDONS).join(', '));
  console.log('One-off add-ons:   ' + Object.keys(ONEOFF_ADDONS).join(', '));
  process.exit(0);
}

sendProposal(flags.email, flags.package, flags['lead-id'], flags.addons).catch(console.error);
