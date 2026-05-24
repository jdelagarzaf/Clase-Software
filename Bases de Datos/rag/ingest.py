import argparse
import json
import os
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

import psycopg2
from psycopg2.extras import Json
from sentence_transformers import SentenceTransformer

LOCAL_DEPS = Path(__file__).resolve().parent / ".rag_deps"
if LOCAL_DEPS.exists():
    sys.path.insert(0, str(LOCAL_DEPS))

try:
    import fitz  # PyMuPDF
except ImportError as exc:
    raise SystemExit(
        "PyMuPDF is required for layout-aware extraction. "
        "Install it with: pip install -r requirements.txt"
    ) from exc


# =========================
# CONFIGURACION
# =========================

BASE_DIR = Path(__file__).resolve().parent
PDF_PATH = BASE_DIR / "source" / "lotr-manual.pdf"

OUTPUT_DIR = BASE_DIR / "output"
EXTRACTED_PAGES_PATH = OUTPUT_DIR / "extracted_pages.json"
CHUNKS_PATH = OUTPUT_DIR / "chunks.json"
EMBEDDED_CHUNKS_PATH = OUTPUT_DIR / "embedded_chunks.json"

BOOK_TITLE = "Lord of the Rings: The Manual"
EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5"

MAX_CHUNK_WORDS = 250
MIN_SPLIT_WORDS = 280
CHUNK_OVERLAP = 35

DB_CONFIG = {
    "dbname": os.getenv("PGDATABASE", "rag_db"),
    "user": os.getenv("PGUSER", "postgres"),
    "password": os.getenv("PGPASSWORD", "postgres"),
    "host": os.getenv("PGHOST", "127.0.0.1"),
    "port": os.getenv("PGPORT", "5432"),
}

SECTION_MARKERS = [
    (re.compile(r"\bINTRODUCTION\b", re.I), "Introduction"),
    (re.compile(r"\bCHARACTER TYPES\b", re.I), "Character Types"),
    (re.compile(r"^CHARACTERISTICS$", re.I), "Character Types"),
    (re.compile(r"\bSKILLS\s+in\s+\"?LORD", re.I), "Skills"),
    (re.compile(r"^SPELLS$", re.I), "Spells"),
    (re.compile(r"\bINTERFACE\b", re.I), "System Interface"),
    (re.compile(r"^(?:COMBAT|COMBAT SYSTEM)$", re.I), "Combat System"),
    (re.compile(r"^ITEMS$", re.I), "Items"),
    (re.compile(r"^WEAPONS$", re.I), "Weapons"),
    (re.compile(r"^MAGIC ITEMS$", re.I), "Magic Items"),
    (re.compile(r"^FOOD\b.*\bHEALING\b.*\bITEMS$", re.I), "Food and Healing Items"),
    (re.compile(r"\bWIZARDLY ADVICE\b", re.I), "Wizardly Advice"),
    (re.compile(r"^BACKGROUND$", re.I), "Background"),
    (re.compile(r"^WHAT HAS GONE BEFORE$", re.I), "What Has Gone Before"),
    (re.compile(r"^THE SHIRE$", re.I), "The Shire"),
    (re.compile(r"^BEYOND THE SHIRE$", re.I), "Beyond the Shire"),
    (re.compile(r"^HISTORY OF MIDDLE", re.I), "History of Middle Earth"),
    (re.compile(r"(?:BESTIARY|ESTIARY)", re.I), "Bestiary of Middle Earth Creatures"),
    (re.compile(r"^(?:PEOPLES?|EOPLES)OF$|^PEOPLES?\s*OF\s*MIDDLE EARTH$", re.I), "People of Middle Earth"),
    (re.compile(r"^GLOSSARY$", re.I), "Glossary of Names"),
    (re.compile(r"^MAP OF THE SHIRE$", re.I), "Map of the Shire"),
    (re.compile(r"^PARAGRAPH BOOK$", re.I), "Paragraph Book"),
    (re.compile(r"^BIOGRAPHIES$", re.I), "Biographies"),
]

SUBSECTION_MARKERS = [
    "Active Skills",
    "Combat Skills",
    "Lores",
    "Acquiring New Skills",
    "Magic in Middle Earth",
    "Acquiring New Spells",
    "Words of Power",
    "Foes",
    "The Third Age",
]

TITLE_FIXES = {
    "Dexterfiy (Dex)": "Dexterity (Dex)",
    "Delect Lraps": "Detect Traps",
    "Wck(Luck)": "Luck (Luck)",
    "Skiu.S": "Skills",
    "Illciminate": "Illuminate",
    "Cocintermagic": "Countermagic",
    "Animals Peak": "Animalspeak",
}

