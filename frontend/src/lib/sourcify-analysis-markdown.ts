import type { SourcifyAnalysisSummary } from '@/lib/sourcify-analyze'

/** Markdown shaped like `src/analyser.py` CLI outputs (`contract_analysis_report.md` + summary rows). */
export function buildSourcifyAnalysisMarkdown(
  analysis: SourcifyAnalysisSummary,
  options?: { title?: string },
): string {
  const title = options?.title ?? 'Verified contract analysis (Sourcify)'
  const proxyEmoji = analysis.proxy.isProxy ? '✅' : '❌'
  const impls = analysis.proxy.implementations.length
    ? analysis.proxy.implementations.map(String).join(', ')
    : '—'

  const pragmaLines = Object.entries(analysis.pragmaPerFile)
    .slice(0, 40)
    .map(([path, pragma]) => `- \`${path}\`: \`${pragma ?? '—'}\``)

  const libLines = Object.entries(analysis.libraryUsage).map(
    ([library, count]) => `- **${library}:** ${count}`,
  )

  const lines: string[] = [
    `# ${title}`,
    '',
    `**Chain** \`${analysis.chainId}\` · **Address** \`${analysis.address}\``,
    '',
    '## Snapshot',
    '',
    '| Field | Value |',
    '| :-- | :-- |',
    `| Compiler | \`${analysis.compilerVersion}\` |`,
    `| Language | ${analysis.language} |`,
    `| Source files | ${analysis.sourceFileCount} |`,
    `| interface / library / abstract / contract | ${analysis.totalDefinitions.interface} / ${analysis.totalDefinitions.library} / ${analysis.totalDefinitions.abstractContract} / ${analysis.totalDefinitions.contract} |`,
    `| Proxy | ${proxyEmoji} ${analysis.proxy.isProxy ? `\`${analysis.proxy.proxyType ?? 'unknown'}\`` : 'No'} |`,
    `| Implementations | \`${impls}\` |`,
    `| Deploy tx | \`${analysis.deployment.transactionHash ?? '—'}\` |`,
    `| Deploy block | ${analysis.deployment.blockNumber ?? '—'} |`,
    `| Verified | ${analysis.verification.status} · ${analysis.verification.verifiedAt ?? '—'} |`,
    `| Signatures (fn / ev / err) | ${analysis.signatureCounts.functions} / ${analysis.signatureCounts.events} / ${analysis.signatureCounts.errors} |`,
    '',
    '## Storage layout',
    '',
    '```text',
    analysis.storageLayoutDiagram,
    '```',
    '',
    '## Narration-style summary',
    '',
    analysis.narrationTranscript,
    '',
    '## Pragma per file (first 40)',
    '',
    ...pragmaLines,
    '',
    '## Library usage (import classification)',
    '',
    ...libLines,
    '',
    '_This report is derived from the same Sourcify payload used by the Python CLI (`src/analyser.py`). For OpenAI narrative + PNG storage diagram, run `python3 main.py --chain … --address …` locally._',
    '',
  ]

  return lines.join('\n')
}
