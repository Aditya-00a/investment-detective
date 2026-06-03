/* ============================================================================
   THE INVESTMENT DETECTIVE — DATA LAYER
   All curriculum content mirrored from the "Investment Philosophies Workbook".
   Buffett • Thiel • Steinhardt • Cathie Wood
   Educational use only. Nothing here is financial advice.
   ========================================================================== */

/* ---- Rating thresholds (identical to the Excel RATING formula) ---------- */
function ratingFor(pct) {
  if (pct >= 0.75) return { label: "STRONG BUY CANDIDATE", icon: "🏆", cls: "buy" };
  if (pct >= 0.50) return { label: "WATCH LIST",            icon: "👀", cls: "watch" };
  if (pct >= 0.33) return { label: "NEEDS MORE RESEARCH",   icon: "⚠️", cls: "research" };
  return                  { label: "PASS",                  icon: "❌", cls: "pass" };
}

/* ---- Per-criterion status (identical to the Excel Status formula) ------- */
function statusFor(score) {
  if (score === 2) return { t: "Strong",   icon: "✅", cls: "strong" };
  if (score === 1) return { t: "Moderate", icon: "⚠️", cls: "moderate" };
  return                  { t: "Weak",     icon: "❌", cls: "weak" };
}

/* ========================================================================== *
 *  THE 4 LENSES  (criteria + 0/1/2 rubric pulled straight from the workbook) *
 * ========================================================================== */
const LENSES = {
  buffett: {
    key: "buffett",
    name: "Warren Buffett",
    tag: "Quality + Moat",
    color: "#2563eb",
    soft: "#dbeafe",
    icon: "🔵",
    question: "Would I own this whole business for 10 years?",
    oneLine: "Buy wonderful businesses at fair prices — and hold.",
    blurb:
      "Buffett looks for wonderful businesses he'd be happy to own even if the stock market closed for ten years. " +
      "He wants a durable moat, pricing power, honest managers, and a fair price. A great company bought at a silly " +
      "price is still a bad investment — so price always matters.",
    famous: "“It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price.”",
    criteria: [
      { key: "demand",   name: "Durable Demand",      hint: "Do customers keep coming back? Recession-proof?",
        lv: { 2: "Steady, recession-proof demand", 1: "Some seasonal ups & downs", 0: "Fad or trend-dependent" } },
      { key: "moat",     name: "Moat Strength",       hint: "Which of the 5 moat types? How hard to copy?",
        lv: { 2: "Strong, multi-layered moat", 1: "Some moat, but copyable", 0: "Little to no moat" } },
      { key: "pricing",  name: "Pricing Power",       hint: "Can it raise prices without losing customers?",
        lv: { 2: "Regularly raises prices successfully", 1: "Occasional small increases", 0: "Price-taker, no control" } },
      { key: "runway",   name: "Reinvestment Runway", hint: "Can profits be reinvested at high returns for years?",
        lv: { 2: "Long, high-return runway ahead", 1: "Moderate reinvestment options", 0: "Limited / declining options" } },
      { key: "mgmt",     name: "Management Quality",  hint: "Honest, long-term, great capital allocators?",
        lv: { 2: "Track record of great capital allocation", 1: "Mixed performance", 0: "Short-term focus or scandals" } },
      { key: "value",    name: "Price vs. Value",     hint: "Is today's price fair vs. intrinsic value? (use the Valuation Lab!)",
        lv: { 2: "Attractive / below intrinsic value", 1: "Fair price for the quality", 0: "Way overpriced vs. value" } },
    ],
  },

  thiel: {
    key: "thiel",
    name: "Peter Thiel",
    tag: "Monopoly Engine",
    color: "#7c3aed",
    soft: "#ede9fe",
    icon: "🟣",
    question: "Is this business 10x better — and impossible to copy?",
    oneLine: "Find the monopoly: dominate one niche, then expand.",
    blurb:
      "Thiel hunts for businesses so uniquely good that customers have no real substitute — a 'monopoly' not in the " +
      "illegal sense, but in the 'nobody else even comes close' sense. Win one niche completely, then scale. The best " +
      "founders see a secret the rest of the world has missed.",
    famous: "“Competition is for losers. If you want to create and capture value, build a monopoly.”",
    criteria: [
      { key: "secret",   name: "Secret / 10x Edge",   hint: "What proprietary advantage makes this 10x better?",
        lv: { 2: "Truly proprietary insight", 1: "Some edge, but known", 0: "No real advantage" } },
      { key: "timing",   name: "Timing",              hint: "Is the market / tech ready? Are tailwinds accelerating?",
        lv: { 2: "Perfect timing, tailwinds", 1: "Reasonable timing", 0: "Too early or too late" } },
      { key: "monopoly", name: "Monopoly Potential",  hint: "Can it dominate a clear niche before expanding?",
        lv: { 2: "Dominant in a defined niche", 1: "Strong contender", 0: "Fighting giants head-on" } },
      { key: "team",     name: "Team Quality",        hint: "World-class people with vision + execution?",
        lv: { 2: "World-class talent & culture", 1: "Competent team", 0: "Weak or missing key talent" } },
      { key: "dist",     name: "Distribution",        hint: "How do customers find & adopt it? Self-reinforcing?",
        lv: { 2: "Viral or self-distributing", 1: "Clear distribution plan", 0: "No go-to-market strategy" } },
      { key: "durable",  name: "Durability (10 yr)",  hint: "Will the advantage be hard to copy in 10 years?",
        lv: { 2: "Near impossible to copy", 1: "Hard but possible to copy", 0: "Easily replicated" } },
      { key: "contrarian", name: "Contrarian Truth",  hint: "What does the market miss that you clearly see?",
        lv: { 2: "Strong contrarian view + evidence", 1: "Somewhat different view", 0: "Consensus / no edge" } },
    ],
  },

  steinhardt: {
    key: "steinhardt",
    name: "Michael Steinhardt",
    tag: "Variant Perception",
    color: "#059669",
    soft: "#d1fae5",
    icon: "🟢",
    question: "What does the market believe — and why am I differently right?",
    oneLine: "Profit only when you're right AND the crowd is wrong.",
    blurb:
      "Steinhardt coined 'variant perception' — a view that differs from the market consensus and is backed by hard " +
      "evidence. You don't make money by being right; you make money by being differently right from what's already " +
      "priced in. A guess is not a thesis: you need evidence, a disproof test, and a catalyst.",
    famous: "“A variant perception is a well-founded view that is meaningfully different from market consensus.”",
    criteria: [
      { key: "belief",   name: "Market Belief",     hint: "What does Wall Street currently believe about this?",
        lv: { 2: "Clearly identified, specific belief", 1: "Vague sense of consensus", 0: "No research on consensus" } },
      { key: "variant",  name: "Variant View",      hint: "What is YOUR different, specific, evidence-backed view?",
        lv: { 2: "Sharp, specific, evidence-backed", 1: "Somewhat different view", 0: "Same as consensus" } },
      { key: "evidence", name: "Evidence Quality",  hint: "What 3+ concrete data points support your view?",
        lv: { 2: "3+ concrete data points", 1: "1–2 data points", 0: "Only intuition / vibes" } },
      { key: "disproof", name: "Disproof Test",     hint: "What specific outcome would PROVE you wrong?",
        lv: { 2: "Clear, specific, falsifiable test", 1: "Somewhat testable", 0: "No test defined" } },
      { key: "catalyst", name: "Catalyst",          hint: "What near-term event makes others see what you see?",
        lv: { 2: "Clear, near-term catalyst", 1: "Possible catalyst", 0: "No catalyst identified" } },
      { key: "risk",     name: "Risk Sizing",       hint: "Main downside risk — what's the magnitude?",
        lv: { 2: "Risk identified & sized", 1: "Risk mentioned", 0: "Risks ignored" } },
    ],
  },

  wood: {
    key: "wood",
    name: "Cathie Wood",
    tag: "Disruptive Innovation",
    color: "#ea580c",
    soft: "#ffedd5",
    icon: "🟠",
    question: "Is this company riding a massive technology wave?",
    oneLine: "Bet on exponential tech before the world catches up.",
    blurb:
      "Cathie Wood (ARK Invest) backs disruptive innovation — technologies whose costs fall exponentially (Wright's " +
      "Law) and unlock trillion-dollar markets: AI, robotics, energy storage, multiomic sequencing, and blockchain. " +
      "She accepts volatility today for a five-year exponential payoff, and prefers visionary founders.",
    famous: "“Innovation is the key to growth. We invest in the leading, enabling, and beneficiary companies.”",
    criteria: [
      { key: "platform",  name: "Innovation Platform",   hint: "Which ARK platform? (AI, Genomics, Energy, Fintech, Internet)",
        lv: { 2: "Core to a major platform", 1: "Adjacent to a platform", 0: "No clear platform fit" } },
      { key: "tam",       name: "TAM Size",              hint: "How big is the market? Growing exponentially?",
        lv: { 2: "TAM > $1 trillion potential", 1: "TAM > $100B potential", 0: "Niche / limited market" } },
      { key: "curve",     name: "Technology Cost Curve", hint: "Is the underlying tech getting dramatically cheaper?",
        lv: { 2: "Wright's-Law cost decline", 1: "Some cost improvement", 0: "Flat or incremental" } },
      { key: "growth",    name: "Revenue Growth Rate",   hint: "Revenue growing >20% annually? Trajectory?",
        lv: { 2: "> 30% annual revenue growth", 1: "15–30% growth", 0: "< 15% or declining" } },
      { key: "firstmover", name: "First-Mover Advantage", hint: "Does being first create an unbeatable data/network moat?",
        lv: { 2: "Clear leader with data moat", 1: "Strong #2 or #3", 0: "Laggard or follower" } },
      { key: "disruption", name: "Disruption Magnitude", hint: "How large is the legacy industry being disrupted?",
        lv: { 2: "Disrupts a multi-trillion industry", 1: "Disrupts a large industry", 0: "Incremental only" } },
      { key: "vision",    name: "Management Vision",     hint: "Long-term conviction to weather volatility?",
        lv: { 2: "Visionary founder/CEO with evidence", 1: "Solid professional management", 0: "Short-term / financial engineering" } },
    ],
  },
};
const LENS_ORDER = ["buffett", "thiel", "steinhardt", "wood"];

