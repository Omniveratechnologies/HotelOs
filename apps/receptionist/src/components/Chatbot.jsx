import React, { useState, useRef, useEffect } from "react";
import { useHotelOS } from "../app/useHotelOS.js";

const quickReplies = [
  "How many rooms are occupied?",
  "Any pending service requests?",
  "Show food order status",
  "Which rooms are available?",
];

function buildContext(hotelName, rooms, guests, serviceRequests, foodOrders) {
  const occupied = rooms.filter((r) => r.status === "occupied");
  const available = rooms.filter((r) => r.status === "available");
  const reserved = rooms.filter((r) => r.status === "reserved");
  const pending = serviceRequests.filter((r) => r.status === "requested");
  const activeOrders = foodOrders.filter((o) => o.status !== "delivered");
  const checkedIn = guests.filter((g) => g.status === "checked-in");
  const upcoming = guests.filter((g) => g.status === "reserved");

  return `You are HotelOS AI Assistant for ${hotelName || "this hotel"}. Be concise, helpful, and professional.

Current hotel data:
- Total rooms: ${rooms.length}
- Occupied: ${occupied.length} (${occupied.map((r) => `Room ${r.roomNumber} - ${r.guest || "TBD"}`).join(", ")})
- Available: ${available.length} (${available.map((r) => `Room ${r.roomNumber}`).join(", ")})
- Reserved: ${reserved.length} (${reserved.map((r) => `Room ${r.roomNumber} - ${r.guest || "TBD"}`).join(", ")})
- Guests checked in: ${checkedIn.length} (${checkedIn.map((g) => `${g.name} in room ${g.room}`).join(", ")})
- Upcoming reservations: ${upcoming.length} (${upcoming.map((g) => `${g.name} in room ${g.room}`).join(", ")})
- Pending service requests: ${pending.length} (${pending.map((r) => `Room ${r.room}: ${r.type}`).join(", ")})
- Active food orders: ${activeOrders.length} (${activeOrders.map((o) => `Room ${o.room}: ${o.items} [${o.status}]`).join(", ")})

Answer questions about hotel status, suggest actions, and help the receptionist. Keep answers brief.`;
}

export default function Chatbot({
  isOpen,
  setIsOpen,
  rooms,
  serviceRequests,
  foodOrders,
}) {
  const { guests, stats } = useHotelOS();
  const hotelName = stats?.hotelName;
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your HotelOS AI assistant. I can help you check room status, manage requests, and answer any hotel operations questions. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- `messages` intentionally triggers auto-scroll but is not read inside the effect body
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { id: crypto.randomUUID(), role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const systemContext = buildContext(
        hotelName,
        rooms,
        guests,
        serviceRequests,
        foodOrders,
      );
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemContext,
          messages: apiMessages,
        }),
      });

      const data = await response.json();
      const reply =
        data.content?.[0]?.text || "Sorry, I could not get a response.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-navy-900 hover:bg-navy-800 fixed right-6 bottom-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all hover:scale-105"
      >
        {isOpen ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            className="h-6 w-6"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <span className="text-2xl">🤖</span>
        )}
        {!isOpen &&
          serviceRequests.filter((r) => r.status === "requested").length >
            0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {serviceRequests.filter((r) => r.status === "requested").length}
            </span>
          )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed right-6 bottom-24 z-40 flex h-[500px] w-96 flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-navy-900 flex items-center gap-3 rounded-t-2xl px-4 py-3">
            <div className="bg-gold-400 flex h-9 w-9 items-center justify-center rounded-xl text-lg">
              🤖
            </div>
            <div>
              <div className="text-sm font-bold text-white">HotelOS AI</div>
              <div className="flex items-center gap-1 text-xs text-white/50">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                Online · Powered by Claude
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto text-white/40 transition-colors hover:text-white"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 scrollbar-thin space-y-3 overflow-y-auto p-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="bg-navy-900 mt-0.5 mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-navy-900 rounded-br-sm text-white"
                      : "rounded-bl-sm bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-navy-900 mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm">
                  🤖
                </div>
                <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3">
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Replies */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="hover:bg-navy-900 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600 transition-colors hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-100 p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about rooms, guests, orders..."
                className="focus:border-gold-400 focus:ring-gold-400 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:ring-1 focus:outline-hidden"
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="bg-navy-900 hover:bg-navy-800 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
