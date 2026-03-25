#!/usr/bin/env node
/**
 * Solis Digital — Instantly.ai Webhook Handler
 *
 * Receives email events from Instantly (opened, replied, bounced)
 * and updates the outreach + leads tables in Supabase.
 *
 * Deploy as:
 *   - Make.com/Zypflow webhook → HTTP module → calls this script
 *   - Or Vercel serverless function
 *   - Or Supabase Edge Function
 *
 * Usage: echo '{"event":"reply","email":"john@example.com"}' | node scripts/instantly-webhook.mjs
 *
 * Expected payload from Instantly webhook:
 *   { event_type: "email_opened"|"email_replied"|"email_bounced",
 *     email: "lead@example.com",
 *     campaign_id: "...",
 *     timestamp: "..." }
 */

import { SB_REST as SB_URL, sbHeaders as HEADERS } from './config.mjs';
import { notify } from './notify.mjs';

async function query(endpoint) {
  const res = await fetch(`${SB_URL}${endpoint}`, { headers: HEADERS });
  if (!res.ok) { console.error(`Query failed: ${endpoint} (${res.status})`); return []; }
  return res.json();
}

async function patch(endpoint, body) {
  const res = await fetch(`${SB_URL}${endpoint}`, {
    method: 'PATCH',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body)
  });
  return res.ok;
}

async function logAction(action) {
  await fetch(`${SB_URL}/admin_actions`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(action)
  });
}

const EVENT_MAP = {
  'email_opened': 'Opened',
  'email_replied': 'Replied',
  'email_bounced': 'Bounced',
  'email_clicked': 'Opened',
  'reply': 'Replied',
  'open': 'Opened',
  'bounce': 'Bounced',
  'click': 'Opened'
};

const LEAD_STATUS_MAP = {
  'Replied': 'Replied',
  'Bounced': 'Bounced'
};

async function handleEvent(payload) {
  const eventType = payload.event_type || payload.event || payload.type;
  const email = payload.email || payload.lead_email || payload.to;

  if (!eventType || !email) {
    console.error('Invalid payload — missing event_type or email');
    return;
  }

  const status = EVENT_MAP[eventType];
  if (!status) {
    console.log(`Unknown event type: ${eventType}, skipping`);
    return;
  }

  console.log(`Processing: ${eventType} → ${email} (status: ${status})`);

  // Update outreach record
  const outreach = await query(`/outreach?contact_email=eq.${encodeURIComponent(email)}&order=created_at.desc&limit=1`);
  if (outreach.length > 0) {
    const record = outreach[0];
    const updates = { status };
    if (status === 'Opened') {
      updates.opens = (record.opens || 0) + 1;
    }
    await patch(`/outreach?id=eq.${record.id}`, updates);
    console.log(`  Updated outreach #${record.id} → ${status}`);
  } else {
    console.log(`  No outreach record found for ${email}`);
  }

  // Update lead status for replies and bounces
  const leadStatus = LEAD_STATUS_MAP[status];
  if (leadStatus) {
    const leads = await query(`/leads?email=eq.${encodeURIComponent(email)}&select=id,status&limit=1`);
    if (leads.length > 0) {
      await patch(`/leads?id=eq.${leads[0].id}`, { status: leadStatus });
      console.log(`  Updated lead #${leads[0].id} → ${leadStatus}`);
    }
  }

  // Pause nurture sequence if replied (they're engaged, stop automated emails)
  if (status === 'Replied') {
    const sequences = await query(`/nurture_sequences?email=eq.${encodeURIComponent(email)}&status=eq.active&limit=1`);
    if (sequences.length > 0) {
      await patch(`/nurture_sequences?id=eq.${sequences[0].id}`, { status: 'paused' });
      console.log(`  Paused nurture sequence for ${email} (replied)`);
    }

    // Notify founders via Slack on replies
    const leads = await query(`/leads?email=eq.${encodeURIComponent(email)}&select=business_name,industry,location&limit=1`);
    const leadInfo = leads[0] || {};
    await notify('reply', {
      name: leadInfo.business_name || email,
      email,
      preview: payload.reply_text || payload.body || 'Lead replied to your email'
    });
  }

  await logAction({
    action_type: 'instantly_event',
    description: `Email ${status.toLowerCase()}: ${email}`,
    target: 'outreach',
    result: 'success',
    details: { email, event: eventType, status }
  });

  console.log(`  ✅ Done`);
}

// Read from stdin (for piped input) or CLI args
async function main() {
  let payload;

  // Check if data is piped via stdin
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const input = Buffer.concat(chunks).toString().trim();
    if (input) {
      payload = JSON.parse(input);
    }
  }

  // Or accept as CLI JSON arg
  if (!payload && process.argv[2]) {
    payload = JSON.parse(process.argv[2]);
  }

  if (!payload) {
    console.log('Usage:');
    console.log('  echo \'{"event_type":"email_replied","email":"john@example.com"}\' | node scripts/instantly-webhook.mjs');
    console.log('  node scripts/instantly-webhook.mjs \'{"event_type":"email_opened","email":"john@example.com"}\'');
    process.exit(0);
  }

  // Handle single event or array of events
  const events = Array.isArray(payload) ? payload : [payload];
  for (const event of events) {
    await handleEvent(event);
  }

  console.log(`\nProcessed ${events.length} event(s).`);
}

main().catch(console.error);
