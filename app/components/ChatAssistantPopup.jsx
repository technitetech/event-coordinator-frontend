"use client";

import { useEffect, useRef, useState } from "react";

const GREETING = "Hi! Tell me about the event you're planning — the type, guest count, budget, and theme — and I'll put together a recommendation.";

const fmt = (n) => "LKR " + Number(n).toLocaleString();

export default function ChatAssistantPopup({ onClose, onApplyPlan }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: GREETING }]);
  const [sessionState, setSessionState] = useState({});
  const [recommendation, setRecommendation] = useState(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, recommendation]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, sessionState }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Chat request failed");

      setSessionState(data.sessionState || sessionState);
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
      setRecommendation(data.recommendation || null);
    } catch (err) {
      setError(err.message || "Something went wrong while chatting.");
    } finally {
      setSending(false);
    }
  };

  const handleUsePlan = () => {
    if (!recommendation) return;
    onApplyPlan(sessionState, recommendation);
  };

  return (
    <div className="dg-modal-overlay">
      <div className="dg-modal chat-modal">
        <div className="dg-modal-header">
          <div>
            <h2>Chat with your AI Coordinator</h2>
            <span className="text-xs text-stone-400">Describe your event in your own words</span>
          </div>
          <button onClick={onClose} className="dg-modal-close" aria-label="Close modal">&times;</button>
        </div>

        <div className="dg-modal-body chat-body">
          {error && <div className="dg-error">{error}</div>}

          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble chat-bubble-${m.role}`}>
                {m.content}
              </div>
            ))}

            {sending && (
              <div className="chat-bubble chat-bubble-assistant chat-typing">Thinking…</div>
            )}

            {recommendation && !sending && (
              <div className="chat-rec-card">
                <div className="chat-rec-title">{recommendation.label || "Recommended Plan"}</div>
                <div className="chat-rec-row"><span>Venue</span><span>{recommendation.venue.name}</span></div>
                <div className="chat-rec-row"><span>Menu</span><span>{recommendation.menu.name}</span></div>
                <div className="chat-rec-row"><span>Decoration</span><span>{recommendation.decoration.name}</span></div>
                <div className="chat-rec-row chat-rec-total"><span>Total</span><span>{fmt(recommendation.total_cost)}</span></div>
                <button type="button" className="dg-btn-submit chat-use-plan-btn" onClick={handleUsePlan}>
                  Use this plan
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="dg-modal-footer chat-footer">
          <form id="chat-form" onSubmit={handleSend} className="chat-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Wedding for 150 guests, budget 500000, floral theme"
              disabled={sending}
              autoFocus
            />
          </form>
          <button type="button" onClick={onClose} className="dg-btn-cancel" disabled={sending}>
            Close
          </button>
          <button type="submit" form="chat-form" disabled={sending || !input.trim()} className="dg-btn-submit">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
