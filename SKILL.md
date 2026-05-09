---
name: sourcify-contract-training-cli
description: >-
  Run the sourcify-contract-training-data Python CLI: Sourcify is the primary
  data source every time; Etherscan API is optional fallback only after Sourcify
  fails. Writes Markdown reports, storage layout image, optional OpenAI analysis.
---

# Sourcify contract training data — CLI agent skill

Use this file as **agent instructions** for **OpenClaw**, **Hermes**, **Claude Code**, or any tool that accepts a Markdown skill or system prompt attachment.

## How to feed this skill to an agent

1. **Attach or paste** the path to this file (or its contents) when starting a task, e.g. “Follow `SKILL.md` in the repo root.”
2. **Project rule**: Point the agent at `./SKILL.md` (or copy the “Operational summary” section into the thread).
3. **Cursor / IDE**: Add as a project rule, or place under `.cursor/rules/` if your workflow expects rules there—this `SKILL.md` at the repository root is the canonical copy for this hackathon project.

The agent should **run commands in a real shell** from the repository root unless the user specifies otherwise.

---

## Operational summary (what the CLI does)

| Mode | Command shape | Needs network | Needs `OPENAI_API_KEY` |
| ---- | ------------- | ------------- | ---------------------- |
| `fetch` | `--mode fetch` | Yes (Sourcify, then Etherscan if configured) | No |
| `analyze` | `--mode analyze` | Yes | Yes (storage layout image uses Images API) |
| `run` (default) | `--mode run` or omit `--mode` | Yes | Yes (image + text narrative) |

**Sourcify is always attempted first** (core/default). Etherscan runs **only** if Sourcify returns **404** or empty `sources`, and **only when** **`ETHERSCAN_API_KEY`** is set — see **[`ai/ETHERSCAN_INDEX.md`](./ai/ETHERSCAN_INDEX.md)**. Use **`--no-etherscan-fallback`** to stop after Sourcify (no Etherscan).

**Working directory:** repository root (where `main.py` and `requirements.txt` live).

**Entry points (equivalent):**

```bash
python3 main.py --chain <CHAIN_ID> --address <CONTRACT_ADDRESS>
python3 src/main.py --chain <CHAIN_ID> --address <CONTRACT_ADDRESS>
```

---

## Preconditions (agent checklist)

1. **Python 3.10+** available as `python3`.
2. **Virtual environment** (recommended): `python3 -m venv .venv && source .venv/bin/activate` (Unix) or `.venv\Scripts\Activate.ps1` (Windows).
3. **Dependencies:** `python3 -m pip install -r requirements.txt`
4. **Environment:** For `analyze` / `run`, set `OPENAI_API_KEY` in `.env` (see [`.env.example`](./.env.example)). The contract must be **verified** on **Sourcify** and/or **Etherscan** (fallback); see [`ai/ETHERSCAN_INDEX.md`](./ai/ETHERSCAN_INDEX.md).
5. **HTTP timeout:** Default **`HTTP_TIMEOUT=15`** for Sourcify and Etherscan requests.

---

## Arguments (reference)

| Flag | Short | Required | Meaning |
| ---- | ----- | -------- | ------- |
| `--chain` | `-c` | Yes | EVM chain ID (e.g. `1` Ethereum mainnet). |
| `--address` | `-a` | Yes | Contract address; `0x` prefix optional. |
| `--mode` | `-m` | No | `fetch` \| `analyze` \| `run` (default: **`run`**). |
| `--output` | `-o` | No | Only with `--mode fetch`: JSON output path. Default: `sourcify_<chain>_<addr-prefix>.json`. |
| `--no-etherscan-fallback` | — | No | Do not call Etherscan if Sourcify fails. |

Full parser help:

```bash
python3 main.py --help
```

---

## Copy-paste examples

Full pipeline (default):

```bash
python3 main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36
```

Download Sourcify JSON only:

```bash
python3 main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36 --mode fetch -o ./sourcify-dump.json
```

Markdown + image, **no** OpenAI text narrative:

```bash
python3 main.py --chain 1 --address 0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36 --mode analyze
```

---

## Outputs (typical filenames)

Runs write artifacts **relative to the current working directory** unless overridden by env:

| Artifact | Default / pattern |
| -------- | ------------------- |
| Contract summary table | `contract_summary.md` (`CONTRACT_SUMMARY_MD`) |
| Full analysis Markdown | `contract_analysis_report.md` (`CONTRACT_ANALYSIS_MD`) |
| Storage layout PNG | `storage_layout_image.png` (fixed in current code) |
| OpenAI narrative (`run` only) | `{CompilationContractName}_openai_analysis.md` (`OPENAI_ANALYSIS_MD`) |
| Debug raw JSON | When `DEBUG_MODE` is set: `DEBUG_JSON` or auto-named file |

---

## Environment variables (common)

| Variable | Role |
| -------- | ---- |
| `OPENAI_API_KEY` | Required for `analyze` / `run` (images + LLM). |
| `ETHERSCAN_API_KEY` | Enables Etherscan fallback; see [`ai/ETHERSCAN_INDEX.md`](./ai/ETHERSCAN_INDEX.md). |
| `HTTP_TIMEOUT` | Optional; default **15** seconds. |

---

## Troubleshooting for agents

- **`ModuleNotFoundError: requests`**: Install deps inside the activated venv (`pip install -r requirements.txt`).
- **Sourcify 404 / no sources**: Normal for many contracts; set `ETHERSCAN_API_KEY` or verify on [etherscan.io](https://etherscan.io/). See [`ai/ETHERSCAN_INDEX.md`](./ai/ETHERSCAN_INDEX.md).
- **401 / OpenAI errors**: Set `OPENAI_API_KEY` for modes that call OpenAI.

For more detail, see [`README.md`](./README.md) in the same repository.
