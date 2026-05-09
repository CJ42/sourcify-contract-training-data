# sourcify-contract-training-data

Tooling to collect verified smart-contract data from [Sourcify](https://sourcify.dev/) for use as training data.

## Requirements

- Python 3.10+
- `pip` (bundled with Python)

Verify your Python version:

```bash
python3 --version
```

## Installation

On macOS (Homebrew Python) and many Linux distributions, the system Python is "externally managed" (PEP 668), so installing packages globally with `pip` is blocked. Use a virtual environment instead.

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/sourcify-contract-training-data.git
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

Once activated, your shell prompt should be prefixed with `(.venv)`.

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

Then set at least these variables (names match what `python-dotenv` loads in `src/main.py`):

| Variable | Purpose |
| -------- | ------- |
| `OPENAI_API_KEY` | OpenAI API key — required for `--mode run`, storage layout images, and LLM analysis. [platform.openai.com](https://platform.openai.com/) |
| `ETHERSCAN_API_KEY` | Etherscan **API V2** key — optional; used **only** when Sourcify has no match (fallback). [etherscan.io/apis](https://etherscan.io/apis) |

Example `.env` body using **placeholders** (replace with your secrets):

```bash
# OpenAI (required for full pipeline: analyze/run + images)
OPENAI_API_KEY=sk-your-openai-api-key-placeholder

# Etherscan API V2 (optional fallback after Sourcify fails)
ETHERSCAN_API_KEY=YourEtherscanApiKeyV2Placeholder
```

Other optional entries (`HTTP_TIMEOUT`, `ETHERSCAN_API_URL`, `DEBUG_MODE`, …) are documented in [`.env.example`](./.env.example). Fallback behaviour: [`ai/ETHERSCAN_INDEX.md`](./ai/ETHERSCAN_INDEX.md).

### 5. Verify the installation

```bash
python3 -c "import requests; print(requests.__version__)"
```

## CLI

From the repository root (after activating the virtual environment and installing dependencies):

```bash
python3 main.py --chain <CHAIN_ID> --address <CONTRACT_ADDRESS>
```

You can also invoke the module path directly:

```bash
python3 src/main.py --chain <CHAIN_ID> --address <CONTRACT_ADDRESS>
```

### Arguments

| Option | Short | Description |
| ------ | ----- | ----------- |
| `--chain` | `-c` | **Required.** EVM chain ID (e.g. `1` for Ethereum mainnet). |
| `--address` | `-a` | **Required.** Verified contract address, with or without the `0x` prefix. |
| `--mode` | `-m` | What to run: `fetch`, `analyze`, or `run` (default: `run`). |
| `--output` | `-o` | Only for `--mode fetch`: path for the saved JSON file. If omitted, a name like `sourcify_<chain>_<address-prefix>.json` is used. |
| `--no-etherscan-fallback` | — | If Sourcify returns **404** or unusable JSON, exit immediately instead of calling the Etherscan API. |

### Data fetching: Sourcify is default; Etherscan is fallback only

**Primary source (always tried first):** [Sourcify](https://sourcify.dev/) — this project is built around Sourcify’s verified bundles (sources, metadata, `storageLayout` when present). Requests use a bounded HTTP timeout (`HTTP_TIMEOUT`, default **15**).

**Fallback only:** If Sourcify returns **404** or a payload **without usable `sources`**, the CLI may call **[Etherscan API V2](https://docs.etherscan.io/)** `getsourcecode` — **only after** Sourcify fails, and **only if** `ETHERSCAN_API_KEY` is set (see [`.env.example`](./.env.example)). Nothing skips or replaces the Sourcify attempt.

Successful payloads include `_dataSource`: `sourcify` or `etherscan` so you can tell provenance in exported JSON.

Fallback setup and troubleshooting: **[`ai/ETHERSCAN_INDEX.md`](./ai/ETHERSCAN_INDEX.md)**.

CLI status lines use **`🔘✅`** on success and **`🔘❌`** on failure so demos fail loudly and clearly.

### Modes

- **`fetch`** — Downloads verified contract data (Sourcify-shaped JSON after any fallback) and writes it to disk. No analysis steps.
- **`analyze`** — Fetches contract data, prints the analysis report, writes Markdown summaries (`contract_summary.md`, `contract_analysis_report.md` by default), and generates the storage layout image. Does **not** call the OpenAI text explanation endpoint.
- **`run`** — Full pipeline: everything in `analyze`, plus the OpenAI Responses call and the `{ContractName}_openai_analysis.md` file (default).

### Examples

```bash
# Full pipeline (same as --mode run)
python3 main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36

# Explicit mode
python3 main.py -c 1 -a 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36 --mode run

# Only download verified metadata + sources as JSON
python3 main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36 --mode fetch -o ./dump.json

# Reports and storage image only (no OpenAI narrative text)
python3 main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36 --mode analyze

# Fail if Sourcify has no match — do not call Etherscan
python3 main.py --chain 1 --address 0x… --no-etherscan-fallback
```

### Environment variables

| Variable | Purpose |
| -------- | ------- |
| `OPENAI_API_KEY` | Required for `--mode run` (text analysis) and for storage layout image generation in `analyze` / `run`. |
| `ETHERSCAN_API_KEY` | **Optional.** Used **only** when Sourcify fails (404 / no sources); never replaces Sourcify as the first hop. See [`ai/ETHERSCAN_INDEX.md`](./ai/ETHERSCAN_INDEX.md). |
| `ETHERSCAN_API_URL` | Optional. Defaults to `https://api.etherscan.io/v2/api`. |
| `HTTP_TIMEOUT` | Optional. Seconds for HTTP requests to Sourcify and Etherscan (default: **`15`**). |
| `DEBUG_MODE` | When set, also writes the raw fetched JSON (see `DEBUG_JSON`). |
| `DEBUG_JSON` | Path for the debug JSON dump when `DEBUG_MODE` is enabled. |
| `CONTRACT_SUMMARY_MD` | Output path for the contract summary Markdown (default: `contract_summary.md`). |
| `CONTRACT_ANALYSIS_MD` | Output path for the analysis report Markdown (default: `contract_analysis_report.md`). |
| `OPENAI_ANALYSIS_MD` | Output path for the OpenAI narrative (default: `{ContractName}_openai_analysis.md`). |

Show all options:

```bash
python3 main.py --help
```

## Deactivating the virtual environment

When you are done working, deactivate the venv with:

```bash
deactivate
```

## Dependencies

| Package    | Purpose                                |
| ---------- | -------------------------------------- |
| `requests` | HTTP client used to query the Sourcify API |

Pinned versions live in [`requirements.txt`](./requirements.txt).

## Troubleshooting

### `error: externally-managed-environment`

This means you tried to `pip install` against the system Python. Always activate the project's virtual environment first:

```bash
source .venv/bin/activate
```

Then re-run the install command. Avoid `--break-system-packages`; it can corrupt your system Python.

---

# Steps

- [ ] 1. count how many files in "sources"
- [ ] 2. define the storage layout from the storage slots and draw a diagram out of it extract from "storageLayout"
- [ ] 3. extract the type of proxy looking at `proxyResolution`
- [ ] 4. extract from each file the pragma statement used
- [ ] 5. analyse the OZ imports / common libs imported