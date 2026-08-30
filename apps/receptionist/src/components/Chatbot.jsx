import React, { useState, useRef, useEffect } from "react";
import { useHotelOS } from "../app/providers.jsx";

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
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", content: msg };
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
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
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
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0f1f3d] shadow-2xl transition-all hover:scale-105 hover:bg-[#162847]"
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
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {serviceRequests.filter((r) => r.status === "requested").length}
            </span>
          )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[500px] w-96 flex-col rounded-2xl border border-gray-100 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 rounded-t-2xl bg-[#0f1f3d] px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c9a84c] text-lg">
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
          <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="mr-2 mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#0f1f3d] text-sm">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-[#0f1f3d] text-white"
                      : "rounded-bl-sm bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="mr-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[#0f1f3d] text-sm">
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
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-600 transition-colors hover:bg-[#0f1f3d] hover:text-white"
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
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#c9a84c] focus:outline-none focus:ring-1 focus:ring-[#c9a84c]"
                disabled={loading}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#0f1f3d] transition-colors hover:bg-[#162847] disabled:opacity-40"
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
