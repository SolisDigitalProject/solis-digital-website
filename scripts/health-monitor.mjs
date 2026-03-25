#!/usr/bin/env node
/**
 * Solis Digital — AI Admin Health Monitor
 * Checks uptime of all critical systems every 30 minutes.
 * Run via: node scripts/health-monitor.mjs
 * Or via Make.com HTTP module calling this as a Vercel serverless function.
 */

import { SB_REST as SB_URL, PAGESPEED_KEY, sbHeaders as HEADERS } from './config.mjs';
import { notify } from './notify.mjs';

const CHECKS = [
  { type: 'uptime', url: 'https://www.solisdigital.co.uk/', name: 'Main Website' },
  { type: 'supabase', url: `${SB_URL}/leads?select=id&limit=1`, name: 'Supabase API' },
  { type: 'pagespeed_api', url: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=MOBILE&category=performance&url=https://example.com&key=${PAGESPEED_KEY}`, name: 'PageSpeed API' },
  { type: 'tawkto', url: 'https://embed.tawk.to/69b9a21c7f0aa71c36e441e0/1jjui2gh9', name: 'Tawk.to Widget' },
  { type: 'dashboard', url: 'https://www.solisdigital.co.uk/dashboard.html', name: 'Command Centre' },
];

async function checkEndpoint(check) {
  const start = Date.now();
  try {
    const opts = { headers: check.type === 'supabase' ? HEADERS : {}, signal: AbortSignal.timeout(15000) };
    const res = await fetch(check.url, opts);
    const elapsed = Date.now() - start;
    return {
      check_type: check.type,
      target_url: check.url,
      status: res.ok ? 'ok' : 'warning',
      response_time_ms: elapsed,
      status_code: res.status,
      error_message: res.ok ? null : `HTTP ${res.status}`,
      metadata: { name: check.name }
    };
  } catch (err) {
    return {
      check_type: check.type,
      target_url: check.url,
      status: 'critical',
      response_time_ms: Date.now() - start,
      status_code: 0,
      error_message: err.message,
      metadata: { name: check.name }
    };
  }
}

async function saveResults(results) {
  const res = await fetch(`${SB_URL}/health_checks`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(results)
  });
  if (!res.ok) console.error('Failed to save health checks:', await res.text());
}

async function logAction(action) {
  await fetch(`${SB_URL}/admin_actions`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(action)
  });
}

async function run() {
  console.log(`[${new Date().toISOString()}] Running health checks...`);

  const results = await Promise.all(CHECKS.map(checkEndpoint));
  await saveResults(results);

  const failures = results.filter(r => r.status !== 'ok');
  const allOk = failures.length === 0;

  // Log the action
  await logAction({
    action_type: 'health_check',
    description: allOk
      ? `All ${results.length} systems healthy`
      : `${failures.length} system(s) unhealthy: ${failures.map(f => f.metadata.name).join(', ')}`,
    target: 'all_systems',
    result: allOk ? 'success' : 'failed',
    details: {
      checks: results.map(r => ({ name: r.metadata.name, status: r.status, ms: r.response_time_ms })),
      failures: failures.map(f => ({ name: f.metadata.name, error: f.error_message }))
    }
  });

  // Print summary
  results.forEach(r => {
    const icon = r.status === 'ok' ? '✅' : r.status === 'warning' ? '⚠️' : '❌';
    console.log(`  ${icon} ${r.metadata.name}: ${r.status} (${r.response_time_ms}ms)`);
  });

  if (!allOk) {
    console.log('\n🚨 FAILURES DETECTED — sending Slack alerts');
    for (const f of failures) {
      await notify('system_alert', {
        system: f.metadata.name,
        status: f.status,
        details: f.error_message,
        response_time: f.response_time_ms
      });
    }
  }

  console.log(`\n✅ Health check complete. ${results.length} checks, ${failures.length} failures.`);
  return { ok: allOk, results, failures };
}

run().catch(console.error);
