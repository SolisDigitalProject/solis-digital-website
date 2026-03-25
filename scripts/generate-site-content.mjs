#!/usr/bin/env node
/**
 * Solis Digital — AI Website Content Generator
 *
 * Reads brief_data from a Supabase `projects` record and uses Claude API
 * to generate all website copy sections, ready to paste into Framer.
 *
 * Usage:
 *   node scripts/generate-site-content.mjs --project-id "uuid"
 *   node scripts/generate-site-content.mjs --project-id "uuid" --output content.json
 *   node scripts/generate-site-content.mjs --project-id "uuid" --send
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_KEY — via config.mjs
 *   ANTHROPIC_API_KEY — Claude API key
 *   RESEND_API_KEY — for sending (optional, only with --send flag)
 */

import { SB_REST as SB_URL, sbHeaders as HEADERS } from './config.mjs';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

// ── Supabase helpers ────────────────────────────────────────────────────

async function query(endpoint) {
  const res = await fetch(`${SB_URL}${endpoint}`, { headers: HEADERS });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function patch(endpoint, body) {
  const res = await fetch(`${SB_URL}${endpoint}`, {
    method: 'PATCH',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body)
  });
  return res.ok;
}

// ── Packages that include chatbot ───────────────────────────────────────

const CHATBOT_PACKAGES = ['Growth', 'Accelerator'];

function hasChatbot(pkg, briefData) {
  if (CHATBOT_PACKAGES.includes(pkg)) return true;
  // Check for chatbot add-on in various possible fields
  const addons = briefData?.addons || briefData?.add_ons || '';
  if (typeof addons === 'string') return addons.toLowerCase().includes('chatbot');
  if (Array.isArray(addons)) return addons.some(a => a.toLowerCase().includes('chatbot'));
  return false;
}

// ── Build the Claude prompt ─────────────────────────────────────────────

