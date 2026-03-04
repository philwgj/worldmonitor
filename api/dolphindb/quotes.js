export default async function handler(req, res) {
  const DOLPHINDB_API_URL = process.env.DOLPHINDB_API_URL || '';
  const DOLPHINDB_API_KEY = process.env.DOLPHINDB_API_KEY || '';

  if (!DOLPHINDB_API_URL) {
    res.status(500).json({ error: 'DOLPHINDB_API_URL not configured' });
    return;
  }

  try {
    // Preserve query string
    const origUrl = req.url || '';
    const qsIndex = origUrl.indexOf('?');
    const qs = qsIndex === -1 ? '' : origUrl.slice(qsIndex);
    const targetBase = `${DOLPHINDB_API_URL.replace(/\/$/, '')}/quotes`;
    const target = `${targetBase}${qs}`;

    const headers = {};
    if (DOLPHINDB_API_KEY) headers['Authorization'] = `Bearer ${DOLPHINDB_API_KEY}`;

    let upstream;
    if (req.method === 'POST') {
      // Forward POST body
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      headers['Content-Type'] = req.headers['content-type'] || 'application/json';
      upstream = await fetch(targetBase, { method: 'POST', headers, body });
    } else {
      upstream = await fetch(target, { method: 'GET', headers });
    }

    const text = await upstream.text();

    // Proxy status and body
    res.status(upstream.status);
    const contentType = upstream.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
}
