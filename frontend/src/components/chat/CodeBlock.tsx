'use client'

import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeBlockProps {
  code: string
  language: string
}

const COPY_RESET_DELAY_MS = 2000

function normalizeLanguage(language: string): string {
  const normalizedLanguage = language.trim().toLowerCase()

  if (normalizedLanguage === 'sol') {
    return 'solidity'
  }

  if (!normalizedLanguage) {
    return 'text'
  }

  return normalizedLanguage
}

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false)

  const highlightedLanguage = useMemo(() => normalizeLanguage(language), [language])

  const lineCount = useMemo(() => code.split('\n').length, [code])
  const shouldShowLineNumbers = lineCount > 3

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), COPY_RESET_DELAY_MS)
    } catch (clipboardError) {
      setIsCopied(false)
      console.error('Failed to copy code block content to clipboard:', clipboardError)
    }
  }

  return (
    <div className="relative group my-4 overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <button
        type="button"
        onClick={handleCopyClick}
        aria-label={isCopied ? 'Code copied' : 'Copy code'}
        className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-black/45 text-white/80 opacity-0 transition-all duration-200 hover:bg-black/60 hover:text-white group-hover:opacity-100"
      >
        {isCopied ? <Check size={14} /> : <Copy size={14} />}
      </button>

      <SyntaxHighlighter
        language={highlightedLanguage}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '16px',
          background: 'transparent',
          fontSize: '13px',
          lineHeight: '1.6',
        }}
        showLineNumbers={shouldShowLineNumbers}
        lineNumberStyle={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: '11px',
          minWidth: '2em',
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
