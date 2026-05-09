const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8000';
const INTERNAL_GATEWAY_SECRET = process.env.INTERNAL_GATEWAY_SECRET || '';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function djangoHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (INTERNAL_GATEWAY_SECRET) {
    headers['X-Gateway-Secret'] = INTERNAL_GATEWAY_SECRET;
  }
  return headers;
}

async function parseBackendResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return { ok: response.ok, status: response.status, data: await response.json() };
  }
  const text = await response.text();
  return { ok: response.ok, status: response.status, data: { error: text || 'Empty backend response' } };
}

app.get('/api/health', async (_req, res) => {
  try {
    const response = await fetch(`${DJANGO_BASE_URL}/api/health/`, { headers: djangoHeaders() });
    const { ok, status, data } = await parseBackendResponse(response);
    res.status(ok ? 200 : status).json({ ok, gateway: 'express', backend: data });
  } catch (error) {
    res.status(502).json({ ok: false, error: `Backend unreachable: ${error.message}` });
  }
});

app.post('/api/contracts/analyze', async (req, res) => {
  try {
    const response = await fetch(`${DJANGO_BASE_URL}/api/contracts/analyze/`, {
      method: 'POST',
      headers: djangoHeaders(),
      body: JSON.stringify(req.body),
    });

    const { ok, status, data } = await parseBackendResponse(response);
    res.status(status).json(data);
  } catch (error) {
    res.status(502).json({ error: `Backend unreachable: ${error.message}` });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Express gateway listening on http://127.0.0.1:${PORT}`);
  console.log(`Proxying API calls to ${DJANGO_BASE_URL}`);
});
