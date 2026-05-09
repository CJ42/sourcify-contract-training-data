import json
import os
import re
from datetime import datetime, timezone
from typing import Any

import requests

PRAGMA_PATTERN = re.compile(r"pragma\s+solidity\s+([^;]+);")
IMPORT_PATTERN = re.compile(r"""import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]""")

INTERFACE_DEF_PATTERN = re.compile(r"^\s*interface\s+(\w+)", re.MULTILINE)
LIBRARY_DEF_PATTERN = re.compile(r"^\s*library\s+(\w+)", re.MULTILINE)
ABSTRACT_CONTRACT_PATTERN = re.compile(r"^\s*abstract\s+contract\s+(\w+)", re.MULTILINE)
CONTRACT_DEF_PATTERN = re.compile(r"^\s*contract\s+(\w+)", re.MULTILINE)

DEFAULT_RPC_BY_CHAIN: dict[str, str] = {
    "1": "https://ethereum.publicnode.com",
    "11155111": "https://ethereum-sepolia.publicnode.com",
    "17000": "https://ethereum-holesky.publicnode.com",
}

KNOWN_LIBRARIES: dict[str, str] = {
    "@openzeppelin/": "OpenZeppelin",
    "@uniswap/": "Uniswap",
    "@chainlink/": "Chainlink",
    "@aave/": "Aave",
    "@layerzerolabs/": "LayerZero",
    "@axelar-network/": "Axelar",
    "solmate/": "Solmate",
    "solady/": "Solady",
    "ds-test/": "ds-test",
    "forge-std/": "forge-std",
    "hardhat/": "Hardhat",
}


def count_source_files(data: dict[str, Any]) -> int:
    sources = data.get("sources") or {}
    return len(sources)


def list_source_files(data: dict[str, Any]) -> list[str]:
    sources = data.get("sources") or {}
    return sorted(sources.keys())


def _resolve_type_label(type_id: str, types: dict[str, Any]) -> str:
    label = (types.get(type_id) or {}).get("label")
    return label or type_id


def get_storage_layout_diagram(data: dict[str, Any]) -> str:
    layout = data.get("storageLayout") or {}
    storage = layout.get("storage") or []
    types = layout.get("types") or {}

    if not storage:
        return "(no storage layout available)"

    lines: list[str] = []
    for slot in storage:
        slot_id = slot.get("slot", "?")
        offset = slot.get("offset", 0)
        label = slot.get("label", "")
        type_id = slot.get("type", "")
        type_label = _resolve_type_label(type_id, types)
        lines.append(f"slot {slot_id:>3} | off {offset:>2} | {label}: {type_label}")

        if "struct" in type_id:
            members = (types.get(type_id) or {}).get("members") or []
            for member in members:
                m_slot = member.get("slot", "?")
                m_off = member.get("offset", 0)
                m_label = member.get("label", "")
                m_type = _resolve_type_label(member.get("type", ""), types)
                lines.append(f"           +{m_slot:>2} | off {m_off:>2} |   ├─ {m_label}: {m_type}")

    return "\n".join(lines)


def get_proxy_info(data: dict[str, Any]) -> dict[str, Any]:
    proxy = data.get("proxyResolution") or {}
    return {
        "isProxy": bool(proxy.get("isProxy", False)),
        "proxyType": proxy.get("proxyType"),
        "implementations": proxy.get("implementations") or [],
    }


def count_solidity_definitions(data: dict[str, Any]) -> dict[str, int]:
    """Aggregate counts of top-level Solidity definitions across all verified source files."""
    sources = data.get("sources") or {}
    interfaces = libraries = abstract_contracts = contracts = 0
    for _, entry in sources.items():
        content = _read_source_content(entry)
        interfaces += len(INTERFACE_DEF_PATTERN.findall(content))
        libraries += len(LIBRARY_DEF_PATTERN.findall(content))
        abstract_contracts += len(ABSTRACT_CONTRACT_PATTERN.findall(content))
        contracts += len(CONTRACT_DEF_PATTERN.findall(content))
    return {
        "totalSourceFiles": len(sources),
        "interface": interfaces,
        "library": libraries,
        "abstractContract": abstract_contracts,
        "contract": contracts,
    }


def _collect_link_reference_library_names(link_refs: Any) -> list[str]:
    if not isinstance(link_refs, dict):
        return []
    names: list[str] = []
    for _path, slots in link_refs.items():
        if isinstance(slots, dict):
            names.extend(slots.keys())
    return sorted(set(names))


def has_external_library_links(data: dict[str, Any]) -> bool:
    creation = (data.get("creationBytecode") or {}).get("linkReferences") or {}
    runtime = (data.get("runtimeBytecode") or {}).get("linkReferences") or {}
    return bool(creation or runtime)


