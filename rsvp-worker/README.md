# RSVP relay (Cloudflare Worker)

> **Not deployed by default.** `final/index.html` has `RSVP_ENDPOINT = ""`,
> so RSVP buttons use plain `mailto:` links until this Worker is deployed and
> its URL pasted in. The site itself is back on plain GitHub Pages — no
> server of its own — so this Worker (free tier) is the option if you want
> real emails without adding one.

Why this exists: a static page with no server of its own can't
hold a secret, and **Resend's API doesn't send CORS headers**, so the browser
refuses a direct `fetch()` to `api.resend.com` no matter how the key is
scoped (send-only or not — CORS is a browser rule, not a key permission).
This Worker is the smallest thing that fixes that: it holds the Resend key
server-side and adds the CORS header the page needs.

Free tier is enough (100k requests/day) — a wedding invite RSVP won't get
close to that.

## Deploy (~2 minutes)

```bash
cd rsvp-worker
npm install -g wrangler   # if you don't have it
wrangler login
wrangler secret put RESEND_API_KEY   # paste the send-only key
wrangler secret put TO_EMAIL         # e.g. mieguelesofia@example.com
wrangler deploy
```

That prints a URL like `https://ms-o-jogo-rsvp.<your-subdomain>.workers.dev`.

## Wire it to the site

Open `final/index.html`, find `var RSVP_ENDPOINT=""` near the top of the
`<script>`, and paste the Worker URL in:

```js
var RSVP_ENDPOINT="https://ms-o-jogo-rsvp.<your-subdomain>.workers.dev";
```

Commit and push. Until this is set, the RSVP buttons keep working as plain
`mailto:` links (today's behaviour) — nothing breaks in the meantime.

## Notes

- **Sender**: defaults to `onboarding@resend.dev`, Resend's shared test address.
  In test mode Resend only delivers to the account's own registered email —
  which is exactly `TO_EMAIL` here (every RSVP goes to one fixed inbox: the
  couple's), so **no domain verification is needed** for this to work as-is.
  If you'd rather send from a real domain later, verify one in Resend and set
  `FROM_EMAIL` in `wrangler.toml`.
- **CORS**: `ALLOWED_ORIGIN` is `*` for now (works from anywhere, including
  local testing). Once the Pages URL/domain is final, tighten it to that
  origin — `wrangler.toml` has the line, redeploy after changing it.
- Nothing here reads or stores the guest list — it only relays whatever the
  RSVP button sends (name(s), card, yes/no) straight into one email.
