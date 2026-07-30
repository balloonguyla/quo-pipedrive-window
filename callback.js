/**
 * GET /api/callback — OAuth callback for app installation.
 * Pipedrive redirects here after a user authorizes the app. We exchange the
 * code for tokens to complete the install cleanly (tokens are not stored —
 * this app talks to Pipedrive with your API token instead).
 * Set this URL as the "Callback URL" in Developer Hub.
 */
module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const code = url.searchParams.get('code');
  const clientId = process.env.PIPEDRIVE_CLIENT_ID;
  const clientSecret = process.env.PIPEDRIVE_CLIENT_SECRET;

  let exchanged = false;
  if (code && clientId && clientSecret) {
    try {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const tokenRes = await fetch('https://oauth.pipedrive.com/oauth/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: `https://${req.headers.host}/api/callback`,
        }).toString(),
      });
      exchanged = tokenRes.ok;
    } catch (_) {
      exchanged = false;
    }
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Quo for Pipedrive</title>
<style>body{font-family:-apple-system,Segoe UI,sans-serif;display:grid;place-items:center;height:100vh;margin:0;background:#f7f7fb;color:#26272b}
.card{background:#fff;border:1px solid #e5e5ec;border-radius:12px;padding:32px 40px;text-align:center;max-width:420px}
h1{font-size:20px;margin:0 0 8px}p{margin:0;color:#5a5b63;font-size:14px;line-height:1.5}</style></head>
<body><div class="card">
<h1>${exchanged ? 'Quo for Pipedrive installed 🎉' : 'Almost there'}</h1>
<p>${
    exchanged
      ? 'You can close this tab and head back to Pipedrive. Click any phone number or open the apps dock (puzzle icon) to use the Quo window.'
      : 'Installation was authorized. If the app does not appear in Pipedrive, check that PIPEDRIVE_CLIENT_ID and PIPEDRIVE_CLIENT_SECRET are set in Vercel and reinstall.'
  }</p>
</div></body></html>`);
};
