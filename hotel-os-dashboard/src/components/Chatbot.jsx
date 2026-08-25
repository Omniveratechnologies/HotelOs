import React, { useState, useRef, useEffect } from 'react'

const quickReplies = [
  'How many rooms are occupied?',
  'Any pending service requests?',
  'Show food order status',
  'Which rooms are available?',
]

function buildContext(rooms, serviceRequests, foodOrders) {
  const occupied = rooms.filter(r => r.status === 'occupied')
  const available = rooms.filter(r => r.status === 'available')
  const reserved = rooms.filter(r => r.status === 'reserved')
  const pending = serviceRequests.filter(r => r.status === 'requested')
  const activeOrders = foodOrders.filter(o => o.status !== 'delivered')

  return `You are HotelOS AI Assistant for Grand Residency Hotel. Be concise, helpful, and professional.

Current hotel data:
- Total rooms: ${rooms.length}
- Occupied: ${occupied.length} (${occupied.map(r=>`Room ${r.id} - ${r.guest}`).join(', ')})
- Available: ${available.length} (${available.map(r=>`Room ${r.id}`).join(', ')})
- Reserved: ${reserved.length} (${reserved.map(r=>`Room ${r.id} - ${r.guest || 'TBD'}`).join(', ')})
- Pending service requests: ${pending.length} (${pending.map(r=>`Room ${r.room}: ${r.type}`).join(', ')})
- Active food orders: ${activeOrders.length} (${activeOrders.map(o=>`Room ${o.room}: ${o.items} [${o.status}]`).join(', ')})

Answer questions about hotel status, suggest actions, and help the receptionist. Keep answers brief.`
}

export default function Chatbot({ isOpen, setIsOpen, rooms, serviceRequests, foodOrders }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your HotelOS AI assistant. I can help you check room status, manage requests, and answer any hotel operations questions. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', content: msg }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const systemContext = buildContext(rooms, serviceRequests, foodOrders)
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: systemContext,
          messages: apiMessages,
        })
      })

      const data = await response.json()
      const reply = data.content?.[0]?.text || 'Sorry, I could not get a response.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I\'m having trouble connecting. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#0f1f3d] rounded-full shadow-2xl flex items-center justify-center hover:bg-[#162847] transition-all hover:scale-105 z-40"
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
        {!isOpen && serviceRequests.filter(r=>r.status==='requested').length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {serviceRequests.filter(r=>r.status==='requested').length}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-40">
          {/* Header */}
          <div className="bg-[#0f1f3d] rounded-t-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#c9a84c] flex items-center justify-center text-lg">🤖</div>
            <div>
              <div className="text-white font-bold text-sm">HotelOS AI</div>
              <div className="text-white/50 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"/>
                Online · Powered by Claude
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="ml-auto text-white/40 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-[#0f1f3d] flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">🤖</div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#0f1f3d] text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-lg bg-[#0f1f3d] flex items-center justify-center text-sm mr-2 flex-shrink-0">🤖</div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {quickReplies.map(q => (
                <button key={q} onClick={() => send(q)}
                  className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full hover:bg-[#0f1f3d] hover:text-white transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask about rooms, guests, orders..."
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]"
                disabled={loading}
              />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                className="w-10 h-10 bg-[#0f1f3d] rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-[#162847] transition-colors flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
