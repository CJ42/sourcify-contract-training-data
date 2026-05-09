import WaitlistForm from '@/components/WaitlistForm'

export const metadata = {
  title: 'Join the Waitlist — SOLY',
}

export default function WaitlistPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ paddingTop: '100px' }}>
      <div className="glass-card p-12 max-w-lg w-full text-center">
        <div className="text-4xl mb-4">✦</div>
        <h1 className="text-[32px] font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          Join the waitlist
        </h1>
        <p className="text-[16px] mb-8" style={{ color: 'var(--text-secondary)' }}>
          Be among the first developers to access SOLY when we launch.
        </p>
        <WaitlistForm layout="stack" />
        <p className="text-[13px] mt-6" style={{ color: 'var(--text-tertiary)' }}>
          👤 2,400+ developers already joined
        </p>
      </div>
    </main>
  )
}
