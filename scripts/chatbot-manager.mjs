#!/usr/bin/env node
/**
 * Solis Digital — AI Chatbot Manager
 *
 * Manages chatbot knowledge bases per client. The chatbot widget is a
 * standalone JS file clients embed on their site via <script> tag.
 * Queries hit a Supabase Edge Function that uses Claude to answer.
 *
 * Modes:
 *   node scripts/chatbot-manager.mjs setup --project <id>
 *   node scripts/chatbot-manager.mjs update --project <id> --field "hours" --value "Mon-Fri 9-5"
 *   node scripts/chatbot-manager.mjs list
 *   node scripts/chatbot-manager.mjs embed --project <id>  — Get embed code
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_KEY — via config.mjs
 */

import { SB_URL, SB_REST, SB_KEY, sbHeaders as HEADERS } from './config.mjs';

async function query(endpoint) {
  const res = await fetch(`${SB_REST}${endpoint}`, { headers: HEADERS });
  if (!res.ok) { console.error(`Query failed: ${endpoint} (${res.status})`); return []; }
  return res.json();
}

async function logAction(action) {
  await fetch(`${SB_REST}/admin_actions`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(action)
  });
}

async function setupChatbot(projectId) {
  // Get project details
  const projects = await query(`/projects?id=eq.${projectId}&select=*`);
  if (!projects.length) { console.error('Project not found'); return; }
  const project = projects[0];

  // Get lead data for business details
  const leads = await query(`/leads?business_name=eq.${encodeURIComponent(project.business_name)}&select=industry,location,phone,email&limit=1`);
  const lead = leads[0] || {};

  // Check if config already exists
  const existing = await query(`/chatbot_configs?project_id=eq.${projectId}&limit=1`);
  if (existing.length) {
    console.log(`Chatbot config already exists for project ${projectId}. Use 'update' to modify.`);
    return;
  }

  // Create default config
  const config = {
    project_id: projectId,
    client_id: project.client_id,
    business_name: project.business_name,
    business_description: `${project.business_name} is a ${lead.industry || 'local business'} based in ${lead.location || 'the UK'}.`,
    services: [],
    faqs: [
      { q: 'What are your opening hours?', a: 'Please check our website or call us for current hours.' },
      { q: 'How do I book an appointment?', a: 'You can book through our website or by calling us directly.' },
      { q: 'Where are you located?', a: lead.location || 'Please contact us for our address.' }
    ],
    hours: '',
    phone: lead.phone || project.client_email || '',
    email: lead.email || project.client_email || '',
    booking_url: '',
    custom_instructions: `You are a friendly and helpful AI assistant for ${project.business_name}. Answer customer questions based on the provided business information. Be concise, professional, and helpful. If you do not know the answer, suggest they call or email the business directly.`,
    widget_color: '#e8a23a',
    is_active: true
  };

  const res = await fetch(`${SB_REST}/chatbot_configs`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(config)
  });

  if (res.ok) {
    const saved = await res.json();
    const configId = Array.isArray(saved) ? saved[0]?.id : saved?.id;

    // Update project addon status
    await fetch(`${SB_REST}/projects?id=eq.${projectId}`, {
      method: 'PATCH',
      headers: { ...HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ addon_chatbot_status: 'active' })
    });

    console.log(`\u2705 Chatbot configured for ${project.business_name}`);
    console.log(`   Config ID: ${configId}`);
    console.log(`   Status: Active`);
    console.log(`\n   Get embed code: node scripts/chatbot-manager.mjs embed --project ${projectId}`);

    await logAction({
      action_type: 'chatbot_setup',
      description: `AI Chatbot configured for ${project.business_name}`,
      target: 'chatbot_configs',
      result: 'success',
      details: { config_id: configId, project_id: projectId }
    });
  } else {
    console.error(`Failed: ${res.status}`);
  }
}

async function updateConfig(projectId, field, value) {
  const configs = await query(`/chatbot_configs?project_id=eq.${projectId}&limit=1`);
  if (!configs.length) { console.error('No chatbot config found. Run setup first.'); return; }

  const update = {};
  // Handle JSON fields
  if (field === 'services' || field === 'faqs') {
    try { update[field] = JSON.parse(value); } catch { console.error('Invalid JSON'); return; }
  } else {
    update[field] = value;
  }
  update.updated_at = new Date().toISOString();

  const res = await fetch(`${SB_REST}/chatbot_configs?project_id=eq.${projectId}`, {
    method: 'PATCH',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(update)
  });

  if (res.ok) {
    console.log(`\u2705 Updated ${field} for project ${projectId}`);
  } else {
    console.error(`Failed: ${res.status}`);
  }
}

async function listConfigs() {
  const configs = await query('/chatbot_configs?select=id,business_name,project_id,is_active,created_at&order=created_at.desc');
  if (!configs.length) { console.log('No chatbot configurations found.'); return; }

  console.log('\nAI Chatbot Configurations:\n');
  console.log('Business'.padEnd(30) + 'Project'.padEnd(10) + 'Active'.padEnd(10) + 'Created');
  console.log('-'.repeat(60));

  for (const c of configs) {
    console.log(
      `${(c.business_name || '').substring(0, 28).padEnd(30)}${String(c.project_id || '').padEnd(10)}${(c.is_active ? 'Yes' : 'No').padEnd(10)}${new Date(c.created_at).toLocaleDateString('en-GB')}`
    );
  }
}

async function getEmbedCode(projectId) {
  const configs = await query(`/chatbot_configs?project_id=eq.${projectId}&select=id,business_name&limit=1`);
  if (!configs.length) { console.error('No chatbot config found. Run setup first.'); return; }

  const config = configs[0];
  const supabaseUrl = SB_URL;

  console.log(`\nEmbed code for ${config.business_name}:`);
  console.log(`Add this before </body> on the client's website:\n`);
  console.log(`<!-- Solis Digital AI Chatbot -->`);
  console.log(`<script>`);
  console.log(`  window.SOLIS_CHAT_CONFIG = {`);
  console.log(`    projectId: ${projectId},`);
  console.log(`    supabaseUrl: '${supabaseUrl}',`);
  console.log(`    color: '#e8a23a'`);
  console.log(`  };`);
  console.log(`</script>`);
  console.log(`<script src="https://www.solisdigital.co.uk/chatbot-widget.js" defer></script>`);
  console.log(`\n(The widget JS file serves from your main domain)`);
}

// ── CLI ──
const args = process.argv.slice(2);
const mode = args[0] || 'list';
const flags = {};
for (let i = 1; i < args.length; i += 2) {
  const key = args[i]?.replace(/^--/, '');
  const val = args[i + 1];
  if (key && val) flags[key] = val;
}

switch (mode) {
  case 'setup':
    if (!flags.project) { console.error('Usage: --project <id>'); process.exit(1); }
    setupChatbot(Number(flags.project)).catch(console.error);
    break;
  case 'update':
    if (!flags.project || !flags.field || !flags.value) { console.error('Usage: --project <id> --field "hours" --value "Mon-Fri 9-5"'); process.exit(1); }
    updateConfig(Number(flags.project), flags.field, flags.value).catch(console.error);
    break;
  case 'list':
    listConfigs().catch(console.error);
    break;
  case 'embed':
    if (!flags.project) { console.error('Usage: --project <id>'); process.exit(1); }
    getEmbedCode(Number(flags.project)).catch(console.error);
    break;
  default:
    console.log('Usage: node scripts/chatbot-manager.mjs <setup|update|list|embed>');
}
