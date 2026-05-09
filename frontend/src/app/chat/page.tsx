import ChatInterface from '@/components/chat/ChatInterface'

export const metadata = {
  title: 'Chat — SOLY',
}

export default function ChatPage() {
  return (
    <div className="flex flex-col" style={{ height: '100vh', paddingTop: '88px', background: 'radial-gradient(ellipse at 50% 30%, #EBEBF0 0%, #D8D8E0 60%, #CECEDD 100%)' }}>
      <ChatInterface />
    </div>
  )
}
