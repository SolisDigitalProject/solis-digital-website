#!/usr/bin/env node
/**
 * Solis Digital — SEO Blog Post Generator
 * Generates AI-powered blog posts for clients using Claude API.
 *
 * Usage:
 *   node scripts/generate-blog-post.mjs --client "Linden Grove" --topic "dental implants" --industry dental
 *   node scripts/generate-blog-post.mjs --client "Linden Grove" --keywords "dental implants London cost"
 *
 * Writes the post to Supabase `blog_posts` table for review before publishing.
 */

import { SB_REST, sbHeaders } from './config.mjs';

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_KEY) {
  console.error('Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

// Parse CLI args
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const clientName = getArg('client');
const topic = getArg('topic');
const industry = getArg('industry') || 'local business';
const keywords = getArg('keywords') || topic;
const wordCount = parseInt(getArg('words') || '1000', 10);

if (!clientName || !topic) {
  console.error('Usage: --client "Business Name" --topic "Blog topic" [--industry dental] [--keywords "keyword1, keyword2"] [--words 1000]');
  process.exit(1);
}

console.log(`Generating blog post for ${clientName} on "${topic}" (${industry})...`);

const systemPrompt = `You are an expert SEO content writer for UK local businesses. You write blog posts that:
- Are optimised for Google search (UK English, natural keyword placement)
- Target local customers searching for services
- Include practical, actionable advice
- Use a professional but approachable tone
- Include a clear call-to-action at the end
- Use proper heading hierarchy (H2, H3)
- Are formatted in clean HTML (no <html>, <head>, or <body> tags — just the article content)
- Include meta description and title tag suggestions at the top as HTML comments`;

const userPrompt = `Write a ${wordCount}-word SEO blog post for "${clientName}", a ${industry} business in the UK.

Topic: ${topic}
Target keywords: ${keywords}

Requirements:
1. Start with an HTML comment containing: suggested title tag (under 60 chars) and meta description (under 155 chars)
2. Use an engaging H1 title
3. Include 3-5 H2 subheadings
4. Naturally include the target keywords 3-5 times
5. Include a "Why Choose ${clientName}" section near the end
6. End with a clear call-to-action (book a consultation / get a quote / call us)
7. UK English spelling throughout
8. Output clean HTML only — no markdown`;

async function generatePost() {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    console.error('Claude API error:', res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  const content = data.content?.[0]?.text;
  if (!content) {
    console.error('No content returned from Claude');
    process.exit(1);
  }

  return content;
}

async function saveToSupabase(htmlContent) {
  // Extract title from H1 tag if present
  const titleMatch = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : topic;

  // Extract meta description from comment
  const metaMatch = htmlContent.match(/meta description[:\s]*([^-\n]+)/i);
  const metaDesc = metaMatch ? metaMatch[1].trim().slice(0, 155) : '';

  const post = {
    client_name: clientName,
    title: title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    content: htmlContent,
    meta_description: metaDesc,
    industry: industry,
    keywords: keywords,
    word_count: wordCount,
    status: 'draft',
    created_at: new Date().toISOString(),
  };

  const saveRes = await fetch(`${SB_REST}/blog_posts`, {
    method: 'POST',
    headers: { ...sbHeaders, 'Prefer': 'return=representation' },
    body: JSON.stringify(post),
  });

  if (saveRes.ok) {
    const saved = await saveRes.json();
    console.log(`Blog post saved to Supabase (id: ${saved[0]?.id || 'unknown'})`);
    console.log(`Title: ${title}`);
    console.log(`Status: draft — review and approve before publishing`);
  } else {
    // Table might not exist yet — output to console instead
    console.log('\n--- GENERATED BLOG POST ---');
    console.log(`Title: ${title}`);
    console.log(`Keywords: ${keywords}`);
    console.log(`Word count target: ${wordCount}`);
    console.log('---');
    console.log(htmlContent);
    console.log('\n(Blog post table not found in Supabase — post output to console for manual use)');
  }

  // Log to admin_actions
  await fetch(`${SB_REST}/admin_actions`, {
    method: 'POST',
    headers: sbHeaders,
    body: JSON.stringify({
      action_type: 'blog_post_generated',
      description: `Generated blog post: "${title}" for ${clientName}`,
      target: clientName,
      result: 'success',
      details: { topic, industry, keywords, word_count: wordCount },
    }),
  });
}

const html = await generatePost();
await saveToSupabase(html);
console.log('Done.');