function buildPrompt(brief, businessName, pkg, includeChatbot) {
  const servicesText = (brief.services || [])
    .map((s, i) => `  ${i + 1}. ${s.name}${s.price ? ` (${s.price})` : ''}${s.duration ? ` [${s.duration}]` : ''}${s.description ? ` — ${s.description}` : ''}`)
    .join('\n');

  const faqsText = (brief.faqs || [])
    .map((f, i) => `  ${i + 1}. Q: ${f.question}\n     A: ${f.answer}`)
    .join('\n');

  const teamText = (brief.team_members || [])
    .map((t, i) => `  ${i + 1}. ${t.name}${t.role ? ` — ${t.role}` : ''}${t.bio ? `: ${t.bio}` : ''}`)
    .join('\n');

  const locationsText = (brief.locations || [])
    .map((l, i) => `  ${i + 1}. ${l.name ? l.name + ' — ' : ''}${l.address}${l.phone ? ` (${l.phone})` : ''}`)
    .join('\n');

  const hoursText = brief.opening_hours
    ? Object.entries(brief.opening_hours)
        .map(([day, h]) => `  ${day}: ${h.closed ? 'Closed' : `${h.open} – ${h.close}`}`)
        .join('\n')
    : '  Not provided';

  const socialText = brief.social_media
    ? Object.entries(brief.social_media)
        .filter(([, v]) => v)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n')
    : '  None provided';

  const pagesText = (brief.pages || []).join(', ');

  const chatbotInstruction = includeChatbot
    ? `Generate a "chatbot_config" section with:
  - greeting: a warm welcome message from the business
  - fallback: a polite message when the bot cannot answer
  - faqs: array of {trigger, response} for the top 5-8 most common questions
  - booking_prompt: a message encouraging the user to book an appointment/consultation`
    : `Set "chatbot_config" to null (client's package does not include AI chatbot).`;

  return `You are a UK-based website copywriter for Solis Digital, a web design agency. Generate ALL website copy for the following business. Write in UK English (colour, optimise, favourite, etc.). The copy must be professional, conversion-focused, and appropriate for the ${brief.industry || 'general'} industry.

=== BUSINESS BRIEF ===

Business Name: ${businessName}
${brief.tagline ? `Tagline: ${brief.tagline}` : ''}
Industry: ${brief.industry || 'Not specified'}
${brief.year_established ? `Established: ${brief.year_established}` : ''}
Description: ${brief.description || 'Not provided'}
${brief.about_detailed ? `About (detailed): ${brief.about_detailed}` : ''}
USP: ${brief.usp || 'Not provided'}
${brief.mission ? `Mission: ${brief.mission}` : ''}
Target Audience: ${brief.target_audience || 'Not specified'}
Customer Pain Points: ${brief.customer_pains || 'Not specified'}
${brief.tone_of_voice ? `Tone of Voice: ${brief.tone_of_voice}` : ''}
${brief.certifications ? `Certifications/Awards: ${brief.certifications}` : ''}
${brief.customer_phrases ? `Phrases customers use: ${brief.customer_phrases}` : ''}
${brief.service_areas ? `Service Areas: ${brief.service_areas}` : ''}
${brief.seo_locations ? `SEO Target Locations: ${brief.seo_locations}` : ''}
${brief.keywords ? `Target Keywords: ${brief.keywords}` : ''}
${brief.website_goal ? `Website Goal: ${brief.website_goal}` : ''}

Services:
${servicesText || '  None listed'}

${faqsText ? `FAQs provided by client:\n${faqsText}` : ''}

${teamText ? `Team Members:\n${teamText}` : ''}

Locations:
${locationsText || '  Not provided'}

Opening Hours:
${hoursText}

Social Media:
${socialText}

Pages selected: ${pagesText || 'Home, About, Services, Contact'}

${brief.hero_headline ? `Client's preferred hero headline: ${brief.hero_headline}` : ''}
${brief.cta_primary ? `Client's preferred primary CTA: ${brief.cta_primary}` : ''}
${brief.cta_secondary ? `Client's preferred secondary CTA: ${brief.cta_secondary}` : ''}
${brief.testimonials ? `Existing testimonials/reviews:\n${brief.testimonials}` : ''}

Package: ${pkg || 'Not specified'}

=== INSTRUCTIONS ===

Generate a JSON object with ALL of the following sections. Every string value must be UK English. Be specific to the ${brief.industry || 'general'} industry — use appropriate terminology, address typical customer concerns, and reference relevant trust signals.

The JSON must have this exact structure:

{
  "meta": {
    "title": "SEO page title (50-60 chars) including business name and primary service",
    "description": "SEO meta description (150-160 chars) with a clear call to action",
    "og_title": "Social sharing title",
    "og_description": "Social sharing description",
    "keywords": ["array", "of", "8-12", "relevant", "keywords"]
  },
  "hero": {
    "headline": "Powerful, benefit-driven headline (max 10 words)",
    "subheadline": "Supporting text that addresses the target audience's main pain point (1-2 sentences)",
    "cta_primary": "Primary call-to-action button text",
    "cta_secondary": "Secondary CTA text (e.g. 'View Our Work', 'Learn More')",
    "trust_stats": [
      { "number": "...", "label": "..." }
    ]
  },
  "about": {
    "headline": "About section headline",
    "body": "2-3 paragraphs about the business, its story, values and what makes it different",
    "values": [
      { "title": "Value name", "description": "Brief description" }
    ]
  },
  "services": [
    {
      "name": "Service name",
      "description": "Compelling 2-3 sentence description",
      "price": "Price if provided, or null",
      "duration": "Duration if provided, or null",
      "benefits": ["3-4 key benefits of this service"]
    }
  ],
  "testimonials_prompts": [
    "5 suggested review prompts the business can send to happy customers to generate Google Reviews"
  ],
  "faq": [
    { "question": "...", "answer": "..." }
  ],
  "contact": {
    "headline": "Contact section headline",
    "subtext": "Encouraging text below the headline",
    "form_cta": "Submit button text"
  },
  "footer": {
    "tagline": "Short footer tagline",
    "copyright": "Copyright line including business name and current year"
  },
  "seo": {
    "schema_type": "The most appropriate schema.org type (e.g. LocalBusiness, Dentist, BeautySalon, etc.)",
    "schema_json": "A complete JSON-LD schema markup string for this business"
  },
  "chatbot_config": ...see instructions below...
}

Important rules:
1. For "hero.trust_stats", generate 3 plausible trust statistics (e.g. "500+" / "Happy Patients", "15+" / "Years Experience"). Use the business info provided; if not enough info, create reasonable industry-appropriate stats.
2. For "about.values", generate 3-4 core values.
3. For "services", use the services provided in the brief. If none provided, generate 3-5 typical services for the industry.
4. For "faq", use the client-provided FAQs if available, and supplement with additional common questions to reach 6-8 total. Answers should be 2-3 sentences.
5. For "testimonials_prompts", write 5 natural-sounding review request messages that the business could text/email to customers after a visit.
6. For "seo.schema_json", generate valid JSON-LD including name, address, telephone, openingHours, and services.
7. ${chatbotInstruction}
8. For the copyright line, use the year 2025.
9. All copy must be original, professional, and persuasive. No placeholder text.

Respond with ONLY the JSON object. No markdown code fences. No explanation.`;
}

// ── Call Claude API ─────────────────────────────────────────────────────

async function callClaude(prompt) {
  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set. Cannot generate content.');
    process.exit(1);
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Claude API');

  // Strip markdown fences if present
  const cleaned = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Claude response as JSON. Raw output:');
    console.error(text.slice(0, 500));
    throw new Error(`JSON parse error: ${e.message}`);
  }
}

// ── Build summary email ─────────────────────────────────────────────────

function buildSummaryHTML(content, businessName) {
  const sections = [];

  if (content.hero) {
    sections.push(`
      <div style="margin-bottom:24px;">
        <h3 style="color:#d4af37;margin:0 0 8px;">Hero Section</h3>
        <p style="font-size:20px;font-weight:700;color:#333;margin:0 0 4px;">${content.hero.headline}</p>
        <p style="color:#666;margin:0;">${content.hero.subheadline}</p>
      </div>`);
  }

  if (content.about) {
    sections.push(`
      <div style="margin-bottom:24px;">
        <h3 style="color:#d4af37;margin:0 0 8px;">About</h3>
        <p style="color:#666;margin:0;">${content.about.body.slice(0, 200)}...</p>
      </div>`);
  }

  if (content.services?.length) {
    const list = content.services.map(s => `<li>${s.name}</li>`).join('');
    sections.push(`
      <div style="margin-bottom:24px;">
        <h3 style="color:#d4af37;margin:0 0 8px;">Services (${content.services.length})</h3>
        <ul style="color:#666;margin:0;padding-left:20px;">${list}</ul>
      </div>`);
  }

  if (content.faq?.length) {
    sections.push(`
      <div style="margin-bottom:24px;">
        <h3 style="color:#d4af37;margin:0 0 8px;">FAQs</h3>
        <p style="color:#666;margin:0;">${content.faq.length} questions and answers generated</p>
      </div>`);
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0a0a0a,#1a1a2e);padding:32px;text-align:center;">
      <h1 style="color:#d4af37;margin:0;font-size:24px;letter-spacing:1px;">SOLIS DIGITAL</h1>
      <p style="color:#999;margin:8px 0 0;font-size:14px;">Website Content Generated</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#333;font-size:16px;line-height:1.6;">
        Hi there,
      </p>
      <p style="color:#333;font-size:16px;line-height:1.6;">
        Great news — we've generated the website copy for <strong>${businessName}</strong>. Here's a preview of what's been created:
      </p>
      ${sections.join('')}
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#333;font-size:14px;">
          <strong>What happens next?</strong><br/>
          Our team will review the generated content, make any final tweaks, and begin building your website in Framer. You'll receive a preview link within the next few days.
        </p>
      </div>
      <p style="color:#333;font-size:16px;line-height:1.6;">
        If you'd like to suggest any changes to the copy, just reply to this email.
      </p>
      <p style="color:#333;font-size:16px;line-height:1.6;">
        Best,<br/>
        <strong>Alex</strong><br/>
        Solis Digital
      </p>
    </div>
    <div style="background:#f8f9fa;padding:16px 32px;text-align:center;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;margin:0;">Solis Digital — More Clients. More Revenue. All On Autopilot.</p>
      <p style="color:#999;font-size:12px;margin:4px 0 0;">
        <a href="https://www.solisdigital.co.uk" style="color:#d4af37;text-decoration:none;">solisdigital.co.uk</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Main ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '');
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
      flags[key] = val;
    }
  }

  if (!flags['project-id']) {
    console.log('Usage:');
    console.log('  node scripts/generate-site-content.mjs --project-id "uuid"');
    console.log('  node scripts/generate-site-content.mjs --project-id "uuid" --output content.json');
    console.log('  node scripts/generate-site-content.mjs --project-id "uuid" --send');
    console.log('\nFlags:');
    console.log('  --output <file>  Save generated JSON to a file');
    console.log('  --send           Email content summary to the client (requires RESEND_API_KEY)');
    process.exit(0);
  }

  // 1. Fetch project
  const projectId = flags['project-id'];
  console.log(`Fetching project ${projectId}...`);

  const project = await query(`/projects?id=eq.${projectId}&select=*`);
  if (!project) {
    console.error('Project not found.');
    process.exit(1);
  }

  const brief = project.brief_data;
  if (!brief) {
    console.error('No brief_data found on this project. Has the client submitted their brief?');
    process.exit(1);
  }

  const businessName = project.business_name || brief.business_name || 'Unknown Business';
  const pkg = project.package || 'Starter';

  console.log(`Business: ${businessName}`);
  console.log(`Package: ${pkg}`);
  console.log(`Industry: ${brief.industry || 'Not specified'}`);
  console.log(`Services: ${(brief.services || []).length}`);
  console.log(`Pages: ${(brief.pages || []).join(', ') || 'Not specified'}`);
  console.log('');

  // 2. Determine if chatbot config is needed
  const includeChatbot = hasChatbot(pkg, brief);
  console.log(`AI Chatbot: ${includeChatbot ? 'Yes (included)' : 'No'}`);

  // 3. Build prompt and call Claude
  console.log('\nGenerating website content with Claude...');
  const prompt = buildPrompt(brief, businessName, pkg, includeChatbot);
  const content = await callClaude(prompt);
  console.log('Content generated successfully.\n');

  // 4. Save to Supabase
  console.log('Saving generated content to Supabase...');
  const saved = await patch(`/projects?id=eq.${projectId}`, {
    generated_content: content,
    content_generated_at: new Date().toISOString()
  });
  if (saved) {
    console.log('Saved to projects.generated_content');
  } else {
    console.error('Warning: failed to save to Supabase. Content still available in output.');
  }

  // 5. Output to file
  if (flags.output) {
    const { writeFileSync } = await import('fs');
    writeFileSync(flags.output, JSON.stringify(content, null, 2));
    console.log(`\nSaved to ${flags.output}`);
  }

  // 6. Send email summary
  if (flags.send) {
    const toEmail = brief.email_main || project.email;
    if (!toEmail) {
      console.error('\nNo client email found. Cannot send.');
    } else if (!RESEND_KEY) {
      console.error('\nRESEND_API_KEY not set. Cannot send email.');
    } else {
      console.log(`\nSending content summary to ${toEmail}...`);
      const html = buildSummaryHTML(content, businessName);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Alex — Solis Digital <alex@solisdigital.co.uk>',
          to: [toEmail],
          subject: `Your website content is ready — ${businessName}`,
          html
        })
      });

      if (res.ok) {
        console.log('Email sent!');
      } else {
        console.error(`Send failed: ${res.status} ${await res.text()}`);
      }
    }
  }

  // 7. Always print JSON to stdout
  console.log('\n--- GENERATED CONTENT ---\n');
  console.log(JSON.stringify(content, null, 2));
}

main().catch(err => {
  console.error(`\nFatal error: ${err.message}`);
  process.exit(1);
});