/* ========================================================================== *
 *  FINANCIAL METRICS  (Step 4 of the Group sheet)                            *
 *  checker() returns a {cls, note} verdict so the app can colour-code live.  *
 * ========================================================================== */
const METRICS = [
  { key: "pe",        name: "P/E Ratio",        unit: "x",
    means: "Price ÷ annual earnings per share — what you pay for $1 of profit.",
    range: "Value < 20  •  Growth 30+  •  Expensive > 50",
    check: v => v == null ? null : v < 0 ? { cls:"weak", note:"Negative — company isn't profitable yet" }
              : v < 20 ? { cls:"strong", note:"Value territory" }
              : v <= 50 ? { cls:"moderate", note:"Growth pricing — market expects fast growth" }
              : { cls:"weak", note:"Expensive — priced for perfection" } },
  { key: "pb",        name: "P/B Ratio",        unit: "x",
    means: "Price ÷ book (net asset) value per share.",
    range: "Value < 1.5  •  Fair 1.5–5  •  Asset-light > 5",
    check: v => v == null ? null : v < 1.5 ? { cls:"strong", note:"Near book value (classic value signal)" }
              : v <= 5 ? { cls:"moderate", note:"Fair range" }
              : { cls:"weak", note:"Intangibles / brand drive value, not assets" } },
  { key: "revGrowth", name: "Revenue Growth",   unit: "%",
    means: "How fast sales are growing year over year.",
    range: "ARK standard > 20%  •  Buffett: steady > 5%",
    check: v => v == null ? null : v >= 20 ? { cls:"strong", note:"High growth — Cathie Wood territory" }
              : v >= 5 ? { cls:"moderate", note:"Steady — Buffett-friendly" }
              : { cls:"weak", note:"Slow or shrinking" } },
  { key: "grossMargin", name: "Gross Margin",   unit: "%",
    means: "Profit left after the direct cost of the product.",
    range: "Software 70%+  •  Retail 25%+  •  Mfg 15%+",
    check: v => v == null ? null : v >= 60 ? { cls:"strong", note:"Software-like margins" }
              : v >= 25 ? { cls:"moderate", note:"Healthy" }
              : { cls:"weak", note:"Thin — commodity-like" } },
  { key: "opMargin",  name: "Operating Margin", unit: "%",
    means: "Profit left after ALL operating costs.",
    range: "Great > 20%  •  Good 10–20%  •  Thin < 10%",
    check: v => v == null ? null : v >= 20 ? { cls:"strong", note:"Excellent profitability" }
              : v >= 10 ? { cls:"moderate", note:"Good" }
              : { cls:"weak", note:"Thin profitability" } },
  { key: "roe",       name: "Return on Equity", unit: "%",
    means: "Profit ÷ shareholders' equity — how well it turns equity into profit.",
    range: "Excellent > 20%  •  Good 10–20%",
    check: v => v == null ? null : v >= 20 ? { cls:"strong", note:"Excellent" }
              : v >= 10 ? { cls:"moderate", note:"Good" }
              : { cls:"weak", note:"Low returns on equity" } },
  { key: "de",        name: "Debt / Equity",    unit: "x",
    means: "Total debt vs. equity — how much leverage.",
    range: "Strong < 0.5  •  Risky > 2.0",
    check: v => v == null ? null : v < 0.5 ? { cls:"strong", note:"Conservative balance sheet" }
              : v <= 2 ? { cls:"moderate", note:"Moderate leverage" }
              : { cls:"weak", note:"Highly leveraged — risky" } },
  { key: "mktCap",    name: "Market Cap",       unit: "$B",
    means: "Total value of all shares — the size of the company.",
    range: "Large > $100B  •  Mid $10–100B  •  Small < $10B",
    check: v => v == null ? null : v >= 100 ? { cls:"moderate", note:"Large cap" }
              : v >= 10 ? { cls:"moderate", note:"Mid cap" }
              : { cls:"moderate", note:"Small cap — higher risk/reward" } },
];

