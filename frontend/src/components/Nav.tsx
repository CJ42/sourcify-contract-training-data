import Link from 'next/link'

export default function Nav() {
  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="glass-nav flex items-center gap-2 px-4 py-2.5 w-full max-w-2xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-[17px] tracking-tight mr-4 flex-shrink-0"
          style={{ color: 'var(--text-primary)' }}>
          <span className="text-[20px]" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>✦</span>
          SOLY
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {['Features', 'About'].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}
              className="px-3 py-1.5 text-[14px] font-medium rounded-full transition-all hover:bg-white/30"
              style={{ color: 'var(--text-secondary)' }}>
              {item}
            </a>
          ))}
        </div>

        {/* CTA */}
        <Link href="/chat"
          className="glass-button-dark px-4 py-1.5 text-[14px] font-semibold flex-shrink-0">
          Try SOLY
        </Link>
      </nav>
    </div>
  )
}
