/**
 * Mirrors `cloudflare-worker/src/index.js` analysis helpers so `next dev` can serve
 * GET /api/analyze (production uses the Worker).
 */

const PRAGMA_PATTERN = /pragma\s+solidity\s+([^;]+);/
const IMPORT_PATTERN = /import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g

const INTERFACE_DEF_PATTERN = /^\s*interface\s+(\w+)/gm
const LIBRARY_DEF_PATTERN = /^\s*library\s+(\w+)/gm
const ABSTRACT_CONTRACT_PATTERN = /^\s*abstract\s+contract\s+(\w+)/gm
const CONTRACT_DEF_PATTERN = /^\s*contract\s+(\w+)/gm

const KNOWN_LIBRARIES: Record<string, string> = {
  '@openzeppelin/': 'OpenZeppelin',
  '@uniswap/': 'Uniswap',
  '@chainlink/': 'Chainlink',
  '@aave/': 'Aave',
  '@layerzerolabs/': 'LayerZero',
  '@axelar-network/': 'Axelar',
  'solmate/': 'Solmate',
  'solady/': 'Solady',
  'ds-test/': 'ds-test',
  'forge-std/': 'forge-std',
  'hardhat/': 'Hardhat',
}

export interface SourcifyAnalysisSummary {
  chainId: string
  address: string
  compilerVersion: string
  language: string
  sourceFileCount: number
  totalDefinitions: {
    interface: number
    library: number
    abstractContract: number
    contract: number
  }
  proxy: {
    isProxy: boolean
    proxyType: string | null
    implementations: unknown[]
  }
  deployment: {
    transactionHash: string | null
    blockNumber: string | number | null
    deployer: string | null
  }
  verification: {
    status: string
    creation: string | null
    runtime: string | null
    verifiedAt: string | null
  }
  signatureCounts: {
    functions: number
    events: number
    errors: number
  }
  libraryUsage: Record<string, number>
  pragmaPerFile: Record<string, string | null>
  importsPerFile: Record<
    string,
    Array<{ path: string; library: string }>
  >
  storageLayoutDiagram: string
  narrationTranscript: string
}

function classifyImport(importPath: string): string {
  for (const [prefix, label] of Object.entries(KNOWN_LIBRARIES)) {
    if (importPath.startsWith(prefix)) return label
  }
  return 'Unknown / local'
}

function countMatches(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length
}

function readSourceContent(entry: unknown): string {
  if (entry && typeof entry === 'object' && 'content' in entry) {
    const c = (entry as { content?: unknown }).content
    return typeof c === 'string' ? c : ''
  }
  return ''
}

function resolveTypeLabel(typeId: string, types: Record<string, { label?: string }>): string {
  return types[typeId]?.label || typeId || 'unknown'
}

function getStorageLayoutDiagram(data: Record<string, unknown>): string {
  const layout = (data.storageLayout as Record<string, unknown>) || {}
  const storage = (layout.storage as Array<Record<string, unknown>>) || []
  const types = (layout.types as Record<string, { label?: string; members?: unknown[] }>) || {}
  if (!storage.length) return '(no storage layout available)'

  const lines: string[] = []
  for (const slot of storage) {
    lines.push(
      `slot ${String(slot.slot ?? '?').padStart(3, ' ')} | off ${String(slot.offset ?? 0).padStart(2, ' ')} | ${slot.label || ''}: ${resolveTypeLabel(String(slot.type || ''), types)}`,
    )
    if (String(slot.type || '').includes('struct')) {
      const members = (types[String(slot.type)]?.members as Array<Record<string, unknown>>) || []
      for (const member of members) {
        lines.push(
          `           +${String(member.slot ?? '?').padStart(2, ' ')} | off ${String(member.offset ?? 0).padStart(2, ' ')} |   ├─ ${member.label || ''}: ${resolveTypeLabel(String(member.type || ''), types)}`,
        )
      }
    }
  }
  return lines.join('\n')
}

