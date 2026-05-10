'use client'

import styles from './ExampleContracts.module.css'

export interface ExampleContractTemplate {
  title: string
  description: string
  address: string
  chainId: number
  chainLabel: string
}

const EXAMPLES: ExampleContractTemplate[] = [
  {
    title: 'Aave Pool Proxy',
    description: 'Aave V3 Pool proxy — core lending market interface.',
    address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    chainId: 1,
    chainLabel: 'Ethereum',
  },
  {
    title: 'Uniswap V3 USDT Pool',
    description: 'High-liquidity USDT/WETH V3 pool on Ethereum.',
    address: '0x4e68Ccd3E89f51C3074ca5072bbAC773960dFa36',
    chainId: 1,
    chainLabel: 'Ethereum',
  },
  {
    title: 'Safe Singleton',
    description: 'Gnosis Safe singleton — multisig wallet implementation.',
    address: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    chainId: 1,
    chainLabel: 'Ethereum',
  },
]

export function buildExplorePrompt(ex: ExampleContractTemplate): string {
  return (
    `Explore the verified contract **${ex.title}** at \`${ex.address}\` on ${ex.chainLabel} mainnet (chain id ${ex.chainId}). ` +
    `Below is the structured Sourcify report (same inputs as the Python CLI); ask follow-ups in chat if you want SOLY to go deeper.`
  )
}

interface ExampleContractsProps {
  onPickContract: (example: ExampleContractTemplate) => void
}

export function ExampleContracts({ onPickContract }: ExampleContractsProps) {
  return (
    <div className={styles.section}>
      <h3 className={styles.heading}>Popular contracts</h3>
      <p className={styles.sub}>
        Fetch verified metadata from Sourcify and render the same style of Markdown report as{' '}
        <code>contract_analysis_report.md</code> from the Python CLI. With a generated <strong>storage layout diagram</strong>.
      </p>
      <div className={styles.grid}>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.address}
            type="button"
            className={`glass-card ${styles.card}`}
            onClick={() => onPickContract(ex)}>
            <span className={styles.cardTitle}>{ex.title}</span>
            <span className={styles.cardDesc}>{ex.description}</span>
            <div className={styles.meta}>
              <span className={styles.badge}>
                {ex.chainLabel} · {ex.chainId}
              </span>
            </div>
            <span className={styles.address}>{ex.address}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
