# Libs
import json
import os
import requests
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Internal imports
from analyser import (
    analyse_verified_contract_source_code,
    build_contract_summary_markdown,
    print_analysis_report,
)
from contracts import uniswap_v3_pool_address_usdt
from storage_layout_image import generate_storage_layout_image

sourcify_server_url = "https://sourcify.dev/server"
endpoint = "/v2/contract/{chainId}/{address}?fields=all"

response = requests.get(
    f"{sourcify_server_url}{endpoint.format(chainId=1, address=uniswap_v3_pool_address_usdt)}"
)
contract_data = response.json()

debug_mode: bool = os.environ.get("DEBUG_MODE")

# Write to a JSON file for now as well so we can analyse the data
if debug_mode:
    print("Debug mode enabled, writing to file...")
    with open("uniswap_v3_pool_address_usdt.json", "w") as f:
        json.dump(contract_data, f, indent=4)
else:
    print("Debug mode is not enabled, skipping writing to file...")

report = analyse_verified_contract_source_code(contract_data)
print_analysis_report(report)

summary_md = build_contract_summary_markdown(contract_data)

# TODO: allow to specify as flag when running the script
summary_path = os.environ.get("CONTRACT_SUMMARY_MD", "contract_summary.md")
with open(summary_path, "w", encoding="utf-8") as f:
    f.write(summary_md)
print(f"📝 Wrote Markdown summary to {summary_path}")

print("🌌 Generating storage layout image...")
generate_storage_layout_image(report["storageLayoutDiagram"])

# Use OpenAI to analyse the data
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

response = client.responses.create(
    model='gpt-5.5',
    instructions='You are a coding assistant that teaches smart contract development in Solidity.',
    input=f"Analyse the following contract data and explain it. Focus mainly on the Solidity source code and what the contract does (do not talk about compiler settings, compilation details, verification details, or proxy status): {json.dumps(contract_data)}"
)

print("🤖 The AI Agent responded with the following: ")
print(response.output_text)