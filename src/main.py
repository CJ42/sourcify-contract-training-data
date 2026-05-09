import json
import os

from dotenv import load_dotenv
from openai import OpenAI

from analyser import print_analysis_report
from contracts import uniswap_v3_pool_address_usdt
from service import analyze_contract
from storage_layout_image import generate_storage_layout_image

load_dotenv()


if __name__ == "__main__":
    result = analyze_contract(chain_id=1, address=uniswap_v3_pool_address_usdt)
    contract_data = result["contract"]
    report = result["report"]
    summary_md = result["summaryMarkdown"]

    debug_mode: bool = os.environ.get("DEBUG_MODE")

    if debug_mode:
        print("Debug mode enabled, writing to file...")
        with open("uniswap_v3_pool_address_usdt.json", "w") as f:
            json.dump(contract_data, f, indent=4)
    else:
        print("Debug mode is not enabled, skipping writing to file...")

    print_analysis_report(report)

    summary_path = os.environ.get("CONTRACT_SUMMARY_MD", "contract_summary.md")
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write(summary_md)
    print(f"📝 Wrote Markdown summary to {summary_path}")

    print("🌌 Generating storage layout image...")
    generate_storage_layout_image(report["storageLayoutDiagram"])

    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    response = client.responses.create(
        model="gpt-5.5",
        instructions="You are a coding assistant that teaches smart contract development in Solidity.",
        input=(
            "Analyse the following contract data and explain it. Focus mainly on the Solidity "
            "source code and what the contract does (do not talk about compiler settings, "
            f"compilation details, verification details, or proxy status): {json.dumps(contract_data)}"
        ),
    )

    print("🤖 The AI Agent responded with the following: ")
    print(response.output_text)
