"""
Verified contract payloads: Sourcify is the only primary source.

Every lookup hits Sourcify first. Etherscan V2 `getsourcecode` runs only as an
optional fallback when Sourcify returns 404 or no usable `sources` — never instead of Sourcify.
"""

from __future__ import annotations

import json
import os
from typing import Any

import requests

SOURCIFY_SERVER_URL = "https://sourcify.dev/server"
SOURCIFY_CONTRACT_PATH = "/v2/contract/{chainId}/{address}?fields=all"

DEFAULT_ETHERSCAN_API_URL = "https://api.etherscan.io/v2/api"


def http_timeout_seconds() -> float:
    raw = os.environ.get("HTTP_TIMEOUT", "15")
    try:
        return float(raw)
    except ValueError:
        return 15.0


def normalize_address(address: str) -> str:
    s = address.strip()
    if not s.startswith("0x"):
        s = "0x" + s
    return s


def cli_error(message: str) -> None:
    print(f"🔘❌ {message}")


def cli_success(message: str) -> None:
    print(f"🔘✅ {message}")


def cli_info(message: str) -> None:
    print(f"🔘ℹ️  {message}")


def has_usable_sources(data: dict[str, Any]) -> bool:
    sources = data.get("sources")
    return isinstance(sources, dict) and len(sources) > 0


def unwrap_etherscan_json_blob(raw: str) -> str:
    """Etherscan sometimes wraps JSON in an extra pair of braces."""
    s = raw.strip()
    while len(s) >= 4 and s.startswith("{{") and s.endswith("}}"):
        s = s[1:-1].strip()
    return s


def parse_etherscan_source_row(row: dict[str, Any]) -> dict[str, dict[str, str]]:
    """Build Sourcify-shaped `sources` map from Etherscan getsourcecode row."""
    raw = (row.get("SourceCode") or "").strip()
    contract_name = (row.get("ContractName") or "Contract").strip() or "Contract"
    contract_file = (row.get("ContractFileName") or "").strip()

    if not raw:
        return {}

    blob = unwrap_etherscan_json_blob(raw)
    if blob.startswith("{"):
        try:
            parsed: dict[str, Any] = json.loads(blob)
        except json.JSONDecodeError:
            parsed = {}
        else:
            sources = _sources_from_etherscan_parsed(parsed)
            if sources:
                return sources

    fname = contract_file if contract_file.endswith(".sol") else (contract_file or f"{contract_name}.sol")
    if not fname.endswith(".sol"):
        fname = f"{fname}.sol"
    return {fname: {"content": raw}}


def _sources_from_etherscan_parsed(parsed: dict[str, Any]) -> dict[str, dict[str, str]]:
    out: dict[str, dict[str, str]] = {}
    src = parsed.get("sources")
    if isinstance(src, dict):
        for path, inner in src.items():
            if isinstance(inner, dict) and "content" in inner:
                out[str(path)] = {"content": str(inner["content"])}
            elif isinstance(inner, str):
                out[str(path)] = {"content": inner}
        if out:
            return out

    skip = {"language", "settings"}
    for key, val in parsed.items():
        if key in skip:
            continue
        if isinstance(val, str) and (key.endswith(".sol") or "/" in key):
            out[str(key)] = {"content": val}
        elif isinstance(val, dict) and "content" in val:
            out[str(key)] = {"content": str(val["content"])}
    return out


def build_sourcify_like_from_etherscan(
    chain_id: int,
    address: str,
    row: dict[str, Any],
    sources: dict[str, dict[str, str]],
) -> dict[str, Any]:
    addr = normalize_address(address)
    abi_raw = row.get("ABI") or "[]"
    try:
        abi = json.loads(abi_raw) if isinstance(abi_raw, str) else abi_raw
    except json.JSONDecodeError:
        abi = []

    impl = (row.get("Implementation") or "").strip()
    is_proxy = str(row.get("Proxy", "0")).strip() == "1"

    return {
        "chainId": chain_id,
        "address": addr,
        "sources": sources,
        "compilation": {
            "name": row.get("ContractName") or "Contract",
            "compilerVersion": row.get("CompilerVersion"),
            "language": "Solidity",
        },
        "abi": abi,
        "proxyResolution": {
            "isProxy": is_proxy,
            "proxyType": None,
            "implementations": [impl] if impl else [],
        },
        "_dataSource": "etherscan",
        "_etherscanNote": (
            "Loaded via Etherscan API fallback; no storage layout from compiler metadata."
        ),
    }