function buildNarrationTranscript(summary: SourcifyAnalysisSummary): string {
  const proxySentence = summary.proxy.isProxy
    ? `It is a proxy contract, specifically ${summary.proxy.proxyType || 'an unknown proxy type'}, and the implementation list has ${summary.proxy.implementations.length} ${summary.proxy.implementations.length === 1 ? 'entry' : 'entries'}.`
    : 'It is not a proxy, so the runtime logic sits directly in this verified contract.'

  const topLibraries =
    Object.entries(summary.libraryUsage)
      .slice(0, 3)
      .map(([label, count]) => `${label} (${count})`)
      .join(', ') || 'no notable external library families'

  return [
    `This contract on chain ${summary.chainId} was verified on Sourcify and compiles with ${summary.compilerVersion}.`,
    `The source bundle contains ${summary.sourceFileCount} files, with ${summary.totalDefinitions.contract} concrete contracts, ${summary.totalDefinitions.abstractContract} abstract contracts, ${summary.totalDefinitions.interface} interfaces, and ${summary.totalDefinitions.library} libraries.`,
    proxySentence,
    `Sourcify exposes ${summary.signatureCounts.functions} function signatures and ${summary.signatureCounts.events} event signatures for this contract.`,
    `The dominant import families in the verified sources are: ${topLibraries}.`,
    `For a spoken walkthrough, I would frame it as compiler and structure first, proxy behavior second, and storage plus interface surface last.`,
  ].join(' ')
}

export function buildAnalysis(data: Record<string, unknown>): SourcifyAnalysisSummary {
  const sources = (data.sources as Record<string, unknown>) || {}
  const sourceEntries = Object.entries(sources)
  const pragmaPerFile: Record<string, string | null> = {}
  const importsPerFile: Record<string, Array<{ path: string; library: string }>> = {}
  const libraryUsage: Record<string, number> = {}
  let interfaceCount = 0
  let libraryCount = 0
  let abstractContractCount = 0
  let contractCount = 0

  for (const [path, entry] of sourceEntries) {
    const content = readSourceContent(entry)
    const pragmaMatch = content.match(PRAGMA_PATTERN)
    pragmaPerFile[path] = pragmaMatch ? pragmaMatch[1].trim() : null

    const fileImports = [...content.matchAll(IMPORT_PATTERN)].map((match) => {
      const importPath = match[1] as string
      const library = classifyImport(importPath)
      libraryUsage[library] = (libraryUsage[library] || 0) + 1
      return { path: importPath, library }
    })
    importsPerFile[path] = fileImports

    interfaceCount += countMatches(content, INTERFACE_DEF_PATTERN)
    libraryCount += countMatches(content, LIBRARY_DEF_PATTERN)
    abstractContractCount += countMatches(content, ABSTRACT_CONTRACT_PATTERN)
    contractCount += countMatches(content, CONTRACT_DEF_PATTERN)
  }

  const proxy = (data.proxyResolution as Record<string, unknown>) || {}
  const compilation = (data.compilation as Record<string, unknown>) || {}
  const deployment = (data.deployment as Record<string, unknown>) || {}
  const signatures = (data.signatures as Record<string, unknown>) || {}

  const summary: SourcifyAnalysisSummary = {
    chainId: String(data.chainId || ''),
    address: String(data.address || ''),
    compilerVersion: (compilation.compilerVersion as string) || 'unknown',
    language: (compilation.language as string) || 'Solidity',
    sourceFileCount: sourceEntries.length,
    totalDefinitions: {
      interface: interfaceCount,
      library: libraryCount,
      abstractContract: abstractContractCount,
      contract: contractCount,
    },
    proxy: {
      isProxy: Boolean(proxy.isProxy),
      proxyType: (proxy.proxyType as string) || null,
      implementations: (proxy.implementations as unknown[]) || [],
    },
    deployment: {
      transactionHash: (deployment.transactionHash as string) || null,
      blockNumber: (deployment.blockNumber as string | number) || null,
      deployer: (deployment.deployer as string) || null,
    },
    verification: {
      status: (data.match as string) || 'unknown',
      creation: (data.creationMatch as string) || null,
      runtime: (data.runtimeMatch as string) || null,
      verifiedAt: (data.verifiedAt as string) || null,
    },
    signatureCounts: {
      functions: ((signatures.function as unknown[]) || []).length,
      events: ((signatures.event as unknown[]) || []).length,
      errors: ((signatures.error as unknown[]) || []).length,
    },
    libraryUsage: Object.fromEntries(
      Object.entries(libraryUsage).sort((a, b) => b[1] - a[1]),
    ),
    pragmaPerFile,
    importsPerFile,
    storageLayoutDiagram: getStorageLayoutDiagram(data),
    narrationTranscript: '',
  }

  summary.narrationTranscript = buildNarrationTranscript(summary)
  return summary
}

export async function fetchContract(chainId: string, address: string): Promise<Record<string, unknown>> {
  const url = `https://sourcify.dev/server/v2/contract/${encodeURIComponent(chainId)}/${encodeURIComponent(address)}?fields=all`
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Sourcify request failed (${response.status}): ${body.slice(0, 200)}`)
  }
  return response.json() as Promise<Record<string, unknown>>
}
