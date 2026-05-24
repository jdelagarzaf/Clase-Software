# ChatAI RAG Web

Small web app that uses the existing RAG artifacts in `Bases de Datos/rag` and asks Gemini to turn the retrieved chunks into a natural-language answer.

## Setup

1. Copy `.env.example` to `.env`.
2. Put your Gemini key in `.env`:

```env
GEMINI_API_KEY=your_key_here
```

3. Install dependencies:

```powershell
npm.cmd install
```

4. Start the app:

```powershell
npm.cmd start
```

5. Open the URL printed in the terminal. The backend defaults to `http://localhost:3010` and moves to the next free port if needed.

## How It Works

- `rag_search.py` reads `../../Bases de Datos/rag/output/embedded_chunks.json`.
- It embeds the user question with the same `BAAI/bge-base-en-v1.5` model used by the RAG.
- `server.js` sends the top retrieved chunks to Gemini through `generateContent`.
- The React frontend shows the polished answer and the retrieved sources.

## Configuration

The app keeps the original RAG project unchanged. Optional `.env` values:

```env
PORT=3000
GEMINI_MODEL=gemini-2.5-flash
CHAT_AI_PYTHON=C:\Users\jorge\Desktop\Clase Software\Bases de Datos\rag\.venv\Scripts\python.exe
RAG_EMBEDDED_CHUNKS_PATH=C:\Users\jorge\Desktop\Clase Software\Bases de Datos\rag\output\embedded_chunks.json
```
