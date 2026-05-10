/**
 * Mirrors frontend/src/app/api/storage-layout-image/route.ts and src/storage_layout_image.py
 */

const STORAGE_LAYOUT_IMAGE_CONTEXT = `You are a helpful Web3 coding assistant that generates images of storage layouts of smart contracts.
You will be given the data of a smart contract and you will generate an image of the storage layout of the smart contract using the data provided.
The image should be a visual representation of the storage layout of the smart contract.
Follow Solidity's rules for state variables in storage (https://docs.soliditylang.org/en/latest/internals/layout_in_storage.html): each storage slot is 32 bytes; multiple value types smaller than 32 bytes pack into one slot when they fit; the first field in a slot is lower-order aligned; value types use only the bytes they need; if a value does not fit in the remaining space, it starts the next slot; structs and fixed-size array data start a new slot and pack members/items tightly; dynamic arrays and mappings each reserve a whole slot for their "pointer" slot.

The image should be a rectangle sitting vertically with a white background, positioned in the center of the image. The longest part of the rectangle should be the height.
Above the rectangle should be the name of the contract. Within the rectangle should be the storage layout of the contract.

Lay out storage as one horizontal band per slot index (slot 0 at the top, then slot 1, and so on). Each band represents exactly one 32-byte slot. Subdivide that band along the horizontal axis into byte positions 0–31 (or proportional segments whose widths sum to the slot). Fields that use fewer than 32 bytes must appear as contiguous horizontal segments within the same slot band, placed side by side in increasing byte offset order (packed fields read left-to-right in offset order). A uint256 or any type that occupies a full slot fills the entire width of that row's band. Do not stack sub-word fields vertically within the same slot; packed smaller types always extend horizontally within their slot row.

The image should be a high quality image with a white background.`

export async function handleStorageLayoutImagePost(request, env) {
  const apiKey = env.OPENAI_API_KEY
  if (!apiKey || typeof apiKey !== 'string') {
    return Response.json(
      { error: 'OPENAI_API_KEY is not set (needed for storage layout image generation).' },
      { status: 503 },
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const diagram = body.storageLayoutDiagram
  if (diagram == null || typeof diagram !== 'string') {
    return Response.json({ error: 'storageLayoutDiagram is required' }, { status: 400 })
  }

  const contractName = typeof body.contractName === 'string' && body.contractName.trim()
    ? body.contractName.trim()
    : 'Contract'

  const userPrompt = `Contract name (label for the diagram): ${contractName}

Generate an image of the storage layout of the following smart contract using the data provided: ${JSON.stringify(diagram)}`

  const fullPrompt = `${STORAGE_LAYOUT_IMAGE_CONTEXT}\n\n${userPrompt}`

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1.5',
        prompt: fullPrompt,
        n: 1,
        size: '1024x1024',
        // GPT image models do not support `response_format` (DALL·E only); they return b64_json by default.
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const msg = data?.error?.message || response.statusText
      return Response.json({ error: msg }, { status: response.status >= 400 ? response.status : 502 })
    }

    const b64 = data?.data?.[0]?.b64_json
    if (!b64) {
      return Response.json({ error: 'OpenAI returned no image data' }, { status: 502 })
    }

    return Response.json({ imageBase64: b64 })
  } catch (error) {
    return Response.json({ error: String(error.message || error) }, { status: 502 })
  }
}
