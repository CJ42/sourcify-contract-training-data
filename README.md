# sourcify-contract-training-data

Python tooling to collect and analyze verified smart-contract data from [Sourcify](https://sourcify.dev/), now with a minimal full-stack demo and a Cloudflare Worker deployment target.

![Architecture diagram](docs/architecture.png)

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

### Alternative: Cloudflare Worker (edge deployment)

```text
Browser
  ↓
Cloudflare Worker (cloudflare-worker/src/index.js)
  ↓
Sourcify API
```

The Worker replaces the Express + Django stack for a zero-infra, single-file edge deployment.
It is the recommended demo path for hackathon judges who want a live URL.

## Repo layout

```text
backend/           Django project + API endpoints
frontend/          Next.js + Express gateway + static frontend page
cloudflare-worker/ Edge demo: Worker serves HTML + analysis API without Django or Express
src/               Core Python analysis logic (used by both Django and the CLI)
```

## Requirements

- Python 3.10+
- Node.js 18+
- `pip` (bundled with Python)
- `npm` / `npx`

Verify your Python version:

```bash
python3 --version
```

## Installation

On macOS (Homebrew Python) and many Linux distributions, the system Python is "externally managed" (PEP 668), so installing packages globally with `pip` is blocked. Use a virtual environment instead.

### 1. Clone the repository

```bash
git clone https://github.com/CJ42/sourcify-contract-training-data.git
cd sourcify-contract-training-data
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

On Windows (PowerShell):

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 3. Install dependencies

```bash
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
```

### 4. Environment file (`.env`)

Copy the template and edit it with your real keys (never commit `.env`):

```bash
cp .env.example .env
```

| Variable | Purpose |
| -------- | ------- |
| `OPENAI_API_KEY` | Required for `--mode run` (text analysis) and storage layout images. |
| `ETHERSCAN_API_KEY` | Optional fallback after Sourcify fails. |
| `DJANGO_SECRET_KEY` | Required in non-dev Django environments. |
| `DJANGO_ENV` | Set to `production` to harden Django settings. |
| `INTERNAL_GATEWAY_SECRET` | Optional shared secret between Express and Django. |

## Option A: Cloudflare Worker (recommended for demos)

```bash
cd cloudflare-worker
npm install
npx wrangler login
npx wrangler deploy
```

> 🔗 **Live demo:** *(paste your Workers URL here after deploy)*

## Option B: Local full-stack (Django + Express)

### Backend (Django)

```bash
export DJANGO_SECRET_KEY="your-secret-key"
export DJANGO_ENV=development
python3 backend/manage.py migrate
python3 backend/manage.py runserver 127.0.0.1:8000
```

### Frontend (Express gateway)

```bash
cd frontend
npm install
npm start
```

## Option C: CLI (Python)

From the repository root (with virtual environment activated):

```bash
python3 src/main.py --chain <CHAIN_ID> --address <CONTRACT_ADDRESS>
```

### Arguments

| Option | Short | Description |
| ------ | ----- | ----------- |
| `--chain` | `-c` | **Required.** EVM chain ID (e.g. `1` for Ethereum mainnet). |
| `--address` | `-a` | **Required.** Verified contract address. |
| `--mode` | `-m` | `fetch`, `analyze`, or `run` (default: `run`). |
| `--output` | `-o` | With `--mode fetch`: path for the saved JSON. |
| `--no-etherscan-fallback` | — | Exit instead of calling Etherscan if Sourcify fails. |

### Modes

- **`fetch`** — Downloads verified contract JSON and writes it to disk.
- **`analyze`** — Fetches, prints the analysis report, writes Markdown summaries and storage layout image. Does **not** call OpenAI.
- **`run`** — Full pipeline: everything in `analyze`, plus the OpenAI explanation.

### Examples

```bash
# Full pipeline
python3 src/main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36

# Download JSON only
python3 src/main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36 --mode fetch -o dump.json

# Reports and storage image only (no OpenAI)
python3 src/main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36 --mode analyze
```

## Security notes

| Concern | How it's addressed |
|---|---|
| Django `SECRET_KEY` | Read from `DJANGO_SECRET_KEY` env-var; fallback is dev-only |
| `DEBUG` mode | Defaults to `True` only when `DJANGO_ENV=development` |
| Express↔Django trust | Optional `INTERNAL_GATEWAY_SECRET` shared header |
| Worker XSS | All Sourcify values are HTML-escaped via DOM `textContent` before insertion |

## Deactivating the virtual environment

```bash
deactivate
```

## Dependencies

| Package    | Purpose |
| ---------- | ------- |
| `requests` | HTTP client for Sourcify API |
| `Django`   | Backend API server |

Pinned versions in [`requirements.txt`](./requirements.txt).

---

- [ ] 1. count how many files in "sources"
- [ ] 2. define the storage layout from the storage slots and draw a diagram out of it — extract from `storageLayout`
- [ ] 3. extract the type of proxy looking at `proxyResolution`
- [ ] 4. extract from each file the pragma statement used
- [ ] 5. analyse the OZ imports / common libs imported
