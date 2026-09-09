// pages/ChatPage.jsx — Short, context-aware AI chatbot with voice interaction

import { useState, useRef, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import VoiceControls from '../components/VoiceControls'
import { useToast } from '../components/Toast'
import api from '../services/api'

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">🤖</div>
      <div className="chat-bubble-ai flex items-center gap-1.5 py-3.5 px-4">
        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { addToast } = useToast()

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI learning assistant. Ask me anything about your coursework — I'll keep it concise and direct. Say \"explain deeply\" or \"give an example\" if you want more depth!",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [topic, setTopic] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text, mode = 'short') => {
    const userMsg = text || input
    if (!userMsg.trim()) return

    // Detect mode from user message
    let detectedMode = 'short'
    if (/explain deeply|in detail|tell me more/i.test(userMsg)) detectedMode = 'deep'
    if (/simple example|give.*(an )?example/i.test(userMsg)) detectedMode = 'example'
    if (mode !== 'short') detectedMode = mode

    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
      const res = await api.post('/api/chat', {
        message: userMsg,
        current_topic: topic || undefined,
        mode: detectedMode,
        history,
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.response }])
    } catch (err) {
      addToast(err.response?.data?.error || 'AI is having trouble responding. Please retry.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const QUICK_REPLIES = ['Explain deeply', 'Give a simple example', 'What should I study next?', 'Summarize this']

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-w-0 flex flex-col h-screen">
        {/* Header */}
        <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3.5 shadow-sm">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-xl shadow-sm">🤖</div>
              <div>
                <p className="font-bold text-slate-900 text-sm">LearnIQ AI Assistant</p>
                <p className="text-xs text-slate-400">Context-aware quick helper • Voice & Text</p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Tag topic context (optional)…"
              className="input-field w-48 text-xs py-1.5"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                } animate-fade-in`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    🤖
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                    {msg.content.split('\n').map((line, j) => (
                      <p key={j} className={j > 0 ? 'mt-1' : ''}>
                        {line}
                      </p>
                    ))}
                  </div>
                  {/* Read message aloud option for assistant */}
                  {msg.role === 'assistant' && (
                    <div className="self-start pl-1">
                      <VoiceControls textToRead={msg.content} />
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0 font-bold mt-0.5">
                    You
                  </div>
                )}
              </div>
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Quick replies */}
        <div className="bg-white border-t border-slate-50 px-4 sm:px-6 pt-2.5">
          <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto pb-2">
            {QUICK_REPLIES.map((r) => (
              <button
                key={r}
                onClick={() => sendMessage(r)}
                disabled={loading}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-primary-50 text-primary-600 border border-primary-100 hover:bg-primary-100 hover:text-primary-700 transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar */}
        <div className="bg-white border-t border-slate-100 px-4 sm:px-6 py-3.5">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <input
              type="text"
              placeholder="Ask anything or request a code snippet…"
              className="input-field flex-1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
              disabled={loading}
            />
            <VoiceControls
              onTranscript={(text) => {
                setInput(text)
                sendMessage(text)
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="btn-primary px-5 flex-shrink-0"
            >
              {loading ? '…' : 'Send'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
