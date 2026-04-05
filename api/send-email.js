// api/send-email.js
// Vercel Serverless Function — runs on the server, never exposed to browser
// 
// Required Vercel Environment Variables (set in Vercel Dashboard):
//   RESEND_API_KEY   — from resend.com (free, 100 emails/day)
//   TO_EMAIL         — er.krishnagaur01@gmail.com
//
// How to set them:
//   1. Go to vercel.com → your project → Settings → Environment Variables
//   2. Add RESEND_API_KEY = (your key from resend.com)
//   3. Add TO_EMAIL = er.krishnagaur01@gmail.com
//   4. Redeploy. Done.

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, day, plan_type, activities, localities, vibe, time, note } = req.body;

  // Basic validation
  if (!day || !plan_type) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const apiKey  = process.env.RESEND_API_KEY;
  const toEmail = process.env.TO_EMAIL;

  if (!apiKey || !toEmail) {
    console.error('[DatePlan] Missing environment variables');
    return res.status(200).json({ ok: true });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Date Planner <onboarding@resend.dev>',
        to: [toEmail],
        subject: `New Plan from ${name || 'Secret admirer'} — ${day}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:28px;background:#fff8f4;border-radius:14px;">
            <h2 style="color:#c9607a;font-family:Georgia,serif;margin-bottom:4px;">NEW DATE PLAN REQUEST</h2>
            <p style="color:#888;font-size:13px;margin-bottom:20px;">Someone just set their vibe 🌸</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#999;width:110px;font-size:13px;">💌 From</td><td style="font-weight:600;color:#2a1a20;">${name || 'Secret admirer'}</td></tr>
              <tr><td style="padding:8px 0;color:#999;font-size:13px;">📅 Day</td><td style="font-weight:600;color:#2a1a20;">${day}</td></tr>
              <tr><td style="padding:8px 0;color:#999;font-size:13px;">🌟 Type</td><td style="font-weight:600;color:#2a1a20;">${plan_type}</td></tr>
              <tr><td style="padding:8px 0;color:#999;font-size:13px;">🎯 Out Items</td><td style="font-weight:600;color:#2a1a20;">${activities || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#999;font-size:13px;">📍 Areas</td><td style="font-weight:600;color:#2a1a20;">${localities || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#999;font-size:13px;">✨ Vibe</td><td style="font-weight:600;color:#2a1a20;">${vibe || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#999;font-size:13px;">🕐 Time</td><td style="font-weight:600;color:#2a1a20;">${time || '—'}</td></tr>
              ${note && note !== '—' ? `<tr><td style="padding:8px 0;color:#999;font-size:13px;">💬 Note</td><td style="font-weight:600;color:#2a1a20;">${note}</td></tr>` : ''}
            </table>
            <p style="margin-top:24px;color:#c9607a;font-style:italic;font-size:14px;">Go plan something wonderful. 🚀</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('[DatePlan] Resend error:', err);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[DatePlan] Fetch error:', err);
    return res.status(200).json({ ok: true });
  }

}
