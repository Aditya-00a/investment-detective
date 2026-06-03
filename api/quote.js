/**
 * THE INVESTMENT DETECTIVE — live-data function (Vercel serverless)
 * ----------------------------------------------------------------
 * Runs same-origin at /api/quote on detective.asion.ai. Reads quotes +
 * fundamentals from Yahoo Finance (NO API KEY) and returns normalized JSON.
 * Auto-deploys with the repo — nothing to configure.
 *
 *   GET /api/quote?ticker=AAPL
 *   -> { ticker, name, sector, price, fin:{...}, dcf:{...}, asOf, source }
 *
 * (worker.js is the equivalent Cloudflare Worker, for non-Vercel hosting.)
 */

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const raw = o => (o && typeof o === "object" && "raw" in o) ? o.raw : (o == null ? null : o);
const r1  = v => v == null ? undefined : Math.round(v * 10) / 10;
const pct = v => v == null ? undefined : Math.round(v * 1000) / 10;   // fraction -> %  (1 dp)
const bil = v => v == null ? undefined : Math.round(v / 1e7) / 100;   // dollars  -> $B (2 dp)

async function cookieCrumb() {
  const c = await fetch("https://fc.yahoo.com", { headers: { "User-Agent": UA } });
  let cookies = [];
  try { if (c.headers.getSetCookie) cookies = c.headers.getSetCookie(); } catch (e) {}
  if (!cookies.length) { const sc = c.headers.get("set-cookie"); if (sc) cookies = [sc]; }
  const cookie = cookies.map(s => s.split(";")[0]).join("; ");
  const cr = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb",
    { headers: { "User-Agent": UA, "Cookie": cookie } });
  return { cookie, crumb: (await cr.text()).trim() };
}

async function getData(ticker) {
  const { cookie, crumb } = await cookieCrumb();
  if (!crumb) throw new Error("could not get Yahoo crumb (try again in a moment)");
  const modules = "financialData,defaultKeyStatistics,summaryDetail,price,summaryProfile";
  const u = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}` +
            `?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
  const r = await fetch(u, { headers: { "User-Agent": UA, "Cookie": cookie } });
  if (!r.ok) throw new Error("Yahoo HTTP " + r.status);
  const j = await r.json();
  const res = j && j.quoteSummary && j.quoteSummary.result && j.quoteSummary.result[0];
  if (!res) throw new Error("no data for '" + ticker + "' — check the ticker symbol");

  const fd = res.financialData || {}, ks = res.defaultKeyStatistics || {},
        sd = res.summaryDetail || {}, pr = res.price || {}, sp = res.summaryProfile || {};
  const price = raw(fd.currentPrice) != null ? raw(fd.currentPrice) : raw(pr.regularMarketPrice);
  const td = raw(fd.totalDebt), tc = raw(fd.totalCash);
  const t = (raw(pr.regularMarketTime) || 0) * 1000;

  return {
    ticker,
    name: raw(pr.longName) || raw(pr.shortName) || ticker,
    sector: sp.sector || "",
    price: price != null ? Math.round(price * 100) / 100 : undefined,
    fin: {
      pe: r1(raw(sd.trailingPE)),
      pb: r1(raw(ks.priceToBook)),
      revGrowth: pct(raw(fd.revenueGrowth)),
      grossMargin: pct(raw(fd.grossMargins)),
      opMargin: pct(raw(fd.operatingMargins)),
      roe: pct(raw(fd.returnOnEquity)),
      de: raw(fd.debtToEquity) != null ? Math.round(raw(fd.debtToEquity)) / 100 : undefined,
      mktCap: bil(raw(pr.marketCap)),
    },
    dcf: {
      price: price != null ? Math.round(price * 100) / 100 : undefined,
      shares: raw(ks.sharesOutstanding) != null ? Math.round(raw(ks.sharesOutstanding) / 1e6) : undefined,
      fcf0: bil(raw(fd.freeCashflow)),
      netDebt: (td != null && tc != null) ? Math.round((td - tc) / 1e7) / 100 : undefined,
    },
    asOf: new Date(t || Date.now()).toISOString(),
    source: "Yahoo Finance (delayed)",
  };
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const ticker = String((req.query && req.query.ticker) || "")
    .toUpperCase().replace(/[^A-Z0-9.\-]/g, "").slice(0, 10);
  if (!ticker) { res.status(400).json({ error: "add ?ticker=AAPL to the URL" }); return; }

  try {
    const data = await getData(ticker);
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=600");
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: String((e && e.message) || e) });
  }
};