def summarize_external_link_libraries(data: dict[str, Any]) -> dict[str, list[str]]:
    creation = (data.get("creationBytecode") or {}).get("linkReferences") or {}
    runtime = (data.get("runtimeBytecode") or {}).get("linkReferences") or {}
    return {
        "creation": _collect_link_reference_library_names(creation),
        "runtime": _collect_link_reference_library_names(runtime),
    }


def get_verification_row(data: dict[str, Any]) -> dict[str, str | None]:
    return {
        "status": _format_verification_status(data),
        "verifiedAt": data.get("verifiedAt"),
    }


def _format_verification_status(data: dict[str, Any]) -> str:
    overall = data.get("match")
    creation = data.get("creationMatch")
    runtime = data.get("runtimeMatch")
    parts: list[str] = []
    if overall:
        parts.append(f"overall: {overall}")
    if creation:
        parts.append(f"creation: {creation}")
    if runtime:
        parts.append(f"runtime: {runtime}")
    return "; ".join(parts) if parts else "unknown"


def get_deployment_row(data: dict[str, Any]) -> dict[str, str | None]:
    dep = data.get("deployment") or {}
    return {
        "transactionHash": dep.get("transactionHash"),
        "blockNumber": dep.get("blockNumber"),
        "deployer": dep.get("deployer"),
    }


def _rpc_url_for_chain(chain_id: str) -> str | None:
    env = os.environ.get("ETH_RPC_URL") or os.environ.get("JSON_RPC_URL")
    if env:
        return env
    return DEFAULT_RPC_BY_CHAIN.get(str(chain_id))


def fetch_block_timestamp_utc_iso(chain_id: str, block_number: str | int | None) -> str | None:
    """
    Deployment time from chain RPC (eth_getBlockByNumber), when available.
    Uses ETH_RPC_URL / JSON_RPC_URL when set, otherwise a public RPC for known chains.
    """
    if block_number is None:
        return None
    rpc_url = _rpc_url_for_chain(chain_id)
    if not rpc_url:
        return None
    try:
        bn = int(str(block_number), 10)
    except ValueError:
        return None
    payload = {
        "jsonrpc": "2.0",
        "method": "eth_getBlockByNumber",
        "params": [hex(bn), False],
        "id": 1,
    }
    try:
        r = requests.post(rpc_url, json=payload, timeout=12)
        r.raise_for_status()
        body = r.json()
    except (requests.RequestException, json.JSONDecodeError, OSError):
        return None
    err = body.get("error")
    if err:
        return None
    result = body.get("result")
    if not result or not isinstance(result, dict):
        return None
    ts_hex = result.get("timestamp")
    if not ts_hex:
        return None
    try:
        ts = int(ts_hex, 16)
    except (TypeError, ValueError):
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _md_cell(value: str | None) -> str:
    if value is None or value == "":
        return "—"
    return str(value).replace("|", "\\|").replace("\n", " ")


def build_contract_summary_markdown(data: dict[str, Any]) -> str:
    """Markdown summary table: source breakdown, proxy, deployment, verification, library linking."""
    defs = count_solidity_definitions(data)
    proxy = get_proxy_info(data)
    verification = get_verification_row(data)
    deployment = get_deployment_row(data)
    chain_id = str(data.get("chainId") or "")
    address = data.get("address") or "—"

    deployment_date = fetch_block_timestamp_utc_iso(chain_id, deployment.get("blockNumber"))
    if deployment_date:
        deployment_date_cell = deployment_date
    elif deployment.get("blockNumber"):
        deployment_date_cell = (
            "— (could not fetch block timestamp; set ETH_RPC_URL or use a chain with a built-in RPC)"
        )
    else:
        deployment_date_cell = "—"

    is_proxy = proxy["isProxy"]
    proxy_emoji = "✅" if is_proxy else "❌"
    if is_proxy:
        ptype = proxy.get("proxyType") or "unknown"
        impls = proxy.get("implementations") or []
        impl_text = ", ".join(str(x) for x in impls) if impls else "—"
        proxy_detail = (
            f"Proxy type: **{ptype}**. Implementation contract(s): `{impl_text}`. "
            "derive its logic from implementation contract"
        )
    else:
        proxy_detail = "contains the contract logic directly."

    ext_links = has_external_library_links(data)
    if ext_links:
        names = summarize_external_link_libraries(data)
        extra: list[str] = []
        if names["creation"]:
            extra.append(f"creation linkReferences: {', '.join(names['creation'])}")
        if names["runtime"]:
            extra.append(f"runtime linkReferences: {', '.join(names['runtime'])}")
        lib_sentence = (
            "external libraries contracts are linked to this contract and interacted with via delegatecall"
        )
        if extra:
            lib_sentence += " (" + "; ".join(extra) + ")"
    else:
        lib_sentence = "all libraries are compiled internally into the bytecode"

    lines: list[str] = [
        "# Smart contract summary report",
        "",
        f"**Chain** `{_md_cell(chain_id)}` · **Address** `{_md_cell(address)}`",
        "",
        "| Category | Details |",
        "| :-- | :-- |",
        f"| Total source files | {_md_cell(str(defs['totalSourceFiles']))} |",
        f"| `interface` | {_md_cell(str(defs['interface']))} |",
        f"| `library` | {_md_cell(str(defs['library']))} |",
        f"| `abstract contract` | {_md_cell(str(defs['abstractContract']))} |",
        f"| `contract` (non-abstract) | {_md_cell(str(defs['contract']))} |",
        f"| Proxy? | {proxy_emoji} |",
        f"| Proxy / logic | {_md_cell(proxy_detail)} |",
        f"| Deployment transaction | `{_md_cell(deployment.get('transactionHash'))}` |",
        f"| Deployment block | {_md_cell(deployment.get('blockNumber'))} |",
        f"| Deployment date (UTC, from block) | {_md_cell(deployment_date_cell)} |",
        f"| Verification status | {_md_cell(verification['status'])} |",
        f"| Verified at (Sourcify) | {_md_cell(verification['verifiedAt'])} |",
        f"| Library usage | {_md_cell(lib_sentence)} |",
        "",
    ]
    return "\n".join(lines)


