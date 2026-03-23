#!/usr/bin/env node
/**
 * Solis Digital — Daily KPI Report
 * Generates a summary of all key metrics and outputs HTML email body.
 * Run via: node scripts/daily-kpi-report.mjs
 * Or trigger via Make.com scheduled scenario at 8am daily.
 */

const SB_URL = 'https://zqcpktpnfikmshqeqxlg.supabase.co/rest/v1';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY3BrdHBuZmlrbXNocWVxeGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDg5MDIsImV4cCI6MjA4ODkyNDkwMn0.whtTwOyOihSqhjPPj8YMEV-T4-m_-jYTWJ2m6LtUYKE';
const HEADERS = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

async function query(endpoint) {
  const res = await fetch(`${SB_URL}${endpoint}`, { headers: HEADERS });
  return res.json();
}

async function run() {
  const now = new Date();
  const yesterday = new Date(now - 86400000).toISOString();

  // Fetch all data
  const [leads, outreach, inquiries, clients, healthChecks] = await Promise.all([
    query('/leads?select=*&order=created_at.desc'),
    query('/outreach?select=*'),
    query(`/inquiries?select=*&created_at=gte.${yesterday}&order=created_at.desc`),
    query('/clients?select=*'),
    query(`/health_checks?select=*&created_at=gte.${yesterday}&order=created_at.desc`),
  ]);

  // Calculate KPIs
  const totalLeads = leads.length;
  const newLeads24h = leads.filter(l => new Date(l.created_at) > new Date(yesterday)).length;
  const audited = leads.filter(l => l.status === 'Audited').length;
  const withEmail = leads.filter(l => l.email).length;
  const withPhone = leads.filter(l => l.phone).length;
  const inOutreach = leads.filter(l => l.status === 'In Outreach').length;
  const replied = leads.filter(l => l.status === 'Replied').length;
  const callsBooked = leads.filter(l => l.status === 'Call Booked').length;
  const clientsWon = clients.length;

  const emailsSent = outreach.length;
  const emailsReplied = outreach.filter(o => o.status === 'Replied').length;
  const emailsInterested = outreach.filter(o => o.status === 'Interested').length;

  const newInquiries = inquiries.length;

  const totalRevenue = clients.reduce((a, c) => a + (parseFloat(c.one_off_revenue) || 0), 0);
  const totalMRR = clients.reduce((a, c) => a + (parseFloat(c.monthly_retainer) || 0), 0);

  // Health check summary
  const healthFailures = healthChecks.filter(h => h.status !== 'ok').length;
  const healthTotal = healthChecks.length;
  const uptimePercent = healthTotal > 0 ? Math.round((1 - healthFailures / healthTotal) * 100) : 100;

  // Top 5 leads to call today
  const topCallLeads = leads
    .filter(l => l.phone && (!l.notes || l.notes.indexOf('Called') === -1))
    .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
    .slice(0, 5);

  // Generate report
  const report = {
    date: now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    pipeline: { totalLeads, newLeads24h, audited, withEmail, withPhone, inOutreach, replied, callsBooked, clientsWon },
    outreach: { emailsSent, emailsReplied, emailsInterested },
    revenue: { totalRevenue, totalMRR },
    health: { uptimePercent, healthFailures, healthTotal },
    inquiries: newInquiries,
    topCallLeads: topCallLeads.map(l => ({
      name: l.business_name,
      phone: l.phone,
      score: l.lead_score,
      speed: l.speed_score
    }))
  };

  // Generate HTML email
  const html = generateEmailHTML(report);

  // Log the action
  await fetch(`${SB_URL}/admin_actions`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      action_type: 'kpi_report',
      description: `Daily KPI report: ${totalLeads} leads, ${emailsSent} emails sent, ${clientsWon} clients, £${totalRevenue} revenue`,
      target: 'daily_report',
      result: 'success',
      details: report
    })
  });

  console.log('\n📊 SOLIS DIGITAL — DAILY KPI REPORT');
  console.log(`📅 ${report.date}\n`);
  console.log('── PIPELINE ──');
  console.log(`  Total Leads: ${totalLeads} (${newLeads24h} new today)`);
  console.log(`  Audited: ${audited} | With Email: ${withEmail} | With Phone: ${withPhone}`);
  console.log(`  In Outreach: ${inOutreach} | Replied: ${replied} | Calls Booked: ${callsBooked}`);
  console.log(`  Clients Won: ${clientsWon}`);
  console.log('\n── OUTREACH ──');
  console.log(`  Emails Sent: ${emailsSent} | Replied: ${emailsReplied} | Interested: ${emailsInterested}`);
  console.log('\n── REVENUE ──');
  console.log(`  One-Off: £${totalRevenue.toLocaleString('en-GB')} | MRR: £${totalMRR.toLocaleString('en-GB')}/mo`);
  console.log('\n── SYSTEM HEALTH ──');
  console.log(`  Uptime: ${uptimePercent}% (${healthFailures} failures / ${healthTotal} checks)`);
  console.log('\n── INQUIRIES (24h) ──');
  console.log(`  New form submissions: ${newInquiries}`);

  if (topCallLeads.length > 0) {
    console.log('\n── TOP 5 LEADS TO CALL TODAY ──');
    topCallLeads.forEach((l, i) => {
      console.log(`  ${i + 1}. ${l.name} — ${l.phone} (Score: ${l.score}, Speed: ${l.speed})`);
    });
  }

  console.log('\n✅ Report generated. HTML email body ready for Make.com/Resend.');

  // Output HTML for Make.com to pick up
  return { report, html };
}

