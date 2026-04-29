import psycopg2
from sentence_transformers import SentenceTransformer

QUESTION = ""

model = SentenceTransformer("BAAI/bge-base-en-v1.5")
query_embedding = model.encode(QUESTION, normalize_embeddings=True).tolist()


DB_CONFIG = {
    "dbname": "rag_db",
    "user": "postgres",
    "password": "postgres",
    "host": "127.0.0.1",
    "port": "5433"
}

conn = psycopg2.connect(**DB_CONFIG)

cur = conn.cursor()

cur.execute("""
    SELECT
        chunk_index,
        page_start,
        content,
        embedding <=> %s::vector AS distance
    FROM chunks
    ORDER BY embedding <=> %s::vector
    LIMIT 5;
""", (query_embedding, query_embedding))

results = cur.fetchall()

print("Pregunta:")
print(QUESTION)
print("\nResultados:")

for row in results:
    chunk_index, page_start, content, distance = row

    print("\n---")
    print(f"Chunk: {chunk_index}")
    print(f"Página: {page_start}")
    print(f"Distancia: {distance}")
    print(content[:1000])

cur.close()
conn.close()