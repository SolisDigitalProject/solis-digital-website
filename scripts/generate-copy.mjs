#!/usr/bin/env node
/**
 * Solis Digital — AI Copy Generation Script
 * Generates full website copy for a client using Claude API.
 *
 * Usage: ANTHROPIC_API_KEY=sk-... node scripts/generate-copy.mjs \
 *   --name "Mitchell's Dental" \
 *   --industry "Dental Practice" \
 *   --services "General dentistry, Cosmetic dentistry, Invisalign, Emergency dental" \
 *   --audience "Families and professionals in Leeds seeking quality dental care" \
 *   --location "Leeds"
 *
 * Output: JSON file with all generated copy
 */

const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;
if (!CLAUDE_KEY) {
  console.error('ERROR: Set ANTHROPIC_API_KEY env var.');
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const val = args[i + 1];
    if (key && val) opts[key] = val;
  }
  if (!opts.name || !opts.industry) {
    console.error('Usage: node scripts/generate-copy.mjs --name "Business Name" --industry "Industry" [--services "..."] [--audience "..."] [--location "..."]');
    process.exit(1);
  }
  return opts;
}

async function generateCopy(opts) {
  const prompt = `You are a world-class copywriter for Solis Digital, a UK marketing agency. Generate complete website copy for a client.

CLIENT DETAILS:
- Business Name: ${opts.name}
- Industry: ${opts.industry}
- Services: ${opts.services || 'Not specified'}
- Target Audience: ${opts.audience || 'Local customers'}
- Location: ${opts.location || 'UK'}

Generate the following in JSON format:
{
  "homepage": {
    "hero_headline": "...",
    "hero_subheadline": "...",
    "hero_cta": "...",
    "intro_section": "2-3 sentences about the business",
    "why_choose_us": ["reason 1", "reason 2", "reason 3", "reason 4"]
  },
  "about": {
    "headline": "...",
    "body": "3-4 paragraphs about page copy",
    "mission_statement": "..."
  },
  "services": {
    "headline": "...",
    "intro": "...",
    "services_list": [
      {"name": "...", "description": "2-3 sentences"}
    ]
  },
  "contact": {
    "headline": "...",
    "body": "Short intro paragraph encouraging contact",
    "cta": "..."
  },
  "meta": [
    {"page": "Home", "title": "...", "description": "..."},
    {"page": "About", "title": "...", "description": "..."},
    {"page": "Services", "title": "...", "description": "..."},
    {"page": "Contact", "title": "...", "description": "..."},
    {"page": "Blog", "title": "...", "description": "..."}
  ],
  "faqs": [
    {"question": "...", "answer": "..."}
  ]
}

Requirements:
- Professional British English
- SEO-optimised with natural keyword placement
- Persuasive, benefit-driven copy
- Include the location for local SEO
- Generate exactly 10 FAQs relevant to the industry
- Meta descriptions should be 150-160 characters
- All copy should feel warm, professional, and trustworthy

Return ONLY valid JSON, no markdown fences or extra text.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Claude API error: ${res.status} — ${err}`);
    process.exit(1);
  }

  const data = await res.json();
  return data.content?.[0]?.text;
}

async function main() {
  const opts = parseArgs();
  console.error(`Generating website copy for "${opts.name}" (${opts.industry})...`);

  const raw = await generateCopy(opts);

  try {
    const parsed = JSON.parse(raw);
    const output = JSON.stringify(parsed, null, 2);
    console.log(output);
    console.error(`\nDone! Copy generated successfully.`);
  } catch {
    // If Claude didn't return clean JSON, output raw
    console.log(raw);
    console.error('\nWarning: Output may need manual JSON cleanup.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
