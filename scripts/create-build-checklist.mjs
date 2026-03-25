#!/usr/bin/env node
/**
 * Solis Digital — Build Checklist Generator
 *
 * Auto-generates a build checklist for a client project based on their
 * package (Starter/Growth/Accelerator) and any add-ons purchased.
 * Creates tasks in Supabase and notifies the team via Slack.
 *
 * Usage:
 *   node scripts/create-build-checklist.mjs --project-id "uuid"
 *   node scripts/create-build-checklist.mjs --project-id "uuid" --addons "chatbot,reviews,landing_page"
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_KEY — via config.mjs
 *   SLACK_WEBHOOK_URL — optional, for Slack notifications
 */

import { SB_REST as SB_URL, sbHeaders as HEADERS } from './config.mjs';
import { notify } from './notify.mjs';

// ── Delivery days by package ────────────────────────────────────────────
const DELIVERY_DAYS = { Starter: 7, Growth: 10, Accelerator: 14 };

// ── Base tasks by package tier ──────────────────────────────────────────
const STARTER_TASKS = [
  // Phase 1 - Setup (Day 1)
  { phase: 'Setup', task: 'Create Framer project from niche template', due_day: 1 },
  { phase: 'Setup', task: 'Set up domain + DNS', due_day: 1 },
  { phase: 'Setup', task: 'Configure SSL certificate', due_day: 1 },
  { phase: 'Setup', task: 'Set up Google Analytics + Search Console', due_day: 1 },
  // Phase 2 - Content (Day 2-3)
  { phase: 'Content', task: 'Run generate-site-content.mjs for AI copy', due_day: 2 },
  { phase: 'Content', task: 'Review and refine generated content', due_day: 2 },
  { phase: 'Content', task: 'Source/optimise client photos + assets', due_day: 3 },
  { phase: 'Content', task: 'Set up contact form + Google Maps embed', due_day: 3 },
  // Phase 3 - Build (Day 3-5)
  { phase: 'Build', task: 'Build all pages in Framer (5 pages)', due_day: 3 },
  { phase: 'Build', task: 'Mobile responsiveness check', due_day: 4 },
  { phase: 'Build', task: 'SEO setup (meta tags, schema, sitemap)', due_day: 4 },
  { phase: 'Build', task: 'Google Business Profile setup/claim', due_day: 5 }
];

const GROWTH_TASKS = [
  { phase: 'Build', task: 'Build additional pages (up to 10)', due_day: 5 },
  { phase: 'Build', task: 'Advanced SEO (keyword targeting, internal linking)', due_day: 6 },
  { phase: 'Build', task: 'Set up booking system integration', due_day: 6 },
  { phase: 'Build', task: 'Configure white-label performance dashboard', due_day: 7 },
  { phase: 'Build', task: 'Set up monthly analytics reporting', due_day: 7 },
  { phase: 'Build', task: 'Google Business Profile optimisation (photos, posts, Q&A)', due_day: 8 }
];

const ACCELERATOR_TASKS = [
  { phase: 'Build', task: 'Set up Google Ads account + campaigns', due_day: 8 },
  { phase: 'Build', task: 'Configure Meta Ads + retargeting pixel', due_day: 9 },
  { phase: 'Build', task: 'Set up social media content calendar', due_day: 9 },
  { phase: 'Build', task: 'Create first month social media posts (16 posts)', due_day: 10 },
  { phase: 'Build', task: 'Set up dedicated Slack channel for client', due_day: 10 },
  { phase: 'Build', task: 'White-glove onboarding call + walkthrough', due_day: 11 }
];

const LAUNCH_TASKS = [
  { phase: 'Launch', task: 'Internal QA review (speed, links, forms, mobile)', due_day: -4 },
  { phase: 'Launch', task: 'Client preview link sent', due_day: -3 },
  { phase: 'Launch', task: 'Client review + feedback round 1', due_day: -3 },
  { phase: 'Launch', task: 'Revisions from round 1', due_day: -2 },
  { phase: 'Launch', task: 'Client review + feedback round 2 (if needed)', due_day: -2 },
  { phase: 'Launch', task: 'Final approval received', due_day: -1 },
  { phase: 'Launch', task: 'Go live: point domain + remove preview watermark', due_day: 0 },
  { phase: 'Launch', task: 'Post-launch smoke test (forms, analytics, speed)', due_day: 0 }
];

