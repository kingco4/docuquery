import { useState, useRef, useEffect } from "react";
import "./ChatPanel.css";

function MessageBubble({ msg }) {
  if (msg.role === "system") {
    return (
      <div className="msg-system">
        <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      </div>
    );
  }

  return (
    <div className={`msg msg-${msg.role}`}>
      <div className="msg-label">{msg.role === "user" ? "YOU" : "AI"}</div>
      <div className="msg-content">
        {msg.content || <span className="msg-cursor">▋</span>}
      </div>
    </div>
  );
}

export default function ChatPanel({ messages, onQuery, isQuerying, docName }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isQuerying) return;
    onQuery(input.trim());
    setInput("");
  };

  const suggestions = [
    "Summarize this document",
    "What are the key findings?",
    "List the main topics covered",
    "What conclusions are drawn?",
  ];

  return (
    <div className="chat-panel">
      <div className="chat-doc-bar">
        <span className="chat-doc-icon">◈</span>
        <span className="chat-doc-name">{docName}</span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <h3>Ask anything about your document</h3>
            <div className="suggestions">
              {suggestions.map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => onQuery(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about the document..."
          disabled={isQuerying}
        />
        <button
          className={`chat-send ${isQuerying ? "loading" : ""}`}
          type="submit"
          disabled={isQuerying || !input.trim()}
        >
          {isQuerying ? "⟳" : "→"}
        </button>
      </form>
    </div>
  );
}
