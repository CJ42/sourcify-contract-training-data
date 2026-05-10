'use client'

import type { KeyboardEvent, FormEvent } from 'react'
import { useRef, useEffect } from 'react'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSend: (text: string) => void
  isLoading: boolean
}

export default function ChatInput({ input, setInput, onSend, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize the message textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [input])

  const canSend = !isLoading && input.trim().length > 0

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSend) return
    onSend(input.trim())
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      const form = e.currentTarget.closest('form')
      if (form) form.requestSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-2">
      <div className="glass-card flex items-end gap-3 p-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste a verified contract address (0x…) or ask follow-up questions after loading a report…"
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none bg-transparent outline-none text-sm leading-relaxed"
          style={{
            color: 'var(--text)',
            maxHeight: '160px',
            minHeight: '24px',
          }}
        />

        <button
          type="submit"
          disabled={!canSend}
          className="glass-button-dark px-4 py-2 text-sm font-semibold flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? '...' : 'Send'}
        </button>
      </div>

      <p className="text-xs mt-1 text-center" style={{ color: 'var(--muted)' }}>
        Press Enter to send · Shift+Enter for new line
      </p>
    </form>
  )
}
