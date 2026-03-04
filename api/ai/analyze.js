export default async function handler(req, res) {
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
  const GROQ_KEY = process.env.GROQ_API_KEY || '';

  // Read input payload (headlines, quotes, iv, positions)
  let payload = {};
  try {
    payload = req.method === 'POST' ? await new Promise((r, rej) => {
      let d = '';
      req.on('data', c => d += c);
      req.on('end', () => r(JSON.parse(d || '{}')));
      req.on('error', rej);
    }) : {};
  } catch (e) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const systemPrompt = `You are a market intelligence assistant. Given news headlines, live quotes, implied volatility data and positions, produce a concise list of trading opportunities and associated risks. Return JSON with keys: opportunities (array of {symbol,reason,confidence}), risks (array of {symbol,reason,severity}), summary (short text).`;

  const userMessage = `Context: ${JSON.stringify(payload).slice(0, 20000)}`;

  // Prefer OpenRouter if available
  if (OPENROUTER_KEY) {
    try {
      const resp = await fetch('https://api.openrouter.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }], max_tokens: 600 })
      });
      const data = await resp.json();
      // Try to extract text
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || JSON.stringify(data);
      res.status(200).json({ provider: 'openrouter', result: String(text) });
      return;
    } catch (e) {
      console.warn('OpenRouter call failed', e);
    }
  }

  // Fallback to Groq if configured
  if (GROQ_KEY) {
    try {
      const resp = await fetch('https://api.groq.ai/v1', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: systemPrompt + '\n' + userMessage, max_tokens: 600 })
      });
      const data = await resp.json();
      const text = data?.choices?.[0]?.text || JSON.stringify(data);
      res.status(200).json({ provider: 'groq', result: String(text) });
      return;
    } catch (e) {
      console.warn('Groq call failed', e);
    }
  }

  // No cloud provider configured — return error
  res.status(503).json({ error: 'No cloud AI provider configured (set OPENROUTER_API_KEY or GROQ_API_KEY)' });
}
