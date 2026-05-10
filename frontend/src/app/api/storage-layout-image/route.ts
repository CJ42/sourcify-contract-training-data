import { NextResponse } from 'next/server'

import { STORAGE_LAYOUT_IMAGE_CONTEXT } from '@/lib/storage-layout-image-prompt'

/** Matches `src/storage_layout_image.py`: `gpt-image-1.5`, diagram payload JSON-encoded in prompt. */
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not set (needed for storage layout image generation).' },
      { status: 503 },
    )
  }

  let body: { storageLayoutDiagram?: string; contractName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const diagram = body.storageLayoutDiagram
  if (diagram == null || typeof diagram !== 'string') {
    return NextResponse.json({ error: 'storageLayoutDiagram is required' }, { status: 400 })
  }

  const contractName = body.contractName?.trim() || 'Contract'

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
        response_format: 'b64_json',
      }),
    })

    const data = (await response.json()) as {
      error?: { message?: string }
      data?: Array<{ b64_json?: string }>
    }

    if (!response.ok) {
      const msg = data.error?.message || response.statusText
      return NextResponse.json({ error: msg }, { status: response.status >= 400 ? response.status : 502 })
    }

    const b64 = data.data?.[0]?.b64_json
    if (!b64) {
      return NextResponse.json({ error: 'OpenAI returned no image data' }, { status: 502 })
    }

    return NextResponse.json({ imageBase64: b64 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
