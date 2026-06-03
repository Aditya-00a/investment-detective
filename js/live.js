/* ============================================================================
   THE INVESTMENT DETECTIVE — LIVE DATA CLIENT
   Talks to a small proxy (see worker.js / LIVE_DATA_SETUP.md) that reads
   Yahoo Finance. NO API KEY anywhere. The proxy URL is stored only in this
   browser's localStorage — never committed, never shared.
   ========================================================================== */
window.LIVE = (function () {
  "use strict";
  const LS_KEY = "invdet:proxy";

  function getProxy() { try { return localStorage.getItem(LS_KEY) || ""; } catch (e) { return ""; } }
  function setProxy(u) { try { localStorage.setItem(LS_KEY, (u || "").trim()); } catch (e) {} }

  // If a proxy returns RAW Yahoo quoteSummary JSON instead of our normalized
  // shape, map it here so the app still works with a generic passthrough proxy.
  function mapYahoo(j) {
    const res = j && j.quoteSummary && j.quoteSummary.result && j.quoteSummary.result[0];
    if (!res) return null;
    const fd = res.financialData || {}, ks = res.defaultKeyStatistics || {},
          sd = res.summaryDetail || {}, pr = res.price || {}, sp = res.summaryProfile || {};
    const raw = o => (o && typeof o === "object" && "raw" in o) ? o.raw : (o == null ? null : o);
    const pct = v => v == null ? undefined : Math.round(v * 1000) / 10;     // fraction -> %  (1 dp)
    const bil = v => v == null ? undefined : Math.round(v / 1e7) / 100;     // dollars -> $B  (2 dp)
    const r1  = v => v == null ? undefined : Math.round(v * 10) / 10;
    const price = raw(fd.currentPrice) != null ? raw(fd.currentPrice) : raw(pr.regularMarketPrice);
    const td = raw(fd.totalDebt), tc = raw(fd.totalCash);
    const t = (raw(pr.regularMarketTime) || 0) * 1000;
    return {
      ticker: raw(pr.symbol) || "", name: raw(pr.longName) || raw(pr.shortName) || "", sector: sp.sector || "",
      price: price != null ? Math.round(price * 100) / 100 : undefined,
      fin: {
        pe: r1(raw(sd.trailingPE)), pb: r1(raw(ks.priceToBook)),
        revGrowth: pct(raw(fd.revenueGrowth)), grossMargin: pct(raw(fd.grossMargins)),
        opMargin: pct(raw(fd.operatingMargins)), roe: pct(raw(fd.returnOnEquity)),
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

  async function fetchLive(ticker) {
    const base = getProxy();
    if (!base) throw new Error("NO_PROXY");
    const sep = base.includes("?") ? "&" : "?";
    const url = base + sep + "ticker=" + encodeURIComponent(ticker);
    let res;
    try { res = await fetch(url, { headers: { accept: "application/json" } }); }
    catch (e) { throw new Error("can't reach proxy (check the URL / it's deployed)"); }
    let data;
    try { data = await res.json(); }
    catch (e) { throw new Error("proxy did not return JSON (HTTP " + res.status + ")"); }
    if (data && data.error) throw new Error(data.error);
    if (!res.ok) throw new Error("proxy HTTP " + res.status);
    if (data && data.fin) return data;            // already normalized (our worker)
    const mapped = mapYahoo(data);                // raw Yahoo passthrough
    if (mapped) return mapped;
    throw new Error("unexpected data shape from proxy");
  }

  return { getProxy, setProxy, fetchLive };
})();
