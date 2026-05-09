> ## Documentation Index
> Fetch the complete documentation index at: https://docs.etherscan.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Common Error Messages

An API call that encounters an error will return 0 as its `status code` and display the cause of the error under the `result` field.

```json theme={null}
{
  "status": "0",
  "message": "NOTOK",
  "result": "Max rate limit reached, please use API Key for higher rate limit"
}
```

### Missing or Unsupported Chain

<Warning>
  "Missing or unsupported chainid parameter (required for v2 api), please see chainlist for the list of supported chainids"
</Warning>

The chain you've specified is not supported by us yet. It could also be that you've sent multiple chains at the same time like `420,10`, you can only send **one** at a time.

### Invalid API Key

<Warning>
  "Invalid API Key"
</Warning>

This error occurs when you specify an invalid API Key.

Ensure you are using your **Etherscan API Key**, keys from other chains like Polygonscan/Arbiscan are not valid for V2.

Keys do take a few minutes to activate, anything longer than should be alarming.

### Too many invalid API key attempts

<Warning>
  "Too many invalid api key attempts, please try again later"
</Warning>

This error occurs when more than **5 invalid API key attempts** are made within a **30-second** window. Your source IP will be temporarily throttled as a security measure.

The throttle resets automatically after **30 seconds**. To resolve, wait at least 30 seconds and retry with a **valid API key**.

### Max rate limit

<Warning>
  "Max rate limit reached, please use API Key for higher rate limit"
</Warning>

This error occurs when you **exceed the rate limit** assigned to your specific API key.

To resolve, adhere to the [rate limits](/resources/rate-limits) of your available plan.

If you are using a script or application, **apply throttling** like a token bucket to limit the frequency of calls.

### Missing or invalid action

<Warning>
  "Error! Missing Or invalid Action name"
</Warning>

This error occurs when you **do not specify**, or specify an **invalid** `module` and `action` name.

To resolve, **double check** your API query to use a valid module and action name.

If you require some help getting started, try copying the sample queries provided in the API Playground and pasting them into your browser.

### Endpoint-specific errors

<Warning>
  "Error! Block number already pass"

  "Error! Invalid address format"

  "Contract source code not verified"
</Warning>

These error messages returned are specific to certain endpoints and their **related parameters.**

To resolve, kindly refer to the specific endpoint's documentation, and check for the **correct format** or **values** to be specified as **parameters.**

### Query Timeout

<Warning>
  "Query Timeout occured. Please select a smaller result dataset"

  "Unexpected err, timeout occurred or server too busy. Please try again later"
</Warning>

This error occurs when you have sent a particularly large query that did not manage to be completed in time.

To resolve, consider selecting a smaller date/block range, though you may [**ping us**](/resources/contact-us) if you think the issue may be performance related.

### Free Tier Access

<Warning>
  "Free API access is not supported for this chain. Please upgrade your api plan for full chain coverage."
</Warning>

Certain chains are not included under the Free tier. To access all [**supported networks**](/supported-chains), you may upgrade to any of our [**paid plans**](https://etherscan.io/apis), check out the affordable Lite tier.
