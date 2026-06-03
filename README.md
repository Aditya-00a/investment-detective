# 🕵️ The Investment Detective — 4 Lenses Lab

### ▶ **[Open the live app →](https://aditya-00a.github.io/investment-detective/)**

An interactive, **offline** web app that turns the *Investment Philosophies Workbook* (Excel) into a
hands-on teaching tool for high-school finance students.

Students **put a stock in** and judge it through the eyes of four legendary investors —
**Warren Buffett, Peter Thiel, Michael Steinhardt, and Cathie Wood** — then value it with a real
**DCF (WACC · FCFF · NPV)**. The whole point: *the same company can be a BUY to one philosophy and a PASS to another.*

---

## ▶ How to run it

**Just double-click `index.html`.** That's it — no install, no internet, no server, no accounts.
It runs entirely in the browser (Chrome / Edge / Firefox) and saves each group's work locally.

To share with a class: zip the `investment-detective` folder and send it, drop it on a shared drive,
or upload the folder to any free static host (GitHub Pages, Netlify drop, your LMS).

> Everything works from `file://`. The only thing that needs the internet is the *research links*
> (finviz, SEC, ARK) the students click out to.

---

## 📡 Live data (optional, no API key)

Out of the box the app uses rounded teaching figures. Flip on **live price + ratios from Yahoo Finance**
(no API key, no signup) by deploying one tiny free proxy — see **[`LIVE_DATA_SETUP.md`](LIVE_DATA_SETUP.md)**
(~2 minutes). Then click **🔄 Fetch live** on any company (or it auto-fills when you pick a stock), and a
**"🟢 Live · as of …"** badge appears. Live numbers flow straight into the four scorecards *and* the DCF
(price, shares, free cash flow). If the proxy is unreachable, the app quietly falls back to the teaching
figures. Files involved: [`worker.js`](worker.js) (the proxy) and [`js/live.js`](js/live.js) (the client).

---

## 🧭 What's inside (mirrors the Excel, tab-for-tab)

| App tab | Mirrors in the workbook | What students do |
|---|---|---|
| **🏠 Start** | HOME sheet | Type a ticker or pick a pre-loaded company |
| **🔬 Analyze** | Group sheet (Steps 1–6) | Record financials (live color-coded), score the 4 lenses 0/1/2, write a 60-sec pitch |
| **⚖️ Compare** | *(new)* the whole point | See all 4 verdicts side-by-side + the Dream/Hype/Junk/Trap matrix |
| **🧮 Valuation Lab** | extends "Price vs. Value" | A real DCF: WACC, FCFF, terminal value → intrinsic value & margin of safety |
| **📚 Learn** | Philosophy Guide | The 4 lenses, 5 moats, Thiel's 7 questions, variant perception, finance glossary |
| **✅ Examples** | Apple & Meta sheets | The fully-scored worked examples, with evidence behind every score |

### The scoring (identical to the Excel)
- Each criterion is scored **0 / 1 / 2** → live status **✅ Strong / ⚠️ Moderate / ❌ Weak**
- Auto totals & rating: **🏆 Strong Buy ≥75% · 👀 Watch ≥50% · ⚠️ More Research ≥33% · ❌ Pass**
- Buffett /12 · Thiel /14 · Steinhardt /12 · Wood /14 — same criteria, same wording

### The finance your students are learning
The Valuation Lab is a genuine discounted-cash-flow model so **WACC, FCFF, NPV, terminal value,
beta, and margin of safety** stop being vocabulary words and become sliders they can feel.
There's an optional "build the WACC from scratch" panel (risk-free + β × ERP, blended with after-tax
cost of debt). The result feeds back into Buffett's "Price vs. Value" score with one click.

---

## 🍎 A 45-minute lesson flow

1. **Learn** → skim the four lenses and the glossary (10 min).
2. **Examples** → walk through Apple together; show how evidence drives each score (10 min).
3. **Analyze** → each group picks a stock, looks up the numbers on finviz, scores one or more lenses (15 min).
4. **Valuation Lab** → run a DCF; debate why the terminal value dominates the answer (5 min).
5. **Compare** → which lens loved it? which passed? *Why do they disagree?* (5 min).

---

## 🛠 Customizing it (no framework, just plain files)

- **Add companies** → edit the `COMPANIES` array in `js/data.js` (ticker, name, sector, rough financials, DCF presets).
- **Tweak a rubric** → edit `LENSES` in `js/data.js` (criteria text and the 0/1/2 level descriptions).
- **Add a glossary term** → add to `GLOSSARY` in `js/data.js`.
- **Restyle** → all colors/layout live in `css/styles.css` (the four lens colors are CSS variables).
- **Logic** (scoring, radar, matrix, DCF) lives in `js/app.js`.

```
investment-detective/
├── index.html        ← double-click this
├── css/styles.css
└── js/
    ├── data.js       ← all curriculum content (edit here to customize)
    └── app.js        ← scoring, radar, matrix, DCF logic
```

---

## ⚠️ Disclaimer
Educational use only — **nothing here is financial advice.** The pre-loaded numbers are rough,
rounded teaching figures, *not* live market data. Students should always look up current figures
and do their own research.
