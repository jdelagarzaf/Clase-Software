import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpen, Loader2, Send, Sparkles } from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3010/api/chat" : "/api/chat");

function pageLabel(source) {
  if (!source.page_start && !source.page_end) return "N/A";
  return source.page_start === source.page_end
    ? String(source.page_start)
    : `${source.page_start}-${source.page_end}`;
}

function Message({ role, children }) {
  return (
    <article className={`message ${role}`}>
      <div className="avatar">{role === "user" ? "You" : "AI"}</div>
      <div className="bubble">{children}</div>
    </article>
  );
}

function Sources({ sources }) {
  if (!sources.length) {
    return <p className="empty-state">Sources will appear after the first answer.</p>;
  }

  return sources.map((source) => (
    <article className="source-item" key={`${source.chunk_index}-${source.entry_title}`}>
      <h3>{source.entry_title || source.subsection || source.section || "Untitled source"}</h3>
      <p className="source-meta">
        {source.section || "No section"} | Pages {pageLabel(source)} | Score{" "}
        {Number(source.score || 0).toFixed(3)}
      </p>
      <p className="source-content">{source.content}</p>
    </article>
  ));
}

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Ask a question about the manual. I will retrieve the best RAG context and answer it in natural language.",
    },
  ]);
  const [sources, setSources] = useState([]);
  const [status, setStatus] = useState("Ready");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanQuestion = question.trim();
    if (!cleanQuestion || isLoading) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: cleanQuestion },
      {
        role: "assistant",
        text: "Searching the RAG context and preparing an answer...",
        pending: true,
      },
    ]);
    setQuestion("");
    setStatus("Retrieving");
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "The server could not answer the question.");
      }

      setMessages((current) =>
        current.map((message, index) =>
          index === current.length - 1 ? { role: "assistant", text: payload.answer } : message,
        ),
      );
      setSources(payload.sources || []);
      setStatus("Ready");
    } catch (error) {
      setMessages((current) =>
        current.map((message, index) =>
          index === current.length - 1
            ? { role: "assistant", text: error.message || "Unexpected error." }
            : message,
        ),
      );
      setStatus("Error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="chat-panel" aria-label="RAG chat">
        <header className="top-bar">
          <div>
            <p className="eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              LOTR manual assistant
            </p>
            <h1>ChatAI RAG</h1>
          </div>
          <div className="status-pill" data-busy={isLoading}>
            {isLoading ? <Loader2 size={15} className="spin" aria-hidden="true" /> : null}
            {status}
          </div>
        </header>

        <div className="conversation" aria-live="polite">
          {messages.map((message, index) => (
            <Message role={message.role} key={`${message.role}-${index}`}>
              {message.text}
            </Message>
          ))}
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="questionInput">
            Question
          </label>
          <textarea
            id="questionInput"
            name="question"
            rows="2"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: How does combat work?"
            autoComplete="off"
            required
          />
          <button type="submit" disabled={isLoading}>
            <Send size={18} aria-hidden="true" />
            Ask
          </button>
        </form>
      </section>

      <aside className="sources-panel" aria-label="Retrieved sources">
        <div className="sources-header">
          <p className="eyebrow">
            <BookOpen size={14} aria-hidden="true" />
            Retrieved context
          </p>
          <h2>Sources</h2>
        </div>
        <div className="sources-list">
          <Sources sources={sources} />
        </div>
      </aside>
    </main>
  );
}

createRoot(document.querySelector("#root")).render(<App />);
