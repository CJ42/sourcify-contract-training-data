'use client'

import type { KeyboardEvent, FormEvent } from 'react'
import { useRef, useEffect, useState } from 'react'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSend: (text: string) => void
  isLoading: boolean
}

export default function ChatInput({ input, setInput, onSend, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showCodePanel, setShowCodePanel] = useState(false)
  const [contractCode, setContractCode] = useState('')

  // Auto-resize the message textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [input])

  const canSend = !isLoading && (input.trim().length > 0 || contractCode.trim().length > 0)

  const buildMessage = (): string => {
    const codeSection = contractCode.trim()
      ? `\`\`\`solidity\n${contractCode.trim()}\n\`\`\``
      : ''
    const questionSection = input.trim()

    if (codeSection && questionSection) return `${codeSection}\n\n${questionSection}`
    if (codeSection) return codeSection
    return questionSection
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSend) return
    const message = buildMessage()
    onSend(message)
    if (contractCode.trim()) {
      setContractCode('')
      setShowCodePanel(false)
    }
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
      {/* Code paste panel — shown when toggle is active */}
      {showCodePanel && (
        <div
          className="rounded border overflow-hidden"
          style={{ borderColor: 'var(--accent-purple)', background: 'var(--code-bg)' }}>
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{ borderColor: 'var(--border)' }}>
            <span className="text-xs font-mono font-medium" style={{ color: 'var(--accent-purple)' }}>
              Contract code
            </span>
            <button
              type="button"
              onClick={() => { setShowCodePanel(false); setContractCode('') }}
              className="text-xs px-2 py-0.5 rounded transition-all"
              style={{ color: 'var(--muted)' }}>
              ✕ Remove
            </button>
          </div>
          <textarea
            value={contractCode}
            onChange={(e) => setContractCode(e.target.value)}
            placeholder={`// Paste your Solidity contract here\npragma solidity ^0.8.0;\n\ncontract MyContract {\n    ...\n}`}
            rows={10}
            className="w-full resize-y bg-transparent outline-none text-sm font-mono leading-relaxed p-4"
            style={{
              color: 'var(--text)',
              minHeight: '200px',
              maxHeight: '400px',
              caretColor: 'var(--accent-purple)',
            }}
          />
        </div>
      )}

      {/* Main input row */}
      <div className="glass-card flex items-end gap-3 p-3">

        {/* Paste contract toggle */}
        <button
          type="button"
          onClick={() => setShowCodePanel((prev) => !prev)}
          title="Paste contract code"
          className="flex-shrink-0 px-2 py-1.5 rounded text-xs font-mono font-medium transition-all"
          style={{
            background: showCodePanel ? 'var(--accent-purple-light)' : 'transparent',
            color: showCodePanel ? 'var(--accent-purple)' : 'var(--muted)',
            border: `1px solid ${showCodePanel ? 'var(--accent-purple)' : 'var(--border)'}`,
          }}>
          {'{ }'}
        </button>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            showCodePanel
              ? "Describe what's wrong or what you want SOLY to do..."
              : 'Ask SOLY anything about Solidity or Web3...'
          }
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
        {showCodePanel && ' · Contract code will be included automatically'}
      </p>
    </form>
  )
}
