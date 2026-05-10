# sourcify-contract-training-data

Python tooling to collect and analyze verified smart-contract data from [Sourcify](https://sourcify.dev/), now with a minimal full-stack demo and a Cloudflare Worker deployment target.

![Architecture diagram](docs/architecture.png)

## Architecture

**Primary Python path — CLI (no Django required)**

```text
python3 main.py  (or python3 src/main.py)
        ↓
src/fetch_contract.py → Sourcify (+ optional Etherscan)
        ↓
src/analyser.py → Markdown reports, storage layout image, optional OpenAI
```

**SOLY web chat (Next.js)**

```text
Browser → frontend (Next.js app router)
        ↓
/api/chat → OpenAI (Solidity assistant UI)
```

### Cloudflare Worker (edge deployment)

```text
Browser
  ↓
Cloudflare Worker (cloudflare-worker/src/index.js)
  ↓
Sourcify API
```

The Worker is a zero-infra, single-file edge deployment for demos.

### Optional: Django REST API

```text
Express (frontend/server.js) or direct POST
        ↓
Django (backend/api/views.py) → src/service.py + src/analyser.py
        ↓
Sourcify API
```

Install Django only if you use this stack (`pip install -r backend/requirements.txt`).

## Repo layout

```text
main.py            Repo-root wrapper; runs src/main.py CLI
src/               Core Python: CLI, analyser, fetch_contract, optional service helpers
backend/           Optional Django API (not needed for the CLI)
frontend/          Next.js app (SOLY chat) + legacy Express gateway (server.js)
cloudflare-worker/ Edge Worker + static HTML demo
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
| `DJANGO_SECRET_KEY` | Only if you run the optional Django backend. |
| `DJANGO_ENV` | Only if you run Django; set to `production` to harden settings. |
| `INTERNAL_GATEWAY_SECRET` | Optional shared secret between Express and Django. |

## Option A: CLI (Python) — default tooling

From the repository root (with virtual environment activated):

```bash
python3 main.py --chain <CHAIN_ID> --address <CONTRACT_ADDRESS>
```

Same program as `python3 src/main.py …`.

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
python3 main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36

# Download JSON only
python3 main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36 --mode fetch -o dump.json

# Reports and storage image only (no OpenAI)
python3 main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36 --mode analyze
```

## Option B: Cloudflare Worker (recommended for demos)

```bash
cd cloudflare-worker
npm install
npx wrangler login
npx wrangler deploy
```

> 🔗 **Live demo:** *(paste your Workers URL here after deploy)*

## Option C: Next.js SOLY chat (local)

```bash
cd frontend
npm install
npm run dev
```

Configure `OPENAI_API_KEY` (and any model keys) via `frontend/.env.local` as needed for `/api/chat`.

## Option D: Optional full-stack (Django + Express gateway)

Install backend dependencies (adds Django on top of the base `requirements.txt`):

```bash
python3 -m pip install -r backend/requirements.txt
```

### Backend (Django)

```bash
export DJANGO_SECRET_KEY="your-secret-key"
export DJANGO_ENV=development
python3 backend/manage.py migrate
python3 backend/manage.py runserver 127.0.0.1:8000
```

### Frontend (legacy Express gateway for `public/index.html`)

```bash
cd frontend
npm install
node server.js
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
| `openai` / `python-dotenv` | CLI analysis and env loading |
| `Django`   | Optional; install via [`backend/requirements.txt`](./backend/requirements.txt) only if you run the Django API |

Pinned versions in [`requirements.txt`](./requirements.txt).

---

- [ ] 1. count how many files in "sources"
- [ ] 2. define the storage layout from the storage slots and draw a diagram out of it — extract from `storageLayout`
- [ ] 3. extract the type of proxy looking at `proxyResolution`
- [ ] 4. extract from each file the pragma statement used
- [ ] 5. analyse the OZ imports / common libs imported
