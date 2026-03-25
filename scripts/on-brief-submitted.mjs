#!/usr/bin/env node
/**
 * Solis Digital — Post-Brief Pipeline Handler
 *
 * Runs when a client submits their brief via onboard.html.
 * Orchestrates: confirmation email, project status update, Slack notification, admin logging.
 *
 * Usage:
 *   node scripts/on-brief-submitted.mjs --project-id "uuid"
 *
 * Trigger methods:
 *   - Manual:       node scripts/on-brief-submitted.mjs --project-id "uuid"
 *   - Make.com:     triggered by Supabase webhook when client_brief changes to true
 *   - Scheduled:    poll for projects where client_brief=true and status='Discovery'
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_KEY — via config.mjs
 *   RESEND_API_KEY              — Resend transactional email API key (optional — logs to stdout if missing)
 *   SLACK_WEBHOOK_URL           — via notify.mjs (optional)
 */

import { SB_REST as SB_URL, sbHeaders as HEADERS } from './config.mjs';
import { notify } from './notify.mjs';

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'alex@solisdigital.co.uk';
const FROM_NAME = 'Alex — Solis Digital';

// ── Delivery Timelines by Package ───────────────────────────────────────
const DELIVERY = {
  Starter:     { days: '5–7 days',   business_days: 7  },
  Growth:      { days: '7–10 days',  business_days: 10 },
  Accelerator: { days: '10–14 days', business_days: 14 }
};

// ── Supabase Helpers ────────────────────────────────────────────────────

async function fetchProject(id) {
  const res = await fetch(`${SB_URL}/projects?id=eq.${id}&select=*`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  const rows = await res.json();
  return rows[0] || null;
}

async function patchProject(id, data) {
  const res = await fetch(`${SB_URL}/projects?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Supabase patch failed: ${res.status}`);
}

async function logAction(action) {
  await fetch(`${SB_URL}/admin_actions`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(action)
  });
}

// ── Estimated Launch Date ───────────────────────────────────────────────

function estimatedLaunch(packageName) {
  const bd = DELIVERY[packageName]?.business_days || 10;
  const d = new Date();
  let added = 0;
  while (added < bd) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}

// ── Updated Milestones ──────────────────────────────────────────────────

function buildMilestones(existing) {
  const defaults = [
    { name: 'Client Brief', status: 'done' },
    { name: 'Content Generation', status: 'active' },
    { name: 'Design', status: 'pending' },
    { name: 'Build', status: 'pending' },
    { name: 'Review', status: 'pending' },
    { name: 'Launch', status: 'pending' }
  ];

  if (!Array.isArray(existing) || existing.length === 0) return defaults;

  return existing.map(m => {
    if (m.name === 'Client Brief') return { ...m, status: 'done' };
    if (m.name === 'Content Generation' || m.name === 'Design') return { ...m, status: 'active' };
    return m;
  });
}

// ── Confirmation Email HTML ─────────────────────────────────────────────

