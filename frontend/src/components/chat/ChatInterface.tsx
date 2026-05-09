'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useEffect, useRef } from 'react'
import MessageList from './MessageList'
import StarterPrompts from './StarterPrompts'
import ChatInput from './ChatInput'

export default function ChatInterface() {
  // Default transport sends to /api/chat — no config needed
  const { messages, sendMessage, status } = useChat()

  const [input, setInput] = useState('')
  const isLoading = status === 'submitted' || status === 'streaming'
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return
    setInput('')
    await sendMessage({ text: text.trim() })
  }

  return (
    <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full px-4">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-8 space-y-6">
        {messages.length === 0 ? (
          <StarterPrompts onSelect={handleSend} />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
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
