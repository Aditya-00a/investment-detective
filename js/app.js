/* ============================================================================
   THE INVESTMENT DETECTIVE — APP LOGIC
   ========================================================================== */
(function () {
"use strict";
const D = window.DATA;
const { LENSES, LENS_ORDER, METRICS, MOATS, THIEL_QUESTIONS, VARIANT_STEPS,
        MATRIX, GLOSSARY, COMPANIES, EXAMPLES, ratingFor, statusFor } = D;

/* ---------- tiny helpers ------------------------------------------------- */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s==null?"":s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const num = v => (v==null || v==="" || isNaN(+v)) ? null : +v;
const fmtNum = (v,d=1) => v==null ? "—" : (+v).toLocaleString(undefined,{maximumFractionDigits:d});
const money = v => v==null ? "—" : "$"+(+v).toLocaleString(undefined,{maximumFractionDigits:2});
const pctTxt = v => v==null ? "—" : Math.round(v*100)+"%";
function fmtTime(iso){ try{ const d=new Date(iso); return d.toLocaleString(undefined,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}); }catch(e){ return ""; } }

/* Site-wide default proxy URL for live data. Leave "" to require per-device setup.
   Once you deploy worker.js, paste its URL here (or send it to me) so live data
   works for everyone on detective.asion.ai with nothing to configure. */
const DEFAULT_PROXY = "";

/* ---------- state -------------------------------------------------------- */
const BLANK = () => ({
  ticker:"", name:"", sector:"", group:"",
  fin:{}, scores:{buffett:{},thiel:{},steinhardt:{},wood:{}}, ev:{buffett:{},thiel:{},steinhardt:{},wood:{}},
  dcf:{ fcf0:10, g:12, gTerm:3, wacc:9, netDebt:0, shares:1000, price:100 },
  decision:{ buyReason:"", risk:"", evidence:"", change:"", variant:"", pitch:"" },
  asOf:"", liveSource:"",
});
let S = BLANK();
let view = "home";
let activeLens = "buffett";
let learnTab = "guide";

/* ---------- persistence (graceful if localStorage blocked) --------------- */
const LS = (()=>{ try{ const k="__t";localStorage.setItem(k,k);localStorage.removeItem(k);return localStorage;}catch(e){return null;} })();
function saveCurrent(){
  if(!LS || !S.ticker) return;
  try{ LS.setItem("invdet:"+S.ticker.toUpperCase(), JSON.stringify(S));
       const idx = new Set(JSON.parse(LS.getItem("invdet:index")||"[]"));
       idx.add(S.ticker.toUpperCase());
       LS.setItem("invdet:index", JSON.stringify([...idx])); }catch(e){}
}
function loadTicker(t){
  if(!LS) return null;
  try{ const r = LS.getItem("invdet:"+t.toUpperCase()); return r?JSON.parse(r):null; }catch(e){ return null; }
}
function savedList(){
  if(!LS) return [];
  try{ return JSON.parse(LS.getItem("invdet:index")||"[]"); }catch(e){ return []; }
}
let saveTimer=null;
const autosave = () => { clearTimeout(saveTimer); saveTimer=setTimeout(saveCurrent, 500); };

/* ---------- calculations ------------------------------------------------- */
function lensTotal(lk){
  const L = LENSES[lk]; let sum=0, scored=0;
  L.criteria.forEach(c=>{ const v=S.scores[lk][c.key]; if(v!=null){ sum+=v; scored++; } });
  return { sum, max:L.criteria.length*2, scored, total:L.criteria.length, pct: sum/(L.criteria.length*2) };
}
function anyScored(lk){ return LENSES[lk].criteria.some(c=>S.scores[lk][c.key]!=null); }

function dcfCalc(d){
  const fcf0=+d.fcf0, g=+d.g/100, gT=+d.gTerm/100, w=+d.wacc/100;
  const years=5, rows=[]; let pvSum=0, last=fcf0;
  for(let t=1;t<=years;t++){
    const f = fcf0*Math.pow(1+g,t);
    const pv = f/Math.pow(1+w,t);
    rows.push({t, fcff:f, pv}); pvSum+=pv; last=f;
  }
  let tv=null, pvTV=0;
  if(w>gT){ tv = last*(1+gT)/(w-gT); pvTV = tv/Math.pow(1+w,years); }
  const ev = pvSum + pvTV;                     // enterprise value ($B)
  const equity = ev - (+d.netDebt);            // netDebt>0 subtracts, net cash (<0) adds
  const perShare = (+d.shares>0) ? equity*1000/(+d.shares) : null;  // $B*1000=$M ; /shares(M)=$/sh
  const price=+d.price;
  const mos = (perShare!=null && perShare!==0) ? (perShare-price)/perShare : null;
  let verdict="fair", vlabel="FAIRLY VALUED";
  if(perShare!=null){
    if(perShare >= price*1.15){ verdict="under"; vlabel="UNDERVALUED"; }
    else if(perShare <= price*0.85){ verdict="over"; vlabel="OVERVALUED"; }
  }
  return { rows, pvSum, tv, pvTV, ev, equity, perShare, price, mos, verdict, vlabel, validTV:(w>gT) };
}

/* matrix: x = expectations(0..1 from P/E), y = quality(0..1 avg of scored lenses) */
function matrixPos(){
  const pe = num(S.fin.pe);
  let x = pe==null ? 0.5 : clamp((pe-8)/(60-8), 0.03, 0.97);   // 8→left, 60→right
  const scoredLenses = LENS_ORDER.filter(anyScored);
  let y;
  if(scoredLenses.length){ y = scoredLenses.reduce((a,lk)=>a+lensTotal(lk).pct,0)/scoredLenses.length; }
  else y = null;
  return { x, y, hasY:y!=null };
}

/* ---------- view router -------------------------------------------------- */
const VIEWS = ["home","analyze","compare","valuation","learn","examples"];
const VIEW_LABEL = { home:"🏠 Start", analyze:"🔬 Analyze", compare:"⚖️ Compare", valuation:"🧮 Valuation Lab", learn:"📚 Learn", examples:"✅ Examples" };
function go(v){ view=v; render(); window.scrollTo({top:0,behavior:"smooth"}); }

function render(){
  renderNav();
  const root=$("#app");
  root.innerHTML = "";
  root.appendChild(({
    home:viewHome, analyze:viewAnalyze, compare:viewCompare,
    valuation:viewValuation, learn:viewLearn, examples:viewExamples,
  })[view]());
}

function renderNav(){
  $("#tabs").innerHTML = VIEWS.map(v=>`<button data-go="${v}" class="${v===view?'active':''}">${VIEW_LABEL[v]}</button>`).join("");
  $("#cur").innerHTML = S.ticker
    ? `<div class="cur-chip">📈 <b>${esc(S.ticker)}</b> <span class="dim">${esc(S.name||"")}</span> <span class="x" data-clear title="Clear current company">✕</span></div>`
    : "";
}

/* ===========================================================================
   HOME
   ========================================================================= */
function viewHome(){
  const v=document.createElement("div"); v.className="view";
  const saved = savedList();
  v.innerHTML = `
  <div class="hero">
    <div class="panel">
      <div class="eyebrow">A High-School Investing Lab</div>
      <h1>Same stock. <span class="g">Four legendary investors.</span> Four very different verdicts.</h1>
      <p class="lead">Type in a company and judge it through the eyes of <b>Buffett</b>, <b>Thiel</b>, <b>Steinhardt</b> and <b>Cathie Wood</b>.
      Score the evidence, value it with a real DCF, and see <i>why great philosophies disagree</i>.</p>
      <div class="steps" style="margin-top:16px">
        <div class="step"><span class="n">1</span><b>Pick a stock</b><p>Choose a company or type any ticker.</p></div>
        <div class="step"><span class="n">2</span><b>Score 4 lenses</b><p>Rate each criterion 0–2 from evidence.</p></div>
        <div class="step"><span class="n">3</span><b>Value it</b><p>WACC · FCFF · NPV → intrinsic value.</p></div>
        <div class="step"><span class="n">4</span><b>Compare & pitch</b><p>See the disagreement. Make the call.</p></div>
      </div>
    </div>
    <div class="panel search-card">
      <div class="eyebrow">Put a stock in 🔎</div>
      <div class="search-box">
        <input id="home-search" placeholder="Company or ticker — e.g. NVDA, Tesla, Costco…" autocomplete="off">
        <button class="btn" data-startsearch>Analyze →</button>
      </div>
      <div class="small dim" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span>${LIVE.getProxy()?"📡 Live data is ON — numbers auto-fill from Yahoo.":"📡 Live data: pull real prices & ratios (no API key)."}</span>
        <button class="btn ghost sm" data-livesettings>⚙ ${LIVE.getProxy()?"Live settings":"Turn on live data"}</button>
      </div>
      <div>
        <div class="small dim" style="margin-bottom:6px">Quick picks (pre-loaded with rough numbers):</div>
        <div class="chips">
          ${COMPANIES.map(c=>`<button class="chip" data-pick="${c.ticker}">${c.ticker} <span class="t">${esc(c.name)}</span></button>`).join("")}
        </div>
      </div>
      ${saved.length?`<hr class="divider"><div class="small dim" style="margin-bottom:6px">📂 Your saved work:</div>
        <div class="chips">${saved.map(t=>`<button class="chip" data-load="${esc(t)}">📈 ${esc(t)}</button>`).join("")}</div>`:""}
      <div class="disclaimer">⚠️ <b>Educational only — not financial advice.</b> Numbers are rough teaching figures, not live market data. Always do your own research.</div>
    </div>
  </div>

  <div class="panel" style="margin-top:18px">
    <div class="eyebrow">The four lenses</div>
    <div class="lens-cards" style="margin-top:12px">
      ${LENS_ORDER.map(lk=>{const L=LENSES[lk];return `
        <div class="lens-card">
          <div class="bar" style="background:${L.color}"></div>
          <div class="tag" style="color:${L.color}">${L.icon} ${esc(L.tag)}</div>
          <h3>${esc(L.name)}</h3>
          <div class="q">“${esc(L.question)}”</div>
          <div class="ol">${esc(L.oneLine)}</div>
        </div>`;}).join("")}
    </div>
  </div>`;
  return v;
}

/* ===========================================================================
   ANALYZE
   ========================================================================= */
function viewAnalyze(){
  const v=document.createElement("div"); v.className="view";
  if(!S.ticker){
    v.innerHTML = `<div class="panel center" style="padding:48px">
      <h2>No company selected yet</h2>
      <p class="dim">Head to Start and pick a stock to begin your investigation.</p>
      <button class="btn" data-go="home">← Choose a stock</button></div>`;
    return v;
  }
  v.innerHTML = `
  <div class="panel">
    <div class="company-head">
      <div>
        <div class="tick">📈 ${esc(S.ticker)}</div>
        <div class="sector">${esc(S.name||"")}${S.sector?" · "+esc(S.sector):""}</div>
        ${S.asOf?`<div class="live-badge">🟢 Live · ${esc(S.liveSource||"Yahoo Finance")} · as of ${esc(fmtTime(S.asOf))}</div>`:""}
      </div>
      <div style="margin-left:auto" class="row no-print">
        <button class="btn sm" id="btn-fetchlive" data-fetchlive>🔄 Fetch live</button>
        <button class="btn ghost sm" data-livesettings title="Live-data settings">⚙</button>
        <input id="f-group" placeholder="Group / your names" value="${esc(S.group)}" style="width:150px">
        <button class="btn ghost sm" data-print>🖨 PDF</button>
        <button class="btn ghost sm" data-reset>↺ Reset</button>
      </div>
    </div>
  </div>

  <div class="panel" style="margin-top:16px">
    <div class="eyebrow">Step 1 · Record the financials <span class="dim" style="text-transform:none;letter-spacing:0">(look them up on finviz.com — colour tells you the story)</span></div>
    <div class="metrics" style="margin-top:12px">
      ${METRICS.map(m=>`
        <div class="metric">
          <label>${esc(m.name)}</label>
          <div class="means">${esc(m.means)}</div>
          <div class="inwrap">
            <input type="number" step="any" data-fin="${m.key}" value="${S.fin[m.key]??""}" placeholder="—">
            <span class="unit">${esc(m.unit)}</span>
          </div>
          <div class="verdict" id="fv-${m.key}"></div>
          <div class="range">${esc(m.range)}</div>
        </div>`).join("")}
    </div>
  </div>

  <div class="grid analyze-2col" style="grid-template-columns:1.55fr .95fr;margin-top:16px">
    <div>
      <div class="panel">
        <div class="eyebrow" style="margin-bottom:10px">Step 2 · Score the four lenses</div>
        <div class="lens-switch" id="lens-switch"></div>
      </div>
      <div id="scorecard-host" style="margin-top:14px"></div>

      <div class="panel" style="margin-top:16px">
        <div class="eyebrow">Step 3 · Your decision &amp; 60-second pitch</div>
        <div class="grid" style="margin-top:12px">
          ${decField("variant","Your variant perception — what does the market miss?")}
          ${decField("buyReason","Main reason TO buy")}
          ${decField("risk","Main risk / reason NOT to buy")}
          ${decField("change","What would change your decision?")}
          ${decField("pitch","Your 60-second pitch (write it, then say it out loud!)")}
        </div>
      </div>
    </div>

    <div>
      <div class="panel results-card">
        <div class="eyebrow">Live verdict</div>
        <div class="chart-wrap" id="radar-host" style="margin:6px 0 4px"></div>
        <div id="mini-results"></div>
        <hr class="divider">
        <div class="btn-row">
          <button class="btn sm" data-go="compare">⚖️ Compare lenses</button>
          <button class="btn ghost sm" data-go="valuation">🧮 Value it</button>
        </div>
      </div>
    </div>
  </div>
  <div class="disclaimer">⚠️ Educational only — not financial advice. Score from <b>evidence, not vibes</b>.</div>`;

  // populate dynamic bits after insertion
  setTimeout(()=>{ renderLensSwitch(); renderScorecard(); renderMini(); renderRadar();
    METRICS.forEach(m=>updateFinVerdict(m.key)); }, 0);
  return v;
}

function decField(key,label){
  return `<div class="field"><label>${esc(label)}</label>
    <textarea data-dec="${key}" rows="2" style="width:100%;background:var(--bg2);border:1px solid var(--line);color:var(--ink);border-radius:8px;padding:8px 10px;font:inherit;font-size:13px;resize:vertical">${esc(S.decision[key]||"")}</textarea></div>`;
}

function renderLensSwitch(){
  const host=$("#lens-switch"); if(!host) return;
  host.innerHTML = LENS_ORDER.map(lk=>{
    const L=LENSES[lk], t=lensTotal(lk);
    return `<button data-lens="${lk}" class="${lk===activeLens?'active':''}"
      style="${lk===activeLens?`background:${L.color};border-color:${L.color}`:''}">
      <span class="dot" style="background:${L.color}"></span>${esc(L.name.split(" ")[L.name.split(" ").length-1])}
      <span class="mini">${t.scored?t.sum+"/"+t.max:""}</span></button>`;
  }).join("");
}

function renderScorecard(){
  const host=$("#scorecard-host"); if(!host) return;
  const L=LENSES[activeLens], t=lensTotal(activeLens), r=ratingFor(t.pct);
  host.innerHTML = `
  <div class="scorecard">
    <div class="sc-head" style="background:${L.color}1a;border-bottom:1px solid ${L.color}55">
      <div>
        <h3 style="color:${L.color}">${L.icon} ${esc(L.name)} — ${esc(L.tag)}</h3>
        <div class="blurb">${esc(L.blurb)}</div>
      </div>
    </div>
    ${L.criteria.map(c=>{
      const sc=S.scores[activeLens][c.key];
      const st=statusFor(sc==null?-1:sc);
      const lvText = sc!=null ? c.lv[sc] : "";
      return `
      <div class="crit">
        <div>
          <div class="cname">${esc(c.name)}</div>
          <div class="chint">${esc(c.hint)}</div>
          ${sc!=null?`<div class="clevel">▸ ${esc(lvText)}</div>`:""}
          <textarea data-ev="${c.key}" placeholder="Evidence / notes — what did you find?">${esc(S.ev[activeLens][c.key]||"")}</textarea>
        </div>
        <div class="scoresel">
          <div class="seg" data-crit="${c.key}">
            ${[0,1,2].map(n=>`<button data-score="${n}" class="${sc===n?'on'+n:''}" title="${esc(c.lv[n])}">${n}</button>`).join("")}
          </div>
          <div class="cstatus" id="st-${activeLens}-${c.key}" style="color:var(--${st.cls==='strong'?'strong':st.cls==='moderate'?'moderate':sc==null?'ink-dim':'weak'})">
            ${sc==null?'<span class="dim">not scored</span>':st.icon+" "+st.t}
          </div>
        </div>
      </div>`;}).join("")}
    <div class="sc-total" style="background:${L.color}12">
      <div style="display:flex;align-items:center;gap:14px;flex:1;min-width:200px">
        <div class="score-big" id="tot-${activeLens}">${t.sum}<span class="of"> / ${t.max}</span></div>
        <div class="progress"><i id="prog-${activeLens}" style="width:${t.pct*100}%;background:${L.color}"></i></div>
      </div>
      <div class="rating-badge ${r.cls}" id="rat-${activeLens}">${r.icon} ${r.label}</div>
    </div>
  </div>
  <div class="small dim" style="margin-top:8px">Score 2 = strong evidence · 1 = some evidence · 0 = little/none. Switch lenses above to score the same company another way.</div>`;
}

function renderMini(){
  const host=$("#mini-results"); if(!host) return;
  host.innerHTML = LENS_ORDER.map(lk=>{
    const L=LENSES[lk], t=lensTotal(lk), r=ratingFor(t.pct), on=anyScored(lk);
    return `<div class="mini-lens">
      <span class="dot" style="background:${L.color}"></span>
      <span class="nm">${esc(L.name)}</span>
      <span class="pct" style="color:${on?L.color:'var(--ink-dim)'}">${on?Math.round(t.pct*100)+"%":"—"}</span>
      <span class="vb rating-badge ${r.cls}" style="${on?'':'opacity:.35'}">${r.icon}</span>
    </div>`;
  }).join("");
}

/* ---- SVG radar chart ---------------------------------------------------- */
function renderRadar(){
  const host=$("#radar-host"); if(!host) return;
  const size=230, cx=size/2, cy=size/2+6, R=78;
  const pts=LEN_AXES();
  const ring=(f)=>pts.map((p,i)=>polar(cx,cy,R*f,i)).map(p=>p.join(",")).join(" ");
  const grid=[0.25,0.5,0.75,1].map(f=>`<polygon points="${ring(f)}" fill="none" stroke="var(--line)" stroke-width="1"/>`).join("");
  const spokes=pts.map((p,i)=>{const e=polar(cx,cy,R,i);return `<line x1="${cx}" y1="${cy}" x2="${e[0]}" y2="${e[1]}" stroke="var(--line)" stroke-width="1"/>`;}).join("");
  const valPts=LEN_ORDER_LOCAL().map((lk,i)=>{const t=lensTotal(lk);return polar(cx,cy,R*Math.max(t.pct,0.001),i);});
  const poly=valPts.map(p=>p.join(",")).join(" ");
  const dots=valPts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${LENSES[LEN_ORDER_LOCAL()[i]].color}"/>`).join("");
  const labels=LEN_ORDER_LOCAL().map((lk,i)=>{const e=polar(cx,cy,R+18,i);const L=LENSES[lk];
    const anchor=Math.abs(e[0]-cx)<6?"middle":(e[0]>cx?"start":"end");
    return `<text x="${e[0]}" y="${e[1]+3}" font-size="10.5" font-weight="700" fill="${L.color}" text-anchor="${anchor}">${L.icon}</text>`;}).join("");
  host.innerHTML = `<svg class="radar" width="${size}" height="${size+6}" viewBox="0 0 ${size} ${size+12}">
    ${grid}${spokes}
    <polygon points="${poly}" fill="rgba(99,102,241,.22)" stroke="var(--accent)" stroke-width="2"/>
    ${dots}${labels}
    <text x="${cx}" y="${cy+R+30}" font-size="9" fill="var(--ink-dim)" text-anchor="middle">outer ring = 100%</text>
  </svg>`;
}
function LEN_ORDER_LOCAL(){ return LEN_ORDER; }
const LEN_ORDER = LENS_ORDER;
function LEN_AXES(){ return LENS_ORDER.map(()=>0); }
function polar(cx,cy,r,i){ const n=LENS_ORDER.length; const a=-Math.PI/2 + i*2*Math.PI/n; return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; }

/* ---- financial verdict colouring --------------------------------------- */
function updateFinVerdict(key){
  const host=$("#fv-"+key); if(!host) return;
  const m=METRICS.find(x=>x.key===key); const v=num(S.fin[key]); const res=m.check(v);
  if(!res){ host.textContent=""; host.className="verdict"; return; }
  host.className="verdict v-"+res.cls; host.textContent=res.note;
}

/* ===========================================================================
   COMPARE
   ========================================================================= */
function viewCompare(){
  const v=document.createElement("div"); v.className="view";
  if(!S.ticker){ v.innerHTML = noCompany(); return v; }
  const mp=matrixPos();
  const quad = mp.hasY ? (mp.y>=0.5 ? (mp.x<0.5?MATRIX.hiQ_loE:MATRIX.hiQ_hiE) : (mp.x<0.5?MATRIX.loQ_loE:MATRIX.loQ_hiE)) : null;
  v.innerHTML = `
  <div class="panel">
    <div class="eyebrow">Head-to-head · ${esc(S.ticker)} ${esc(S.name?'· '+S.name:'')}</div>
    <h2 style="margin-top:6px">How the four philosophies judge the same company</h2>
    <div class="cmp-grid" style="margin-top:14px">
      ${LENS_ORDER.map(lk=>{
        const L=LENSES[lk], t=lensTotal(lk), r=ratingFor(t.pct), on=anyScored(lk);
        return `<div class="cmp-col" style="border-top:3px solid ${L.color}">
          <div class="top"><span style="font-size:18px">${L.icon}</span><h4>${esc(L.name)}</h4></div>
          <div class="small dim">${esc(L.tag)}</div>
          <div class="num" style="color:${on?L.color:'var(--ink-dim)'};margin-top:8px">${on?t.sum:'–'}<span class="of"> / ${t.max}</span></div>
          <div class="cmp-bar"><i style="width:${on?t.pct*100:0}%;background:${L.color}"></i></div>
          <div class="verdict rating-badge ${r.cls}" style="${on?'':'opacity:.4'}">${r.icon} ${on?r.label:'not scored'}</div>
        </div>`;}).join("")}
    </div>
    ${disagreementText()}
  </div>

  <div class="panel" style="margin-top:16px">
    <div class="eyebrow">Great company ≠ great investment</div>
    <h2 style="margin-top:6px">The Dream · Hype · Junk · Trap matrix</h2>
    <div class="matrix-wrap" style="margin-top:10px">
      <div>
        <div class="matrix">
          <div class="quad dream">${MATRIX.hiQ_loE.name}<small>great + cheap</small></div>
          <div class="quad hype">${MATRIX.hiQ_hiE.name}<small>great + pricey</small></div>
          <div class="quad junk">${MATRIX.loQ_loE.name}<small>weak + cheap</small></div>
          <div class="quad trap">${MATRIX.loQ_hiE.name}<small>weak + pricey</small></div>
          ${mp.hasY?`<div class="dot-you" style="left:${mp.x*100}%;bottom:${mp.y*100}%"></div>`:""}
          <div class="axlabel ax-x">Market expectations / price →</div>
          <div class="axlabel ax-y">Business quality →</div>
        </div>
      </div>
      <div>
        ${quad?`<div class="disagree" style="border-left-color:${quad.cls==='dream'?'var(--buy)':quad.cls==='trap'?'var(--pass)':'var(--watch)'}">
          <b>${esc(S.ticker)} lands in: ${quad.name}</b><br>${esc(quad.desc)}
          <div class="small dim" style="margin-top:8px">Quality = your average lens score (${pctTxt(mp.y)}). Expectations = read from the P/E you entered${num(S.fin.pe)==null?' (none yet — assumed middle)':' ('+fmtNum(num(S.fin.pe),1)+'x)'}.</div>
        </div>`:`<div class="disagree"><b>Score at least one lens</b> (and enter a P/E) to plot ${esc(S.ticker)} on the matrix.</div>`}
        <div class="cards3" style="margin-top:12px">
          ${Object.values(MATRIX).map(q=>`<div class="tcard"><b>${q.name}</b><div class="small dim">${esc(q.desc)}</div></div>`).join("")}
        </div>
      </div>
    </div>
  </div>
  <div class="btn-row no-print" style="margin-top:16px"><button class="btn" data-go="analyze">← Back to scoring</button>
    <button class="btn ghost" data-go="valuation">🧮 Open Valuation Lab</button></div>`;
  return v;
}

function disagreementText(){
  const scored=LENS_ORDER.filter(anyScored);
  if(scored.length<2) return `<div class="disagree" style="margin-top:14px">Score <b>two or more lenses</b> to reveal where the philosophies agree and disagree.</div>`;
  const ranked=scored.map(lk=>({lk,pct:lensTotal(lk).pct})).sort((a,b)=>b.pct-a.pct);
  const hi=ranked[0], lo=ranked[ranked.length-1];
  const gap=hi.pct-lo.pct;
  let msg;
  if(gap<0.12) msg=`The lenses mostly <b>agree</b> on ${esc(S.ticker)} — a rare case where quality, dominance, edge and innovation point the same way.`;
  else msg=`Biggest split: <b>${esc(LENSES[hi.lk].name)}</b> is most positive (${pctTxt(hi.pct)}) while <b>${esc(LENSES[lo.lk].name)}</b> is most cautious (${pctTxt(lo.pct)}). ${disagreeWhy(hi.lk,lo.lk)}`;
  return `<div class="disagree" style="margin-top:14px">🤔 ${msg}</div>`;
}
function disagreeWhy(hi,lo){
  const M={
    buffett:"sees a durable, high-quality business",
    thiel:"sees a hard-to-copy monopoly",
    steinhardt:"sees a real gap between consensus and reality",
    wood:"sees a company riding an exponential tech wave",
  };
  const N={
    buffett:"doesn't see enough moat or a fair price",
    thiel:"doesn't see a 10x, defensible edge",
    steinhardt:"thinks the story is already consensus (no variant edge)",
    wood:"doesn't see fast enough innovation or growth",
  };
  return `In plain terms: ${LENSES[hi].name.split(' ').pop()} ${M[hi]}, but ${LENSES[lo].name.split(' ').pop()} ${N[lo]}.`;
}
function noCompany(){ return `<div class="panel center" style="padding:48px"><h2>No company selected</h2>
  <p class="dim">Pick a stock first.</p><button class="btn" data-go="home">← Choose a stock</button></div>`; }

/* ===========================================================================
   VALUATION LAB (WACC / FCFF / NPV / DCF)
   ========================================================================= */
let waccBuilder = { on:false, rf:4, erp:5, beta:1.1, costDebt:5, tax:21, wEq:80 };
function viewValuation(){
  const v=document.createElement("div"); v.className="view";
  if(!S.ticker){ v.innerHTML=noCompany(); return v; }
  v.innerHTML = `
  <div class="panel">
    <div class="eyebrow">Valuation Lab · ${esc(S.ticker)}</div>
    <h2 style="margin-top:6px">🧮 What is it actually worth? <span class="dim" style="font-size:14px;font-weight:400">A real discounted-cash-flow model</span></h2>
    <p class="small dim">Project the company's free cash flow (FCFF), discount it back to today at the WACC, add a terminal value, and out comes an <b>intrinsic value per share</b>. Compare that to the price → margin of safety. This is the engine behind Buffett's “Price vs. Value”.</p>
  </div>
  <div class="val-grid" style="margin-top:16px">
    <div class="panel">
      <div class="eyebrow" style="margin-bottom:10px">Inputs <span class="dim" style="text-transform:none;letter-spacing:0">(all cash figures in $ billions)</span></div>
      ${valField("fcf0","Starting Free Cash Flow (FCFF)","$B","FCFF","number","any")}
      ${valSlider("g","Growth rate · years 1–5","%",0,60,1)}
      ${valSlider("gTerm","Terminal growth (forever after)","%",0,6,0.5)}
      ${valSlider("wacc","WACC (discount rate)","%",3,20,0.5)}
      <button class="btn ghost sm" data-waccbuilder style="margin:2px 0 6px">${waccBuilder.on?'▾':'▸'} Build the WACC from scratch</button>
      <div id="wacc-builder">${waccBuilder.on?waccBuilderHTML():""}</div>
      <hr class="divider">
      ${valField("netDebt","Net debt (cash = negative)","$B","Net debt","number","any")}
      ${valField("shares","Shares outstanding","M","Shares","number","any")}
      ${valField("price","Current share price","$","Price","number","any")}
    </div>
    <div class="panel">
      <div class="eyebrow" style="margin-bottom:10px">Result</div>
      <div id="val-out"></div>
    </div>
  </div>
  <div class="disclaimer">⚠️ A DCF is only as good as its assumptions — small changes in WACC or growth swing the answer a lot. That's the lesson, not a price target. Educational only.</div>`;
  setTimeout(renderValOut,0);
  return v;
}
function valField(key,label,unit,help,type,step){
  return `<div class="field"><label>${esc(label)} <span class="help" title="${esc(help)}">i</span></label>
    <div class="inrow"><input type="${type}" step="${step||'any'}" data-dcf="${key}" value="${S.dcf[key]}"><span class="u">${esc(unit)}</span></div></div>`;
}
function valSlider(key,label,unit,min,max,step){
  return `<div class="field"><label>${esc(label)} <span class="range-val"><span id="rv-${key}">${S.dcf[key]}</span>${esc(unit)}</span></label>
    <input type="range" min="${min}" max="${max}" step="${step}" data-dcfrange="${key}" value="${S.dcf[key]}"></div>`;
}
function waccBuilderHTML(){
  const b=waccBuilder;
  const costEq=(b.rf+b.beta*b.erp);
  const wacc=(b.wEq/100*costEq + (1-b.wEq/100)*b.costDebt*(1-b.tax/100));
  return `<div class="wacc-box">
    <div class="small dim" style="margin-bottom:8px">Cost of equity = risk-free + β × equity-risk-premium. Then blend with after-tax cost of debt.</div>
    ${[["rf","Risk-free rate","%"],["erp","Equity risk premium","%"],["beta","Beta (β)",""],["costDebt","Cost of debt","%"],["tax","Tax rate","%"],["wEq","Equity weight","%"]].map(([k,l,u])=>`
      <div class="field" style="margin-bottom:7px"><label style="font-size:11.5px">${l}<span class="u">${u}</span></label>
      <input type="number" step="any" data-wacc="${k}" value="${b[k]}" style="padding:6px 8px"></div>`).join("")}
    <div class="val-line" style="border-top:1px solid var(--line)"><span>Cost of equity</span><b>${costEq.toFixed(1)}%</b></div>
    <div class="val-line"><span>→ Computed WACC</span><b style="color:var(--accent)">${wacc.toFixed(1)}%</b></div>
    <button class="btn sm" data-applywacc style="margin-top:8px;width:100%">Use ${wacc.toFixed(1)}% as my WACC</button>
  </div>`;
}
function renderValOut(){
  const host=$("#val-out"); if(!host) return;
  const r=dcfCalc(S.dcf);
  const maxF=Math.max(...r.rows.map(x=>x.fcff),1);
  host.innerHTML = `
  <div class="val-headline" style="border-color:var(--${r.verdict==='under'?'buy':r.verdict==='over'?'pass':'watch'})">
    <div class="vs">Intrinsic value per share</div>
    <div class="iv">${r.perShare==null?'—':money(r.perShare)}</div>
    <div class="vs">vs. price ${money(r.price)}</div>
    <div class="mos-badge mos-${r.verdict==='under'?'under':r.verdict==='over'?'over':'fair'}">
      ${r.verdict==='under'?'🟢':r.verdict==='over'?'🔴':'🟡'} ${r.vlabel}${r.mos!=null?` · ${r.mos>0?'+':''}${Math.round(r.mos*100)}% margin of safety`:''}
    </div>
  </div>
  ${!r.validTV?`<div class="disagree" style="border-left-color:var(--pass)"><b>Heads up:</b> terminal growth must be below WACC, or the math blows up. Lower terminal growth (or raise WACC).</div>`:""}
  <div class="small dim" style="margin-top:6px">FCFF projection (solid) and its present value (faded):</div>
  <div class="fcff-bars">
    ${r.rows.map(x=>`<div class="b" title="Year ${x.t}: FCFF ${money(x.fcff)}B, PV ${money(x.pv)}B">
      <i style="height:${Math.max(x.fcff/maxF*100,2)}%"></i>
      <div class="pv" style="height:${Math.max(x.pv/maxF*100,1)}%;margin-top:-1px"></div>
      <small>Y${x.t}</small></div>`).join("")}
  </div>
  <hr class="divider">
  <div class="val-line"><span>Σ PV of 5-yr cash flows</span><b>${money(r.pvSum)}B</b></div>
  <div class="val-line"><span>Terminal value (undiscounted)</span><b>${r.tv==null?'—':money(r.tv)+'B'}</b></div>
  <div class="val-line"><span>PV of terminal value</span><b>${money(r.pvTV)}B</b></div>
  <div class="val-line"><span><b>Enterprise value</b></span><b>${money(r.ev)}B</b></div>
  <div class="val-line"><span>− net debt</span><b>${money(+S.dcf.netDebt)}B</b></div>
  <div class="val-line"><span><b>Equity value</b></span><b>${money(r.equity)}B</b></div>
  <div class="val-line"><span>÷ shares (${fmtNum(+S.dcf.shares,0)}M)</span><b>${r.perShare==null?'—':money(r.perShare)}/sh</b></div>
  <hr class="divider">
  <div class="small dim">This DCF informs Buffett's <b>“Price vs. Value”</b> criterion:</div>
  <button class="btn sm" data-applyval style="margin-top:8px">Apply to Buffett scorecard → ${r.verdict==='under'?'score 2 (attractive)':r.verdict==='over'?'score 0 (overpriced)':'score 1 (fair)'}</button>`;
}

/* ===========================================================================
   LEARN
   ========================================================================= */
function viewLearn(){
  const v=document.createElement("div"); v.className="view";
  const tabs=[["guide","The 4 lenses"],["moats","Moats & Monopoly"],["variant","Variant Perception"],["glossary","Finance glossary"]];
  v.innerHTML = `
  <div class="panel">
    <div class="eyebrow">Learn</div>
    <div class="tabs2" style="margin-top:10px">${tabs.map(([k,l])=>`<button data-learn="${k}" class="${k===learnTab?'active':''}">${l}</button>`).join("")}</div>
    <div id="learn-body"></div>
  </div>`;
  setTimeout(renderLearnBody,0);
  return v;
}
function renderLearnBody(){
  const host=$("#learn-body"); if(!host) return;
  if(learnTab==="guide") host.innerHTML = LENS_ORDER.map(lk=>{
    const L=LENSES[lk];
    return `<div class="guide-lens" style="border-color:${L.color}">
      <h3 style="color:${L.color};margin-top:14px">${L.icon} ${esc(L.name)} — ${esc(L.tag)}</h3>
      <div class="small" style="color:var(--ink)">${esc(L.blurb)}</div>
      <div class="famous">${esc(L.famous)}</div>
      <table class="rubric"><tr><th>Criterion</th><th>Strong (2)</th><th>Moderate (1)</th><th>Weak (0)</th></tr>
      ${L.criteria.map(c=>`<tr><td><b>${esc(c.name)}</b><br><span class="dim" style="font-size:11px">${esc(c.hint)}</span></td>
        <td class="s2">${esc(c.lv[2])}</td><td class="s1">${esc(c.lv[1])}</td><td class="s0">${esc(c.lv[0])}</td></tr>`).join("")}
      </table></div>`;
  }).join("");
  else if(learnTab==="moats") host.innerHTML = `
    <h3 style="margin-top:12px">🏰 Buffett's 5 Moat Types</h3>
    <p class="small dim">A moat is the durable advantage that keeps competitors from stealing customers.</p>
    <div class="cards3">${MOATS.map(m=>`<div class="tcard"><b>${esc(m.name)}</b><div class="small">${esc(m.desc)}</div><div class="eg">e.g. ${esc(m.eg)}</div></div>`).join("")}</div>
    <h3 style="margin-top:22px">🟣 Thiel's 7 Questions</h3>
    <p class="small dim">Every great monopoly answers “yes” to most of these.</p>
    <table class="rubric"><tr><th>Question</th><th>What it really asks</th></tr>
    ${THIEL_QUESTIONS.map(q=>`<tr><td><b>${esc(q.q)}</b></td><td>${esc(q.a)}</td></tr>`).join("")}</table>
    <h3 style="margin-top:22px">💡 The pricing-power test</h3>
    <div class="disagree">If a company raised prices <b>10%</b>, would customers stay? <span class="dim">Low power = generic chips at the supermarket. High power = the must-have app all your friends use, or water at a stadium.</span></div>`;
  else if(learnTab==="variant") host.innerHTML = `
    <h3 style="margin-top:12px">🟢 Variant Perception — the 5-part thesis</h3>
    <p class="small dim">Steinhardt's edge: a view that <b>differs from consensus</b> and is backed by evidence. Contrarian = randomly disagreeing. Variant = disagreeing <i>with evidence</i>.</p>
    <div class="cards3">${VARIANT_STEPS.map((s,i)=>`<div class="tcard"><b>${i+1}. ${esc(s.t)}</b><div class="small">${esc(s.d)}</div></div>`).join("")}</div>
    <h3 style="margin-top:22px">📐 Growth vs. Value</h3>
    <table class="rubric"><tr><th>Metric</th><th>Value signal</th><th>Growth signal</th></tr>
      <tr><td><b>P/E</b></td><td class="s2">below ~20</td><td class="s1">above ~30</td></tr>
      <tr><td><b>P/B</b></td><td class="s2">below ~1.5</td><td class="s1">above ~5</td></tr>
      <tr><td><b>PEG</b></td><td class="s2" colspan="2">below 1 = growth at a fair price (Peter Lynch's favourite)</td></tr>
    </table>
    <div class="disagree" style="margin-top:14px">⚠️ Value ≠ “cheap stocks” and growth ≠ “expensive stocks.” It's about what you pay <b>relative to future cash flows.</b></div>`;
  else host.innerHTML = `<h3 style="margin-top:12px">📖 Finance glossary</h3>
    <p class="small dim">The terms your class is learning — WACC, NPV, FCFF and the rest — in plain English.</p>
    <div class="glossary">${GLOSSARY.map(g=>`<div class="gterm"><div class="t">${esc(g.term)}</div><div class="full">${esc(g.full)}</div>
      <div class="d">${esc(g.def)}</div>${g.formula?`<div class="f mono">${esc(g.formula)}</div>`:""}</div>`).join("")}</div>`;
}

/* ===========================================================================
   EXAMPLES
   ========================================================================= */
function viewExamples(){
  const v=document.createElement("div"); v.className="view";
  v.innerHTML = `
  <div class="panel">
    <div class="eyebrow">Worked examples</div>
    <h2 style="margin-top:6px">See how a pro scored Apple &amp; Meta across all four lenses</h2>
    <p class="small dim">Study how each score is backed by evidence — then try the same thinking on your own stock. Load one to explore it live.</p>
    <div class="row" style="margin-top:12px">
      ${Object.values(EXAMPLES).map(e=>`<button class="btn ghost" data-example="${e.ticker}">📈 Load ${esc(e.ticker)} — ${esc(e.name)}</button>`).join("")}
    </div>
  </div>
  ${Object.values(EXAMPLES).map(exampleBlock).join("")}`;
  return v;
}
function exampleBlock(e){
  return `<div class="panel" style="margin-top:16px">
    <h3>📈 ${esc(e.name)} (${esc(e.ticker)}) <span class="dim small">· ${esc(e.sector)}</span></h3>
    <div class="cmp-grid" style="margin-top:12px">
    ${LENS_ORDER.map(lk=>{
      const L=LENSES[lk]; const sc=e.scores[lk];
      const sum=L.criteria.reduce((a,c)=>a+(sc[c.key]||0),0); const max=L.criteria.length*2;
      const r=ratingFor(sum/max);
      return `<div class="cmp-col" style="border-top:3px solid ${L.color}">
        <div class="top"><span style="font-size:17px">${L.icon}</span><h4>${esc(L.name.split(' ').pop())}</h4></div>
        <div class="num" style="color:${L.color}">${sum}<span class="of"> / ${max}</span></div>
        <div class="cmp-bar"><i style="width:${sum/max*100}%;background:${L.color}"></i></div>
        <div class="verdict rating-badge ${r.cls}">${r.icon} ${r.label}</div>
      </div>`;}).join("")}
    </div>
    <details style="margin-top:12px"><summary class="small" style="cursor:pointer;color:var(--accent)">▸ Show the evidence behind every score</summary>
      ${LENS_ORDER.map(lk=>{const L=LENSES[lk];return `
        <div style="margin-top:10px"><b style="color:${L.color}">${L.icon} ${esc(L.name)}</b>
        <table class="rubric"><tr><th style="width:140px">Criterion</th><th style="width:48px">Score</th><th>Evidence</th></tr>
        ${L.criteria.map(c=>`<tr><td><b>${esc(c.name)}</b></td><td class="${'s'+(e.scores[lk][c.key])}">${e.scores[lk][c.key]}/2</td><td>${esc(e.ev[lk][c.key]||"")}</td></tr>`).join("")}
        </table></div>`;}).join("")}
    </details>
  </div>`;
}

/* ===========================================================================
   LOADING COMPANIES
   ========================================================================= */
function startCompany(ticker, name, sector, fin, dcf){
  const t=ticker.toUpperCase();
  const existing=loadTicker(t);
  if(existing){ S=existing; }
  else{
    S=BLANK(); S.ticker=t; S.name=name||""; S.sector=sector||"";
    if(fin) S.fin={...fin};
    if(dcf) S.dcf={...S.dcf,...dcf};
  }
  activeLens="buffett"; saveCurrent(); go("analyze");
  if(!existing && LIVE.getProxy()) fetchLiveFor(t, {silent:true});
}
function pickFromLibrary(ticker){
  const c=COMPANIES.find(x=>x.ticker===ticker);
  if(c) startCompany(c.ticker,c.name,c.sector,c.fin,c.dcf);
}
function loadExample(ticker){
  const e=EXAMPLES[ticker]; if(!e) return;
  S=BLANK(); S.ticker=e.ticker; S.name=e.name; S.sector=e.sector;
  S.fin={...e.fin}; S.dcf={...S.dcf,...e.dcf};
  LENS_ORDER.forEach(lk=>{ S.scores[lk]={...e.scores[lk]}; S.ev[lk]={...e.ev[lk]}; });
  activeLens="buffett"; saveCurrent(); go("analyze"); toast(`Loaded the worked ${e.ticker} example`);
}
function handleSearch(q){
  q=q.trim(); if(!q) return;
  const up=q.toUpperCase();
  const byTicker=COMPANIES.find(c=>c.ticker===up);
  const byName=COMPANIES.find(c=>c.name.toLowerCase()===q.toLowerCase()||c.name.toLowerCase().includes(q.toLowerCase()));
  if(byTicker) return pickFromLibrary(byTicker.ticker);
  if(byName) return pickFromLibrary(byName.ticker);
  // unknown ticker — start a blank analysis the student fills in
  const t = up.replace(/[^A-Z0-9.\-]/g,"").slice(0,8) || up.slice(0,8);
  startCompany(t, q.length<=6?"":q, "", null, null);
  toast(`New analysis for ${t} — fill in the numbers yourself!`);
}

/* ---------- toast -------------------------------------------------------- */
let toastTimer;
function toast(msg){
  $$(".toast").forEach(t=>t.remove());
  const el=document.createElement("div"); el.className="toast"; el.textContent=msg; document.body.appendChild(el);
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.remove(),2200);
}

