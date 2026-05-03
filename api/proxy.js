export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    const { targetUrl, apiKey, body } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ error: 'missing targetUrl' });
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: body,
      signal: AbortSignal.timeout(25000)
    });

    const data = await response.text();
    return res.status(response.status).setHeader('Content-Type', 'application/json').send(data);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
