'use client'

const PROMPTS = [
  'Explain how LSP1 Universal Receiver works and when to use it',
  'Review this Solidity contract for security vulnerabilities',
  "What's the difference between LSP7 and ERC20 tokens?",
  'How do I implement upgradeable contracts with a proxy pattern?',
  'Explain reentrancy attacks and how to prevent them',
  'What are the best practices for access control in Solidity?',
]

interface StarterPromptsProps {
  onSelect: (prompt: string) => void
}

export default function StarterPrompts({ onSelect }: StarterPromptsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
      <div className="text-5xl font-bold mb-2">
        <span style={{ color: 'var(--accent-purple)' }}>◆</span>{' '}
        <span style={{ color: 'var(--text)' }}>SOLY</span>
      </div>
      <p className="text-lg mb-2 font-medium" style={{ color: 'var(--text)' }}>Your Solidity AI coding assistant</p>
      <p className="mb-10" style={{ color: 'var(--muted)' }}>
        Ask me anything about Solidity, EVM, LSP standards, or Web3 architecture.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full text-left">
        {PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSelect(prompt)}
            className="glass-card p-4 text-sm text-left transition-all hover:-translate-y-0.5 cursor-pointer">
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}
