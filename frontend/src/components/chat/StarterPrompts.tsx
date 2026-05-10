'use client'

import { ExampleContracts, type ExampleContractTemplate } from './ExampleContracts'

interface StarterPromptsProps {
  onContractPick: (example: ExampleContractTemplate) => void
}

export default function StarterPrompts({ onContractPick }: StarterPromptsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="text-5xl font-bold mb-2">
        <span style={{ color: 'var(--accent-purple)' }}>◆</span>{' '}
        <span style={{ color: 'var(--text)' }}>SOLY</span>
      </div>
      <p className="text-lg mb-2 font-medium" style={{ color: 'var(--text)' }}>Your Solidity AI coding assistant</p>
      <p className="mb-8 max-w-lg mx-auto" style={{ color: 'var(--muted)' }}>
        Enter a <strong>verified smart contract address</strong> below (or pick an example). SOLY loads sources from{' '}
        <strong>Sourcify</strong> with <strong>Etherscan</strong> fallback, builds the Markdown report and storage layout diagram,
        then you can chat — powered by <strong>OpenAI</strong> — about how the contract works and how to integrate with it.
      </p>

      <ExampleContracts onPickContract={onContractPick} />
    </div>
  )
}
