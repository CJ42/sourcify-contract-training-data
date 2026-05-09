> ## Documentation Index
> Fetch the complete documentation index at: https://docs.etherscan.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Contract Creator and Creation Tx Hash

> Retrieve a contract's deployer address and creation transaction.

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

<ParamField query="action" type="string" default="getcontractcreation">
  Set to `getcontractcreation` for this endpoint.
</ParamField>

<ParamField query="contractaddresses" type="string" default="0xB83c27805aAcA5C7082eB45C868d955Cf04C337F,0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45">
  Up to 5 contract addresses, separated by commas.
</ParamField>

<ResponseExample>
  ```json Response theme={null}
  {
    "status": "1",
    "message": "OK",
    "result": [
      {
        "contractAddress": "0xcbdcd3815b5f975e1a2c944a9b2cd1c985a1cb7f",
        "contractCreator": "0x3d080421c9dd5fb387d6e3124f7e1c241ade9568",
        "txHash": "0xdce495a9261c4a2a5d4e879cfb55c060b4616a846d3425c441a9e31aa34c956f",
        "blockNumber": "10720863",
        "timestamp": "1598242563",
        "contractFactory": "",
        "creationBytecode": "0x602d3d8160093d39f3363d3d373d3d3d363d73c6cf0f044ba8ea402bfedf9e87b88bf1c008d1625af43d82803e903d91602b57fd5bf3"
      }
    ]
  }
  ```
</ResponseExample>
