# BLSS website + AI assistant — self-hosted package

This package has two parts:

```
site/
  index.html         The full BLSS website
  assets/             School crest plus the supplied BLSS photos and videos
  chat-widget.js      The chat widget (floating button + panel)
  chat-widget.css     Widget styling (BLSS navy/gold, matches the site)
server/
  server.js            Express backend that calls Groq's API
  package.json
  .env.example          Copy to .env and add your Groq key
```

The browser **never** talks to Groq directly — it only talks to your own
`server/`, which holds the Groq API key server-side. This is the standard
reason to use a backend at all here: an API key shipped in client-side
JavaScript is visible to anyone who opens dev tools.

## 1. Run the backend

```bash
cd server
npm install
cp .env.example .env
# edit .env and paste your Groq key (https://console.groq.com/keys)
npm start
```

This starts the API on `http://localhost:3000`. Check it's alive:

```bash
curl http://localhost:3000/healthz
# {"ok":true}
```

## 2. Point the widget at your backend

In `site/index.html`, near the closing `</body>` tag:

```html
<script>
  window.BLSS_CHAT_API_URL = "http://localhost:3000/api/chat";
</script>
```

For local testing this is already set correctly. Once you deploy the
backend (step 4), change this to your real backend URL, e.g.
`https://blss-assistant-api.onrender.com/api/chat`.

## 3. Open the site

`site/index.html` is a single self-contained file (photos are embedded as
base64, no build step). Open it directly in a browser, or serve the whole
`site/` folder with any static file server:

```bash
cd site
npx serve .
```

## 4. Deploying for real

**Backend (`server/`)** — any Node host works: Render, Railway, Fly.io, a
plain VPS with `pm2`, etc. Set the same environment variables from
`.env.example` in that host's dashboard — **never commit your real `.env`
file**. Once deployed, set `ALLOWED_ORIGIN` in that host's env vars to your
actual website domain (e.g. `https://blss.ac.tz`) so random sites can't call
your API and burn your Groq quota.

**Frontend (`site/`)** — any static host: GitHub Pages, Netlify, Vercel,
cPanel, or wherever the school's domain already points. Just update
`BLSS_CHAT_API_URL` to the deployed backend's address before you upload.

## Updating what the assistant knows

The assistant is grounded in a fact block inside `server/server.js`
(`buildSystemPrompt`). When the school's real fees, dates, results, or
contact details change, edit that block — the assistant will never say
anything not written there. It's deliberately kept in the backend (not the
widget) so you can update school facts without touching the public site.

## Model & cost notes

- Default model: `llama-3.3-70b-versatile` (good quality, handles Swahili
  and English well). A faster/cheaper option is `llama-3.1-8b-instant` —
  change `GROQ_MODEL` in `.env`.
- The backend rate-limits each visitor to 20 messages/minute as a basic
  abuse guard. Groq's own free-tier rate limits still apply on top of that.
- Conversation history is kept client-side only (in the browser tab) and
  sent with each request — the backend has no memory or database. If you
  later want staff to see what visitors are asking (as described in the
  proposal's "unanswered questions" feature), that needs a small database
  added to `server.js` to log each exchange — happy to help with that next
  when you're ready.

## What's intentionally NOT included yet

Per the original proposal, these are later-phase items, not part of this
chatbot drop-in:
- Secure parent login / student-specific info
- WhatsApp handover automation (the assistant tells visitors the phone
  numbers; actually connecting to WhatsApp Business API is a separate
  integration)
- Staff-facing inquiry log / dashboard of unanswered questions
- Bilingual CMS for non-technical staff to edit site content

None of these block launching the chatbot as described in the proposal —
they're the natural next phases.


## Supplied media

The supplied BLSS photo and video assets are stored under `site/assets/media/`
and are used in the appropriate school-life, campus, and school-identity sections
of the website. The original embedded site content has been preserved; the new
media was added without changing the chatbot backend or its configuration.
