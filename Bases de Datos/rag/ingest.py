import json
from pathlib import Path

import psycopg2
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer


# =========================
# CONFIGURACIÓN
# =========================

PDF_PATH = Path("source/lotr-manual.pdf")

OUTPUT_DIR = Path("output")
EXTRACTED_PAGES_PATH = OUTPUT_DIR / "extracted_pages.json"
CHUNKS_PATH = OUTPUT_DIR / "chunks.json"
EMBEDDED_CHUNKS_PATH = OUTPUT_DIR / "embedded_chunks.json"

BOOK_TITLE = "Lord of the Rings: The Manual"
EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100

DB_CONFIG = {
    "dbname": "rag_db",
    "user": "postgres",
    "password": "postgres",
    "host": "127.0.0.1",
    "port": "5433"
}


# =========================
# 1. EXTRAER TEXTO DEL PDF
# =========================

def extract_pages_from_pdf(pdf_path):
    reader = PdfReader(str(pdf_path))
    pages = []

    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        text = text.strip()

        if text:
            pages.append({
                "page": i + 1,
                "text": text
            })

    return pages


# =========================
# 2. CREAR CHUNKS
# =========================

def chunk_text(text, chunk_size=500, overlap=100):
    words = text.split()
    chunks = []

    start = 0

    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])

        if chunk.strip():
            chunks.append(chunk)

        start += chunk_size - overlap

    return chunks


def create_chunks(pages):
    all_chunks = []
    chunk_index = 0

    for page in pages:
        page_chunks = chunk_text(
            page["text"],
            chunk_size=CHUNK_SIZE,
            overlap=CHUNK_OVERLAP
        )

        for chunk in page_chunks:
            all_chunks.append({
                "chunk_index": chunk_index,
                "page_start": page["page"],
                "page_end": page["page"],
                "content": chunk
            })

            chunk_index += 1

    return all_chunks


# =========================
# 3. GENERAR EMBEDDINGS
# =========================

def add_embeddings(chunks):
    model = SentenceTransformer(EMBEDDING_MODEL)

    for chunk in chunks:
        embedding = model.encode(
            chunk["content"],
            normalize_embeddings=True
        )

        chunk["embedding"] = embedding.tolist()

    return chunks


# =========================
# 4. INSERTAR EN POSTGRESQL
# =========================

def embedding_to_pgvector(embedding):
    return "[" + ",".join(map(str, embedding)) + "]"


def insert_chunks_into_postgres(chunks):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO documents (title, source_path)
        VALUES (%s, %s)
        RETURNING id;
    """, (BOOK_TITLE, str(PDF_PATH)))

    document_id = cur.fetchone()[0]

    for chunk in chunks:
        embedding_str = embedding_to_pgvector(chunk["embedding"])

        cur.execute("""
            INSERT INTO chunks (
                document_id,
                chunk_index,
                page_start,
                page_end,
                content,
                embedding
            )
            VALUES (%s, %s, %s, %s, %s, %s::vector);
        """, (
            document_id,
            chunk["chunk_index"],
            chunk["page_start"],
            chunk["page_end"],
            chunk["content"],
            embedding_str
        ))

    conn.commit()
    cur.close()
    conn.close()


# =========================
# EJECUCIÓN PRINCIPAL
# =========================

def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    print("Extrayendo texto del PDF...")
    pages = extract_pages_from_pdf(PDF_PATH)

    with open(EXTRACTED_PAGES_PATH, "w", encoding="utf-8") as f:
        json.dump(pages, f, ensure_ascii=False, indent=2)

    print(f"Se extrajeron {len(pages)} páginas con texto.")

    print("Creando chunks...")
    chunks = create_chunks(pages)

    with open(CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"Se generaron {len(chunks)} chunks.")

    print("Generando embeddings...")
    embedded_chunks = add_embeddings(chunks)

    with open(EMBEDDED_CHUNKS_PATH, "w", encoding="utf-8") as f:
        json.dump(embedded_chunks, f, ensure_ascii=False, indent=2)

    print("Embeddings generados correctamente.")

    print("Insertando chunks en PostgreSQL...")
    insert_chunks_into_postgres(embedded_chunks)

    print("Chunks insertados en PostgreSQL correctamente.")


if __name__ == "__main__":
    main()