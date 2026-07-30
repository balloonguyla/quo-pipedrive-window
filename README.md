# Quo floating window for Pipedrive

A Pipedrive [custom floating window](https://pipedrive.readme.io/docs/custom-ui-extensions-floating-window) that puts Quo (formerly OpenPhone) inside Pipedrive: click-to-call, send texts, see recent call/text history, and log activities to the timeline.

**Setup:** see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

## How it works

- `index.html` — the floating window UI. Loads the Pipedrive App Extensions SDK, listens for the phone number the user clicked, and talks to the serverless API below.
- `api/numbers.js` — lists your Quo phone numbers.
- `api/history.js` — merged recent calls + messages with the contact.
- `api/send-message.js` — sends an SMS via the Quo API.
- `api/log-activity.js` — creates a done activity in Pipedrive (uses your API token).
- `api/callback.js` — OAuth callback that completes app installation.

Every API route verifies the Pipedrive-signed JWT (passed to the iframe as `?token=`) before touching your Quo or Pipedrive credentials, which live only in Vercel environment variables.

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `QUO_API_KEY` | yes | Quo API key (Workspace settings → Integrations → API) |
| `PIPEDRIVE_CLIENT_ID` | yes | From Developer Hub → your app → OAuth |
| `PIPEDRIVE_CLIENT_SECRET` | yes | Same page; also used to verify the iframe JWT |
| `PIPEDRIVE_JWT_SECRET` | no | Only if you set a custom JWT secret on the floating window |
| `PIPEDRIVE_API_TOKEN` | for logging | Personal preferences → API in your live account |
| `PIPEDRIVE_COMPANY_DOMAIN` | for logging | e.g. `theballoonguyla` for theballoonguyla.pipedrive.com |
| `QUO_API_BASE` | no | Defaults to `https://api.quo.com/v1` |
