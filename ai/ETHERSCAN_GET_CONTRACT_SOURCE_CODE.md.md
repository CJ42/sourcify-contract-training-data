> ## Documentation Index
> Fetch the complete documentation index at: https://docs.etherscan.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Contract Source Code

> Retrieve the source code for a verified smart contract.

export const chain = '1';

### Query Parameters

<ParamField query="apikey" type="string" default="YourApiKeyToken">
  Your Etherscan API key.
</ParamField>

<ParamField query="chainid" type="string" default="1">
  Chain ID to query, eg `1` for Ethereum, `8453` for Base from our [supported chains](/supported-chains).
</ParamField>

<ParamField query="module" type="string" default="contract">
  Set to `contract` for this endpoint.
</ParamField>

<ParamField query="action" type="string" default="getsourcecode">
  Set to `getsourcecode` for this endpoint.
</ParamField>

<ParamField query="address" type="string" default="0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413">
  The contract address to query.
</ParamField>

<ResponseExample>
  ```json Response theme={null}
  {
    "status": "1",
    "message": "OK",
    "result": [
      {
        "SourceCode": "pragma solidity 0.4.26;\r\n\r\ncontract Test12345 {\r\n    string public test;\r\n    \r\n    function enterValue(string _c) {\r\n        test = _c;\r\n    }\r\n}",
        "ABI": "[{\"constant\":false,\"inputs\":[{\"name\":\"_c\",\"type\":\"string\"}],\"name\":\"enterValue\",\"outputs\":[],\"payable\":false,\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"test\",\"outputs\":[{\"name\":\"\",\"type\":\"string\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]",
        "ContractName": "Test12345",
        "CompilerVersion": "v0.4.26+commit.4563c3fc",
        "CompilerType": "solc",
        "OptimizationUsed": "1",
        "Runs": "200",
        "ConstructorArguments": "",
        "EVMVersion": "Default",
        "Library": "",
        "ContractFileName": "",
        "LicenseType": "None",
        "Proxy": "0",
        "Implementation": "",
        "SwarmSource": "bzzr://f6b932198e10e83a6c872406a4252cf5eea48f37bac9a33085eba887820370cf",
        "SimilarMatch": "0x60810f4d8a618edb533a168e790ab6c09b0e7707"
      }
    ]
  }
  ```
</ResponseExample>