function buildConfirmationHTML(project, brief, packageName) {
  const businessName = brief.business_name || project.business_name || 'Your Business';
  const delivery = DELIVERY[packageName] || DELIVERY.Growth;
  const portalUrl = `https://www.solisdigital.co.uk/portal?token=${project.onboard_token || ''}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0a0a0a,#1a1a2e);padding:32px;text-align:center;">
      <h1 style="color:#d4af37;margin:0;font-size:24px;letter-spacing:1px;">SOLIS DIGITAL</h1>
      <p style="color:#ffffff;margin:16px 0 0;font-size:22px;font-weight:700;">We've Got Your Brief!</p>
      <p style="color:#999;margin:8px 0 0;font-size:14px;">${businessName}</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">

      <p style="color:#333;font-size:16px;line-height:1.6;">
        Thanks for completing your website brief. We have everything we need to get started.
      </p>
      <p style="color:#333;font-size:16px;line-height:1.6;">
        Your <strong>${packageName}</strong> project is now in our pipeline and your dedicated team has been notified.
      </p>

      <!-- What Happens Now -->
      <div style="margin:28px 0;">
        <h3 style="color:#333;font-size:18px;margin:0 0 16px;">What happens now</h3>

        <div style="display:flex;gap:12px;margin-bottom:16px;">
          <div style="flex-shrink:0;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#d4af37,#c4872a);display:flex;align-items:center;justify-content:center;color:#0a0a0a;font-weight:700;font-size:14px;">1</div>
          <div>
            <p style="color:#333;font-size:15px;font-weight:600;margin:0 0 2px;">Content Generation</p>
            <p style="color:#666;font-size:13px;margin:0;line-height:1.5;">We craft your website copy, headlines, and page content based on your brief — tailored to your audience and optimised for conversions.</p>
          </div>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:16px;">
          <div style="flex-shrink:0;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#d4af37,#c4872a);display:flex;align-items:center;justify-content:center;color:#0a0a0a;font-weight:700;font-size:14px;">2</div>
          <div>
            <p style="color:#333;font-size:15px;font-weight:600;margin:0 0 2px;">Design & Build</p>
            <p style="color:#666;font-size:13px;margin:0;line-height:1.5;">Your website is designed and built in Framer — responsive, fast, and fully branded to your specifications.</p>
          </div>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:16px;">
          <div style="flex-shrink:0;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#d4af37,#c4872a);display:flex;align-items:center;justify-content:center;color:#0a0a0a;font-weight:700;font-size:14px;">3</div>
          <div>
            <p style="color:#333;font-size:15px;font-weight:600;margin:0 0 2px;">Review & Launch</p>
            <p style="color:#666;font-size:13px;margin:0;line-height:1.5;">You review a live preview, we implement your feedback, and launch your site — all within your delivery window.</p>
          </div>
        </div>
      </div>

      <!-- Delivery Estimate -->
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 4px;color:#16a34a;font-size:14px;font-weight:700;">Estimated Delivery</p>
        <p style="margin:0;color:#333;font-size:15px;">Your <strong>${packageName}</strong> website will be ready within <strong>${delivery.days}</strong>.</p>
      </div>

      <!-- Track Project Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${portalUrl}" style="display:inline-block;background:#d4af37;color:#0a0a0a;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:700;font-size:16px;">Track Your Project</a>
        <p style="color:#999;font-size:12px;margin:10px 0 0;">View progress, milestones, and preview links in your client portal.</p>
      </div>

      <p style="color:#333;font-size:16px;line-height:1.6;">
        Questions? Just reply to this email — we're here to help.
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

// ── Main Pipeline ───────────────────────────────────────────────────────

async function onBriefSubmitted(projectId) {
  // 1. Fetch project
  console.log(`Fetching project ${projectId}...`);
  const project = await fetchProject(projectId);
  if (!project) {
    console.error(`Project not found: ${projectId}`);
    process.exit(1);
  }

  // 2. Validate brief exists
  const brief = project.brief_data;
  if (!brief || !project.client_brief) {
    console.error(`Project ${projectId} has no brief_data or client_brief. Aborting.`);
    process.exit(1);
  }
  console.log(`Brief found for "${brief.business_name || project.business_name}"`);

  // 3. Extract client email
  const clientEmail = brief.email_main || project.client_email || project.email;
  if (!clientEmail) {
    console.error('No client email found in brief_data or project record. Aborting.');
    process.exit(1);
  }

  const businessName = brief.business_name || project.business_name || 'Client';
  const packageName = project.package || project.plan_type || 'Growth';
  const pages = brief.pages || [];
  const addons = project.addons || [];

  // 4. Send confirmation email
  const subject = `We've received your brief — ${businessName}`;
  const html = buildConfirmationHTML(project, brief, packageName);

  if (!RESEND_KEY) {
    console.log('No RESEND_API_KEY set. Logging email to stdout.\n');
    console.log(`To: ${clientEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Package: ${packageName}`);
    console.log('--- HTML START ---');
    console.log(html);
    console.log('--- HTML END ---');
  } else {
    console.log(`Sending confirmation email to ${clientEmail}...`);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [clientEmail],
        subject,
        html
      })
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`Confirmation email sent. Resend ID: ${data.id}`);
    } else {
      const err = await res.text();
      console.error(`Failed to send confirmation email: ${res.status} ${err}`);
    }
  }

  // 5. Update project in Supabase
  const launchDate = estimatedLaunch(packageName);
  const milestones = buildMilestones(project.milestones);

  console.log(`Updating project status to "Content Generation" (est. launch: ${launchDate})...`);
  await patchProject(projectId, {
    status: 'Content Generation',
    estimated_launch: launchDate,
    milestones
  });
  console.log('Project updated.');

  // 6. Slack notification
  const slackMsg =
    `📋 *New brief submitted: ${businessName}* (${packageName})\n` +
    `Industry: ${brief.industry || 'N/A'}\n` +
    `Pages: ${pages.length || 'N/A'}\n` +
    (addons.length ? `Add-ons: ${addons.join(', ')}\n` : '') +
    `<https://supabase.com/dashboard/project/_/editor/projects?filter=id%3Deq.${projectId}|View in Supabase>`;

  await notify('generic', { message: slackMsg });
  console.log('Slack notification sent.');

  // 7. Log to admin_actions
  await logAction({
    action_type: 'brief_received',
    description: `Brief submitted by ${businessName} (${packageName})`,
    target: 'projects',
    result: 'success',
    details: {
      project_id: projectId,
      email: clientEmail,
      package: packageName,
      pages: pages.length,
      industry: brief.industry || null
    }
  });
  console.log('Admin action logged.');

  console.log(`\nPipeline complete for "${businessName}".`);
}

// ── CLI ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i]?.replace(/^--/, '');
  const val = args[i + 1];
  if (key && val) flags[key] = val;
}

if (!flags['project-id']) {
  console.log('Usage: node scripts/on-brief-submitted.mjs --project-id "uuid"');
  process.exit(0);
}

onBriefSubmitted(flags['project-id']).catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
