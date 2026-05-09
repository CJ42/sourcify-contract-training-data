# sourcify-contract-training-data

Tooling to collect and analyze verified smart-contract data from [Sourcify](https://sourcify.dev/), now with a minimal full-stack demo:

- **Django backend** exposes contract-analysis endpoints
- **Express gateway** proxies frontend traffic to Django
- **Tiny frontend** calls the Express API and renders the analysis
- **Python analysis core** still lives in `src/`

## Architecture

```text
Frontend page (frontend/public/index.html)
        ↓
Express gateway (frontend/server.js)
        ↓
Django API (backend/api/views.py)
        ↓
Python analysis service (src/service.py + src/analyser.py)
        ↓
Sourcify API
```

## Repo layout

```text
backend/     Django project + API endpoints
frontend/    Express server + static frontend page
src/         Core Python analysis logic
```

## Requirements

- Python 3.10+
- Node.js 18+
- `pip`
- `npm`

## Backend setup (Django)

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
python3 backend/manage.py migrate
python3 backend/manage.py runserver 127.0.0.1:8000
```

### Backend endpoints

- `GET /api/health/`
- `POST /api/contracts/analyze/`

Sample payload:

```json
{
  "chainId": 1,
  "address": "0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36"
}
```

## Frontend setup (Express + static page)

```bash
cd frontend
npm install
npm start
```

By default, Express runs on `http://127.0.0.1:3000` and proxies API traffic to `http://127.0.0.1:8000`.

If needed, override the backend URL:

```bash
DJANGO_BASE_URL=http://127.0.0.1:8000 npm start
```

## Running the original Python script

The original one-shot analysis flow still works:

```bash
python3 src/main.py
```

## Why this PR matters

This gives the project a real integration path for the hackathon:

- frontend can trigger live analysis
- Express can act as the product-facing API layer
- Django holds the Python-native business logic
- the Sourcify analyzer stays reusable by both CLI and web flows
