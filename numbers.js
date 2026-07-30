const { verifyRequest, quoFetch, sendError } = require('./_lib/helpers');

/** GET /api/numbers — list the workspace's Quo phone numbers (for the "call/text from" picker). */
module.exports = async (req, res) => {
  try {
    verifyRequest(req);
    const data = await quoFetch('/phone-numbers');
    const numbers = (data.data || []).map((n) => ({
      id: n.id,
      number: n.number || n.phoneNumber || n.formattedNumber || '',
      name: n.name || n.symbolName || '',
    }));
    res.status(200).json({ numbers });
  } catch (err) {
    sendError(res, err);
  }
};
