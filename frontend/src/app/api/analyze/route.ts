import { NextResponse } from 'next/server'

import { buildAnalysis, fetchContract } from '@/lib/sourcify-analyze'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const chainId = url.searchParams.get('chainId') || '1'
  const address = url.searchParams.get('address')
  if (!address) {
    return NextResponse.json({ error: 'address query parameter is required' }, { status: 400 })
  }

  try {
    const contractData = await fetchContract(chainId, address)
    const analysis = buildAnalysis(contractData)
    return NextResponse.json({ analysis })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