def _read_source_content(source_entry: Any) -> str:
    if isinstance(source_entry, dict):
        return source_entry.get("content", "") or ""
    return ""


def get_pragma_per_file(data: dict[str, Any]) -> dict[str, str | None]:
    sources = data.get("sources") or {}
    pragmas: dict[str, str | None] = {}
    for path, entry in sources.items():
        content = _read_source_content(entry)
        match = PRAGMA_PATTERN.search(content)
        pragmas[path] = match.group(1).strip() if match else None
    return pragmas


def _classify_import(import_path: str) -> str | None:
    for prefix, label in KNOWN_LIBRARIES.items():
        if import_path.startswith(prefix):
            return label
    return None


def get_imports_per_file(data: dict[str, Any]) -> dict[str, list[dict[str, str | None]]]:
    sources = data.get("sources") or {}
    imports_by_file: dict[str, list[dict[str, str | None]]] = {}
    for path, entry in sources.items():
        content = _read_source_content(entry)
        raw_imports = IMPORT_PATTERN.findall(content)
        imports_by_file[path] = [
            {"path": imp, "library": _classify_import(imp)} for imp in raw_imports
        ]
    return imports_by_file


def get_library_usage_summary(
    imports_by_file: dict[str, list[dict[str, str | None]]],
) -> dict[str, int]:
    counts: dict[str, int] = {}
    for entries in imports_by_file.values():
        for entry in entries:
            library = entry.get("library") or "Unknown / local"
            counts[library] = counts.get(library, 0) + 1
    return dict(sorted(counts.items(), key=lambda kv: kv[1], reverse=True))


def analyse_verified_contract_source_code(data: dict[str, Any]) -> dict[str, Any]:
    imports_by_file = get_imports_per_file(data)
    return {
        "address": data.get("address"),
        "chainId": data.get("chainId"),
        "compilerVersion": (data.get("compilation") or {}).get("compilerVersion"),
        "sourceFileCount": count_source_files(data),
        "sourceFiles": list_source_files(data),
        "storageLayoutDiagram": get_storage_layout_diagram(data),
        "proxy": get_proxy_info(data),
        "pragmaPerFile": get_pragma_per_file(data),
        "importsPerFile": imports_by_file,
        "libraryUsage": get_library_usage_summary(imports_by_file),
    }


def print_analysis_report(report: dict[str, Any]) -> None:
    print(f"=== Contract {report['address']} on chain {report['chainId']} ===")
    print(f"Compiler: {report['compilerVersion']}")
    print(f"Source files ({report['sourceFileCount']}):")
    for path in report["sourceFiles"]:
        print(f"  - {path}")

    print("\n--- Storage layout ---")
    print(report["storageLayoutDiagram"])

    print("\n--- Proxy ---")
    proxy = report["proxy"]
    if proxy["isProxy"]:
        print(f"Proxy type: {proxy['proxyType']}")
        print(f"Implementations: {proxy['implementations']}")
    else:
        print("Not a proxy")

    print("\n--- Pragmas ---")
    for path, pragma in report["pragmaPerFile"].items():
        print(f"  {path}: {pragma}")

    print("\n--- Library usage ---")
    for library, count in report["libraryUsage"].items():
        print(f"  {library}: {count}")
