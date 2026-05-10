# SOLY · Sourcify contract intelligence

**Hackathon submission — verified-source pipeline + SOLY chat**

This repo turns **[Sourcify](https://sourcify.dev/)** verified contract payloads into **structured analysis**: Markdown reports, optional **OpenAI** narrative and storage-layout imagery — exposed through a **CLI**, a **Next.js** assistant (**SOLY**), and a **single Cloudflare Worker** deploy that ships both the UI and edge APIs.

![Architecture diagram](docs/architecture.png)

## Why this exists

| Audience | What they get |
| -------- | ------------- |
| **Judges (live demo)** | Open the deployed Worker URL → **SOLY** chat UI → pick a **popular contract card** → instant **Markdown report** (storage slots, proxy flags, pragmas, imports — aligned with the Python CLI). Follow up in chat for Solidity Q&A (needs `OPENAI_API_KEY` on the Worker). |
| **Developers (deep dive)** | Run **`python3 main.py`** locally for full artifacts: `contract_summary.md`, `contract_analysis_report.md`, optional OpenAI markdown, **`storage_layout_image.png`**. |

## Demo checklist (3 minutes)

1. **Cloudflare (recommended)** — Deploy Worker + static UI: see [Option B](#option-b-cloudflare-worker-recommended-for-demos). Set `OPENAI_API_KEY` secret so chat replies stream.
2. **Popular contracts** — On `/chat`, click **Aave Pool Proxy**, **Uniswap V3 USDT Pool**, or **Safe Singleton**. You should see a **full Markdown report** in-thread (Sourcify → same shape as `src/analyser.py` outputs). With **`OPENAI_API_KEY`**, a **generated storage layout diagram** (same pipeline idea as `storage_layout_image.py`) is appended as an image in the same assistant message.
3. **CLI parity** — Run `python3 main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36` and compare generated `.md` files to the in-browser report.

## Architecture

**Python CLI (primary offline tooling)**

```text
python3 main.py  (wrapper → src/main.py)
        ↓
Sourcify (+ optional Etherscan fallback)
        ↓
src/analyser.py → contract_summary.md, contract_analysis_report.md, storage_layout_image.png, optional OpenAI prose
```

**SOLY web UI (Next.js)**

```text
/chat → Topic prompts use POST /api/chat (OpenAI).
Popular-contract cards → GET /api/analyze → Markdown report in the thread (no LLM required for the report).
```

**Cloudflare Worker (one deploy for judges)**

```text
Browser → Worker
  GET  /api/analyze  → Sourcify + shared JS analysis (pairs with CLI mental model)
  POST /api/chat     → OpenAI streaming (SOLY)
  /* static assets    → Next export (frontend/out)
```

Optional Django REST stack remains available for integrators; see [Option D](#option-d-optional-full-stack-django--express-gateway).

## Repo layout

```text
main.py                   Repo-root CLI entrypoint
src/                      Python: CLI, analyser, fetch_contract
frontend/                 Next.js (SOLY + GET /api/analyze route for local dev)
cloudflare-worker/        Worker + chat-api + wrangler static assets
scripts/build-worker-static.mjs   Moves frontend/src/app/api aside → next export → restores api (Route Handlers incompatible with static export)
backend/                  Optional Django API
```

## Requirements

- Python 3.10+
- Node.js 18+
- `pip`, `npm` / `npx`

```bash
python3 --version
```

## Installation

On macOS/Linux with PEP 668, use a virtual environment.

### 1. Clone

```bash
git clone https://github.com/CJ42/sourcify-contract-training-data.git
cd sourcify-contract-training-data
```

### 2. Virtualenv

```bash
python3 -m venv .venv
source .venv/activate   # Windows: .venv\Scripts\Activate.ps1
```

### 3. Python deps

```bash
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
```

### 4. Environment

```bash
cp .env.example .env
```

| Variable | Purpose |
| -------- | ------- |
| `OPENAI_API_KEY` | CLI `--mode run`, storage layout images; **frontend** `.env.local`; Worker secret for `/api/chat`. |
| `ETHERSCAN_API_KEY` | Optional fallback if Sourcify misses verification. |
| `DJANGO_*`, `INTERNAL_GATEWAY_SECRET` | Only if you run the optional Django gateway. |

## Option A: CLI (Python) — full Markdown artifacts

```bash
python3 main.py --chain <CHAIN_ID> --address <CONTRACT_ADDRESS>
```

Same as `python3 src/main.py …`.

### Arguments

| Option | Short | Description |
| ------ | ----- | ----------- |
| `--chain` | `-c` | **Required.** Chain ID (e.g. `1`). |
| `--address` | `-a` | **Required.** Contract address. |
| `--mode` | `-m` | `fetch`, `analyze`, or `run` (default: `run`). |
| `--output` | `-o` | With `fetch`: JSON output path. |
| `--no-etherscan-fallback` | — | Skip Etherscan if Sourcify fails. |

### Modes

- **`fetch`** — Save verified JSON.
- **`analyze`** — Markdown reports + storage diagram PNG (no OpenAI text).
- **`run`** — Everything + OpenAI narrative Markdown.

### Examples

```bash
python3 main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36
python3 main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36 --mode analyze
```

## Option B: Cloudflare Worker (recommended for demos)

```bash
cd frontend && npm install
cd ../cloudflare-worker && npm install
npx wrangler login
npm run deploy
```

`npm run deploy` builds **`frontend/out`** (see script below) and uploads the Worker + assets.

```bash
npx wrangler secret put OPENAI_API_KEY
```

Local **Next.js** uses `frontend/.env.local` for `/api/chat`; production chat uses **`cloudflare-worker/src/chat-api.js`**.

> Paste your **workers.dev** URL here after deploy.

## Option C: Next.js SOLY (local)

```bash
cd frontend
npm install
npm run dev
```

- **`OPENAI_API_KEY`** in `frontend/.env.local` for streamed chat.
- **`GET /api/analyze`** is implemented at `frontend/src/app/api/analyze/route.ts` so **popular contract cards** work on localhost without Wrangler.

## Option D: Optional full-stack (Django + Express gateway)

```bash
python3 -m pip install -r backend/requirements.txt
export DJANGO_SECRET_KEY="your-secret-key"
export DJANGO_ENV=development
python3 backend/manage.py migrate
python3 backend/manage.py runserver 127.0.0.1:8000
```

Legacy Express gateway (`frontend/server.js`) can proxy to Django if needed.

## Static export + Worker build note

`frontend/next.config.ts` sets `output: "export"`. App Router **Route Handlers** cannot ship in that mode, so:

```bash
# Used by cloudflare-worker deploy
cd frontend && npm run build:static-export
```

That runs `scripts/build-worker-static.mjs`, which temporarily moves `frontend/src/app/api`, runs `next build`, then restores **`api/chat`** and **`api/analyze`** for **`npm run dev`**.

## Security notes

| Concern | Mitigation |
| ------- | ---------- |
| Secrets | Never commit `.env`; Worker secrets for production chat. |
| Django | `DJANGO_SECRET_KEY`, `DJANGO_ENV` for non-dev. |
| XSS | Prefer `react-markdown` rendering over raw HTML; Worker demo historically escaped DOM text. |

## Dependencies

| Package | Role |
| ------- | ---- |
| `requests`, `openai`, `python-dotenv` | CLI (`requirements.txt`) |
| `Django` | Optional (`backend/requirements.txt`) |

---

### Roadmap ideas

- [ ] Count sources / richer stats dashboards  
- [ ] Deeper storage visualization vs `storageLayout`  
- [ ] Proxy taxonomy from `proxyResolution`  
- [ ] Pragma matrix export  
- [ ] Library / OZ import graphs  
