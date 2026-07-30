// Smoke test: JWT verification round-trip + handler wiring with mocked req/res.
const jwt = require('jsonwebtoken');
process.env.PIPEDRIVE_CLIENT_SECRET = 'test-secret';
process.env.QUO_API_KEY = 'fake-key';

const token = jwt.sign({ user_id: 1, company_id: 2 }, 'test-secret', { expiresIn: '5m' });
const badToken = jwt.sign({ user_id: 1 }, 'wrong-secret');

const { verifyRequest, toE164 } = require('../api/_lib/helpers');

// 1. JWT verify
const payload = verifyRequest({ headers: { 'x-pipedrive-token': token } });
console.assert(payload.user_id === 1, 'JWT payload decode failed');
let threw = false;
try { verifyRequest({ headers: { 'x-pipedrive-token': badToken } }); } catch (e) { threw = e.status === 401; }
console.assert(threw, 'Bad JWT should throw 401');
threw = false;
try { verifyRequest({ headers: {} }); } catch (e) { threw = e.status === 401; }
console.assert(threw, 'Missing JWT should throw 401');

// 2. E.164 normalization
console.assert(toE164('(555) 123-4567') === '+15551234567', 'toE164 10-digit failed');
console.assert(toE164('1 555 123 4567') === '+15551234567', 'toE164 11-digit failed');
console.assert(toE164('+447700900123') === '+447700900123', 'toE164 intl failed');

// 3. Handler wiring with mocked fetch
function mockRes() {
  const r = { code: null, body: null };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.setHeader = () => {};
  r.send = (b) => { r.body = b; return r; };
  return r;
}

global.fetch = async (url) => ({
  ok: true,
  json: async () => {
    if (String(url).includes('/phone-numbers')) {
      return { data: [{ id: 'PN1', number: '+15559990000', name: 'Main' }] };
    }
    if (String(url).includes('/messages')) {
      return { data: [{ direction: 'outgoing', text: 'hi', status: 'delivered', createdAt: '2026-07-29T20:00:00Z' }] };
    }
    if (String(url).includes('/calls')) {
      return { data: [{ direction: 'incoming', status: 'completed', duration: 120, createdAt: '2026-07-30T01:00:00Z' }] };
    }
    return {};
  },
});

(async () => {
  const numbers = require('../api/numbers');
  let res = mockRes();
  await numbers({ headers: { 'x-pipedrive-token': token } }, res);
  console.assert(res.code === 200 && res.body.numbers[0].id === 'PN1', 'numbers handler failed: ' + JSON.stringify(res.body));

  const history = require('../api/history');
  res = mockRes();
  await history({ headers: { 'x-pipedrive-token': token }, url: '/api/history?phone=%2B15551234567&phoneNumberId=PN1' }, res);
  console.assert(res.code === 200 && res.body.items.length === 2, 'history handler failed: ' + JSON.stringify(res.body));
  console.assert(res.body.items[0].kind === 'call', 'history should be sorted newest-first');

  const send = require('../api/send-message');
  res = mockRes();
  await send({ method: 'POST', headers: { 'x-pipedrive-token': token }, body: { to: '5551234567', from: '+15559990000', content: 'hello' } }, res);
  console.assert(res.code === 200 && res.body.ok, 'send-message handler failed: ' + JSON.stringify(res.body));

  // unauthorized request is rejected before any external call
  res = mockRes();
  await send({ method: 'POST', headers: {}, body: {} }, res);
  console.assert(res.code === 401, 'send-message should 401 without token');

  console.log('All smoke tests passed ✓');
})();
