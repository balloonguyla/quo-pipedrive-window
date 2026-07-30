const { verifyRequest, quoFetch, toE164, sendError, readJsonBody } = require('./_lib/helpers');

/**
 * POST /api/send-message  { to, from, content }
 * Sends an SMS through Quo. `from` is one of your Quo numbers in E.164.
 */
module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      const e = new Error('Method not allowed');
      e.status = 405;
      throw e;
    }
    verifyRequest(req);
    const body = await readJsonBody(req);
    const to = toE164(body.to);
    const from = toE164(body.from);
    const content = (body.content || '').trim();
    if (!to || !from || !content) {
      const e = new Error('to, from, and content are required');
      e.status = 400;
      throw e;
    }
    const result = await quoFetch('/messages', {
      method: 'POST',
      body: JSON.stringify({ content, from, to: [to] }),
    });
    res.status(200).json({ ok: true, message: result.data || result });
  } catch (err) {
    sendError(res, err);
  }
};
