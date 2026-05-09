'use client'

import { useState } from 'react'

interface WaitlistFormProps {
  layout?: 'row' | 'stack'
  buttonOnly?: boolean
}

export default function WaitlistForm({ layout = 'row' }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="glass-pill-light inline-flex items-center gap-2 px-6 py-3">
        <span style={{ color: '#059669' }}>✓</span>
        <span className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>
          You&apos;re on the list! We&apos;ll be in touch.
        </span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}
      className={`flex ${layout === 'row' ? 'flex-row' : 'flex-col'} gap-3`}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 px-5 py-3.5 rounded-full text-[15px] outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
          color: 'var(--text-primary)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
        onFocus={(e) => {
          e.target.style.background = 'rgba(255,255,255,0.9)'
          e.target.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)'
        }}
        onBlur={(e) => {
          e.target.style.background = 'rgba(255,255,255,0.7)'
          e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
        }}
      />
      <button type="submit"
        className="glass-button-dark px-8 py-3.5 text-[15px] font-semibold whitespace-nowrap">
        Join waitlist
      </button>
    </form>
  )
}
