import json
import os
import sys
from pathlib import Path

from sentence_transformers import SentenceTransformer


APP_DIR = Path(__file__).resolve().parent
WORKSPACE_DIR = APP_DIR.parents[1]
DEFAULT_CHUNKS_PATH = WORKSPACE_DIR / "Bases de Datos" / "rag" / "output" / "embedded_chunks.json"
EMBEDDING_MODEL = os.getenv("RAG_EMBEDDING_MODEL", "BAAI/bge-base-en-v1.5")


def chunks_path():
    override = os.getenv("RAG_EMBEDDED_CHUNKS_PATH")
    return Path(override) if override else DEFAULT_CHUNKS_PATH


def dot_product(left, right):
    return sum(a * b for a, b in zip(left, right))


def load_request():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON input: {exc}") from exc

    question = (payload.get("question") or "").strip()
    if not question:
        raise SystemExit("Question is required.")

    top_k = payload.get("topK", 6)
    try:
        top_k = max(1, min(int(top_k), 10))
    except (TypeError, ValueError):
        top_k = 6

    return question, top_k


def load_chunks(path):
    if not path.exists():
        raise SystemExit(f"RAG embeddings file was not found: {path}")

    with path.open("r", encoding="utf-8") as file:
        chunks = json.load(file)

    usable_chunks = [chunk for chunk in chunks if chunk.get("embedding")]
    if not usable_chunks:
        raise SystemExit(f"No embedded chunks were found in: {path}")

    return usable_chunks


def serialize_result(chunk, score):
    return {
        "chunk_index": chunk.get("chunk_index"),
        "section": chunk.get("section"),
        "subsection": chunk.get("subsection"),
        "entry_title": chunk.get("entry_title"),
        "entry_type": chunk.get("entry_type"),
        "page_start": chunk.get("page_start"),
        "page_end": chunk.get("page_end"),
        "content": chunk.get("content"),
        "score": score,
    }


def score_chunk(query_embedding, chunk):
    content = chunk.get("content") or ""
    word_count = len(content.split())
    score = dot_product(query_embedding, chunk["embedding"])

    if word_count < 8:
        return None
    if word_count < 24:
        score -= 0.08

    return score


def main():
    question, top_k = load_request()
    chunks = load_chunks(chunks_path())

    model = SentenceTransformer(EMBEDDING_MODEL)
    query_embedding = model.encode(question, normalize_embeddings=True).tolist()

    scored_chunks = []
    for chunk in chunks:
        score = score_chunk(query_embedding, chunk)
        if score is not None:
            scored_chunks.append((score, chunk))

    ranked = sorted(scored_chunks, key=lambda item: item[0], reverse=True)

    results = [serialize_result(chunk, score) for score, chunk in ranked[:top_k]]
    json.dump({"results": results}, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
