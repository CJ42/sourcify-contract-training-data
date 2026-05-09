'use client'

import type { UIMessage } from 'ai'
import CodeBlock from './CodeBlock'

interface MessageListProps {
  messages: UIMessage[]
  isLoading: boolean
}

/** Extract plain text from UIMessage parts (ai v6 uses parts[], not content string). */
function getMessageText(message: UIMessage): string {
  if (!message.parts) return ''
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string }).text)
    .join('')
}

/** Split a text string into interleaved text and fenced code segments. */
function parseContent(content: string) {
  const parts: { type: 'text' | 'code'; content: string; language?: string }[] = []
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'code', language: match[1] || 'text', content: match[2].trim() })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) })
  }

  return parts
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>

          {message.role === 'assistant' && (
            <div className="flex flex-col w-full max-w-3xl">
              <div
                className="text-[13px] font-bold mb-2 px-1 flex items-center gap-1.5"
                style={{ color: 'var(--text-primary)' }}>
                <span>✦</span> SOLY
              </div>
              <div
                className="glass-card px-5 py-4 text-[15px] leading-relaxed"
                style={{ borderLeft: '2px solid rgba(0,0,0,0.15)' }}>
                {parseContent(getMessageText(message)).map((part, i) =>
                  part.type === 'code' ? (
                    <CodeBlock key={i} code={part.content} language={part.language || 'solidity'} />
                  ) : (
                    <p key={i} className="whitespace-pre-wrap mb-2 last:mb-0" style={{ color: 'var(--text-primary)' }}>
                      {part.content}
                    </p>
                  )
                )}
              </div>
            </div>
          )}

          {message.role === 'user' && (
            <div
              className="max-w-xl px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm"
              style={{ background: 'var(--glass-dark)', color: 'rgba(255,255,255,0.92)' }}>
              {getMessageText(message)}
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="flex flex-col max-w-3xl w-full">
            <div
              className="text-[13px] font-bold mb-2 px-1 flex items-center gap-1.5"
              style={{ color: 'var(--text-primary)' }}>
              <span>✦</span> SOLY
            </div>
            <div
              className="glass-card px-5 py-4"
              style={{ borderLeft: '2px solid rgba(0,0,0,0.15)' }}>
              <span className="inline-flex gap-1" style={{ color: 'var(--text-primary)' }}>
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
