#!/usr/bin/env node
/**
 * Solis Digital — SEO Blog Post Generator
 *
 * Generates SEO-optimised blog posts for clients using Claude API.
 * Each post is tailored to the client's industry, location, and services.
 *
 * Modes:
 *   node scripts/seo-blog-generator.mjs generate --project <id> --topic "keyword"
 *   node scripts/seo-blog-generator.mjs list --project <id>
 *   node scripts/seo-blog-generator.mjs approve --id <post_id>
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY — Claude API key
 *   SUPABASE_URL, SUPABASE_KEY — via config.mjs
 */

import { SB_REST as SB_URL, sbHeaders as HEADERS } from './config.mjs';

const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;

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

async function generateWithClaude(prompt) {
  if (!CLAUDE_KEY) {
    console.error('ERROR: Set ANTHROPIC_API_KEY env var.');
    process.exit(1);
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) {
    console.error(`Claude API error: ${res.status}`);
    return null;
  }

  const data = await res.json();
  return data.content?.[0]?.text || null;
}

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

async function generateBlogPost(projectId, topic) {
  // Get project details
  const projects = await query(`/projects?id=eq.${projectId}&select=business_name,package,plan_type`);
  if (!projects.length) { console.error('Project not found'); return; }
  const project = projects[0];

  // Get client details for industry/location
  const clients = await query(`/clients?business_name=eq.${encodeURIComponent(project.business_name)}&select=*&limit=1`);
  const leads = await query(`/leads?business_name=eq.${encodeURIComponent(project.business_name)}&select=industry,location&limit=1`);

  const industry = leads[0]?.industry || 'local business';
  const location = leads[0]?.location || 'UK';
  const businessName = project.business_name;

  console.log(`\nGenerating SEO blog post for ${businessName}...`);
  console.log(`  Industry: ${industry}`);
  console.log(`  Location: ${location}`);
  console.log(`  Topic: ${topic}\n`);

  const prompt = `You are an expert SEO content writer for UK local businesses. Write a blog post for a ${industry} business called "${businessName}" located in ${location}.

TOPIC/KEYWORD: ${topic}

Requirements:
- Title should include the target keyword naturally
- 600-900 words, conversational but professional UK English
- Include a compelling meta description (155 chars max)
- Structure with H2 and H3 headings for SEO
- Include local references to ${location} where natural
- End with a call-to-action mentioning the business
- Focus on providing genuine value to potential customers
- Use short paragraphs and bullet points for readability

Output format (use these exact markers):
TITLE: [blog post title]
META: [meta description]
KEYWORDS: [comma-separated keywords]
---
[blog post content in HTML format with h2, h3, p, ul, li tags]`;

  const result = await generateWithClaude(prompt);
  if (!result) { console.error('Failed to generate content'); return; }

  // Parse the response
  const titleMatch = result.match(/TITLE:\s*(.+)/);
  const metaMatch = result.match(/META:\s*(.+)/);
  const keywordsMatch = result.match(/KEYWORDS:\s*(.+)/);
  const contentStart = result.indexOf('---');

  const title = titleMatch?.[1]?.trim() || `${topic} - ${businessName}`;
  const meta = metaMatch?.[1]?.trim() || '';
  const keywords = keywordsMatch?.[1]?.split(',').map(k => k.trim()).filter(Boolean) || [topic];
  const content = contentStart > -1 ? result.substring(contentStart + 3).trim() : result;

  const wordCount = content.split(/\s+/).length;

  // Save to database
  const saveRes = await fetch(`${SB_URL}/blog_posts`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify({
      project_id: projectId,
      client_id: clients[0]?.id || null,
      title,
      slug: slugify(title),
      content,
      meta_description: meta,
      keywords,
      word_count: wordCount,
      industry,
      location,
      status: 'draft'
    })
  });

  if (saveRes.ok) {
    const saved = await saveRes.json();
    const postId = Array.isArray(saved) ? saved[0]?.id : saved?.id;
    console.log(`\u2705 Blog post generated and saved!`);
    console.log(`   Title: ${title}`);
    console.log(`   Words: ${wordCount}`);
    console.log(`   Keywords: ${keywords.join(', ')}`);
    console.log(`   Status: Draft`);
    console.log(`   ID: ${postId}`);
    console.log(`\n   To approve: node scripts/seo-blog-generator.mjs approve --id ${postId}`);

    await logAction({
      action_type: 'blog_post_generated',
      description: `Generated SEO blog post: "${title}" for ${businessName}`,
      target: 'blog_posts',
      result: 'success',
      details: { post_id: postId, word_count: wordCount, topic }
    });
  } else {
    console.error(`Failed to save: ${saveRes.status}`);
  }
}

async function listPosts(projectId) {
  const filter = projectId ? `&project_id=eq.${projectId}` : '';
  const posts = await query(`/blog_posts?select=id,title,status,word_count,created_at,industry,location${filter}&order=created_at.desc`);

  if (!posts.length) {
    console.log('No blog posts found.');
    return;
  }

  console.log('\nBlog Posts:\n');
  console.log('ID'.padEnd(38) + 'Title'.padEnd(50) + 'Status'.padEnd(12) + 'Words'.padEnd(8) + 'Date');
  console.log('-'.repeat(120));

  for (const p of posts) {
    const date = new Date(p.created_at).toLocaleDateString('en-GB');
    console.log(
      `${(p.id || '').substring(0, 36).padEnd(38)}${(p.title || '').substring(0, 48).padEnd(50)}${(p.status || '').padEnd(12)}${String(p.word_count || 0).padEnd(8)}${date}`
    );
  }
}

async function approvePost(postId) {
  const res = await fetch(`${SB_URL}/blog_posts?id=eq.${postId}`, {
    method: 'PATCH',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ status: 'approved' })
  });

  if (res.ok) {
    console.log(`\u2705 Blog post ${postId} approved and ready for publishing.`);
  } else {
    console.error(`Failed: ${res.status}`);
  }
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
  case 'generate':
    if (!flags.project || !flags.topic) {
      console.error('Usage: node scripts/seo-blog-generator.mjs generate --project <id> --topic "best dentist in london"');
      process.exit(1);
    }
    generateBlogPost(Number(flags.project), flags.topic).catch(console.error);
    break;
  case 'list':
    listPosts(flags.project ? Number(flags.project) : null).catch(console.error);
    break;
  case 'approve':
    if (!flags.id) { console.error('Usage: --id <post_id>'); process.exit(1); }
    approvePost(flags.id).catch(console.error);
    break;
  default:
    console.log('Usage: node scripts/seo-blog-generator.mjs <generate|list|approve>');
}
