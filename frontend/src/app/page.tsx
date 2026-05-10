import Link from 'next/link'

const features = [
  {
    icon: '🟦',
    title: 'Sourcify Data',
    desc: 'Soly is built on verified smart contract data from Sourcify. Learning and analysing from source code, dependencies and libraries.',
  },
  {
    icon: '🔬',
    title: 'Structured Analysis',
    desc: 'Analyse Solidity source files in depth, including most used libraries, interfaces, dependencies, and storage layout.',
  },
  {
    icon: '📚',
    title: 'Teacher Oriented',
    desc: 'Give Soly a smart contract address. It will tell you how it works, how it was built, and how to interact with it. For Solidity developers to learn and to integrate.',
  },
]

const steps = [
  {
    number: '01',
    title: 'Enter a contract address',
    desc:
      'Paste a verified smart contract address (for example on Ethereum). SOLY fetches metadata and source from Sourcify, with Etherscan as a fallback when verification lives there instead.',
    logos: ['sourcify', 'etherscan'] as const,
  },
  {
    number: '02',
    title: 'Analyze verified sources',
    desc:
      'SOLY loads Sourcify- or Etherscan-verified contract data, mirrors the Python CLI analysis, and generates a storage layout diagram plus structured Markdown so you can see slots, proxies, and dependencies at a glance.',
    logos: [] as const,
  },
  {
    number: '03',
    title: 'Understand & integrate',
    desc:
      'Chat with SOLY to learn how the contract works and how to integrate with it—surface area, storage, and practical call patterns—using responses powered by OpenAI.',
    logos: [] as const,
  },
]

function StepLogos({ kinds }: { kinds: readonly ('sourcify' | 'etherscan')[] }) {
  if (kinds.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-4 mt-4">
      {kinds.includes('sourcify') ? (
        <img
          src="/sourcify-logo.png"
          alt="Sourcify"
          className="h-7 w-auto object-contain opacity-90"
        />
      ) : null}
      {kinds.includes('etherscan') ? (
        <img
          src="/etherscan-logo.png"
          alt="Etherscan"
          className="h-7 w-auto object-contain opacity-90"
        />
      ) : null}
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen" style={{ paddingTop: '100px' }}>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24">
        {/* Early access badge */}
        <div className="glass-pill-light inline-flex items-center gap-2 px-4 py-1.5 text-[13px] font-medium mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ color: '#059669' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Solidity-first AI assistant</span>
        </div>

        {/* Main headline */}
        <h1 className="text-[64px] md:text-[80px] font-bold leading-[1.0] tracking-tight mb-6 max-w-3xl"
          style={{ color: 'var(--text-primary)' }}>
          The AI Assistant
          <br />
          for{' '}
          <span style={{ color: 'var(--text-secondary)' }}>Smart Contracts</span>{' '}
          developers.
        </h1>

        {/* Sub-headline */}
        <p className="text-[18px] md:text-[20px] mb-6 max-w-xl leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}>
          Explore verified contracts from Sourcify and Etherscan — storage layouts, reports, and chat that help you learn how protocols work and how to build against them.
        </p>

        <p className="text-[14px] mb-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{ color: 'var(--text-tertiary)' }}>
          <span>Leverages</span>
          <img
            src="/openai-logo.png"
            alt="OpenAI"
            className="h-5 w-auto object-contain opacity-90"
          />
          <span>for conversational analysis and diagram generation.</span>
        </p>

        {/* CTA */}
        <Link
          href="/chat"
          className="glass-button-dark px-10 py-4 text-[17px] font-semibold mb-4">
          Try now
        </Link>

      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-[40px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Built for Solidity developers
          </h2>
          <p className="text-[18px] max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Not a generic coding assistant. SOLY was built from the ground up for smart contracts.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div key={feature.title} className="glass-card p-8">
              <div className="text-3xl mb-5">{feature.icon}</div>
              <h3 className="text-[17px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                {feature.title}
              </h3>
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-[40px] font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            How it works
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step) => (
            <div key={step.number}>
              <div className="text-[13px] font-bold font-mono mb-4" style={{ color: 'var(--text-tertiary)' }}>
                {step.number}
              </div>
              <h3 className="text-[17px] font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                {step.title}
              </h3>
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {step.desc}
              </p>
              <StepLogos kinds={step.logos} />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <p className="text-[14px]" style={{ color: 'var(--text-tertiary)' }}>
          © 2026 SOLY · The AI Assistant built for Web3
        </p>
      </footer>
    </main>
  )
}
