import re
from typing import Any

PRAGMA_PATTERN = re.compile(r"pragma\s+solidity\s+([^;]+);")
IMPORT_PATTERN = re.compile(r"""import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]""")

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
