#!/usr/bin/env node
/**
 * Solis Digital — Shared Configuration
 * All scripts import credentials from here.
 * Loads .env file automatically if present.
 *
 * Required env vars (set in .env at project root):
 *   SUPABASE_URL      — Supabase project URL
 *   SUPABASE_KEY      — Supabase anon key
 *   PAGESPEED_API_KEY  — Google PageSpeed API key
 *   INSTANTLY_API_KEY  — Instantly API key (for outreach campaigns)
 *   ANTHROPIC_API_KEY  — Claude API key (for bulk-audit & generate-copy)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Auto-load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dirname, '..', '.env');
  const envFile = readFileSync(envPath, 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env file not found — rely on system env vars */ }

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}\n` +
      `Set it in your .env file at the project root or export it in your shell.`
    );
  }
  return value;
}

export const SB_URL = requireEnv('SUPABASE_URL');
export const SB_REST = SB_URL + '/rest/v1';
export const SB_KEY = requireEnv('SUPABASE_KEY');
export const PAGESPEED_KEY = requireEnv('PAGESPEED_API_KEY');

export const sbHeaders = {
  'apikey': SB_KEY,
  'Authorization': `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json'
};
