const { verifyRequest, quoFetch, toE164, sendError } = require('./_lib/helpers');

/**
 * GET /api/history?phone=+15551234567&phoneNumberId=PNxxxx
 * Returns the contact's recent Quo calls + messages (merged, newest first).
 */
module.exports = async (req, res) => {
  try {
    verifyRequest(req);
    const url = new URL(req.url, 'http://localhost');
    const phone = toE164(url.searchParams.get('phone'));
    const phoneNumberId = url.searchParams.get('phoneNumberId');
    if (!phone || !phoneNumberId) {
      const e = new Error('phone and phoneNumberId are required');
      e.status = 400;
      throw e;
    }

    const qs = new URLSearchParams();
    qs.append('phoneNumberId', phoneNumberId);
    qs.append('participants', phone);
    qs.append('maxResults', '20');

    const [messagesRes, callsRes] = await Promise.allSettled([
      quoFetch(`/messages?${qs.toString()}`),
      quoFetch(`/calls?${qs.toString()}`),
    ]);

    const items = [];
    if (messagesRes.status === 'fulfilled') {
      for (const m of messagesRes.value.data || []) {
        items.push({
          kind: 'message',
          direction: m.direction, // incoming | outgoing
          text: m.text || '',
          status: m.status,
          createdAt: m.createdAt,
        });
      }
    }
    if (callsRes.status === 'fulfilled') {
      for (const c of callsRes.value.data || []) {
        items.push({
          kind: 'call',
          direction: c.direction,
          status: c.status, // e.g. completed, missed, no-answer, voicemail
          duration: c.duration || 0,
          createdAt: c.createdAt,
        });
      }
    }

    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const warnings = [];
    if (messagesRes.status === 'rejected') warnings.push(`messages: ${messagesRes.reason.message}`);
    if (callsRes.status === 'rejected') warnings.push(`calls: ${callsRes.reason.message}`);

    res.status(200).json({ items: items.slice(0, 30), warnings });
  } catch (err) {
    sendError(res, err);
  }
};