/* ========================================================================== *
 *  TEACHING CONTENT — moats, Thiel's questions, variant structure, matrix    *
 * ========================================================================== */
const MOATS = [
  { name: "Brand Trust",    desc: "People choose it automatically.",        eg: "Coca-Cola, Apple" },
  { name: "Switching Pain", desc: "Hard & costly to change once you start.", eg: "iPhone ecosystem, your bank" },
  { name: "Cost Advantage", desc: "Can deliver the same thing cheaper.",     eg: "Costco, Amazon logistics" },
  { name: "Network Effect", desc: "More users make it more valuable.",       eg: "Meta, Visa, the App Store" },
  { name: "Rules / Permits", desc: "Licenses or scale others can't get.",    eg: "Utilities, defense, ratings agencies" },
];

const THIEL_QUESTIONS = [
  { q: "Secret",       a: "What do you know that others miss?" },
  { q: "Timing",       a: "Is now the right moment?" },
  { q: "Monopoly",     a: "Can you be #1 in a niche?" },
  { q: "People",       a: "Is the team excellent?" },
  { q: "Distribution", a: "How do you reach users? (the hidden killer)" },
  { q: "Durability",   a: "Will the advantage last 10 years?" },
  { q: "Mission",      a: "Is it worth building?" },
];

const VARIANT_STEPS = [
  { t: "Market Belief",   d: "What most people & algorithms expect (it's baked into today's price)." },
  { t: "Your Different View", d: "One clear idea the crowd hasn't seen yet." },
  { t: "Evidence",        d: "Facts, numbers, and real behaviour — not vibes." },
  { t: "Disproof Test",   d: "The exact metric that would prove you wrong (must be falsifiable)." },
  { t: "Catalyst",        d: "The specific event that forces the market to wake up." },
];

/* The 2x2 used everywhere in the decks: quality (y) vs. expectations/price (x) */
const MATRIX = {
  hiQ_loE: { name: "THE DREAM", cls: "dream", desc: "Great company, low expectations. The ultimate variant-perception target." },
  hiQ_hiE: { name: "HYPE",      cls: "hype",  desc: "Great company, but priced for perfection — already in the price." },
  loQ_loE: { name: "JUNK",      cls: "junk",  desc: "Weak company, low expectations. Cheap for a reason." },
  loQ_hiE: { name: "TRAP",      cls: "trap",  desc: "Weak company, high expectations. The most dangerous quadrant." },
};

/* ========================================================================== *
 *  FINANCE GLOSSARY — plain-English, high-school level                       *
 * ========================================================================== */
