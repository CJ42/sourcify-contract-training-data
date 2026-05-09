const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL || 'http://127.0.0.1:8000';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', async (_req, res) => {
  try {
    const response = await fetch(`${DJANGO_BASE_URL}/api/health/`);
    const data = await response.json();
    res.json({ ok: true, gateway: 'express', backend: data });
  } catch (error) {
    res.status(502).json({ ok: false, error: `Backend unreachable: ${error.message}` });
  }
});

app.post('/api/contracts/analyze', async (req, res) => {
  try {
    const response = await fetch(`${DJANGO_BASE_URL}/api/contracts/analyze/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
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
