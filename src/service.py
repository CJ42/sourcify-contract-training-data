from __future__ import annotations

import json
from typing import Any

import requests

from analyser import analyse_verified_contract_source_code, build_contract_summary_markdown

SOURCIFY_SERVER_URL = "https://sourcify.dev/server"
CONTRACT_ENDPOINT = "/v2/contract/{chainId}/{address}?fields=all"


class SourcifyServiceError(RuntimeError):
    pass


def fetch_verified_contract(chain_id: str | int, address: str, timeout: int = 20) -> dict[str, Any]:
    url = f"{SOURCIFY_SERVER_URL}{CONTRACT_ENDPOINT.format(chainId=chain_id, address=address)}"
    try:
        response = requests.get(url, timeout=timeout)
        response.raise_for_status()
    except requests.exceptions.HTTPError as exc:
        raise SourcifyServiceError(
            f"Sourcify returned HTTP {response.status_code} for {address} on chain {chain_id}"
        ) from exc
    except requests.exceptions.RequestException as exc:
        raise SourcifyServiceError(
            f"Network error while contacting Sourcify: {exc}"
        ) from exc

    try:
        payload = response.json()
    except json.JSONDecodeError as exc:
        raise SourcifyServiceError(
            "Sourcify returned a non-JSON response body"
        ) from exc

    if not isinstance(payload, dict) or not payload.get("address"):
        raise SourcifyServiceError("Sourcify returned an unexpected response payload")

    return payload


def analyze_contract(chain_id: str | int, address: str) -> dict[str, Any]:
    contract_data = fetch_verified_contract(chain_id=chain_id, address=address)
    report = analyse_verified_contract_source_code(contract_data)
    summary_markdown = build_contract_summary_markdown(contract_data)
    return {
        "contract": contract_data,
        "report": report,
        "summaryMarkdown": summary_markdown,
    }