/* ===========================================================================
   EVENT DELEGATION
   ========================================================================= */
document.addEventListener("click", e=>{
  const t=e.target.closest("[data-go],[data-pick],[data-load],[data-startsearch],[data-clear],[data-lens],[data-score],[data-print],[data-reset],[data-example],[data-learn],[data-waccbuilder],[data-applywacc],[data-applyval],[data-load]");
  if(!t) return;

  if(t.dataset.go){ go(t.dataset.go); return; }
  if(t.dataset.pick){ pickFromLibrary(t.dataset.pick); return; }
  if(t.dataset.load){ const s=loadTicker(t.dataset.load); if(s){S=s;activeLens="buffett";go("analyze");toast("Loaded "+t.dataset.load);} return; }
  if(t.hasAttribute("data-startsearch")){ handleSearch($("#home-search").value); return; }
  if(t.hasAttribute("data-clear")){ S=BLANK(); go("home"); return; }
  if(t.dataset.example){ loadExample(t.dataset.example); return; }
  if(t.dataset.learn){ learnTab=t.dataset.learn; renderLearnBody(); $$("[data-learn]").forEach(b=>b.classList.toggle("active",b.dataset.learn===learnTab)); return; }

  // lens switch
  if(t.dataset.lens){ activeLens=t.dataset.lens; renderLensSwitch(); renderScorecard(); return; }

  // score button
  if(t.dataset.score!=null && t.closest(".seg")){
    const crit=t.closest(".seg").dataset.crit; const n=+t.dataset.score;
    if(S.scores[activeLens][crit]===n) S.scores[activeLens][crit]=null; else S.scores[activeLens][crit]=n;
    onScoreChange(crit); autosave(); return;
  }

  if(t.hasAttribute("data-print")){ window.print(); return; }
  if(t.hasAttribute("data-reset")){ if(confirm("Clear all scores, notes and financials for "+S.ticker+"?")){ const k=S.ticker,n=S.name,s=S.sector,f={...S.fin}; S=BLANK(); S.ticker=k;S.name=n;S.sector=s; go("analyze"); } return; }

  if(t.hasAttribute("data-waccbuilder")){ waccBuilder.on=!waccBuilder.on; $("#wacc-builder").innerHTML=waccBuilder.on?waccBuilderHTML():""; t.textContent=(waccBuilder.on?'▾':'▸')+" Build the WACC from scratch"; return; }
  if(t.hasAttribute("data-applywacc")){ const b=waccBuilder; const w=(b.wEq/100*(b.rf+b.beta*b.erp)+(1-b.wEq/100)*b.costDebt*(1-b.tax/100)); S.dcf.wacc=+w.toFixed(1); renderValuationInputs(); renderValOut(); toast("WACC set to "+S.dcf.wacc+"%"); autosave(); return; }
  if(t.hasAttribute("data-applyval")){ const r=dcfCalc(S.dcf); const v=r.verdict==='under'?2:r.verdict==='over'?0:1; S.scores.buffett.value=v; toast("Buffett · Price vs. Value set to "+v); go("analyze"); return; }
});

