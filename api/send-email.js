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

  const { day, plan_type, mood, activities, locality } = req.body;

  // Basic validation
  if (!day || !plan_type || !activities || !locality) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const apiKey  = process.env.RESEND_API_KEY;
  const toEmail = process.env.TO_EMAIL;

  if (!apiKey || !toEmail) {
    console.error('[DatePlan] Missing environment variables');
    // Return success to client anyway — don't expose config errors
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
        subject: `🗓️ Date Plan — ${day} (${plan_type})`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#fff8f8;border-radius:12px;">
            <h2 style="color:#4a0e1f;">New Date Preference 💌</h2>
            <table style="width:100%;border-collapse:collapse;margin-top:16px;">
              <tr><td style="padding:8px 0;color:#888;width:120px;">📅 Day</td><td style="font-weight:600;">${day}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">🌟 Plan Type</td><td style="font-weight:600;">${plan_type}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">😌 Mood</td><td style="font-weight:600;">${mood || 'Not selected'}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">🎯 Activities</td><td style="font-weight:600;">${activities}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">📍 Locality</td><td style="font-weight:600;">${locality}</td></tr>
            </table>
            <p style="margin-top:24px;color:#4a0e1f;font-style:italic;">Go plan something awesome. 🚀</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('[DatePlan] Resend error:', err);
    }

    // Always return success to the client — never expose errors
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[DatePlan] Fetch error:', err);
    return res.status(200).json({ ok: true }); // Fail silently to client
  }
}
