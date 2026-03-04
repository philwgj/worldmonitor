async function fetchJSON(path, opts) {
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function loadNews() {
  const feeds = [
    'https://feeds.reuters.com/Reuters/worldNews',
    'https://rss.cnn.com/rss/edition.rss',
  ];
  const container = document.getElementById('newsList');
  container.innerHTML = 'Loading...';
  try {
    const fragments = [];
    for (const url of feeds) {
      const proxy = `/api/rss-proxy?url=${encodeURIComponent(url)}`;
      const resp = await fetch(proxy);
      if (!resp.ok) continue;
      const text = await resp.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');
      const items = doc.querySelectorAll('item');
      for (let i=0;i<Math.min(3, items.length); i++){
        const it = items[i];
        const title = it.querySelector('title')?.textContent || '';
        const link = it.querySelector('link')?.textContent || (it.querySelector('link[href]')?.getAttribute('href')) || '#';
        fragments.push({ title, link });
      }
    }
    container.innerHTML = '<ul>' + fragments.map(f => `<li><a href="${f.link}" target="_blank">${f.title}</a></li>`).join('') + '</ul>';
  } catch (e) {
    container.textContent = 'Failed to load news: ' + e.message;
  }
}

function computeStats(quotes) {
  const valid = quotes.filter(q=>typeof q.price === 'number' && typeof q.change === 'number');
  const changes = valid.map(q => q.change!);
  const n = changes.length;
  if (n===0) return { distribution: {}, ranked: [], totalVolume: 0 };
  const totalVolume = valid.reduce((s,q)=>s + (q.volume||0), 0);
  const ranked = [...valid].sort((a,b)=> (b.change||0) - (a.change||0));
  // simple distribution buckets
  const buckets = { '>2%':0, '0-2%':0, '-2-0%':0, '<-2%':0 };
  for (const c of changes) {
    if (c > 2) buckets['>2%']++;
    else if (c > 0) buckets['0-2%']++;
    else if (c > -2) buckets['-2-0%']++;
    else buckets['<-2%']++;
  }
  return { distribution: buckets, ranked, totalVolume };
}

async function loadMarket() {
  const container = document.getElementById('marketSummary');
  container.innerHTML = 'Loading...';
  try {
    const quotes = await fetchJSON('/api/dolphindb/quotes');
    const stats = computeStats(quotes);
    container.innerHTML = `
      <div class="small">Total instruments: ${quotes.length} — Total volume: ${stats.totalVolume}</div>
      <h3>Top movers</h3>
      <table><thead><tr><th>Symbol</th><th>Change%</th><th>Price</th></tr></thead>
      <tbody>${stats.ranked.slice(0,10).map(r=>`<tr><td>${r.symbol}</td><td>${(r.change||0).toFixed(2)}%</td><td>${(r.price==null?'--':r.price)}</td></tr>`).join('')}</tbody></table>
      <h3>Distribution</h3>
      <div>${Object.entries(stats.distribution).map(([k,v])=>`<div>${k}: ${v}</div>`).join('')}</div>
    `;
  } catch (e) {
    container.textContent = 'Failed to load market: ' + e.message;
  }
}

async function loadIV() {
  const container = document.getElementById('ivSummary');
  container.innerHTML = 'Loading...';
  try {
    const ivs = await fetchJSON('/api/dolphindb/iv');
    container.innerHTML = `<table><thead><tr><th>Symbol</th><th>IV</th></tr></thead><tbody>${ivs.map(i=>`<tr><td>${i.symbol}</td><td>${i.iv==null?'-':(i.iv*100).toFixed(2)+'%'}</td></tr>`).join('')}</tbody></table>`;
  } catch (e) {
    container.textContent = 'Failed to load IV: ' + e.message;
  }
}

async function loadPositions() {
  const container = document.getElementById('positionsList');
  container.innerHTML = 'Loading...';
  try {
    const pos = await fetchJSON('/api/dolphindb/positions');
    container.innerHTML = `<table><thead><tr><th>Account</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Notional</th></tr></thead><tbody>${pos.map(p=>`<tr><td>${p.account||'-'}</td><td>${p.symbol}</td><td>${p.side}</td><td>${p.quantity}</td><td>${p.notional||'-'}</td></tr>`).join('')}</tbody></table>`;
  } catch (e) {
    container.textContent = 'Failed to load positions: ' + e.message;
  }
}

// Run AI analysis by sending context to server-side cloud LLM endpoint
async function runAIAnalysis() {
  const out = document.getElementById('aiOutput');
  out.innerHTML = 'Running cloud analysis...';
  try {
    const headlines = [];
    // small attempt to collect headlines from newsList items
    const newsLinks = document.querySelectorAll('#newsList li a');
    newsLinks.forEach(a=> headlines.push({ title: a.textContent, url: a.href }));

    const [quotes, ivs, pos] = await Promise.all([
      fetchJSON('/api/dolphindb/quotes').catch(()=>[]),
      fetchJSON('/api/dolphindb/iv').catch(()=>[]),
      fetchJSON('/api/dolphindb/positions').catch(()=>[]),
    ]);

    const body = { headlines, quotes, ivs, positions: pos };

    const resp = await fetch('/api/ai/analyze_structured', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    if (!resp.ok) {
      const text = await resp.text().catch(()=>resp.statusText);
      // fallback to local heuristic
      out.textContent = 'Cloud analysis failed: ' + text + '\nFalling back to local heuristic...';
      await runLocalHeuristicAnalysis();
      return;
    }

    const result = await resp.json();
    if (result?.parsedOk && result.parsed) {
      const obj = result.parsed;
      let html = `<div class="small">Provider: ${result.provider || 'unknown'}</div>`;
      html += `<h4>Summary</h4><div>${escapeHtml(obj.summary || '')}</div>`;
      html += `<h4>Opportunities</h4><ul>`;
      (obj.opportunities||[]).forEach(o=>{
        html += `<li>${escapeHtml(o.symbol)}: ${escapeHtml(o.reason)} (conf ${o.confidence})</li>`;
      });
      html += `</ul><h4>Risks</h4><ul>`;
      (obj.risks||[]).forEach(r=>{
        html += `<li>${escapeHtml(r.symbol)}: ${escapeHtml(r.reason)} (sev ${r.severity})</li>`;
      });
      html += `</ul>`;
      out.innerHTML = html;
    } else {
      out.textContent = 'Unexpected AI response or parse failed:\n' + JSON.stringify(result).slice(0,1000);
    }
  } catch (e) {
    out.textContent = 'Analysis failed: ' + e.message + '\nFalling back to local heuristic...';
    await runLocalHeuristicAnalysis();
  }
}

// Local heuristic fallback (kept from previous implementation)
async function runLocalHeuristicAnalysis() {
  const out = document.getElementById('aiOutput');
  try {
    const quotes = await fetchJSON('/api/dolphindb/quotes').catch(()=>[]);
    const ivs = await fetchJSON('/api/dolphindb/iv').catch(()=>[]);
    const pos = await fetchJSON('/api/dolphindb/positions').catch(()=>[]);
    const ivMap = new Map(ivs.map(i=>[i.symbol, i.iv]));
    const opportunities = [];
    for (const q of quotes) {
      const iv = ivMap.get(q.symbol) ?? null;
      const score = (Math.abs(q.change||0) / (iv? Math.max(iv*100,1):1));
      if (score > 3 && Math.abs(q.change||0) > 1) {
        opportunities.push({ symbol: q.symbol, change: q.change, iv, score });
      }
    }
    opportunities.sort((a,b)=>b.score - a.score);
    out.innerHTML = `<div class="small">Found ${opportunities.length} candidate opportunities (heuristic)</div>` +
      `<ul>${opportunities.slice(0,10).map(o=>`<li>${o.symbol}: change ${(o.change||0).toFixed(2)}% — IV ${o.iv==null?'-':(o.iv*100).toFixed(2)+'%'} — score ${o.score.toFixed(2)}</li>`).join('')}</ul>`;
  } catch (e) {
    out.textContent = 'Heuristic analysis failed: ' + e.message;
  }
}

async function refreshAll(){
  await Promise.allSettled([loadNews(), loadMarket(), loadIV(), loadPositions(), runAIAnalysis()]);
}

document.getElementById('refresh').addEventListener('click', refreshAll);
document.getElementById('runQuery').addEventListener('click', async ()=>{
  const v = document.getElementById('customQuery').value;
  if(!v) return alert('Enter JSON query body');
  try{
    const parsed = JSON.parse(v);
    const resp = await fetch('/api/dolphindb/quotes', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(parsed) });
    const json = await resp.json();
    alert('POST returned ' + (Array.isArray(json)? json.length + ' rows' : JSON.stringify(json).slice(0,200)));
    await refreshAll();
  }catch(e){ alert('Query failed: '+e.message) }
});

// Auto load
refreshAll();
