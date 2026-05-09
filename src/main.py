# Libs
import argparse
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Internal imports
from analyser import (
    analyse_verified_contract_source_code,
    build_analysis_report_markdown,
    build_contract_summary_markdown,
    get_compilation_contract_name,
    print_analysis_report,
    slugify_contract_filename_prefix,
)
from fetch_contract import (
    cli_info,
    cli_success,
    fetch_verified_contract,
    normalize_address,
)
from storage_layout_image import generate_storage_layout_image


def default_fetch_json_path(chain_id: int, address: str) -> str:
    short = normalize_address(address).lower()
    return f"sourcify_{chain_id}_{short[:10]}.json"


def write_analyze_artifacts(contract_data: dict) -> dict:
    """Markdown summaries, analysis report, optional debug JSON, storage layout image."""
    debug_mode = bool(os.environ.get("DEBUG_MODE"))
    if debug_mode:
        chain = contract_data.get("chainId", "?")
        addr = contract_data.get("address", "?")
        debug_path = os.environ.get(
            "DEBUG_JSON",
            default_fetch_json_path(int(chain) if chain != "?" else 0, str(addr)),
        )
        cli_info("Debug mode enabled, writing raw API payload...")
        with open(debug_path, "w", encoding="utf-8") as f:
            json.dump(contract_data, f, indent=4)
        cli_success(f"Wrote debug JSON to {debug_path}")
    else:
        cli_info("Debug mode is not enabled, skipping raw JSON dump...")

    report = analyse_verified_contract_source_code(contract_data)
    print_analysis_report(report)

    summary_md = build_contract_summary_markdown(contract_data)
    analysis_md = build_analysis_report_markdown(report)

    summary_path = os.environ.get("CONTRACT_SUMMARY_MD", "contract_summary.md")
    analysis_path = os.environ.get("CONTRACT_ANALYSIS_MD", "contract_analysis_report.md")

    with open(summary_path, "w", encoding="utf-8") as f:
        f.write(summary_md)
    cli_success(f"Wrote Markdown contract summary to {summary_path}")

    with open(analysis_path, "w", encoding="utf-8") as f:
        f.write(analysis_md)
    cli_success(f"Wrote Markdown analysis report to {analysis_path}")

    cli_info("Generating storage layout image...")
    generate_storage_layout_image(report["storageLayoutDiagram"])
    cli_success("Storage layout image generated (storage_layout_image.png).")

    return report


def write_openai_analysis(contract_data: dict) -> None:
    client = OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
    )

    response = client.responses.create(
        model="gpt-5.5",
        instructions=(
            "You are a coding assistant that teaches smart contract development in Solidity."
        ),
        input=(
            "Analyse the following contract data and explain it. Focus mainly on the Solidity "
            "source code and what the contract does (do not talk about compiler settings, "
            "compilation details, verification details, or proxy status): "
            f"{json.dumps(contract_data)}"
        ),
    )

    output_text = response.output_text or ""

    contract_title = get_compilation_contract_name(contract_data) or "Contract"
    file_prefix = slugify_contract_filename_prefix(contract_title)
    default_openai_md = f"{file_prefix}_openai_analysis.md"
    openai_analysis_path = os.environ.get("OPENAI_ANALYSIS_MD", default_openai_md)

    openai_markdown = "\n".join(
        [
            f"# {contract_title}",
            "",
            f"*Chain `{contract_data.get('chainId')}` · `{contract_data.get('address')}` · 🔘 Soly analysis*",
            "",
            output_text,
            "",
        ]
    )

    with open(openai_analysis_path, "w", encoding="utf-8") as f:
        f.write(openai_markdown)

    print("🤖 The AI Agent responded with the following: ")
    print(output_text)
    cli_success(f"Wrote OpenAI analysis Markdown to {openai_analysis_path}")


def cmd_fetch(
    chain_id: int,
    address: str,
    output: str | None,
    *,
    allow_etherscan_fallback: bool,
) -> None:
    contract_data = fetch_verified_contract(
        chain_id,
        address,
        allow_etherscan_fallback=allow_etherscan_fallback,
    )
    path = output or default_fetch_json_path(chain_id, address)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(contract_data, f, indent=2)
    cli_success(f"Wrote contract payload JSON to {path}")


def cmd_analyze(
    chain_id: int,
    address: str,
    *,
    allow_etherscan_fallback: bool,
) -> None:
    contract_data = fetch_verified_contract(
        chain_id,
        address,
        allow_etherscan_fallback=allow_etherscan_fallback,
    )
    write_analyze_artifacts(contract_data)


def cmd_run(
    chain_id: int,
    address: str,
    *,
    allow_etherscan_fallback: bool,
) -> None:
    contract_data = fetch_verified_contract(
        chain_id,
        address,
        allow_etherscan_fallback=allow_etherscan_fallback,
    )
    write_analyze_artifacts(contract_data)
    write_openai_analysis(contract_data)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Fetch verified contracts from Sourcify (primary), optional Etherscan fallback only "
            "if Sourcify fails — then Markdown reports, storage layout image, optional OpenAI "
            "narrative. See ai/ETHERSCAN_INDEX.md for fallback env vars."
        ),
    )
    parser.add_argument(
        "--chain",
        "-c",
        type=int,
        required=True,
        metavar="ID",
        help="EVM chain ID (e.g. 1 for Ethereum mainnet).",
    )
    parser.add_argument(
        "--address",
        "-a",
        required=True,
        metavar="0x…",
        help="Contract address (with or without 0x prefix).",
    )
    parser.add_argument(
        "--mode",
        "-m",
        choices=("fetch", "analyze", "run"),
        default="run",
        help=(
            "fetch: save JSON only; analyze: reports + storage image (no text LLM); "
            "run: full pipeline including OpenAI explanation (default)."
        ),
    )
    parser.add_argument(
        "-o",
        "--output",
        metavar="FILE",
        help="With --mode fetch: write JSON to this path (default: sourcify_<chain>_<addr-prefix>.json).",
    )
    parser.add_argument(
        "--no-etherscan-fallback",
        action="store_true",
        help="If Sourcify returns 404 or unusable data, exit instead of calling Etherscan.",
    )
    return parser


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    allow_fallback = not args.no_etherscan_fallback

    if args.mode == "fetch":
        cmd_fetch(args.chain, args.address, args.output, allow_etherscan_fallback=allow_fallback)
        return

    if args.mode == "analyze":
        cmd_analyze(args.chain, args.address, allow_etherscan_fallback=allow_fallback)
        return

    cmd_run(args.chain, args.address, allow_etherscan_fallback=allow_fallback)


if __name__ == "__main__":
    main()