NOISE_PATTERNS = [
    re.compile(r"^\d+$"),
    re.compile(r"^\d+\s+The Lord (?:of|or|D?rd) the Rings, Vol\. I$", re.I),
    re.compile(r"^The Lord (?:of|or|D?rd) the Rings, Vol\. I$", re.I),
    re.compile(r"^Interplay Productions(?:\s+\d+)?$", re.I),
    re.compile(r"^(?:li>l|r-)$", re.I),
]


@dataclass
class Line:
    text: str
    x0: float
    y0: float
    x1: float
    y1: float


# =========================
# 1. EXTRAER TEXTO DEL PDF
# =========================

def normalize_text(text):
    text = text.replace("\u00ad", "")
    text = text.replace("Â­", "")
    text = text.replace("â€¢", "")
    text = text.replace("•", "")
    text = re.sub(r"(?<=\w)-\s+(?=\w)", "", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    return text.strip()


def clean_ocr_text(text):
    return normalize_text(text)


def line_is_noise(line):
    text = normalize_text(line.text)
    if not text:
        return True
    return any(pattern.match(text) for pattern in NOISE_PATTERNS)


def words_to_lines(words):
    line_map = {}

    for word in words:
        x0, y0, x1, y1, token, block_no, line_no, word_no = word
        if not token.strip():
            continue
        key = (block_no, line_no)
        line_map.setdefault(key, []).append((x0, y0, x1, y1, token, word_no))

    lines = []
    for parts in line_map.values():
        parts.sort(key=lambda item: (item[0], item[5]))
        text = normalize_text(" ".join(part[4] for part in parts))
        if not text:
            continue
        lines.append(
            Line(
                text=text,
                x0=min(part[0] for part in parts),
                y0=min(part[1] for part in parts),
                x1=max(part[2] for part in parts),
                y1=max(part[3] for part in parts),
            )
        )

    return lines


def detect_column_starts(lines, page_width):
    candidates = [
        line.x0
        for line in lines
        if len(line.text) > 8
        and not line_is_noise(line)
        and line.x0 > page_width * 0.03
        and line.x1 < page_width * 0.98
    ]

    if not candidates:
        return [0.0]

    clusters = []
    for x0 in sorted(candidates):
        if not clusters or x0 - clusters[-1][0] > 120:
            clusters.append([x0])
        else:
            clusters[-1].append(x0)

    starts = [cluster[0] for cluster in clusters]
    return starts[:6]


def column_for_line(line, column_starts):
    return min(range(len(column_starts)), key=lambda i: abs(line.x0 - column_starts[i]))


def extract_page_with_pymupdf(page):
    words = page.get_text("words")
    lines = [line for line in words_to_lines(words) if not line_is_noise(line)]

    column_starts = detect_column_starts(lines, page.rect.width)
    columns = {i: [] for i in range(len(column_starts))}

    for line in lines:
        columns[column_for_line(line, column_starts)].append(line)

    ordered_lines = []
    for column_id in sorted(columns):
        column_lines = sorted(columns[column_id], key=lambda line: (line.y0, line.x0))
        ordered_lines.extend(column_lines)

    text = "\n".join(line.text for line in ordered_lines)
    text = normalize_extracted_text(text)

    return {
        "text": text,
        "method": "pymupdf",
        "column_count": len(column_starts),
        "word_count": len(words),
        "line_count": len(ordered_lines),
        "column_starts": [round(start, 2) for start in column_starts],
    }


def extract_page_with_tesseract(page):
    if not shutil.which("tesseract"):
        return None

    try:
        from PIL import Image
        import pytesseract
    except ImportError:
        return None

    pix = page.get_pixmap(matrix=fitz.Matrix(3, 3), alpha=False, colorspace=fitz.csGRAY)
    image = Image.frombytes("L", [pix.width, pix.height], pix.samples)
    text = pytesseract.image_to_string(image, config="--psm 4")
    text = clean_ocr_text(text)

    if not text:
        return None

    return {
        "text": text,
        "method": "tesseract_psm4",
        "column_count": None,
        "word_count": len(text.split()),
        "line_count": len(text.splitlines()),
        "column_starts": [],
    }


def extraction_quality_is_low(page_data):
    text = page_data["text"]
    if len(text.split()) < 30:
        return True
    entry_count = len(re.findall(r"\b[A-Z][A-Z' -]{2,35}:", text))
    garbled_count = len(re.findall(r"[~_]{3,}|[^\w\s.,;:!?\"'()\-]{4,}", text))
    return garbled_count > max(3, entry_count)


def normalize_extracted_text(text):
    lines = []
    for raw_line in text.splitlines():
        line = normalize_text(raw_line)
        if line:
            lines.append(line)

    joined = "\n".join(lines)
    joined = re.sub(r"\n{3,}", "\n\n", joined)
    return joined.strip()


def extract_pages_from_pdf(pdf_path):
    pages = []

    with fitz.open(pdf_path) as document:
        for page_index, page in enumerate(document):
            page_data = extract_page_with_pymupdf(page)

            if extraction_quality_is_low(page_data):
                ocr_page_data = extract_page_with_tesseract(page)
                if ocr_page_data:
                    page_data = ocr_page_data

            if page_data["text"]:
                pages.append(
                    {
                        "page": page_index + 1,
                        "text": page_data["text"],
                        "metadata": {
                            "source_path": str(pdf_path),
                            "extraction_method": page_data["method"],
                            "column_count": page_data["column_count"],
                            "column_starts": page_data["column_starts"],
                            "word_count": page_data["word_count"],
                            "line_count": page_data["line_count"],
                        },
                    }
                )

    return pages


# =========================
# 2. CREAR CHUNKS
# =========================

def detect_section(text, current_section):
    compact = re.sub(r"\s+", " ", text)
    for pattern, section in SECTION_MARKERS:
        if pattern.search(compact):
            return section
    return current_section


def detect_subsection(text, current_subsection):
    clean = normalize_text(text)
    for marker in SUBSECTION_MARKERS:
        if re.search(rf"\b{re.escape(marker)}\b", clean, re.I):
            return marker
    return current_subsection


def looks_like_entry_start(line):
    clean = normalize_text(line)
    if re.match(r"^\d{1,3}\.\s+", clean):
        return True
    letters = re.findall(r"[A-Za-z]", clean.split(":", 1)[0])
    uppercase_ratio = sum(1 for letter in letters if letter.isupper()) / max(1, len(letters))
    if re.match(r"^[A-Za-z][A-Za-z0-9' -]{2,35}:\s*\S", clean) and uppercase_ratio >= 0.65:
        return True
    letters = re.findall(r"[A-Za-z]", clean)
    uppercase_ratio = sum(1 for letter in letters if letter.isupper()) / max(1, len(letters))
    if (
        re.match(r"^[A-Za-z][A-Za-z0-9' -]{2,35}(?:\s+\([A-Z]+\))?$", clean)
        and uppercase_ratio >= 0.65
    ):
        return clean not in {
            "TABLE OF CONTENTS",
            "THE LORD OF THE RINGS",
            "MAGIC IN",
            "MIDDLE EARTH",
            "OF THE RINGS",
            "NEW SPELLS",
        }
    return False


def parse_entry_start(line):
    clean = normalize_text(line)
    numbered = re.match(r"^(\d{1,3})\.\s+(.*)$", clean)
    if numbered:
        return f"Paragraph {numbered.group(1)}", "paragraph", numbered.group(2)

    named = re.match(r"^([A-Za-z][A-Za-z0-9' -]{2,35}):\s*(.*)$", clean)
    if named and looks_like_entry_start(clean):
        title = normalize_entry_title(named.group(1))
        return title, "definition", named.group(2)

    heading = re.match(r"^([A-Za-z][A-Za-z0-9' -]{2,35}(?:\s+\([A-Z]+\))?)$", clean)
    if heading:
        title = normalize_entry_title(heading.group(1))
        return title, "definition", ""

    return None, "section", clean


def normalize_entry_title(title):
    clean_title = " ".join(title.title().split())
    return TITLE_FIXES.get(clean_title, clean_title)


def infer_entry_type(section, entry_type):
    if entry_type != "definition":
        return entry_type
    if section == "Glossary of Names":
        return "glossary_entry"
    if section == "Bestiary of Middle Earth Creatures":
        return "bestiary_entry"
    if section == "People of Middle Earth":
        return "people_entry"
    if section in {"Skills", "Spells", "Weapons", "Magic Items", "Food and Healing Items"}:
        return "manual_entry"
    return entry_type


def build_embedding_text(chunk):
    parts = []
    if chunk.get("section"):
        parts.append(f"Section: {chunk['section']}.")
    if chunk.get("subsection"):
        parts.append(f"Subsection: {chunk['subsection']}.")
    if chunk.get("entry_title"):
        parts.append(f"Entry: {chunk['entry_title']}.")
    parts.append(f"Content: {chunk['content']}")
    return " ".join(parts)


def split_oversized_chunk(chunk):
    words = chunk["content"].split()
    if len(words) <= MIN_SPLIT_WORDS:
        chunk["embedding_text"] = build_embedding_text(chunk)
        return [chunk]

    split_chunks = []
    start = 0
    part = 1
    step = MAX_CHUNK_WORDS - CHUNK_OVERLAP

    while start < len(words):
        end = min(start + MAX_CHUNK_WORDS, len(words))
        next_chunk = dict(chunk)
        next_chunk["content"] = " ".join(words[start:end])
        next_chunk["entry_title"] = (
            f"{chunk['entry_title']} part {part}" if chunk.get("entry_title") else None
        )
        next_chunk["metadata"] = dict(chunk.get("metadata", {}))
        next_chunk["metadata"]["split_part"] = part
        next_chunk["embedding_text"] = build_embedding_text(next_chunk)
        split_chunks.append(next_chunk)

        if end == len(words):
            break
        start += step
        part += 1

    return split_chunks


def make_chunk(chunk_index, section, subsection, entry_title, entry_type, page_start, page_end, content, metadata):
    chunk = {
        "chunk_index": chunk_index,
        "section": section,
        "subsection": subsection,
        "entry_title": entry_title,
        "entry_type": entry_type,
        "page_start": page_start,
        "page_end": page_end,
        "source_path": str(PDF_PATH),
        "content": normalize_text(content),
        "metadata": metadata,
    }
    chunk["embedding_text"] = build_embedding_text(chunk)
    return chunk


def create_chunks(pages):
    raw_chunks = []
    current_section = None
    current_subsection = None
    current_entry = None
    chunk_index = 0

    def flush_current():
        nonlocal chunk_index, current_entry
        if not current_entry:
            return

        content = normalize_text(" ".join(current_entry["content_parts"]))
        if not content:
            current_entry = None
            return

        raw_chunk = make_chunk(
            chunk_index=chunk_index,
            section=current_entry["section"],
            subsection=current_entry["subsection"],
            entry_title=current_entry["entry_title"],
            entry_type=infer_entry_type(current_entry["section"], current_entry["entry_type"]),
            page_start=current_entry["page_start"],
            page_end=current_entry["page_end"],
            content=content,
            metadata=current_entry["metadata"],
        )
        raw_chunks.append(raw_chunk)
        chunk_index += 1
        current_entry = None

    for page in pages:
        page_no = page["page"]
        page_metadata = page.get("metadata", {})

        for line in page["text"].splitlines():
            line = normalize_text(line)
            if not line:
                continue

            detected_section = detect_section(line, current_section)
            if detected_section != current_section:
                current_section = detected_section
                current_subsection = None
            current_subsection = detect_subsection(line, current_subsection)

            if looks_like_entry_start(line):
                flush_current()
                entry_title, entry_type, first_content = parse_entry_start(line)
                entry_section = "Paragraph Book" if entry_type == "paragraph" else current_section
                entry_subsection = None if entry_type == "paragraph" else current_subsection
                current_entry = {
                    "section": entry_section,
                    "subsection": entry_subsection,
                    "entry_title": entry_title,
                    "entry_type": entry_type,
                    "page_start": page_no,
                    "page_end": page_no,
                    "content_parts": [f"{entry_title}: {first_content}" if entry_title and entry_type != "paragraph" else first_content],
                    "metadata": {
                        "pages": [page_no],
                        "extraction": {str(page_no): page_metadata},
                    },
                }
                continue

            if current_entry is None:
                current_entry = {
                    "section": current_section,
                    "subsection": current_subsection,
                    "entry_title": current_subsection or current_section or f"Page {page_no}",
                    "entry_type": "section",
                    "page_start": page_no,
                    "page_end": page_no,
                    "content_parts": [],
                    "metadata": {
                        "pages": [page_no],
                        "extraction": {str(page_no): page_metadata},
                    },
                }

            if page_no not in current_entry["metadata"]["pages"]:
                current_entry["metadata"]["pages"].append(page_no)
                current_entry["metadata"]["extraction"][str(page_no)] = page_metadata

            current_entry["page_end"] = page_no
            if current_entry["entry_type"] != "paragraph":
                current_entry["section"] = current_entry["section"] or current_section
                current_entry["subsection"] = current_entry["subsection"] or current_subsection
            current_entry["content_parts"].append(line)

    flush_current()

    final_chunks = []
    for raw_chunk in raw_chunks:
        final_chunks.extend(split_oversized_chunk(raw_chunk))

    for index, chunk in enumerate(final_chunks):
        chunk["chunk_index"] = index

    return final_chunks


# =========================
# 3. GENERAR EMBEDDINGS
# =========================

def add_embeddings(chunks):
    model = SentenceTransformer(EMBEDDING_MODEL)

    embedding_texts = [chunk["embedding_text"] for chunk in chunks]
    embeddings = model.encode(
        embedding_texts,
        normalize_embeddings=True,
        show_progress_bar=True,
    )

    for chunk, embedding in zip(chunks, embeddings):
        chunk["embedding"] = embedding.tolist()

    return chunks


# =========================
# 4. INSERTAR EN POSTGRESQL
# =========================

def embedding_to_pgvector(embedding):
    return "[" + ",".join(map(str, embedding)) + "]"


def ensure_schema(cur):
    cur.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS section TEXT;")
    cur.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS subsection TEXT;")
    cur.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS entry_title TEXT;")
    cur.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS entry_type TEXT;")
    cur.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS source_path TEXT;")
    cur.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS embedding_text TEXT;")
    cur.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS metadata JSONB;")


def insert_chunks_into_postgres(chunks):
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    ensure_schema(cur)

    cur.execute(
        """
        DELETE FROM chunks
        USING documents
        WHERE chunks.document_id = documents.id
          AND documents.title = %s;
        """,
        (BOOK_TITLE,),
    )

    cur.execute(
        """
        DELETE FROM documents
        WHERE title = %s;
        """,
        (BOOK_TITLE,),
    )

    cur.execute(
        """
        INSERT INTO documents (title, source_path)
        VALUES (%s, %s)
        RETURNING id;
        """,
        (BOOK_TITLE, str(PDF_PATH)),
    )

    document_id = cur.fetchone()[0]

    for chunk in chunks:
        embedding_str = embedding_to_pgvector(chunk["embedding"])

        cur.execute(
            """
            INSERT INTO chunks (
                document_id,
                chunk_index,
                page_start,
                page_end,
                section,
                subsection,
                entry_title,
                entry_type,
                source_path,
                content,
                embedding_text,
                metadata,
                embedding
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::vector);
            """,
            (
                document_id,
                chunk["chunk_index"],
                chunk["page_start"],
                chunk["page_end"],
                chunk["section"],
                chunk["subsection"],
                chunk["entry_title"],
                chunk["entry_type"],
                chunk["source_path"],
                chunk["content"],
                chunk["embedding_text"],
                Json(chunk["metadata"]),
                embedding_str,
            ),
        )

    conn.commit()
    cur.close()
    conn.close()


def write_json(path, data):
    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


# =========================
# EJECUCION PRINCIPAL
# =========================

def parse_args():
    parser = argparse.ArgumentParser(description="Ingest the LOTR manual into JSON artifacts and PostgreSQL.")
    parser.add_argument(
        "--skip-embeddings",
        action="store_true",
        help="Only write extracted_pages.json and chunks.json.",
    )
    parser.add_argument(
        "--skip-db",
        action="store_true",
        help="Generate embeddings and JSON artifacts, but do not insert into PostgreSQL.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    OUTPUT_DIR.mkdir(exist_ok=True)

    print("Extrayendo texto del PDF con PyMuPDF...")
    pages = extract_pages_from_pdf(PDF_PATH)
    write_json(EXTRACTED_PAGES_PATH, pages)
    print(f"Se extrajeron {len(pages)} paginas con texto.")

    print("Creando chunks semanticos...")
    chunks = create_chunks(pages)
    write_json(CHUNKS_PATH, chunks)
    print(f"Se generaron {len(chunks)} chunks.")

    if args.skip_embeddings:
        print("Se omitio la generacion de embeddings.")
        return

    print("Generando embeddings...")
    embedded_chunks = add_embeddings(chunks)
    write_json(EMBEDDED_CHUNKS_PATH, embedded_chunks)
    print("Embeddings generados correctamente.")

    if args.skip_db:
        print("Se omitio la insercion en PostgreSQL.")
        return

    print("Insertando chunks en PostgreSQL...")
    insert_chunks_into_postgres(embedded_chunks)
    print("Chunks insertados en PostgreSQL correctamente.")


if __name__ == "__main__":
    main()
