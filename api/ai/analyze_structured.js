export default async function handler(req, res) {
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
  const GROQ_KEY = process.env.GROQ_API_KEY || '';

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

  const schemaNote = `Return STRICT JSON only (no surrounding text). Schema: {\n  "summary": string,\n  "opportunities": [{ "symbol": string, "reason": string, "confidence": number }],\n  "risks": [{ "symbol": string, "reason": string, "severity": number }]\n}`;

  const systemPrompt = `You are a concise market intelligence assistant. Given the provided context (news headlines, live quotes, implied volatility, positions), produce a succinct JSON object describing market opportunities and risks.

${schemaNote}\n
Important: If there are no items for opportunities or risks, return empty arrays. DO NOT output any explanation or text outside the JSON. Ensure numeric confidence/severity are between 0 and 1.`;

  const userMessage = `Context: ${JSON.stringify(payload).slice(0, 20000)}`;

  async function callOpenRouter() {
    const resp = await fetch('https://api.openrouter.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }], max_tokens: 800 })
    });
    return resp.json();
  }

  async function callGroq() {
    const resp = await fetch('https://api.groq.ai/v1', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: systemPrompt + '\n' + userMessage, max_tokens: 800 })
    });
    return resp.json();
  }

  let provider = null;
  let rawText = null;

  if (OPENROUTER_KEY) {
    try {
      const data = await callOpenRouter();
      rawText = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || JSON.stringify(data);
      provider = 'openrouter';
    } catch (e) {
      console.warn('OpenRouter failed', e);
    }
  }

  if (!rawText && GROQ_KEY) {
    try {
      const data = await callGroq();
      rawText = data?.choices?.[0]?.text || JSON.stringify(data);
      provider = 'groq';
    } catch (e) {
      console.warn('Groq failed', e);
    }
  }

  if (!rawText) {
    res.status(503).json({ error: 'No cloud AI provider configured or all calls failed' });
    return;
  }

  // Try to parse JSON out of rawText defensively
  let parsed = null;
  let parsedOk = false;
  try {
    parsed = JSON.parse(rawText);
    parsedOk = true;
  } catch (e) {
    // Attempt to extract first JSON object-like substring
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = rawText.slice(firstBrace, lastBrace + 1);
      try {
        parsed = JSON.parse(candidate);
        parsedOk = true;
      } catch (e2) {
        parsedOk = false;
      }
    }
  }

  res.status(200).json({ provider, parsedOk, parsed, raw: String(rawText).slice(0, 20000) });
}
