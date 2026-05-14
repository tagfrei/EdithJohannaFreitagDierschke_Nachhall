#!/usr/bin/env python3
"""
Extrahiert Gedichte aus .docx-Dateien und erzeugt eine strukturierte JSON-Datei.
Verwendet nur die Python-Standardbibliothek (zipfile + xml.etree).

Aufruf: python3 scripts/extract-poems.py
"""

import json
import os
import re
import uuid
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Optional, Dict

# Namespace fuer Word XML
WORD_NS = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'

BASE_DIR = Path(__file__).resolve().parent.parent
POEM_DIRS = [
    BASE_DIR / "Gedichte chronologisch",
    BASE_DIR / "Neue Gedichte_2019_2020_2021_2022",
]
OUTPUT_FILE = BASE_DIR / "src" / "data" / "poems.json"


def extract_text_from_docx(filepath: Path) -> List[str]:
    """Extrahiert Absaetze aus einer .docx-Datei."""
    paragraphs = []
    try:
        with zipfile.ZipFile(filepath, 'r') as z:
            with z.open('word/document.xml') as f:
                tree = ET.parse(f)
                root = tree.getroot()
                for para in root.iter(f'{WORD_NS}p'):
                    texts = []
                    for run in para.iter(f'{WORD_NS}r'):
                        for t in run.iter(f'{WORD_NS}t'):
                            if t.text:
                                texts.append(t.text)
                    line = ''.join(texts).strip()
                    paragraphs.append(line)
    except (zipfile.BadZipFile, KeyError) as e:
        print(f"  WARNUNG: Konnte {filepath.name} nicht lesen: {e}")
        return []
    return paragraphs


def parse_poem(paragraphs: List[str], filename: str) -> Optional[Dict]:
    """Parst Absaetze in ein strukturiertes Gedicht-Objekt."""
    # Leere Absaetze am Anfang/Ende entfernen
    while paragraphs and not paragraphs[0]:
        paragraphs.pop(0)
    while paragraphs and not paragraphs[-1]:
        paragraphs.pop()

    if not paragraphs:
        return None

    # Titel: erster nicht-leerer Absatz
    title = paragraphs[0] if paragraphs else filename

    # Autor und Datum am Ende erkennen
    author = "Edith Johanna Freitag-Dierschke"
    date_str = None
    body_end = len(paragraphs)

    # Suche von unten nach Autor-Zeile und Datum
    for i in range(len(paragraphs) - 1, max(0, len(paragraphs) - 5), -1):
        line = paragraphs[i]
        if re.search(r'(Freitag|Dierschke|Edith|Johanna)', line, re.IGNORECASE):
            author = line.strip()
            body_end = i
            continue
        if re.match(r'^[\d]{4}$', line.strip()):
            date_str = line.strip()
            body_end = min(body_end, i)
            continue
        # Datumsformate wie "Maerz 1988", "12. Mai 2022"
        if re.match(r'^[\w\d\.\s,]+\d{4}$', line.strip()) and len(line.strip()) < 30:
            date_str = line.strip()
            body_end = min(body_end, i)
            continue

    # Body: alles zwischen Titel und Autor/Datum
    body_lines = paragraphs[1:body_end]

    # Fuehrende Leerzeilen im Body entfernen
    while body_lines and not body_lines[0]:
        body_lines.pop(0)

    body = '\n'.join(body_lines)

    if not body.strip():
        return None

    # Nummer aus Dateiname extrahieren (falls vorhanden)
    num_match = re.match(r'^(\d+)', filename)
    sort_order = int(num_match.group(1)) if num_match else 999

    return {
        "id": str(uuid.uuid4()),
        "title": title,
        "body": body,
        "author": author,
        "date": date_str,
        "source_file": filename,
        "sort_order": sort_order,
        # Platzhalter fuer Mood-Werte (werden spaeter via AI oder manuell gesetzt)
        "warmth": 0.5,
        "lightness": 0.5,
        "energy": 0.5,
        "intensity": 0.5,
        "tags_mood": [],
        "tags_theme": [],
    }


def main():
    poems = []
    skipped = []

    for poem_dir in POEM_DIRS:
        if not poem_dir.exists():
            print(f"Verzeichnis nicht gefunden: {poem_dir}")
            continue

        print(f"\nVerarbeite: {poem_dir.name}")
        docx_files = sorted(poem_dir.glob("*.docx"))
        print(f"  {len(docx_files)} .docx-Dateien gefunden")

        doc_files = sorted(poem_dir.glob("*.doc"))
        if doc_files:
            # Pruefe ob .doc-Dateien existieren, die keine .docx-Version haben
            docx_stems = {f.stem for f in docx_files}
            unconverted = [f for f in doc_files if f.stem not in docx_stems]
            if unconverted:
                print(f"  HINWEIS: {len(unconverted)} .doc-Dateien ohne .docx-Version")
                for f in unconverted[:5]:
                    print(f"    - {f.name}")
                if len(unconverted) > 5:
                    print(f"    ... und {len(unconverted) - 5} weitere")

        for filepath in docx_files:
            paragraphs = extract_text_from_docx(filepath)
            if not paragraphs:
                skipped.append(filepath.name)
                continue

            poem = parse_poem(paragraphs, filepath.stem)
            if poem:
                poems.append(poem)
            else:
                skipped.append(filepath.name)

    # Nach sort_order sortieren
    poems.sort(key=lambda p: p["sort_order"])

    # Output-Verzeichnis erstellen
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(poems, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*50}")
    print(f"Erfolgreich extrahiert: {len(poems)} Gedichte")
    print(f"Uebersprungen: {len(skipped)} Dateien")
    if skipped:
        for s in skipped:
            print(f"  - {s}")
    print(f"Output: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