const GLOSSARY = [
  { term: "WACC", full: "Weighted Average Cost of Capital",
    def: "The blended yearly return all of a company's investors (lenders + shareholders) expect. In a valuation it's the discount rate — the 'interest rate' you use to shrink future cash back to today. Higher WACC = future cash is worth less now.",
    formula: "WACC = (E ÷ V)·costEquity + (D ÷ V)·costDebt·(1 − tax)" },
  { term: "FCFF", full: "Free Cash Flow to the Firm",
    def: "The cash a business throws off for ALL its investors after paying operating costs, taxes, and reinvesting in itself (capex + working capital). It's the 'owner's cash' a DCF values.",
    formula: "FCFF = EBIT·(1 − tax) + Depreciation − Capex − Δ Working Capital" },
  { term: "NPV", full: "Net Present Value",
    def: "Add up future cash flows after discounting each one back to today's value, then subtract what you pay. Positive NPV = worth more than its cost. A DCF is basically one big NPV.",
    formula: "NPV = Σ [ Cash_t ÷ (1 + r)ᵗ ] − Cost" },
  { term: "DCF", full: "Discounted Cash Flow",
    def: "A way to estimate what a company is really worth by projecting its future free cash flows and discounting them back to today at the WACC. Add a 'terminal value' for everything beyond the forecast.",
    formula: "Value = Σ FCFFₜ ÷ (1+WACC)ᵗ  +  TerminalValue ÷ (1+WACC)ⁿ" },
  { term: "Terminal Value", full: "Terminal Value (Gordon Growth)",
    def: "The estimated value of ALL cash flows after your explicit forecast window, assuming the business grows slowly forever. Usually the biggest chunk of a DCF — handle with care.",
    formula: "TV = FCFF_final · (1 + g) ÷ (WACC − g)" },
  { term: "Intrinsic Value", full: "Intrinsic Value per Share",
    def: "What the business is actually worth per share based on its cash flows — not its current stock price. The whole game is buying when price < intrinsic value.",
    formula: "Intrinsic / share = (Enterprise Value − Net Debt) ÷ Shares" },
  { term: "Margin of Safety", full: "Margin of Safety",
    def: "How far below intrinsic value you're buying. A big cushion protects you when your estimates are wrong. Graham & Buffett's core idea.",
    formula: "Margin of Safety = (Intrinsic Value − Price) ÷ Intrinsic Value" },
  { term: "Beta", full: "Beta (β)",
    def: "How much a stock swings vs. the whole market. Beta 1 = moves with the market; 2 = twice as jumpy; 0.5 = calmer. Used to set the cost of equity.",
    formula: "costEquity = riskFree + β · equityRiskPremium" },
  { term: "P/E", full: "Price-to-Earnings",
    def: "Price ÷ earnings per share. What you pay for $1 of current profit. Below ~20 leans value; above ~30 means the market expects fast growth.",
    formula: "P/E = Price ÷ EPS" },
  { term: "P/B", full: "Price-to-Book",
    def: "Price ÷ the company's net asset (book) value per share. Below ~1.5 is a classic value signal; high P/B means brand & ideas, not factories, drive the value.",
    formula: "P/B = Price ÷ Book Value per Share" },
  { term: "PEG", full: "Price/Earnings-to-Growth",
    def: "P/E divided by the growth rate. Peter Lynch's favourite — it finds growth at a fair price. Below 1 is the sweet spot.",
    formula: "PEG = P/E ÷ Earnings Growth %" },
  { term: "Moat", full: "Economic Moat",
    def: "The durable advantage that stops rivals from stealing customers. Five types: brand, switching cost, cost advantage, network effect, and rules/permits.",
    formula: "" },
  { term: "Pricing Power", full: "Pricing Power",
    def: "Can the company raise prices ~10% and keep its customers? If yes, it has real power. The cleanest test of a moat.",
    formula: "" },
  { term: "TAM", full: "Total Addressable Market",
    def: "The total revenue available if a company won 100% of its market. Cathie Wood hunts for trillion-dollar TAMs that are still growing.",
    formula: "" },
  { term: "Consensus", full: "Market Consensus",
    def: "What the crowd already believes about a stock — and it's already baked into the price. You only profit by being differently right from consensus.",
    formula: "" },
  { term: "Catalyst", full: "Catalyst",
    def: "A specific upcoming event (earnings, a launch, a ruling) that will force the market to notice what you already see and re-price the stock.",
    formula: "" },
];

/* ========================================================================== *
 *  PRELOADED COMPANY LIBRARY — so students can "put a stock in" instantly.   *
 *  Figures are rough, rounded teaching numbers (not live data).              *
 * ========================================================================== */
