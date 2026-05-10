'use client'

import type { UIMessage } from 'ai'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'
import styles from './MessageList.module.css'

interface MessageListProps {
  messages: UIMessage[]
  isLoading: boolean
  chatError?: Error | null
  onDismissError?: () => void
}

/** Extract plain text from UIMessage parts (AI SDK v6: text + reasoning). */
function getMessageText(message: UIMessage): string {
  const parts = message.parts
  if (!parts?.length) return ''

  const chunks: string[] = []
  for (const part of parts) {
    if (part.type === 'text' && 'text' in part && typeof part.text === 'string') {
      chunks.push(part.text)
    }
    if (part.type === 'reasoning' && 'text' in part && typeof part.text === 'string') {
      chunks.push(`> ${part.text}`)
    }
  }

  return chunks.join('\n\n')
}

export default function MessageList({
  messages,
  isLoading,
  chatError,
  onDismissError,
}: MessageListProps) {
  return (
    <div className="space-y-6">
      {chatError ? (
        <div className={styles.errorBanner} role="alert">
          <strong>Chat request failed.</strong> Check <code>OPENAI_API_KEY</code> in{' '}
          <code>frontend/.env.local</code> (local) or Worker secrets (deployed).
          <pre className="mt-2 text-xs whitespace-pre-wrap opacity-90">{chatError.message}</pre>
          {onDismissError ? (
            <button type="button" className={styles.errorDismiss} onClick={onDismissError}>
              Dismiss
            </button>
          ) : null}
        </div>
      ) : null}

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
                className={`glass-card px-5 py-4 text-[15px] leading-relaxed ${styles.markdownBody}`}
                style={{ borderLeft: '2px solid rgba(0,0,0,0.15)' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children }) {
                      const inline = !className
                      const body = String(children).replace(/\n$/, '')
                      if (inline) {
                        return (
                          <code>{children}</code>
                        )
                      }
                      const lang = /language-(\w+)/.exec(className || '')?.[1] || 'text'
                      return <CodeBlock code={body} language={lang} />
                    },
                    img({ src, alt }) {
                      const url = typeof src === 'string' ? src : ''
                      if (!url) return null
                      return (
                        <Image
                          src={url}
                          alt={alt ?? 'Storage layout diagram'}
                          width={1024}
                          height={1024}
                          unoptimized
                          className={styles.reportImage}
                        />
                      )
                    },
                  }}>
                  {getMessageText(message)}
                </ReactMarkdown>
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