// ── Add-on task sets ────────────────────────────────────────────────────
const ADDON_TASKS = {
  chatbot: [
    { task: 'Train AI chatbot on client services + FAQs' },
    { task: 'Configure chatbot greeting, fallback, and booking flow' },
    { task: 'Embed chatbot widget + test all conversation paths' }
  ],
  reviews: [
    { task: 'Set up Google Reviews automation platform' },
    { task: 'Configure SMS + email review request templates' },
    { task: 'Test review flow end-to-end + set up negative review alerts' }
  ],
  extra_page: [
    { task: 'Design and build extra page(s)' },
    { task: 'SEO optimise extra page(s) (meta, schema, internal links)' }
  ],
  blog_post: [
    { task: 'Research keywords + write 1,000-word SEO blog post' },
    { task: 'Publish blog post + submit to Google for indexing' }
  ],
  landing_page: [
    { task: 'Design conversion-optimised landing page' },
    { task: 'Set up A/B test variants' },
    { task: 'Configure tracking pixels + conversion goals' }
  ],
  logo: [
    { task: 'Create 3 logo concepts + colour palette' },
    { task: 'Refine chosen logo + create brand guidelines doc' },
    { task: 'Export logo in all formats (SVG, PNG, favicon)' }
  ],
  video: [
    { task: 'Edit 30-second social clip (captions + music)' },
    { task: 'Export optimised for Instagram/TikTok/Facebook' }
  ],
  google_ads: [
    { task: 'Set up Google Ads account + billing' },
    { task: 'Research keywords + write ad copy (3 variants)' },
    { task: 'Configure campaigns, ad groups, + conversion tracking' }
  ],
  quarterly_refresh: [
    { task: 'Schedule quarterly refresh calendar reminder' },
    { task: 'Document current site baseline metrics for comparison' }
  ],
  email_template: [
    { task: 'Design branded email template matching website style' },
    { task: 'Export as HTML + test across email clients' }
  ]
};

// ── Helpers ─────────────────────────────────────────────────────────────

function buildTaskList(packageName, addonKeys) {
  const tier = packageName?.toLowerCase();
  let tasks = [...STARTER_TASKS];

  if (tier === 'growth' || tier === 'accelerator') {
    tasks = tasks.concat(GROWTH_TASKS);
  }
  if (tier === 'accelerator') {
    tasks = tasks.concat(ACCELERATOR_TASKS);
  }

  // Determine the last build due_day for add-on scheduling
  const lastBuildDay = Math.max(...tasks.map(t => t.due_day));
  let addonDay = lastBuildDay + 1;

  // Add-on tasks
  for (const key of addonKeys) {
    const addonSet = ADDON_TASKS[key];
    if (!addonSet) {
      console.log(`⚠️  Unknown add-on "${key}" — skipping.`);
      continue;
    }
    for (const t of addonSet) {
      tasks.push({ phase: 'Add-Ons', task: t.task, due_day: addonDay, addon: key });
    }
    addonDay++;
  }

  // Launch tasks — due_day offsets are relative to delivery day
  const deliveryDays = DELIVERY_DAYS[packageName] || 7;
  for (const t of LAUNCH_TASKS) {
    tasks.push({
      phase: t.phase,
      task: t.task,
      due_day: deliveryDays + t.due_day // e.g. day 7 + (-4) = day 3
    });
  }

  // Sort by due_day, then by insertion order within same day
  tasks.sort((a, b) => a.due_day - b.due_day);

  return tasks;
}

function formatChecklist(tasks, packageName, businessName, addonKeys) {
  const lines = [];
  lines.push(`\n${'═'.repeat(60)}`);
  lines.push(`  BUILD CHECKLIST — ${businessName || 'Unknown Project'}`);
  lines.push(`  Package: ${packageName} | Tasks: ${tasks.length}`);
  if (addonKeys.length > 0) lines.push(`  Add-ons: ${addonKeys.join(', ')}`);
  lines.push(`${'═'.repeat(60)}\n`);

  let currentPhase = '';
  for (const t of tasks) {
    if (t.phase !== currentPhase) {
      currentPhase = t.phase;
      lines.push(`  📋 ${currentPhase.toUpperCase()}`);
      lines.push(`  ${'─'.repeat(40)}`);
    }
    const addon = t.addon ? ` [${t.addon}]` : '';
    lines.push(`  [ ] Day ${t.due_day}: ${t.task}${addon}`);
  }

  lines.push(`\n${'═'.repeat(60)}\n`);
  return lines.join('\n');
}

// ── Main ────────────────────────────────────────────────────────────────