/* update one criterion's status + totals + radar without re-rendering inputs */
function onScoreChange(crit){
  const seg=$(`.seg[data-crit="${crit}"]`);
  if(seg){ const sc=S.scores[activeLens][crit];
    $$("button",seg).forEach(b=>{ b.className = (+b.dataset.score===sc)?("on"+sc):""; });
    const st=$("#st-"+activeLens+"-"+crit);
    if(st){ if(sc==null){ st.innerHTML='<span class="dim">not scored</span>'; st.style.color="var(--ink-dim)"; }
      else{ const s=statusFor(sc); st.textContent=s.icon+" "+s.t; st.style.color="var(--"+(sc===2?"strong":sc===1?"moderate":"weak")+")"; } }
    // level text
    const crow=seg.closest(".crit"); let lv=crow.querySelector(".clevel");
    const c=LENSES[activeLens].criteria.find(x=>x.key===crit);
    if(S.scores[activeLens][crit]!=null){ const txt="▸ "+c.lv[sc];
      if(lv) lv.textContent=txt; else { lv=document.createElement("div"); lv.className="clevel"; lv.textContent=txt; crow.querySelector(".chint").after(lv);} }
    else if(lv) lv.remove();
  }
  // totals
  const t=lensTotal(activeLens), r=ratingFor(t.pct);
  const tot=$("#tot-"+activeLens); if(tot) tot.innerHTML=t.sum+'<span class="of"> / '+t.max+'</span>';
  const prog=$("#prog-"+activeLens); if(prog) prog.style.width=(t.pct*100)+"%";
  const rat=$("#rat-"+activeLens); if(rat){ rat.className="rating-badge "+r.cls; rat.textContent=r.icon+" "+r.label; }
  renderLensSwitch(); renderMini(); renderRadar();
}

