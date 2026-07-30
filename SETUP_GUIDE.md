# Quo + Pipedrive Floating Window — Setup Guide

You're setting up two things that work together:

1. **Quo's native Pipedrive integration** — auto-syncs your calls, texts, voicemails, recordings, and AI call summaries onto Pipedrive contacts. No code needed.
2. **A custom floating window app** (the code in this folder) — a Quo panel *inside* Pipedrive. Click any phone number in Pipedrive and get: a Call button that opens Quo, a text composer that sends through your Quo number, the contact's recent call/text history, and one-click activity logging.

Total setup time: roughly 30–45 minutes. No coding required — just copy-pasting values.

---

## Part 1 — Turn on Quo's native Pipedrive sync (5 min)

1. Open the Quo web or desktop app.
2. Go to **Workspace settings → Integrations → Pipedrive**.
3. Connect your Pipedrive account and choose which Quo numbers should sync activity into Pipedrive.

> Requires Quo **Business or Scale** plan.

## Part 2 — Get your Quo API key (2 min)

1. In Quo, go to **Workspace settings → Integrations → API**.
2. Generate an API key and copy it somewhere safe. You'll paste it into Vercel as `QUO_API_KEY` in Part 3.

## Part 3 — Deploy the app to Vercel (10 min)

The floating window needs a public HTTPS home. Vercel's free tier is perfect.

**Option A — via GitHub (recommended, easiest updates later):**

1. Create a free account at github.com if you don't have one.
2. Create a new repository (e.g. `quo-pipedrive-window`), click **"uploading an existing file"**, and drag in everything from this folder (including the `api` folder).
3. Create a free account at vercel.com (sign in with GitHub).
4. Click **Add New → Project**, import your repo, and click **Deploy**. Leave all build settings at their defaults.
5. Note your app URL, e.g. `https://quo-pipedrive-window.vercel.app`.

**Option B — via command line:** if you're comfortable in a terminal, run `npx vercel --prod` inside this folder and follow the prompts.

**Then add environment variables** (Vercel → your project → **Settings → Environment Variables**). Add these now; two come later:

| Variable | Value | When |
|---|---|---|
| `QUO_API_KEY` | Your Quo API key from Part 2 | Now |
| `PIPEDRIVE_API_TOKEN` | From your **live** Pipedrive: click your profile picture → Personal preferences → API | Now |
| `PIPEDRIVE_COMPANY_DOMAIN` | The first part of your Pipedrive URL — if you log in at `theballoonguyla.pipedrive.com`, enter `theballoonguyla` | Now |
| `PIPEDRIVE_CLIENT_ID` | From Developer Hub (Part 4, step 6) | After Part 4 |
| `PIPEDRIVE_CLIENT_SECRET` | From Developer Hub (Part 4, step 6) | After Part 4 |

After adding or changing variables, go to **Deployments → ⋯ → Redeploy** so they take effect.

## Part 4 — Create the Pipedrive app (15 min)

Pipedrive requires apps to be registered from a free **developer sandbox** (a separate practice Pipedrive account).

1. Go to [developers.pipedrive.com](https://developers.pipedrive.com) and sign up for a **developer sandbox account**.
2. In the sandbox, go to **Settings (gear) → Developer Hub → Create an app → Create private app**.
3. **Basic info:**
   - App name: `Quo`
   - Callback URL: `https://YOUR-APP.vercel.app/api/callback` (use your real Vercel URL)
4. **OAuth & access scopes:** enable **Base/Basic** and **Phone-calls** (the scope for caller integrations). Others aren't needed — the app uses your API token for logging.
5. **App extensions tab → Add custom floating window:**
   - Name: `Quo`  ·  Description: `Call, text, and log Quo activity without leaving Pipedrive`
   - Iframe URL: `https://YOUR-APP.vercel.app/` (must be https)
   - JWT secret: **leave blank** (it defaults to your client secret, which the app expects)
   - Entry points: enable **Apps dock**, **Phone numbers**, and **Calls tab**
6. Copy the **Client ID** and **Client secret** from the OAuth tab → paste into Vercel as `PIPEDRIVE_CLIENT_ID` / `PIPEDRIVE_CLIENT_SECRET` → **redeploy** (Part 3).
7. **Test in the sandbox:** use the app's preview/install option in Developer Hub, then open a Person in your sandbox that has a phone number and click the number. The Quo window should open. (Your real Quo numbers will load, since the Quo API key is live.)

## Part 5 — Install it in your real Pipedrive (5 min)

Draft apps only work in the sandbox, so flip it live:

1. In Developer Hub, open your app and click **"Change to live"** (private apps skip marketplace review; note this can't be reverted to draft).
2. Click the **⋯ menu → Share app** and copy the **installation link**.
3. Open that link in a browser where you're logged into your **real** Pipedrive account (theballoonguyla) and click **Allow & Install**. You should land on a "Quo for Pipedrive installed 🎉" page.

## Part 6 — Make click-to-call open Quo (2 min)

The Call button uses a `tel:` link, so your computer needs to know Quo handles calls:

- **Mac:** open the Quo desktop app → Settings → enable it as your **default calling app** (also check System Settings if another app is claiming tel links).
- **Windows:** Settings → Apps → Default apps → set **Quo** for the `TEL` link type.

## Done — how to use it

- Click **any phone number** in Pipedrive → the Quo window opens with that number pre-filled → hit **Call with Quo** or type a text and hit **Send**.
- Texts sent with "Log to Pipedrive" checked create a done activity on the person/deal automatically (when Pipedrive tells the window which person you're viewing).
- Open it any time from the **puzzle icon** (apps dock) in Pipedrive's top bar and type a number manually.
- The **Recent activity** card shows the contact's last calls and texts with your selected Quo number.

## Troubleshooting

- **Window is blank** — the iframe URL in Developer Hub must exactly match your Vercel URL over https, and the page must load within 10 seconds. Open the URL directly in a browser tab; you should see the Quo panel.
- **"Invalid Pipedrive token"** — `PIPEDRIVE_CLIENT_SECRET` in Vercel doesn't match the app's client secret in Developer Hub, or you set a custom JWT secret in the floating-window settings (then set it in Vercel as `PIPEDRIVE_JWT_SECRET`). Redeploy after fixing.
- **"No Quo numbers found" / errors loading numbers** — check `QUO_API_KEY` and that your Quo plan includes API access (Business/Scale).
- **Number doesn't auto-fill when clicking a phone number** — open the little **"Debug: context from Pipedrive"** section at the bottom of the window, click a phone number again, and send me the JSON it shows — I'll adjust the field mapping in one minute.
- **Call button does nothing** — your OS doesn't have a tel handler set (Part 6), or the browser blocked the popup — click again after interacting with the window.
- **Activity logging fails** — check `PIPEDRIVE_API_TOKEN` and `PIPEDRIVE_COMPANY_DOMAIN` (just the subdomain, no `.pipedrive.com`).
