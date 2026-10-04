import io
from typing import List, Dict, Any
from docx import Document

def extract_docx_content(file_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Extract paragraphs and tables from DOCX, treating headings as section boundaries.
    Returns list of section items:
    [{
        "section_title": str,
        "text": str,
        "page_number": int
    }]
    """
    doc = Document(io.BytesIO(file_bytes))
    sections = []
    current_section = "General"
    current_lines = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        
        # Check if style is heading
        if para.style and para.style.name and para.style.name.startswith("Heading"):
            if current_lines:
                sections.append({
                    "section_title": current_section,
                    "text": "\n".join(current_lines),
                    "page_number": 1
                })
                current_lines = []
            current_section = text
        else:
            current_lines.append(text)

    # Tables
    for table in doc.tables:
        table_rows = []
        for row in table.rows:
            row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_text:
                table_rows.append(row_text)
        if table_rows:
            current_lines.append("\n" + "\n".join(table_rows))

    if current_lines:
        sections.append({
            "section_title": current_section,
            "text": "\n".join(current_lines),
            "page_number": 1
        })

    return sections

def extract_plain_text(text_content: str) -> List[Dict[str, Any]]:
    """
    Extract text/markdown content splitting by blank lines and headings.
    """
    lines = text_content.split("\n")
    sections = []
    current_heading = "General"
    current_lines = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("# ") or stripped.startswith("## ") or (stripped.isupper() and len(stripped) < 40 and not stripped.endswith(".")):
            if current_lines:
                sections.append({
                    "section_title": current_heading,
                    "text": "\n".join(current_lines),
                    "page_number": 1
                })
                current_lines = []
            current_heading = stripped.lstrip("#").strip()
        else:
            if stripped:
                current_lines.append(stripped)

    if current_lines:
        sections.append({
            "section_title": current_heading,
            "text": "\n".join(current_lines),
            "page_number": 1
        })

    return sections
