const { verifyRequest, sendError, readJsonBody } = require('./_lib/helpers');

/**
 * POST /api/log-activity  { subject, note, type, personId, dealId, orgId }
 * Creates a done activity on the Pipedrive record so the touchpoint shows in the timeline.
 * Requires PIPEDRIVE_API_TOKEN and PIPEDRIVE_COMPANY_DOMAIN env vars.
 * (Note: Quo's native Pipedrive integration also auto-logs synced calls/texts —
 * this endpoint is for manual notes/outcomes from the floating window.)
 */
module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      const e = new Error('Method not allowed');
      e.status = 405;
      throw e;
    }
    verifyRequest(req);

    const apiToken = process.env.PIPEDRIVE_API_TOKEN;
    const domain = process.env.PIPEDRIVE_COMPANY_DOMAIN; // e.g. "theballoonguy" from theballoonguy.pipedrive.com
    if (!apiToken || !domain) {
      const e = new Error('Activity logging is not configured (set PIPEDRIVE_API_TOKEN and PIPEDRIVE_COMPANY_DOMAIN)');
      e.status = 500;
      throw e;
    }

    const body = await readJsonBody(req);
    const subject = (body.subject || 'Quo call').slice(0, 255);
    const payload = {
      subject,
      type: body.type === 'sms' ? 'call' : (body.type || 'call'), // "call" is a default Pipedrive activity type key
      done: 1,
      note: body.note || '',
    };
    if (body.personId) payload.person_id = Number(body.personId);
    if (body.dealId) payload.deal_id = Number(body.dealId);
    if (body.orgId) payload.org_id = Number(body.orgId);

    const pdRes = await fetch(
      `https://${domain}.pipedrive.com/api/v1/activities?api_token=${encodeURIComponent(apiToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const pdBody = await pdRes.json().catch(() => ({}));
    if (!pdRes.ok || pdBody.success === false) {
      const e = new Error((pdBody.error || `Pipedrive API error (HTTP ${pdRes.status})`));
      e.status = pdRes.status || 500;
      e.detail = pdBody;
      throw e;
    }
    res.status(200).json({ ok: true, activityId: pdBody.data && pdBody.data.id });
  } catch (err) {
    sendError(res, err);
  }
};
