import sys

import psycopg2
from sentence_transformers import SentenceTransformer

QUESTION = " ".join(sys.argv[1:]) or "Where is The Shire?"
EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5"

DB_CONFIG = {
    "dbname": "rag_db",
    "user": "postgres",
    "password": "postgres",
    "host": "127.0.0.1",
    "port": "5433",
}


def main():
    model = SentenceTransformer(EMBEDDING_MODEL)
    query_embedding = model.encode(QUESTION, normalize_embeddings=True).tolist()

    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            chunk_index,
            page_start,
            page_end,
            section,
            subsection,
            entry_title,
            entry_type,
            content,
            embedding <=> %s::vector AS distance
        FROM chunks
        ORDER BY embedding <=> %s::vector
        LIMIT 5;
        """,
        (query_embedding, query_embedding),
    )

    results = cur.fetchall()

    print("Pregunta:")
    print(QUESTION)
    print("\nResultados:")

    for row in results:
        (
            chunk_index,
            page_start,
            page_end,
            section,
            subsection,
            entry_title,
            entry_type,
            content,
            distance,
        ) = row

        page_label = f"{page_start}" if page_start == page_end else f"{page_start}-{page_end}"
        print("\n---")
        print(f"Chunk: {chunk_index}")
        print(f"Paginas: {page_label}")
        print(f"Seccion: {section or 'N/A'}")
        print(f"Subseccion: {subsection or 'N/A'}")
        print(f"Entrada: {entry_title or 'N/A'}")
        print(f"Tipo: {entry_type or 'N/A'}")
        print(f"Distancia: {distance}")
        print(content[:1000])

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
