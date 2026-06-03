# 📡 Turning on live data (2 minutes, no API key)

The app pulls **live price + ratios from Yahoo Finance** — which needs **no API key, no signup.**
The only catch: Yahoo blocks direct browser calls, so we put a tiny free proxy in front of it.
That proxy is `worker.js` (a Cloudflare Worker). Deploy it once and you're done forever.

> Why a proxy and not just a key? No key to leak, no quota to burn, no provider account.
> The proxy reads Yahoo server-side and hands the app clean JSON.

---

## ✅ On Vercel (detective.asion.ai)? It's already done.

This repo ships **`api/quote.js`** — a Vercel serverless function that runs *same-origin* at
**`/api/quote`**. Vercel auto-detects anything in `/api`, so it deploys automatically on every push.
The app already points to it by default (`DEFAULT_PROXY = "/api/quote"` in `js/app.js`).

**You don't have to do anything** — live data is on for everyone the moment Vercel finishes building.
Verify after a deploy: open `https://detective.asion.ai/api/quote?ticker=AAPL` → you'll see live JSON.

The rest of this file (the Cloudflare Worker) is only for hosting the app *somewhere other than Vercel*.

---

## Alternative: deploy the Cloudflare Worker (copy-paste, no install)

1. Go to **https://dash.cloudflare.com** → sign up / log in (free).
2. Left sidebar → **Workers & Pages** → **Create** → **Create Worker**.
3. Name it something like `detective-quotes` → **Deploy**.
4. Click **Edit code**. Delete the sample code, **paste the entire contents of `worker.js`**, then **Deploy** (top right).
5. Copy your Worker URL — it looks like `https://detective-quotes.YOURNAME.workers.dev`.
6. Test it in your browser: open `https://detective-quotes.YOURNAME.workers.dev/?ticker=AAPL`
   — you should see JSON with `price`, `fin`, `dcf`. ✅

That's it. The Worker caches each ticker for 10 minutes, so a whole class barely touches Yahoo.

---

## Point the app at it

**Either** (per-device):
- In the app, click **⚙ Live data** → paste the Worker URL → **Save**. Stored only in your browser.

**Or** (site-wide, recommended for detective.asion.ai):
- Send me the Worker URL and I'll set it as the **default** in `js/app.js` (`DEFAULT_PROXY`),
  commit, and push — then live data works for **everyone** who opens the site, with nothing to paste.

---

## Prefer to host the proxy on your own domain?

If `detective.asion.ai` is on **Vercel / Netlify / Cloudflare Pages**, the same logic can run as a
same-origin function (e.g. `detective.asion.ai/api/quote`) — no separate Worker, no CORS at all.
Tell me your host and I'll provide that version instead.

---

## Notes & limits
- Data is **delayed** (Yahoo's free feed) and for **education only — not financial advice.**
- Yahoo is an unofficial source; if it ever rate-limits the proxy, the app automatically falls back
  to the built-in teaching figures and shows a friendly message. The 10-min cache keeps usage tiny.
- Works for any normal US-listed ticker (AAPL, NVDA, COST…). Some obscure/foreign tickers may lack
  fields; the app just leaves those blank for you to fill in.