const COMPANIES = [
  { ticker:"AAPL", name:"Apple",       sector:"Technology / Consumer Electronics",
    fin:{ pe:30, pb:48, revGrowth:6, grossMargin:46, opMargin:31, roe:150, de:1.5, mktCap:3400 },
    dcf:{ fcf0:100, g:8, gTerm:3, wacc:9, netDebt:-50, shares:15000, price:225 } },
  { ticker:"META", name:"Meta Platforms", sector:"Technology / Social Media",
    fin:{ pe:24, pb:8, revGrowth:22, grossMargin:81, opMargin:42, roe:34, de:0.3, mktCap:1300 },
    dcf:{ fcf0:50, g:15, gTerm:3, wacc:10, netDebt:-30, shares:2540, price:560 } },
  { ticker:"NVDA", name:"NVIDIA",      sector:"Semiconductors / AI",
    fin:{ pe:50, pb:45, revGrowth:90, grossMargin:75, opMargin:62, roe:115, de:0.2, mktCap:3000 },
    dcf:{ fcf0:60, g:30, gTerm:4, wacc:11, netDebt:-20, shares:24500, price:122 } },
  { ticker:"TSLA", name:"Tesla",       sector:"Autos / Energy / AI",
    fin:{ pe:60, pb:11, revGrowth:8, grossMargin:18, opMargin:8, roe:20, de:0.1, mktCap:800 },
    dcf:{ fcf0:5, g:25, gTerm:4, wacc:12, netDebt:-10, shares:3190, price:250 } },
  { ticker:"KO",   name:"Coca-Cola",   sector:"Consumer Staples / Beverages",
    fin:{ pe:25, pb:11, revGrowth:5, grossMargin:60, opMargin:30, roe:42, de:1.6, mktCap:280 },
    dcf:{ fcf0:9.5, g:5, gTerm:3, wacc:7, netDebt:30, shares:4300, price:64 } },
  { ticker:"COST", name:"Costco",      sector:"Consumer Staples / Retail",
    fin:{ pe:52, pb:18, revGrowth:7, grossMargin:13, opMargin:3.7, roe:32, de:0.3, mktCap:400 },
    dcf:{ fcf0:7, g:9, gTerm:3, wacc:7.5, netDebt:-5, shares:443, price:900 } },
  { ticker:"PLTR", name:"Palantir",    sector:"Software / AI / Defense",
    fin:{ pe:200, pb:30, revGrowth:30, grossMargin:80, opMargin:16, roe:11, de:0.05, mktCap:90 },
    dcf:{ fcf0:1, g:30, gTerm:4, wacc:12, netDebt:-4, shares:2300, price:40 } },
  { ticker:"AMZN", name:"Amazon",      sector:"E-commerce / Cloud",
    fin:{ pe:42, pb:8, revGrowth:11, grossMargin:48, opMargin:10, roe:21, de:0.5, mktCap:1900 },
    dcf:{ fcf0:35, g:18, gTerm:3, wacc:9, netDebt:0, shares:10500, price:180 } },
  { ticker:"JNJ",  name:"Johnson & Johnson", sector:"Healthcare / Pharma",
    fin:{ pe:15, pb:5, revGrowth:4, grossMargin:69, opMargin:25, roe:25, de:0.5, mktCap:380 },
    dcf:{ fcf0:18, g:4, gTerm:2.5, wacc:7, netDebt:5, shares:2400, price:155 } },
  { ticker:"SHOP", name:"Shopify",     sector:"Software / E-commerce",
    fin:{ pe:80, pb:9, revGrowth:26, grossMargin:51, opMargin:12, roe:12, de:0.05, mktCap:100 },
    dcf:{ fcf0:1.1, g:25, gTerm:4, wacc:11, netDebt:-5, shares:1290, price:78 } },

  { ticker:"MSFT", name:"Microsoft",   sector:"Software / Cloud / AI",
    fin:{ pe:35, pb:12, revGrowth:16, grossMargin:70, opMargin:45, roe:35, de:0.3, mktCap:3100 },
    dcf:{ fcf0:70, g:14, gTerm:3, wacc:9, netDebt:-30, shares:7430, price:420 } },
  { ticker:"GOOGL", name:"Alphabet (Google)", sector:"Search / Advertising / AI",
    fin:{ pe:24, pb:7, revGrowth:14, grossMargin:58, opMargin:32, roe:30, de:0.1, mktCap:2100 },
    dcf:{ fcf0:70, g:13, gTerm:3, wacc:9, netDebt:-90, shares:12200, price:170 } },
  { ticker:"NFLX", name:"Netflix",     sector:"Media / Streaming",
    fin:{ pe:45, pb:12, revGrowth:15, grossMargin:45, opMargin:27, roe:30, de:0.7, mktCap:270 },
    dcf:{ fcf0:7, g:16, gTerm:3, wacc:10, netDebt:5, shares:430, price:620 } },
  { ticker:"DIS",  name:"Walt Disney", sector:"Media / Entertainment",
    fin:{ pe:22, pb:2, revGrowth:4, grossMargin:35, opMargin:15, roe:6, de:0.4, mktCap:180 },
    dcf:{ fcf0:8, g:7, gTerm:3, wacc:8, netDebt:35, shares:1820, price:100 } },
  { ticker:"V",    name:"Visa",        sector:"Financials / Payments",
    fin:{ pe:30, pb:14, revGrowth:10, grossMargin:80, opMargin:65, roe:48, de:0.5, mktCap:560 },
    dcf:{ fcf0:18, g:11, gTerm:3, wacc:8, netDebt:0, shares:1900, price:280 } },
  { ticker:"MA",   name:"Mastercard",  sector:"Financials / Payments",
    fin:{ pe:35, pb:60, revGrowth:12, grossMargin:100, opMargin:57, roe:170, de:2, mktCap:430 },
    dcf:{ fcf0:11, g:13, gTerm:3, wacc:8, netDebt:5, shares:930, price:460 } },
  { ticker:"JPM",  name:"JPMorgan Chase", sector:"Financials / Banking",
    fin:{ pe:12, pb:1.8, revGrowth:8, grossMargin:85, opMargin:40, roe:16, de:1.2, mktCap:600 },
    dcf:{ fcf0:40, g:6, gTerm:3, wacc:9, netDebt:0, shares:2850, price:210 } },
  { ticker:"BRK-B", name:"Berkshire Hathaway", sector:"Financials / Conglomerate",
    fin:{ pe:22, pb:1.6, revGrowth:8, grossMargin:30, opMargin:18, roe:9, de:0.2, mktCap:950 },
    dcf:{ fcf0:30, g:8, gTerm:3, wacc:8, netDebt:-160, shares:2160, price:440 } },
  { ticker:"AXP",  name:"American Express", sector:"Financials / Payments",
    fin:{ pe:19, pb:6, revGrowth:9, grossMargin:80, opMargin:25, roe:32, de:1.8, mktCap:190 },
    dcf:{ fcf0:10, g:9, gTerm:3, wacc:9, netDebt:40, shares:720, price:260 } },
  { ticker:"PYPL", name:"PayPal",      sector:"Financials / Fintech",
    fin:{ pe:18, pb:4, revGrowth:8, grossMargin:45, opMargin:17, roe:21, de:0.5, mktCap:70 },
    dcf:{ fcf0:5, g:9, gTerm:3, wacc:10, netDebt:-5, shares:1020, price:68 } },
  { ticker:"WMT",  name:"Walmart",     sector:"Retail / Consumer Staples",
    fin:{ pe:30, pb:7, revGrowth:5, grossMargin:25, opMargin:4, roe:21, de:0.6, mktCap:600 },
    dcf:{ fcf0:15, g:6, gTerm:3, wacc:7, netDebt:30, shares:8040, price:75 } },
  { ticker:"HD",   name:"Home Depot",  sector:"Retail / Home Improvement",
    fin:{ pe:25, pb:40, revGrowth:3, grossMargin:33, opMargin:14, roe:100, de:5, mktCap:360 },
    dcf:{ fcf0:16, g:6, gTerm:3, wacc:8, netDebt:40, shares:990, price:360 } },
  { ticker:"MCD",  name:"McDonald's",  sector:"Restaurants / Franchise",
    fin:{ pe:24, pb:40, revGrowth:5, grossMargin:57, opMargin:45, roe:150, de:6, mktCap:200 },
    dcf:{ fcf0:7, g:6, gTerm:3, wacc:7, netDebt:50, shares:720, price:290 } },
  { ticker:"SBUX", name:"Starbucks",   sector:"Restaurants / Coffee",
    fin:{ pe:25, pb:50, revGrowth:5, grossMargin:27, opMargin:15, roe:150, de:6, mktCap:100 },
    dcf:{ fcf0:4, g:8, gTerm:3, wacc:8, netDebt:15, shares:1130, price:90 } },
  { ticker:"NKE",  name:"Nike",        sector:"Consumer / Apparel",
    fin:{ pe:22, pb:8, revGrowth:1, grossMargin:44, opMargin:12, roe:35, de:0.6, mktCap:110 },
    dcf:{ fcf0:5, g:7, gTerm:3, wacc:8, netDebt:0, shares:1500, price:75 } },
  { ticker:"PG",   name:"Procter & Gamble", sector:"Consumer Staples",
    fin:{ pe:26, pb:8, revGrowth:3, grossMargin:52, opMargin:24, roe:31, de:0.6, mktCap:390 },
    dcf:{ fcf0:16, g:5, gTerm:3, wacc:7, netDebt:20, shares:2350, price:165 } },
  { ticker:"PEP",  name:"PepsiCo",     sector:"Consumer Staples",
    fin:{ pe:24, pb:11, revGrowth:4, grossMargin:55, opMargin:18, roe:47, de:2, mktCap:230 },
    dcf:{ fcf0:8, g:5, gTerm:3, wacc:7, netDebt:35, shares:1375, price:170 } },
  { ticker:"CMG",  name:"Chipotle",    sector:"Restaurants / Fast-Casual",
    fin:{ pe:55, pb:18, revGrowth:15, grossMargin:27, opMargin:17, roe:42, de:0.5, mktCap:80 },
    dcf:{ fcf0:1.4, g:16, gTerm:3, wacc:9, netDebt:-2, shares:1370, price:58 } },
  { ticker:"LULU", name:"Lululemon",   sector:"Consumer / Apparel",
    fin:{ pe:20, pb:7, revGrowth:10, grossMargin:58, opMargin:23, roe:40, de:0.3, mktCap:40 },
    dcf:{ fcf0:1.5, g:12, gTerm:3, wacc:9, netDebt:-2, shares:122, price:330 } },
  { ticker:"UNH",  name:"UnitedHealth", sector:"Healthcare / Insurance",
    fin:{ pe:19, pb:5, revGrowth:8, grossMargin:24, opMargin:9, roe:25, de:0.7, mktCap:480 },
    dcf:{ fcf0:25, g:9, gTerm:3, wacc:8, netDebt:50, shares:920, price:520 } },
  { ticker:"LLY",  name:"Eli Lilly",   sector:"Healthcare / Pharma",
    fin:{ pe:60, pb:45, revGrowth:30, grossMargin:81, opMargin:35, roe:75, de:2, mktCap:750 },
    dcf:{ fcf0:8, g:25, gTerm:4, wacc:8, netDebt:25, shares:950, price:800 } },
  { ticker:"PFE",  name:"Pfizer",      sector:"Healthcare / Pharma",
    fin:{ pe:12, pb:1.7, revGrowth:-5, grossMargin:65, opMargin:20, roe:9, de:0.7, mktCap:160 },
    dcf:{ fcf0:10, g:3, gTerm:2.5, wacc:8, netDebt:60, shares:5660, price:28 } },
  { ticker:"AMD",  name:"AMD",         sector:"Semiconductors / AI",
    fin:{ pe:45, pb:4, revGrowth:18, grossMargin:50, opMargin:8, roe:7, de:0.05, mktCap:240 },
    dcf:{ fcf0:4, g:25, gTerm:4, wacc:11, netDebt:-4, shares:1620, price:150 } },
  { ticker:"INTC", name:"Intel",       sector:"Semiconductors",
    fin:{ pe:-20, pb:0.9, revGrowth:-3, grossMargin:35, opMargin:-5, roe:-5, de:0.5, mktCap:90 },
    dcf:{ fcf0:2, g:8, gTerm:3, wacc:10, netDebt:25, shares:4300, price:21 } },
  { ticker:"AVGO", name:"Broadcom",    sector:"Semiconductors / Software",
    fin:{ pe:35, pb:9, revGrowth:25, grossMargin:65, opMargin:30, roe:25, de:1, mktCap:750 },
    dcf:{ fcf0:20, g:18, gTerm:3, wacc:9, netDebt:50, shares:4700, price:160 } },
  { ticker:"ARM",  name:"Arm Holdings", sector:"Semiconductors / IP",
    fin:{ pe:100, pb:25, revGrowth:25, grossMargin:95, opMargin:25, roe:12, de:0.1, mktCap:140 },
    dcf:{ fcf0:0.8, g:25, gTerm:4, wacc:11, netDebt:-3, shares:1040, price:135 } },
  { ticker:"CRM",  name:"Salesforce",  sector:"Software / Cloud",
    fin:{ pe:45, pb:5, revGrowth:11, grossMargin:76, opMargin:19, roe:11, de:0.2, mktCap:290 },
    dcf:{ fcf0:12, g:12, gTerm:3, wacc:9, netDebt:-5, shares:970, price:300 } },
  { ticker:"ADBE", name:"Adobe",       sector:"Software / Creative & AI",
    fin:{ pe:35, pb:14, revGrowth:11, grossMargin:88, opMargin:36, roe:40, de:0.3, mktCap:230 },
    dcf:{ fcf0:8, g:12, gTerm:3, wacc:9, netDebt:-3, shares:445, price:510 } },
  { ticker:"ORCL", name:"Oracle",      sector:"Software / Cloud",
    fin:{ pe:40, pb:50, revGrowth:8, grossMargin:70, opMargin:30, roe:130, de:8, mktCap:470 },
    dcf:{ fcf0:12, g:12, gTerm:3, wacc:9, netDebt:80, shares:2770, price:170 } },
  { ticker:"UBER", name:"Uber",        sector:"Tech / Mobility & Delivery",
    fin:{ pe:30, pb:9, revGrowth:16, grossMargin:40, opMargin:8, roe:30, de:0.5, mktCap:150 },
    dcf:{ fcf0:5, g:20, gTerm:3, wacc:11, netDebt:5, shares:2090, price:72 } },
  { ticker:"ABNB", name:"Airbnb",      sector:"Tech / Travel",
    fin:{ pe:18, pb:9, revGrowth:12, grossMargin:83, opMargin:22, roe:35, de:0.2, mktCap:85 },
    dcf:{ fcf0:4, g:15, gTerm:3, wacc:10, netDebt:-10, shares:640, price:135 } },
  { ticker:"COIN", name:"Coinbase",    sector:"Fintech / Crypto",
    fin:{ pe:30, pb:6, revGrowth:60, grossMargin:85, opMargin:30, roe:25, de:1, mktCap:65 },
    dcf:{ fcf0:2, g:25, gTerm:4, wacc:13, netDebt:-5, shares:250, price:250 } },
  { ticker:"RBLX", name:"Roblox",      sector:"Gaming / Metaverse",
    fin:{ pe:-40, pb:30, revGrowth:25, grossMargin:75, opMargin:-15, roe:-50, de:1, mktCap:30 },
    dcf:{ fcf0:0.6, g:22, gTerm:4, wacc:12, netDebt:-2, shares:650, price:45 } },
  { ticker:"SOFI", name:"SoFi",        sector:"Fintech / Digital Banking",
    fin:{ pe:50, pb:1.8, revGrowth:30, grossMargin:80, opMargin:10, roe:4, de:1.5, mktCap:10 },
    dcf:{ fcf0:0.5, g:25, gTerm:4, wacc:12, netDebt:0, shares:1070, price:9 } },
  { ticker:"SPOT", name:"Spotify",     sector:"Media / Audio Streaming",
    fin:{ pe:90, pb:18, revGrowth:19, grossMargin:29, opMargin:9, roe:25, de:0.3, mktCap:90 },
    dcf:{ fcf0:1.5, g:20, gTerm:3, wacc:10, netDebt:-5, shares:200, price:450 } },
  { ticker:"CRWD", name:"CrowdStrike", sector:"Software / Cybersecurity",
    fin:{ pe:90, pb:28, revGrowth:30, grossMargin:75, opMargin:22, roe:12, de:0.2, mktCap:90 },
    dcf:{ fcf0:1.2, g:28, gTerm:4, wacc:11, netDebt:-4, shares:245, price:360 } },
  { ticker:"SNOW", name:"Snowflake",   sector:"Software / Data Cloud",
    fin:{ pe:-80, pb:9, revGrowth:28, grossMargin:68, opMargin:-10, roe:-8, de:0.1, mktCap:55 },
    dcf:{ fcf0:0.8, g:28, gTerm:4, wacc:11, netDebt:-5, shares:330, price:165 } },
  { ticker:"XOM",  name:"Exxon Mobil", sector:"Energy / Oil & Gas",
    fin:{ pe:14, pb:2, revGrowth:-2, grossMargin:35, opMargin:14, roe:14, de:0.2, mktCap:480 },
    dcf:{ fcf0:35, g:3, gTerm:2.5, wacc:8, netDebt:10, shares:4400, price:110 } },
  { ticker:"F",    name:"Ford Motor",  sector:"Autos / Manufacturing",
    fin:{ pe:12, pb:1.1, revGrowth:5, grossMargin:15, opMargin:4, roe:9, de:3.5, mktCap:45 },
    dcf:{ fcf0:5, g:5, gTerm:2.5, wacc:10, netDebt:20, shares:4000, price:11 } },
  { ticker:"BA",   name:"Boeing",      sector:"Aerospace / Defense",
    fin:{ pe:-30, pb:-5, revGrowth:5, grossMargin:10, opMargin:-2, roe:-50, de:10, mktCap:110 },
    dcf:{ fcf0:3, g:12, gTerm:3, wacc:10, netDebt:45, shares:615, price:180 } },
  { ticker:"CAT",  name:"Caterpillar", sector:"Industrials / Machinery",
    fin:{ pe:16, pb:8, revGrowth:3, grossMargin:30, opMargin:20, roe:50, de:2, mktCap:170 },
    dcf:{ fcf0:8, g:6, gTerm:3, wacc:9, netDebt:30, shares:485, price:350 } },
  { ticker:"CRSP", name:"CRISPR Therapeutics", sector:"Biotech / Genomics",
    fin:{ pe:-15, pb:3, revGrowth:100, grossMargin:50, opMargin:-200, roe:-20, de:0.05, mktCap:4 },
    dcf:{ fcf0:0.1, g:30, gTerm:4, wacc:14, netDebt:-2, shares:88, price:45 } },
];