function renderValuationInputs(){
  // refresh slider labels + number inputs to match S.dcf (after wacc apply)
  ["g","gTerm","wacc"].forEach(k=>{ const rv=$("#rv-"+k); if(rv) rv.textContent=S.dcf[k]; const rg=$(`[data-dcfrange="${k}"]`); if(rg) rg.value=S.dcf[k]; });
  $$("[data-dcf]").forEach(i=>{ i.value=S.dcf[i.dataset.dcf]; });
}

/* input handling (typing) */
document.addEventListener("input", e=>{
  const t=e.target;
  if(t.dataset.fin!=null){ const k=t.dataset.fin; S.fin[k]= t.value===""?undefined:+t.value; updateFinVerdict(k); autosave(); return; }
  if(t.dataset.ev!=null){ S.ev[activeLens][t.dataset.ev]=t.value; autosave(); return; }
  if(t.dataset.dec!=null){ S.decision[t.dataset.dec]=t.value; autosave(); return; }
  if(t.id==="f-group"){ S.group=t.value; autosave(); return; }
  if(t.dataset.dcf!=null){ S.dcf[t.dataset.dcf]= t.value===""?0:+t.value; renderValOut(); autosave(); return; }
  if(t.dataset.dcfrange!=null){ const k=t.dataset.dcfrange; S.dcf[k]=+t.value; const rv=$("#rv-"+k); if(rv) rv.textContent=t.value; renderValOut(); autosave(); return; }
  if(t.dataset.wacc!=null){ waccBuilder[t.dataset.wacc]=+t.value||0; $("#wacc-builder").innerHTML=waccBuilderHTML(); return; }
});
document.addEventListener("keydown", e=>{
  if(e.key==="Enter" && e.target.id==="home-search"){ handleSearch(e.target.value); }
});

