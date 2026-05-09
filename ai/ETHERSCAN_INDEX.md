# Etherscan API — optional fallback only (Sourcify stays core)

**Canonical data source:** every CLI run **always tries [Sourcify](https://sourcify.dev/) first**. That is the default and intended primary path for training-data quality (full verified artifacts, `storageLayout` when available).

**This document** covers **Etherscan API V2** only as a **secondary** step: when Sourcify returns HTTP **404** or a payload with **no usable `sources`**, you may optionally supply **`ETHERSCAN_API_KEY`** so the CLI can call `contract` → `getsourcecode` and still recover verified Solidity on supported chains (e.g. Ethereum `chainid=1`). Etherscan is **never** queried before Sourcify.

Use this file as the **single entry point** for configuring that optional fallback.

---

## Quick setup

1. Create an API key on [etherscan.io/apis](https://etherscan.io/apis) (same key works across **[supported chains](https://docs.etherscan.io/supported-chains)** in API V2).
2. In the **repository root**, add a `.env` file (never commit secrets):

```bash
# Required for fallback when Sourcify returns 404 / no sources
ETHERSCAN_API_KEY=YourApiKeyToken

# Optional: defaults to https://api.etherscan.io/v2/api
# ETHERSCAN_API_URL=https://api.etherscan.io/v2/api

# Optional: HTTP timeout in seconds for Sourcify + Etherscan (default 15)
HTTP_TIMEOUT=15
```

3. Run the CLI as usual; if Sourcify fails, you should see **`🔘❌`** for Sourcify, then **`🔘ℹ️`** / **`🔘✅`** when the Etherscan fallback succeeds.

To **disable** fallback (fail fast on Sourcify only):

```bash
python3 main.py --chain 1 --address 0x… --no-etherscan-fallback
```

---

## Behaviour notes

| Source | Storage layout | Verification metadata |
| ------ | ---------------- | --------------------- |
| Sourcify | Compiler `storageLayout` when present | Full Sourcify match / deployment fields |
| Etherscan fallback | Not available from this endpoint — analyser shows “(no storage layout available)” | Synthetic payload; `_dataSource`: `etherscan` |

The pipeline still produces **pragma / import analysis**, **Markdown summaries**, and **OpenAI** narrative when you use `--mode run`, using the reconstructed `sources` map.

---

## Reference docs in `./ai/`

These files mirror Etherscan documentation snippets useful for debugging API errors:

| File | Topic |
| ---- | ----- |
| [ETHERSCAN_GET_CONTRACT_SOURCE_CODE.md.md](./ETHERSCAN_GET_CONTRACT_SOURCE_CODE.md.md) | `getsourcecode` parameters (this fallback uses this action). |
| [ETHERSCAN_GET_CONTRACT_ABI.md](./ETHERSCAN_GET_CONTRACT_ABI.md) | ABI endpoint (not used by the fallback; ABI may still appear in getsourcecode result). |
| [ETHERSCAN_GET_CONTRACT_CREATION_TX_HASH.md](./ETHERSCAN_GET_CONTRACT_CREATION_TX_HASH.md) | Creation tx helper. |
| [ETHERSCAN_COMMON_ERROR_MESSAGES.md](./ETHERSCAN_COMMON_ERROR_MESSAGES.md) | Typical `status: "0"` / rate-limit / invalid key messages. |

Official discovery file for agents: [https://docs.etherscan.io/llms.txt](https://docs.etherscan.io/llms.txt)

---

## Troubleshooting

- **`Contract source code not verified`** — Neither Sourcify nor Etherscan has verified source for that address on the requested chain.
- **`Invalid API Key`** — Regenerate or wait for key activation; see [ETHERSCAN_COMMON_ERROR_MESSAGES.md](./ETHERSCAN_COMMON_ERROR_MESSAGES.md).
- **`Missing or unsupported chainid`** — Use a [supported `chainid`](https://docs.etherscan.io/supported-chains) for API V2.

UI confirmation for addresses missing on Sourcify: [Sourcify contract lookup](https://sourcify.dev/) (e.g. “not verified on Sourcify”) — fallback still works if Etherscan lists verified code [example](https://etherscan.io/address/0x94e7A5dCbE816e498b89aB752661904E2F56c485#code).
