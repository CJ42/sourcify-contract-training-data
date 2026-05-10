'use client'

import type { UIMessage } from 'ai'
import { useChat } from '@ai-sdk/react'
import { useState, useEffect, useRef } from 'react'
import MessageList from './MessageList'
import StarterPrompts from './StarterPrompts'
import ChatInput from './ChatInput'
import {
  buildExplorePrompt,
  type ExampleContractTemplate,
} from './ExampleContracts'
import { buildSourcifyAnalysisMarkdown } from '@/lib/sourcify-analysis-markdown'

export default function ChatInterface() {
  const { messages, sendMessage, status, error, clearError, setMessages } = useChat()

  const [input, setInput] = useState('')
  const [analysisBusy, setAnalysisBusy] = useState(false)
  const isLoading = status === 'submitted' || status === 'streaming' || analysisBusy
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return
    clearError?.()
    setInput('')
    await sendMessage({ text: text.trim() })
  }

  const handleContractPick = async (ex: ExampleContractTemplate) => {
    clearError?.()
    const userText = buildExplorePrompt(ex)
    const userMsg: UIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ type: 'text', text: userText }],
    }
    setMessages([userMsg])
    setAnalysisBusy(true)

    try {
      const res = await fetch(
        `/api/analyze?chainId=${ex.chainId}&address=${encodeURIComponent(ex.address)}`,
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(
          typeof data.error === 'string' ? data.error : `HTTP ${res.status}`,
        )
      }
      let md = buildSourcifyAnalysisMarkdown(data.analysis, {
        title: `${ex.title} — Sourcify report`,
      })

      try {
        const imgRes = await fetch('/api/storage-layout-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storageLayoutDiagram: data.analysis.storageLayoutDiagram,
            contractName: ex.title,
          }),
        })
        const imgJson = (await imgRes.json()) as { imageBase64?: string; error?: string }
        if (imgRes.ok && typeof imgJson.imageBase64 === 'string') {
          md += `\n\n## Storage layout diagram (generated)\n\n![Storage layout — ${ex.title}](data:image/png;base64,${imgJson.imageBase64})\n`
        } else {
          md += `\n\n---\n\n_Storage layout diagram was not generated (${imgJson.error ?? imgRes.statusText}). Set **OPENAI_API_KEY** for image generation._\n`
        }
      } catch {
        md += `\n\n---\n\n_Storage layout diagram request failed (network)._`
      }

      const assistantMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        parts: [{ type: 'text', text: md, state: 'done' }],
      }
      setMessages([userMsg, assistantMsg])
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e)
      const assistantMsg: UIMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        parts: [
          {
            type: 'text',
            text: `## Could not load Sourcify analysis\n\n${err}\n\n- Local dev: run **next dev** so **GET /api/analyze** is available.\n- Deployed: use the Cloudflare Worker URL (same **/api/analyze** route).`,
            state: 'done',
          },
        ],
      }
      setMessages([userMsg, assistantMsg])
    } finally {
      setAnalysisBusy(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full px-4">
      <div className="flex-1 overflow-y-auto py-8 space-y-6">
        {messages.length === 0 ? (
          <StarterPrompts onContractPick={handleContractPick} />
        ) : (
          <MessageList
            messages={messages}
            isLoading={isLoading}
            chatError={error}
            onDismissError={() => clearError?.()}
          />
        )}
        <div ref={bottomRef} />
      </div>

      <div className="py-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