/* ===========================================================================
   LIVE DATA (Yahoo via proxy — see live.js / worker.js)
   ========================================================================= */
function applyLive(d){
  if(!d) return;
  if(d.name) S.name=d.name;
  if(d.sector) S.sector=d.sector;
  if(d.fin) for(const k in d.fin){ const v=d.fin[k]; if(v!=null && !isNaN(v)) S.fin[k]=v; }
  if(d.dcf) ["price","shares","fcf0","netDebt"].forEach(k=>{ if(d.dcf[k]!=null && !isNaN(d.dcf[k])) S.dcf[k]=d.dcf[k]; });
  if(d.price!=null && !isNaN(d.price)) S.dcf.price=d.price;
  S.asOf = d.asOf || new Date().toISOString();
  S.liveSource = d.source || "Yahoo Finance";
  saveCurrent();
  if(["analyze","valuation","compare"].includes(view)) render();
}
async function fetchLiveFor(ticker, opts){
  opts=opts||{};
  if(!ticker) return;
  if(!LIVE.getProxy()){ if(!opts.silent) openLiveSettings("First, turn on live data (2-min setup — no API key)."); return; }
  const btn=$("#btn-fetchlive"); if(btn){ btn.disabled=true; btn.textContent="⏳ Fetching…"; }
  try{
    const d=await LIVE.fetchLive(ticker);
    applyLive(d);
    toast("📡 Live data loaded for "+ticker);
  }catch(e){
    if(String(e.message)==="NO_PROXY"){ if(!opts.silent) openLiveSettings("Turn on live data to auto-fill the numbers."); }
    else toast("Live fetch failed: "+(e.message||e));
  }finally{ const b=$("#btn-fetchlive"); if(b){ b.disabled=false; b.textContent="🔄 Fetch live"; } }
}
function openLiveSettings(msg){
  const old=$("#live-pop"); if(old) old.remove();
  const p=document.createElement("div"); p.id="live-pop"; p.className="live-pop";
  p.innerHTML=`<div class="live-pop-card">
    <button class="live-x" data-closelive title="Close">✕</button>
    <h3>📡 Live data</h3>
    <p class="small dim">Pulls live price &amp; ratios from <b>Yahoo Finance — no API key.</b> Paste your proxy URL (the Cloudflare Worker from <span class="mono">LIVE_DATA_SETUP.md</span>). It's stored only in this browser.</p>
    ${msg?`<div class="live-msg">${esc(msg)}</div>`:""}
    <input id="live-url" placeholder="https://your-worker.workers.dev" value="${esc(LIVE.getProxy())}">
    <div class="btn-row" style="margin-top:10px">
      <button class="btn sm" data-saveproxy>Save</button>
      <button class="btn ghost sm" data-testproxy>Test (AAPL)</button>
      <button class="btn ghost sm" data-closelive>Close</button>
    </div>
    <div id="live-test" class="small" style="margin-top:8px"></div>
    <div class="small dim" style="margin-top:8px">No proxy yet? See <span class="mono">LIVE_DATA_SETUP.md</span> — it takes ~2 minutes and needs no key.</div>
  </div>`;
  document.body.appendChild(p);
  const inp=$("#live-url"); if(inp) inp.focus();
}
async function testProxy(){
  const url=($("#live-url").value||"").trim(); const out=$("#live-test");
  if(!url){ out.textContent="Enter your proxy URL first."; out.className="small v-weak"; return; }
  LIVE.setProxy(url); out.textContent="Testing…"; out.className="small dim";
  try{ const d=await LIVE.fetchLive("AAPL");
    out.innerHTML="✅ Works! AAPL "+(d.price!=null?("$"+d.price):"")+" · P/E "+(d.fin&&d.fin.pe!=null?d.fin.pe:"?")+" · ROE "+(d.fin&&d.fin.roe!=null?d.fin.roe+"%":"?");
    out.className="small v-strong"; }
  catch(e){ out.innerHTML="❌ "+esc(e.message||e); out.className="small v-weak"; }
}
document.addEventListener("click", e=>{
  const t=e.target.closest("[data-fetchlive],[data-livesettings],[data-saveproxy],[data-testproxy],[data-closelive]");
  if(!t) return;
  if(t.hasAttribute("data-livesettings")){ openLiveSettings(); return; }
  if(t.hasAttribute("data-fetchlive")){ fetchLiveFor(S.ticker); return; }
  if(t.hasAttribute("data-testproxy")){ testProxy(); return; }
  if(t.hasAttribute("data-saveproxy")){ LIVE.setProxy($("#live-url").value); const p=$("#live-pop"); if(p)p.remove(); toast("Saved — live data is on"); if(S.ticker) fetchLiveFor(S.ticker); else render(); return; }
  if(t.hasAttribute("data-closelive")){ const p=$("#live-pop"); if(p)p.remove(); return; }
});

/* ---------- boot --------------------------------------------------------- */
if(DEFAULT_PROXY && !LIVE.getProxy()) LIVE.setProxy(DEFAULT_PROXY);
render();
})();