async function createBuildChecklist(projectId, addonStr) {
  // 1. Fetch project from Supabase
  console.log(`Fetching project ${projectId}...`);

  const projRes = await fetch(`${SB_URL}/projects?id=eq.${projectId}&select=*`, {
    headers: HEADERS
  });

  if (!projRes.ok) {
    console.error(`❌ Failed to fetch project: ${projRes.status} ${projRes.statusText}`);
    process.exit(1);
  }

  const projects = await projRes.json();
  const project = Array.isArray(projects) ? projects[0] : projects;

  if (!project) {
    console.error(`❌ Project not found: ${projectId}`);
    process.exit(1);
  }

  const packageName = project.package || 'Starter';
  const businessName = project.business_name || 'Unknown';
  const briefData = project.brief_data || {};

  console.log(`Project: ${businessName} (${packageName})`);

  // 2. Determine add-ons
  const addonKeys = addonStr
    ? addonStr.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    : [];

  if (addonKeys.length > 0) {
    console.log(`Add-ons: ${addonKeys.join(', ')}`);
  }

  // 3. Generate task checklist
  const tasks = buildTaskList(packageName, addonKeys);
  console.log(`Generated ${tasks.length} tasks.`);

  // 4. Prepare task records for Supabase
  const now = new Date().toISOString();
  const taskRecords = tasks.map(t => ({
    project_id: projectId,
    phase: t.phase,
    task: t.task,
    status: 'pending',
    due_day: t.due_day,
    addon: t.addon || null,
    created_at: now
  }));

  // 5. UPSERT tasks to build_tasks table
  console.log('Saving tasks to Supabase...');

  try {
    const upsertRes = await fetch(`${SB_URL}/build_tasks`, {
      method: 'POST',
      headers: {
        ...HEADERS,
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(taskRecords)
    });

    if (!upsertRes.ok) {
      const errText = await upsertRes.text();
      // Graceful failure if table doesn't exist
      if (errText.includes('relation') && errText.includes('does not exist')) {
        console.log('⚠️  build_tasks table does not exist. Please create it with the following schema:');
        console.log('   project_id (uuid), phase (text), task (text), status (text),');
        console.log('   due_day (int), addon (text nullable), created_at (timestamptz)');
        console.log('   Continuing without saving tasks...\n');
      } else {
        console.error(`⚠️  Failed to save tasks: ${upsertRes.status} — ${errText}`);
        console.log('   Continuing without saving tasks...\n');
      }
    } else {
      console.log(`✅ ${taskRecords.length} tasks saved to build_tasks.`);
    }
  } catch (err) {
    console.error(`⚠️  Error saving tasks: ${err.message}`);
    console.log('   Continuing without saving tasks...\n');
  }

  // 6. Update project status + estimated launch date
  const deliveryDays = DELIVERY_DAYS[packageName] || 7;
  const launchDate = new Date();
  launchDate.setDate(launchDate.getDate() + deliveryDays);
  const estimatedLaunch = launchDate.toISOString().split('T')[0];

  console.log(`Updating project status to "In Build" (launch: ${estimatedLaunch})...`);

  try {
    const patchRes = await fetch(`${SB_URL}/projects?id=eq.${projectId}`, {
      method: 'PATCH',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        status: 'In Build',
        estimated_launch: estimatedLaunch
      })
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      console.error(`⚠️  Failed to update project: ${patchRes.status} — ${errText}`);
    } else {
      console.log('✅ Project status updated.');
    }
  } catch (err) {
    console.error(`⚠️  Error updating project: ${err.message}`);
  }

  // 7. Send Slack notification
  const addonLabel = addonKeys.length > 0 ? ` + ${addonKeys.join(', ')}` : '';
  const slackMessage =
    `🚀 *Build Started*\n\n` +
    `*${businessName}* — ${packageName}${addonLabel}\n` +
    `Tasks: ${tasks.length} | Estimated launch: ${estimatedLaunch}\n` +
    `Project ID: \`${projectId}\``;

  await notify('generic', { message: slackMessage });

  // 8. Print formatted checklist
  const checklist = formatChecklist(tasks, packageName, businessName, addonKeys);
  console.log(checklist);

  console.log(`✅ Build checklist created for ${businessName} (${packageName}).`);
  console.log(`   ${tasks.length} tasks | Launch target: ${estimatedLaunch}`);
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
  console.log('Usage: node scripts/create-build-checklist.mjs --project-id "uuid"');
  console.log('       node scripts/create-build-checklist.mjs --project-id "uuid" --addons "chatbot,reviews,landing_page"');
  console.log('\nPackages (auto-detected from project): Starter, Growth, Accelerator');
  console.log('\nAvailable add-ons: ' + Object.keys(ADDON_TASKS).join(', '));
  process.exit(0);
}

createBuildChecklist(flags['project-id'], flags.addons).catch(err => {
  console.error(`❌ Fatal error: ${err.message}`);
  process.exit(1);
});
