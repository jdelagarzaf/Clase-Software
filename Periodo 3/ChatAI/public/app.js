const form = document.querySelector("#chatForm");
const input = document.querySelector("#questionInput");
const conversation = document.querySelector("#conversation");
const sourcesList = document.querySelector("#sourcesList");
const sendButton = document.querySelector("#sendButton");
const statusPill = document.querySelector("#statusPill");

function setStatus(text, busy = false) {
  statusPill.textContent = text;
  statusPill.dataset.busy = String(busy);
  sendButton.disabled = busy;
}

function addMessage(role, text) {
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "You" : "AI";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  article.append(avatar, bubble);
  conversation.append(article);
  conversation.scrollTop = conversation.scrollHeight;

  return article;
}

function pageLabel(source) {
  if (!source.page_start && !source.page_end) return "N/A";
  return source.page_start === source.page_end
    ? String(source.page_start)
    : `${source.page_start}-${source.page_end}`;
}

function renderSources(sources) {
  sourcesList.replaceChildren();

  if (!sources.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No sources returned.";
    sourcesList.append(empty);
    return;
  }

  for (const source of sources) {
    const item = document.createElement("article");
    item.className = "source-item";

    const title = document.createElement("h3");
    title.textContent = source.entry_title || source.subsection || source.section || "Untitled source";

    const meta = document.createElement("p");
    meta.className = "source-meta";
    meta.textContent = `${source.section || "No section"} | Pages ${pageLabel(source)} | Score ${source.score.toFixed(3)}`;

    const content = document.createElement("p");
    content.className = "source-content";
    content.textContent = source.content;

    item.append(title, meta, content);
    sourcesList.append(item);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = input.value.trim();
  if (!question) return;

  addMessage("user", question);
  input.value = "";
  setStatus("Retrieving", true);

  const pending = addMessage("assistant", "Searching the RAG context and preparing an answer...");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "The server could not answer the question.");
    }

    pending.querySelector(".bubble").textContent = payload.answer;
    renderSources(payload.sources || []);
    setStatus("Ready", false);
  } catch (error) {
    pending.querySelector(".bubble").textContent = error.message;
    setStatus("Error", false);
  }
});
