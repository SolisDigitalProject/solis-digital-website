#!/usr/bin/env node
/**
 * Solis Digital — Shared Configuration
 * All scripts import credentials from here.
 * Set environment variables or they fall back to defaults.
 *
 * Required env vars for production:
 *   SUPABASE_URL    — Supabase project URL
 *   SUPABASE_KEY    — Supabase anon key
 *   PAGESPEED_API_KEY — Google PageSpeed API key
 *   ANTHROPIC_API_KEY — Claude API key (for bulk-audit & generate-copy)
 */

export const SB_URL = process.env.SUPABASE_URL || 'https://zqcpktpnfikmshqeqxlg.supabase.co';
export const SB_REST = process.env.SUPABASE_URL
  ? process.env.SUPABASE_URL + '/rest/v1'
  : 'https://zqcpktpnfikmshqeqxlg.supabase.co/rest/v1';
export const SB_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY3BrdHBuZmlrbXNocWVxeGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg5MDIsImV4cCI6MjA4ODkyNDkwMn0.whtTwOyOihSqhjPPj8YMEV-T4-m_-jYTWJ2m6LtUYKE';
export const PAGESPEED_KEY = process.env.PAGESPEED_API_KEY || 'AIzaSyCCd15XjzZE5aoAJ8zJjCLkkW9evdkuHj0';

export const sbHeaders = {
  'apikey': SB_KEY,
  'Authorization': `Bearer ${SB_KEY}`,
  'Content-Type': 'application/json'
};
