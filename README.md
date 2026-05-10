# SOLY · Sourcify contract intelligence

**Live demo:** https://sourcify-worker-demo.cavallerajean.workers.dev/

**Hackathon submission — verified-source pipeline + SOLY chat**

This repo turns **[Sourcify](https://sourcify.dev/)** (and **Etherscan** fallback) verified contract payloads into **structured analysis**: Markdown reports, **storage layout diagrams**, and an **OpenAI**-powered chat that explains how a contract works and how to integrate with it. Use the **Python CLI** for full local artifacts, or open the **deployed SOLY UI** above for the same analysis pipeline in the browser.

![Architecture diagram](docs/architecture.png)

## Why this exists

| Audience | What they get |
| -------- | ------------- |
| **Judges (live demo)** | Open the **live demo** URL → **SOLY** chat UI → enter a **verified contract address** (or pick a **popular contract card**) → **Markdown report** aligned with the Python CLI (storage slots, proxy flags, pragmas, imports). With **`OPENAI_API_KEY`** on the Worker, chat streams explanations and a **generated storage layout diagram** in-thread. |
| **Developers (deep dive)** | Run **`python3 main.py`** locally for full artifacts: `contract_summary.md`, `contract_analysis_report.md`, optional OpenAI markdown, **`storage_layout_image.png`**. |

## What SOLY does

- **Fetches verified sources** via **Sourcify**, with **Etherscan** when Sourcify does not have a match — same mental model as the CLI (`fetch_contract` / analyser).
- **Analyzes** Solidity sources: dependencies, interfaces, storage layout, proxy hints — surfaced as Markdown and (when configured) a **storage layout diagram**.
- **Explains and teaches** through chat (**OpenAI**): how the contract is structured, how to call it, and how to integrate safely — not “fix my broken paste” debugging.

## Demo checklist (3 minutes)

1. Open https://sourcify-worker-demo.cavallerajean.workers.dev/ — ensure **`OPENAI_API_KEY`** is set on the Worker so chat and diagram generation work.
2. **Popular contracts** — Click **Aave Pool Proxy**, **Uniswap V3 USDT Pool**, or **Safe Singleton**. You should see a **full Markdown report** in-thread. With **`OPENAI_API_KEY`**, a **storage layout diagram** is appended when generation succeeds.
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
/chat → Contract address or example cards → GET /api/analyze → Markdown report in the thread.
        Follow-up messages use POST /api/chat (OpenAI).
```

**Cloudflare Worker (production demo)**

```text
Browser → Worker
  GET  /api/analyze  → Sourcify + shared JS analysis (pairs with CLI mental model)
  POST /api/chat     → OpenAI streaming (SOLY)
  /* static assets    → Next export (frontend/out)
```

## Repo layout

```text
main.py                   Repo-root CLI entrypoint
src/                      Python: CLI, analyser, fetch_contract
frontend/                 Next.js (SOLY + GET /api/analyze route for local dev)
cloudflare-worker/        Worker + chat-api + wrangler static assets
scripts/build-worker-static.mjs   Moves frontend/src/app/api aside → next export → restores api (Route Handlers incompatible with static export)
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
| `OPENAI_API_KEY` | CLI `--mode run`, storage layout images; **frontend** `.env.local`; Worker secret for `/api/chat` and diagram routes. |
| `ETHERSCAN_API_KEY` | Optional fallback if Sourcify misses verification. |

## SOLY web app

https://sourcify-worker-demo.cavallerajean.workers.dev/

The production UI and `/api/*` routes are served by the **Cloudflare Worker** (`cloudflare-worker/`). To redeploy:

```bash
cd frontend && npm install
cd ../cloudflare-worker && npm install
npx wrangler login
npm run deploy
```

```bash
npx wrangler secret put OPENAI_API_KEY
```

Local **Next.js** uses `frontend/.env.local` for `/api/chat` and related routes; production uses **`cloudflare-worker/src/chat-api.js`**.

### Local frontend (optional)

```bash
cd frontend
npm install
npm run dev
```

- **`OPENAI_API_KEY`** in `frontend/.env.local` for streamed chat and storage-layout image generation.
- **`GET /api/analyze`** is implemented at `frontend/src/app/api/analyze/route.ts` so **popular contract cards** work on localhost without Wrangler.

## CLI (Python) — full Markdown artifacts

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

## Static export + Worker build note

`frontend/next.config.ts` sets `output: "export"`. App Router **Route Handlers** cannot ship in that mode, so:

```bash
# Used by cloudflare-worker deploy
cd frontend && npm run build:static-export
```

That runs `scripts/build-worker-static.mjs`, which temporarily moves `frontend/src/app/api`, runs `next build`, then restores **`api/chat`**, **`api/analyze`**, and related routes for **`npm run dev`**.

## Security notes

| Concern | Mitigation |
| ------- | ---------- |
| Secrets | Never commit `.env`; Worker secrets for production chat. |
| XSS | Prefer `react-markdown` rendering over raw HTML; Worker demo historically escaped DOM text. |

## Dependencies

| Package | Role |
| ------- | ---- |
| `requests`, `openai`, `python-dotenv` | CLI (`requirements.txt`) |

---

### Roadmap ideas

- [ ] Count sources / richer stats dashboards  
- [ ] Deeper storage visualization vs `storageLayout`  
- [ ] Proxy taxonomy from `proxyResolution`  
- [ ] Pragma matrix export  
- [ ] Library / OZ import graphs  
