import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceDir = path.resolve(__dirname, "..", "..");
const distDir = path.join(__dirname, "dist");

loadEnv(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 3000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_BODY_SIZE = 1024 * 1024;

function loadEnv(envPath) {
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function jsonResponse(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function collectBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function pickPythonExecutable() {
  const candidates = [
    process.env.CHAT_AI_PYTHON,
    path.join(workspaceDir, "Bases de Datos", "rag", ".venv", "Scripts", "python.exe"),
    path.join(workspaceDir, ".venv", "Scripts", "python.exe"),
    "python",
  ].filter(Boolean);

  return candidates.find((candidate) => candidate === "python" || existsSync(candidate));
}

function retrieveContext(question) {
  return new Promise((resolve, reject) => {
    const python = pickPythonExecutable();
    if (!python) {
      reject(new Error("Python was not found. Set CHAT_AI_PYTHON in .env."));
      return;
    }

    const child = spawn(python, [path.join(__dirname, "rag_search.py")], {
      cwd: __dirname,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("RAG search timed out while loading the embedding model."));
    }, 300000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(stderr.trim() || `RAG search failed with exit code ${code}.`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`RAG search returned invalid JSON: ${error.message}`));
      }
    });

    child.stdin.end(JSON.stringify({ question, topK: 6 }));
  });
}

function pageLabel(source) {
  if (!source.page_start && !source.page_end) return "N/A";
  return source.page_start === source.page_end
    ? String(source.page_start)
    : `${source.page_start}-${source.page_end}`;
}

function buildPrompt(question, sources) {
  const context = sources
    .map((source, index) => {
      const title = source.entry_title || source.subsection || source.section || "Untitled";
      return [
        `[${index + 1}] ${title}`,
        `Section: ${source.section || "N/A"}`,
        `Pages: ${pageLabel(source)}`,
        `Content: ${source.content}`,
      ].join("\n");
    })
    .join("\n\n");

  return `Question: ${question}

Retrieved manual context:
${context}

Answer the question naturally using only the retrieved manual context. If the context is not enough, say what is missing instead of inventing details. Keep the answer clear and useful for a player.`;
}

function extractGeminiText(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || "").join("").trim();
}

async function askGemini(question, sources) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to Periodo 3/ChatAI/.env.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text:
                "You are a helpful assistant for The Lord of the Rings, Volume One game manual. Produce polished natural-language answers from retrieved RAG context, not raw chunks.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(question, sources) }],
          },
        ],
        generationConfig: {
          temperature: 0.25,
          topP: 0.9,
          maxOutputTokens: 900,
        },
      }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `Gemini request failed with ${response.status}.`;
    throw new Error(message);
  }

  const answer = extractGeminiText(payload);
  if (!answer) {
    throw new Error("Gemini returned an empty answer.");
  }

  return answer;
}

async function handleChat(req, res) {
  try {
    const rawBody = await collectBody(req);
    const body = rawBody ? JSON.parse(rawBody) : {};
    const question = String(body.question || "").trim();

    if (!question) {
      jsonResponse(res, 400, { error: "Write a question first." });
      return;
    }

    const retrieval = await retrieveContext(question);
    const sources = retrieval.results || [];
    if (!sources.length) {
      jsonResponse(res, 404, { error: "No RAG context was found for that question." });
      return;
    }

    const answer = await askGemini(question, sources);
    jsonResponse(res, 200, { answer, sources });
  } catch (error) {
    jsonResponse(res, 500, { error: error.message || "Unexpected server error." });
  }
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = decodeURIComponent(url.pathname);
  const normalizedPath = requestedPath === "/" ? "/index.html" : requestedPath;
  let filePath = path.normalize(path.join(distDir, normalizedPath));

  if (!filePath.startsWith(distDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    const extension = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[extension] || "application/octet-stream" });
    res.end(content);
  } catch {
    try {
      filePath = path.join(distDir, "index.html");
      const content = await readFile(filePath);
      res.writeHead(200, { "Content-Type": MIME_TYPES[".html"] });
      res.end(content);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Run npm.cmd run build before npm.cmd start, or use npm.cmd run dev.");
    }
  }
}

const server = createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/api/chat") {
    handleChat(req, res);
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  jsonResponse(res, 405, { error: "Method not allowed." });
});

function startServer(port, remainingAttempts = 20) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && remainingAttempts > 0) {
      startServer(port + 1, remainingAttempts - 1);
      return;
    }

    throw error;
  });

  server.listen(port, () => {
    console.log(`ChatAI RAG web app running at http://localhost:${port}`);
  });
}

startServer(PORT);