function generateEmailHTML(r) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;color:#eaeaef;padding:32px;margin:0">
<div style="max-width:600px;margin:0 auto;background:#111216;border-radius:12px;overflow:hidden;border:1px solid #1c1d24">
  <div style="background:#15161b;padding:24px 32px;border-bottom:1px solid #1c1d24">
    <h1 style="margin:0;font-size:20px;color:#e8a23a">☀️ Solis Daily Report</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#5c5d72">${r.date}</p>
  </div>
  <div style="padding:24px 32px">
    <h2 style="font-size:14px;color:#8e8fa3;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px">Pipeline</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#8e8fa3;font-size:13px">Total Leads</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:18px;color:#fff">${r.pipeline.totalLeads}</td></tr>
      <tr><td style="padding:8px 0;color:#8e8fa3;font-size:13px">New Today</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:18px;color:#60a5fa">${r.pipeline.newLeads24h}</td></tr>
      <tr><td style="padding:8px 0;color:#8e8fa3;font-size:13px">In Outreach</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:18px;color:#a78bfa">${r.pipeline.inOutreach}</td></tr>
      <tr><td style="padding:8px 0;color:#8e8fa3;font-size:13px">Replied</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:18px;color:#e8a23a">${r.pipeline.replied}</td></tr>
      <tr><td style="padding:8px 0;color:#8e8fa3;font-size:13px">Calls Booked</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:18px;color:#34d399">${r.pipeline.callsBooked}</td></tr>
      <tr><td style="padding:8px 0;color:#8e8fa3;font-size:13px">Clients Won</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:18px;color:#34d399">${r.pipeline.clientsWon}</td></tr>
    </table>
    <div style="border-top:1px solid #1c1d24;margin:20px 0"></div>
    <h2 style="font-size:14px;color:#8e8fa3;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px">Revenue</h2>
    <table style="width:100%">
      <tr><td style="padding:8px 0;color:#8e8fa3;font-size:13px">One-Off</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:18px;color:#e8a23a">£${r.revenue.totalRevenue.toLocaleString('en-GB')}</td></tr>
      <tr><td style="padding:8px 0;color:#8e8fa3;font-size:13px">Monthly Recurring</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:18px;color:#34d399">£${r.revenue.totalMRR.toLocaleString('en-GB')}/mo</td></tr>
    </table>
    <div style="border-top:1px solid #1c1d24;margin:20px 0"></div>
    <h2 style="font-size:14px;color:#8e8fa3;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px">System Health</h2>
    <p style="font-size:24px;font-weight:900;margin:0;color:${r.health.uptimePercent >= 99 ? '#34d399' : r.health.uptimePercent >= 95 ? '#e8a23a' : '#f87171'}">${r.health.uptimePercent}% Uptime</p>
    ${r.topCallLeads.length > 0 ? `
    <div style="border-top:1px solid #1c1d24;margin:20px 0"></div>
    <h2 style="font-size:14px;color:#8e8fa3;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 16px">Top Leads to Call</h2>
    ${r.topCallLeads.map((l, i) => `<p style="margin:4px 0;font-size:13px;color:#eaeaef"><strong>${i + 1}. ${l.name}</strong> — <a href="tel:${l.phone}" style="color:#e8a23a">${l.phone}</a> (Score: ${l.score})</p>`).join('')}
    ` : ''}
  </div>
  <div style="padding:16px 32px;background:#0c0d10;text-align:center;border-top:1px solid #1c1d24">
    <a href="https://www.solisdigital.co.uk/dashboard.html" style="color:#e8a23a;font-size:13px;font-weight:700;text-decoration:none">Open Command Centre →</a>
  </div>
</div>
</body>
</html>`.trim();
}

run().catch(console.error);