def fetch_via_etherscan(chain_id: int, address: str) -> dict[str, Any]:
    api_key = (os.environ.get("ETHERSCAN_API_KEY") or "").strip()
    if not api_key:
        cli_error(
            "ETHERSCAN_API_KEY is not set. Add it to your .env file. "
            "See ai/ETHERSCAN_INDEX.md"
        )
        raise SystemExit(1)

    base = (os.environ.get("ETHERSCAN_API_URL") or DEFAULT_ETHERSCAN_API_URL).rstrip("/")
    addr = normalize_address(address)
    timeout = http_timeout_seconds()

    params = {
        "chainid": str(chain_id),
        "module": "contract",
        "action": "getsourcecode",
        "address": addr,
        "apikey": api_key,
    }

    try:
        response = requests.get(base, params=params, timeout=timeout)
    except requests.RequestException as exc:
        cli_error(f"Etherscan request failed: {exc}")
        raise SystemExit(1) from exc

    try:
        payload = response.json()
    except json.JSONDecodeError:
        cli_error(
            f"Etherscan returned non-JSON (HTTP {response.status_code}). "
            f"Body preview: {response.text[:200]!r}"
        )
        raise SystemExit(1)

    if not isinstance(payload, dict):
        cli_error("Etherscan: malformed top-level response.")
        raise SystemExit(1)

    if str(payload.get("status", "0")) != "1":
        err_text = payload.get("result")
        if isinstance(err_text, list):
            err_text = json.dumps(err_text)
        msg = str(err_text or payload.get("message") or "NOTOK")
        cli_error(f"Etherscan API: {msg}")
        raise SystemExit(1)

    result = payload.get("result")
    if not isinstance(result, list) or not result:
        cli_error("Etherscan: empty result list (contract may not be verified on Etherscan).")
        raise SystemExit(1)

    row = result[0]
    if not isinstance(row, dict):
        cli_error("Etherscan: unexpected result row shape.")
        raise SystemExit(1)

    sources = parse_etherscan_source_row(row)
    if not sources:
        cli_error(
            "Etherscan returned no parseable Solidity source. "
            "The contract may not be verified on Etherscan for this chain."
        )
        raise SystemExit(1)

    return build_sourcify_like_from_etherscan(chain_id, addr, row, sources)


def fetch_from_sourcify(chain_id: int, address: str) -> tuple[dict[str, Any] | None, str | None]:
    """
    Returns (data, None) if Sourcify returned usable JSON with sources.
    Returns (None, reason) if caller should try fallback or abort.
    """
    addr = normalize_address(address)
    url = f"{SOURCIFY_SERVER_URL}{SOURCIFY_CONTRACT_PATH.format(chainId=chain_id, address=addr)}"
    timeout = http_timeout_seconds()

    try:
        response = requests.get(url, timeout=timeout)
    except requests.RequestException as exc:
        return None, f"Sourcify request failed: {exc}"

    if response.status_code == 404:
        return None, "not_found"

    try:
        response.raise_for_status()
    except requests.HTTPError:
        snippet = response.text[:280].replace("\n", " ")
        return None, f"HTTP {response.status_code} from Sourcify: {snippet}"

    try:
        data = response.json()
    except json.JSONDecodeError:
        return None, "invalid JSON from Sourcify"

    if not isinstance(data, dict):
        return None, "Sourcify response is not a JSON object"

    if data.get("error"):
        return None, f"Sourcify error field: {data.get('error')}"

    if has_usable_sources(data):
        return data, None

    return None, "missing or empty sources in Sourcify response"


def fetch_verified_contract(
    chain_id: int,
    address: str,
    *,
    allow_etherscan_fallback: bool = True,
) -> dict[str, Any]:
    """
    Load contract data for the analyser.

    **Primary (always attempted):** Sourcify HTTP API — full verified artifact when available.
    **Fallback (optional):** Etherscan only after Sourcify fails; requires ETHERSCAN_API_KEY.
    """
    addr = normalize_address(address)

    data, fail_reason = fetch_from_sourcify(chain_id, address)
    if data is not None:
        data.setdefault("chainId", chain_id)
        data.setdefault("address", addr)
        data.setdefault("_dataSource", "sourcify")
        cli_success(
            f"Sourcify (primary): loaded verified contract — chain {chain_id}, `{addr}`."
        )
        return data

    if fail_reason == "not_found":
        cli_error(
            f"Sourcify has no verified contract for `{addr}` on chain {chain_id} (HTTP 404). "
            "See https://sourcify.dev/"
        )
    else:
        cli_error(f"Sourcify: {fail_reason}")

    if not allow_etherscan_fallback:
        cli_error("Etherscan fallback disabled (--no-etherscan-fallback). Exiting.")
        raise SystemExit(1)

    if not (os.environ.get("ETHERSCAN_API_KEY") or "").strip():
        cli_error(
            "Cannot use Etherscan fallback without ETHERSCAN_API_KEY in your environment (.env). "
            "See ai/ETHERSCAN_INDEX.md"
        )
        raise SystemExit(1)

    cli_info(
        "Sourcify had no usable data — calling Etherscan only as fallback (getsourcecode)…"
    )
    eth_data = fetch_via_etherscan(chain_id, address)
    cli_success(
        f"Etherscan (fallback only): loaded verified Solidity source — chain {chain_id}, `{addr}`."
    )
    return eth_data
