#!/usr/bin/env node
/**
 * Solis Digital — Auto Lead Nurture Engine
 * Manages the Day 1/3/7/14 follow-up sequence for leads.
 *
 * Two modes:
 * 1. ENQUEUE: Adds audited leads with emails to the nurture sequence
 * 2. PROCESS: Sends due emails and advances sequence steps
 *
 * Run via: node scripts/lead-nurture.mjs [enqueue|process]
 * Or via Make.com: enqueue daily, process every 2 hours
 */

import { SB_REST as SB_URL, sbHeaders as HEADERS } from './config.mjs';

// Sequence timing: when to send each step (days after initial)
const SEQUENCE_SCHEDULE = {
  1: 0,   // Day 1: Immediate (or same day as enqueue)
  2: 3,   // Day 3: Follow-up
  3: 7,   // Day 7: Value add
  4: 14,  // Day 14: Final follow-up, then close
};

// Email templates for each step
const EMAIL_TEMPLATES = {
  1: {
    subject: '{{business_name}} — Your website is costing you customers',
    body: `Hi there,

I ran a quick audit on your website and found some issues that are likely costing you customers:

- Your site speed score is below average, meaning visitors are leaving before the page loads
- There are SEO gaps that make you invisible on Google for key search terms
- Mobile users are having a poor experience on your site

I put together a free detailed report — would you like me to send it over?

Best,
Zain
Solis Digital
www.solisdigital.co.uk`
  },
  2: {
    subject: 'Re: {{business_name}} website audit',
    body: `Hi,

Just following up on my previous email about your website performance.

I noticed that competitors in your area are ranking higher on Google — in many cases just because they have faster, better-optimised websites.

I've helped businesses like yours fix these exact issues. Would a quick 10-minute call be useful? I can walk you through what's holding your site back and how to fix it.

No obligation — just trying to help.

Best,
Zain
Solis Digital`
  },
  3: {
    subject: 'Quick question about {{business_name}}',
    body: `Hi,

I know you're busy so I'll keep this brief.

I work with UK service businesses to improve their online presence. Most of our clients see a 2-3x increase in website enquiries within the first month.

If that sounds interesting, here's a link to book a free 15-min strategy call: https://calendly.com/solisdigital/strategy-call

Either way, I wish you all the best with the business.

Zain
Solis Digital`
  },
  4: {
    subject: 'Last one from me — {{business_name}}',
    body: `Hi,

This is my last email — I don't want to be a nuisance.

If you ever want a free website audit or need help with your online presence, my door is always open: info@solisdigital.co.uk

Wishing you continued success.

Best,
Zain
Solis Digital
www.solisdigital.co.uk`
  }
};

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

/**
 * ENQUEUE: Find audited leads with emails that aren't already in a nurture sequence
 */
async function enqueue() {
  console.log('📥 Enqueuing new leads into nurture sequence...\n');

  const [leads, existing] = await Promise.all([
    query('/leads?select=id,email,business_name,status&email=neq.null&status=eq.Audited'),
    query('/nurture_sequences?select=lead_id')
  ]);

  const existingIds = new Set(existing.map(e => e.lead_id));
  const newLeads = leads.filter(l => l.email && !existingIds.has(l.id));

  if (newLeads.length === 0) {
    console.log('No new leads to enqueue. All audited leads are already in sequences.');
    return;
  }

  const now = new Date();
  const records = newLeads.map(l => ({
    lead_id: l.id,
    email: l.email,
    business_name: l.business_name,
    sequence_step: 1,
    next_send_at: now.toISOString(), // Send step 1 immediately
    status: 'active'
  }));

  const res = await fetch(`${SB_URL}/nurture_sequences`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(records)
  });

  if (res.ok) {
    console.log(`✅ Enqueued ${newLeads.length} leads into nurture sequence:`);
    newLeads.forEach(l => console.log(`  → ${l.business_name} (${l.email})`));

    await logAction({
      action_type: 'nurture_email',
      description: `Enqueued ${newLeads.length} leads into nurture sequence`,
      target: 'nurture_sequences',
      result: 'success',
      details: { count: newLeads.length, leads: newLeads.map(l => l.business_name) }
    });
  } else {
    console.error('❌ Failed to enqueue:', await res.text());
  }
}

/**
 * PROCESS: Find due nurture emails, generate email content, advance sequence
 */
async function process() {
  console.log('📤 Processing due nurture emails...\n');

  const now = new Date().toISOString();
  const due = await query(`/nurture_sequences?select=*&status=eq.active&next_send_at=lte.${now}&order=next_send_at.asc`);

  if (due.length === 0) {
    console.log('No nurture emails due right now.');
    return;
  }

  console.log(`Found ${due.length} emails to send:\n`);

  for (const seq of due) {
    const template = EMAIL_TEMPLATES[seq.sequence_step];
    if (!template) continue;

    const subject = template.subject.replace('{{business_name}}', seq.business_name || 'your business');
    const body = template.body.replace(/\{\{business_name\}\}/g, seq.business_name || 'your business');

    console.log(`  📧 Step ${seq.sequence_step}/4 → ${seq.email} (${seq.business_name})`);
    console.log(`     Subject: ${subject}`);

    // In production: this sends via Instantly API or Resend
    // For now: log the email content and advance the sequence

    // Record in outreach table
    await fetch(`${SB_URL}/outreach`, {
      method: 'POST',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        email: seq.email,
        lead_email: seq.email,
        status: 'Sent',
        sequence_step: seq.sequence_step,
        sent_at: now,
        subject: subject
      })
    });

    // Advance or complete the sequence
    if (seq.sequence_step >= 4) {
      // Final step — mark as completed
      await fetch(`${SB_URL}/nurture_sequences?id=eq.${seq.id}`, {
        method: 'PATCH',
        headers: { ...HEADERS, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          status: 'completed',
          last_sent_at: now,
          sequence_step: 4
        })
      });

      // Update lead status to show sequence is done
      if (seq.lead_id) {
        await fetch(`${SB_URL}/leads?id=eq.${seq.lead_id}`, {
          method: 'PATCH',
          headers: { ...HEADERS, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ notes: 'Nurture sequence completed (4/4 emails sent)' })
        });
      }
      console.log(`     ✅ Sequence COMPLETED for ${seq.business_name}`);
    } else {
      // Advance to next step
      const nextStep = seq.sequence_step + 1;
      const daysUntilNext = SEQUENCE_SCHEDULE[nextStep] - SEQUENCE_SCHEDULE[seq.sequence_step];
      const nextSend = new Date(Date.now() + daysUntilNext * 86400000).toISOString();

      await fetch(`${SB_URL}/nurture_sequences?id=eq.${seq.id}`, {
        method: 'PATCH',
        headers: { ...HEADERS, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          sequence_step: nextStep,
          next_send_at: nextSend,
          last_sent_at: now
        })
      });
      console.log(`     → Next: Step ${nextStep} in ${daysUntilNext} days`);
    }
  }

  await logAction({
    action_type: 'nurture_email',
    description: `Processed ${due.length} nurture emails`,
    target: 'nurture_sequences',
    result: 'success',
    details: { count: due.length, emails: due.map(d => ({ email: d.email, step: d.sequence_step })) }
  });

  console.log(`\n✅ Processed ${due.length} nurture emails.`);
}

// Run based on CLI arg
const mode = process.argv?.[2] || 'process';
if (mode === 'enqueue') {
  enqueue().catch(console.error);
} else {
  // Default: process due emails
  process().catch(console.error);
}
