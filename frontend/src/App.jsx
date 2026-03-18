import { useState, useRef, useEffect } from "react";
import UploadZone from "./components/UploadZone";
import ChatPanel from "./components/ChatPanel";
import DocumentList from "./components/DocumentList";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [documents, setDocuments] = useState({});
  const [activeDoc, setActiveDoc] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      const data = await res.json();
      setDocuments(data.documents || {});
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (file) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      await fetchDocuments();
      setActiveDoc(data.document_id);
      setMessages([
        {
          role: "system",
          content: `📄 **${data.filename}** indexed — ${data.chunks_indexed} chunks ready. Ask me anything.`,
        },
      ]);
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleQuery = async (question) => {
    if (!activeDoc || !question.trim()) return;

    const userMsg = { role: "user", content: question };
    const assistantMsg = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsQuerying(true);

    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: activeDoc, question }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + json.text,
                };
                return updated;
              });
            } catch {}
          }
        }
      }
    } catch (e) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Error: " + e.message,
        };
        return updated;
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    await fetch(`${API_BASE}/documents/${docId}`, { method: "DELETE" });
    if (activeDoc === docId) {
      setActiveDoc(null);
      setMessages([]);
    }
    await fetchDocuments();
  };

  const handleSelectDoc = (docId) => {
    setActiveDoc(docId);
    setMessages([
      {
        role: "system",
        content: `📄 Switched to **${documents[docId]?.filename}**. Ask me anything about this document.`,
      },
    ]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">◈</span>
          <span className="logo-text">DocuQuery</span>
        </div>
        <p className="tagline">RAG-powered document intelligence</p>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <UploadZone onUpload={handleUpload} isUploading={isUploading} />
          <DocumentList
            documents={documents}
            activeDoc={activeDoc}
            onSelect={handleSelectDoc}
            onDelete={handleDeleteDoc}
          />
        </aside>

        <section className="chat-section">
          {activeDoc ? (
            <ChatPanel
              messages={messages}
              onQuery={handleQuery}
              isQuerying={isQuerying}
              docName={documents[activeDoc]?.filename}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">◈</div>
              <h2>Upload a PDF to begin</h2>
              <p>Drop a document on the left, then ask anything about it.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
