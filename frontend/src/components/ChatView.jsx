import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../api';

/**
 * ChatView
 *
 * A simple chatbot UI that sends messages to POST /chat on the backend.
 * The backend LangGraph agent has access to Gmail + Classroom data as context.
 *
 * History is kept in local state (array of {role, content}).
 */
export default function ChatView() {
  const [history, setHistory] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your Google Workspace assistant. I can answer questions about your Gmail messages and Google Classroom assignments. Try asking something like:\n• What assignments are due soon?\n• Do I have any pending assignments?\n• Summarise my emails from today.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    setHistory((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Send full history (minus the initial greeting) so the agent has context
      const reply = await sendChatMessage(text, [...history, userMsg]);
      setHistory((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-view">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <span className="chat-header-icon">🤖</span>
          <div>
            <div className="chat-header-title">Workspace AI Assistant</div>
            <div className="chat-header-subtitle">Powered by Gemini · sees your Gmail + Classroom</div>
          </div>
        </div>
        <button
          className="chat-clear-btn"
          onClick={() => setHistory([{
            role: 'assistant',
            content: "Chat cleared. What would you like to know?",
          }])}
          title="Clear conversation"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {history.map((msg, idx) => (
          <div key={idx} className={`chat-bubble-row ${msg.role}`}>
            <div className={`chat-bubble ${msg.role}`}>
              {msg.role === 'assistant' && (
                <span className="chat-bubble-avatar">🤖</span>
              )}
              <div className="chat-bubble-content">
                <MessageContent content={msg.content} />
              </div>
              {msg.role === 'user' && (
                <span className="chat-bubble-avatar user-avatar">👤</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-bubble-row assistant">
            <div className="chat-bubble assistant">
              <span className="chat-bubble-avatar">🤖</span>
              <div className="chat-bubble-content">
                <div className="chat-typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="chat-error-row">
            <span>⚠️ {error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <textarea
          ref={inputRef}
          className="chat-input"
          placeholder="Ask about your emails or assignments… (Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          title="Send message"
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}

/** Renders newlines as <br> and preserves bullet formatting */
function MessageContent({ content }) {
  const lines = content.split('\n');
  return (
    <div className="message-text">
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
}
