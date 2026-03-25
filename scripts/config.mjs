#!/usr/bin/env node
/**
 * Solis Digital — Shared Configuration
 * All scripts import credentials from here.
 * All values MUST come from environment variables — no hardcoded fallbacks.
 *
 * Required env vars for production:
 *   SUPABASE_URL    — Supabase project URL
 *   SUPABASE_KEY    — Supabase anon key
 *   PAGESPEED_API_KEY — Google PageSpeed API key
 *   ANTHROPIC_API_KEY — Claude API key (for bulk-audit & generate-copy)
 */

/**
 * Validates that critical environment variables are set.
 * Logs warnings for any missing vars so issues are caught early.
 */
function validateEnv() {
  const required = [
    ['SUPABASE_URL', 'Supabase project URL'],
    ['SUPABASE_KEY', 'Supabase anon key'],
  ];
  const optional = [
    ['PAGESPEED_API_KEY', 'Google PageSpeed API key'],
    ['ANTHROPIC_API_KEY', 'Claude API key'],
  ];

  let hasCriticalMissing = false;

  for (const [key, label] of required) {
    if (!process.env[key]) {
      console.warn(`[config] WARNING: Missing required env var ${key} (${label})`);
      hasCriticalMissing = true;
    }
  }

  for (const [key, label] of optional) {
    if (!process.env[key]) {
      console.warn(`[config] NOTICE: Missing optional env var ${key} (${label})`);
    }
  }

  if (hasCriticalMissing) {
    console.warn('[config] Some required environment variables are not set. Scripts may fail.');
  }
}

validateEnv();

export const SB_URL = process.env.SUPABASE_URL;
export const SB_REST = process.env.SUPABASE_URL
  ? process.env.SUPABASE_URL + '/rest/v1'
  : undefined;
export const SB_KEY = process.env.SUPABASE_KEY;
export const PAGESPEED_KEY = process.env.PAGESPEED_API_KEY;

export const sbHeaders = {
  'apikey': SB_KEY,
  'Authorization': `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json'
};
