#!/usr/bin/env node
/**
 * Solis Digital — Slack Notification System
 *
 * Sends real-time notifications to Slack for key business events.
 * Used by other scripts and webhooks to alert founders.
 *
 * Usage:
 *   import { notify } from './notify.mjs';
 *   await notify('high_lead', { name: 'ABC Dental', score: 95, city: 'London' });
 *
 * Or CLI:
 *   node scripts/notify.mjs --type "high_lead" --message "New lead: ABC Dental (95)"
 *
 * Required env vars:
 *   SLACK_WEBHOOK_URL — Slack incoming webhook URL
 */

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;

const TEMPLATES = {
  high_lead: (data) => ({
    text: `🔥 *High-Priority Lead* (Score: ${data.score})\n*${data.name}*${data.city ? ` in ${data.city}` : ''}${data.industry ? ` — ${data.industry}` : ''}${data.website ? `\n${data.website}` : ''}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🔥 *High-Priority Lead* (Score: ${data.score}/130)\n\n*${data.name}*${data.city ? ` in ${data.city}` : ''}${data.industry ? ` — ${data.industry}` : ''}${data.website ? `\n<${data.website}|${data.website}>` : ''}`
        }
      },
      { type: 'divider' }
    ]
  }),

  reply: (data) => ({
    text: `💬 Reply from ${data.name}: "${data.preview}"`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `💬 *Email Reply*\n\n*${data.name}*${data.email ? ` (${data.email})` : ''}\n\n> ${data.preview || 'No preview available'}`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '📞 View in Dashboard' },
            url: 'https://www.solisdigital.co.uk/dashboard'
          }
        ]
      },
      { type: 'divider' }
    ]
  }),

  new_client: (data) => ({
    text: `🎉 New Client! ${data.name} purchased ${data.package}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎉 *New Client Won!*\n\n*${data.name}* just purchased *${data.package}*\nSetup: £${data.setup || '—'} | Monthly: £${data.monthly || '—'}/mo${data.email ? `\nEmail: ${data.email}` : ''}`
        }
      },
      { type: 'divider' }
    ]
  }),

  system_alert: (data) => ({
    text: `⚠️ System Alert: ${data.system} is ${data.status}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `⚠️ *System Alert*\n\n*${data.system}* — Status: *${data.status}*${data.details ? `\n${data.details}` : ''}${data.response_time ? `\nResponse time: ${data.response_time}ms` : ''}`
        }
      },
      { type: 'divider' }
    ]
  }),

  daily_kpi: (data) => ({
    text: `📊 Daily KPIs — ${data.date}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📊 *Daily KPI Report* — ${data.date}\n\n` +
            `*Pipeline:* ${data.total_leads || 0} leads | ${data.new_today || 0} new today\n` +
            `*Outreach:* ${data.emails_sent || 0} sent | ${data.replies || 0} replies\n` +
            `*Revenue:* £${data.mrr || 0}/mo MRR | ${data.active_clients || 0} active clients\n` +
            `*System:* ${data.uptime || '100'}% uptime`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '📊 Open Dashboard' },
            url: 'https://www.solisdigital.co.uk/dashboard'
          }
        ]
      },
      { type: 'divider' }
    ]
  }),

  proposal_sent: (data) => ({
    text: `📄 Proposal sent to ${data.name} — ${data.package}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📄 *Proposal Sent*\n\n*${data.name}* — ${data.package}\n£${data.setup} setup + £${data.monthly}/mo${data.email ? `\nSent to: ${data.email}` : ''}`
        }
      },
      { type: 'divider' }
    ]
  }),

  upsell_trigger: (data) => ({
    text: `📈 Upsell opportunity: ${data.name} → ${data.target_package}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📈 *Upsell Opportunity*\n\n*${data.name}* (${data.current_package})\n${data.reason}\n*Recommended:* Upgrade to ${data.target_package}`
        }
      },
      { type: 'divider' }
    ]
  }),

  generic: (data) => ({
    text: data.message || 'Solis Digital notification',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: data.message || 'Solis Digital notification'
        }
      }
    ]
  })
};

/**
 * Send a notification to Slack
 * @param {string} type - Notification type (high_lead, reply, new_client, etc.)
 * @param {object} data - Data to populate the template
 */
export async function notify(type, data = {}) {
  if (!SLACK_WEBHOOK) {
    console.log(`[notify] ${type}: ${JSON.stringify(data)} (no SLACK_WEBHOOK_URL set — skipping)`);
    return false;
  }

  const template = TEMPLATES[type] || TEMPLATES.generic;
  const payload = template(data);

  try {
    const res = await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error(`[notify] Slack error: ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[notify] Failed: ${err.message}`);
    return false;
  }
}

// CLI mode
if (process.argv[1]?.includes('notify.mjs')) {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const val = args[i + 1];
    if (key && val) flags[key] = val;
  }

  if (!flags.type && !flags.message) {
    console.log('Usage: node scripts/notify.mjs --type "high_lead" --message "Test notification"');
    console.log('Types: high_lead, reply, new_client, system_alert, daily_kpi, proposal_sent, upsell_trigger, generic');
    process.exit(0);
  }

  const data = { ...flags };
  delete data.type;
  notify(flags.type || 'generic', data).then(ok => {
    console.log(ok ? '✅ Notification sent' : '⚠️ Notification not sent (check SLACK_WEBHOOK_URL)');
  });
}