/* ========================================================================== *
 *  WORKED EXAMPLES — Apple & Meta, fully scored (from the workbook)          *
 *  scores keyed by lens → criterion key.  ev = evidence text.                *
 * ========================================================================== */
const EXAMPLES = {
  AAPL: {
    ticker:"AAPL", name:"Apple", sector:"Technology / Consumer Electronics",
    fin: COMPANIES[0].fin, dcf: COMPANIES[0].dcf,
    scores: {
      buffett: { demand:2, moat:2, pricing:2, runway:2, mgmt:2, value:1 },
      thiel:   { secret:2, timing:2, monopoly:2, team:2, dist:2, durable:2, contrarian:1 },
      steinhardt: { belief:2, variant:2, evidence:2, disproof:2, catalyst:2, risk:1 },
      wood:    { platform:2, tam:2, curve:1, growth:1, firstmover:2, disruption:2, vision:1 },
    },
    ev: {
      buffett: {
        demand:"iPhone has 95%+ brand loyalty. Services used daily by 2B+ active devices. Demand consistent for 15+ years.",
        moat:"Triple moat: brand trust, switching pain (iCloud, apps, photos), and network effects (iMessage, AirDrop).",
        pricing:"iPhone Pro starts at $1,199+ — raised prices 3x in 5 years. Services raised prices in 2023 with little churn.",
        runway:"Services growing 12%+/yr toward $100B+. Vision Pro, AI, India expansion — multiple reinvestment runways.",
        mgmt:"Tim Cook: $600B+ returned via buybacks/dividends. Disciplined, long-term, clear succession.",
        value:"P/E ~28x — fair for the quality, but not 'cheap'. Buffett bought lower; today's price reflects the quality." },
      thiel: {
        secret:"Apple Silicon (M-series) is a genuine 10x advantage — fastest, most power-efficient chips.",
        timing:"2007 iPhone = perfect timing. 2016 services pivot nailed the digital-consumption boom. Now AI + AR.",
        monopoly:"Effective monopoly on the premium mobile ecosystem: 58%+ of US smartphones, 85%+ of global profits.",
        team:"Specialised world-class teams: design, operations (Cook), silicon (Srouji).",
        dist:"1B+ active iPhones = the best distribution platform on Earth. App Store is mandatory for iOS devs.",
        durable:"Ecosystem switching costs grow every year. Apple Intelligence deepens the lock-in.",
        contrarian:"Consensus: 'just a hardware company that will slow.' Variant: services = durable software margin. Partly priced in now." },
      steinhardt: {
        belief:"2016 consensus: iPhone peaked, market saturated, 'just hardware'. Stock fell 28%, analysts cut targets.",
        variant:"Services (App Store, Music, iCloud) growing 30%/yr on a 1B-device base — a real business hiding inside.",
        evidence:"App Store revenue grew $6B (2016) → $85B (2022). Services margins 70%+. Buffett bought a $1B stake in 2016.",
        disproof:"Wrong if services growth stalls below 15%, the install base shrinks, or App Store is broken up by regulators.",
        catalyst:"2017 Services Investor Day + Music/iCloud disclosures made the market start repricing services.",
        risk:"App Store antitrust (Epic) could cut the take rate. Meaningful but not existential." },
      wood: {
        platform:"Apple Intelligence (on-device AI + ChatGPT) plus AR/Vision Pro — two platform bets at once.",
        tam:"On-device AI $500B+; spatial computing $1T+ long term; huge software TAM.",
        curve:"Apple Silicon cost has fallen, but not as exponentially as batteries or gene sequencing. Moderate.",
        growth:"Services growing 12–15% — good, but below ARK's 20%+ bar. ARK has been underweight Apple.",
        firstmover:"Privacy-first on-device AI is unique positioning; Watch health data could become a major asset.",
        disruption:"Vision Pro could disrupt PC/phone/TV at once; AI on iOS threatens Google search.",
        vision:"Cook is an excellent operator, but not the 'visionary founder' mold ARK prefers (Musk-type)." },
    },
  },
  META: {
    ticker:"META", name:"Meta Platforms", sector:"Technology / Social Media",
    fin: COMPANIES[1].fin, dcf: COMPANIES[1].dcf,
    scores: {
      buffett: { demand:2, moat:2, pricing:2, runway:2, mgmt:2, value:2 },
      thiel:   { secret:2, timing:2, monopoly:2, team:2, dist:2, durable:2, contrarian:2 },
      steinhardt: { belief:2, variant:2, evidence:2, disproof:1, catalyst:2, risk:1 },
      wood:    { platform:2, tam:2, curve:2, growth:1, firstmover:2, disruption:2, vision:2 },
    },
    ev: {
      buffett: {
        demand:"3.3B daily active people across Facebook, Instagram, WhatsApp. Network effects keep them from leaving.",
        moat:"World's largest social graph (who knows whom). Switching cost = your entire friend network lives there.",
        pricing:"Ad prices (CPM) have risen consistently — advertisers have no substitute for Meta's targeting.",
        runway:"AI/Llama, Ray-Ban glasses, WhatsApp monetisation, Threads — many reinvestment vectors.",
        mgmt:"Zuckerberg: controlled shares, long-term vision. 2023 'Year of Efficiency' = $10B+ cuts → profit doubled.",
        value:"P/E ~22x with 20%+ EPS growth and $50B+ free cash flow — attractive quality at a fair price." },
      thiel: {
        secret:"Thiel was the FIRST outside investor. Thesis: the social graph is a winner-take-all network asset.",
        timing:"2004: social networks just starting; Facebook first to crack the real-identity graph at scale.",
        monopoly:"Harvard → Ivy League → all colleges → the world. A textbook monopoly-engine execution.",
        team:"Zuckerberg (product) + Sandberg (monetisation) + LeCun (AI). World-class across functions.",
        dist:"Friend invites = viral distribution. Near-zero acquisition cost for the first 500M users.",
        durable:"The social graph is irreplaceable; WhatsApp's 2B users are entrenched in daily communication.",
        contrarian:"2004 view: 'real-identity social will be winner-take-all.' The market didn't see it. He was right." },
      steinhardt: {
        belief:"2022 consensus: 'Metaverse is a money pit, TikTok killed Instagram, Apple ATT broke the ad model. Avoid.'",
        variant:"Reels would catch TikTok within 18 months, ATT impact was temporary, and Zuckerberg would slash costs.",
        evidence:"Reels engagement passed TikTok by Q4 2022. Headcount cut 25% in 2023. FCF went $18B → $50B in 2 years.",
        disproof:"Wrong if Reels never monetises, or regulators force a breakup of Instagram/WhatsApp from Facebook.",
        catalyst:"Q4 2022 earnings: first Reels monetisation + cost-cut announcement. Stock +23% in a single day.",
        risk:"Metaverse still burns $15B/yr and AI capex is $60B+/yr — heavy spend is an earnings risk if ads slow." },
      wood: {
        platform:"AI (Llama models, ad-targeting AI) + Next-Gen Internet (VR/AR via Quest, Ray-Ban). Two platforms.",
        tam:"Digital advertising $700B+; VR/AR $500B+; AI infrastructure massive.",
        curve:"Better AI targeting = more revenue per ad. Llama models get cheaper to run exponentially.",
        growth:"Revenue grew 22% (2023) and 19% (2024) — at the lower edge of ARK's preferred range.",
        firstmover:"3.3B users × 15+ yrs of behaviour = the most powerful ad-targeting dataset in history.",
        disruption:"Disrupted TV advertising ($200B); now disrupting search with AI-powered ads.",
        vision:"Zuckerberg's 10-year Metaverse bet despite $50B in losses — extreme long-term, ARK-style conviction." },
    },
  },
};

/* expose to non-module scripts */
window.DATA = {
  ratingFor, statusFor, LENSES, LENS_ORDER, METRICS, MOATS, THIEL_QUESTIONS,
  VARIANT_STEPS, MATRIX, GLOSSARY, COMPANIES, EXAMPLES,
};
