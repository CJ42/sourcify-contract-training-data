import json

import requests

from analyser import analyse_verified_contract_source_code, print_analysis_report
from contracts import uniswap_v3_pool_address_usdt

sourcify_server_url = "https://sourcify.dev/server"
endpoint = "/v2/contract/{chainId}/{address}?fields=all"

response = requests.get(
    f"{sourcify_server_url}{endpoint.format(chainId=1, address=uniswap_v3_pool_address_usdt)}"
)
contract_data = response.json()

with open("uniswap_v3_pool_address_usdt.json", "w") as f:
    json.dump(contract_data, f, indent=4)

report = analyse_verified_contract_source_code(contract_data)
print_analysis_report(report)
