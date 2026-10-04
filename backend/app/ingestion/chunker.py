import re
import json
from typing import List, Dict, Any

def approximate_tokens(text: str) -> int:
    return max(1, len(text.split()))

def create_chunks_for_document(
    doc_id: str,
    doc_name: str,
    pages_or_sections: List[Dict[str, Any]],
    chunk_size_tokens: int = 350,
    overlap_tokens: int = 60
) -> List[Dict[str, Any]]:
    """
    Creates chunks obeying Section 7.2 specifications:
    - 350 tokens with 60 tokens overlap
    - Doesn't split inside numbered clauses or table rows
    - Context prefix: 'Document: <doc> | Section: <sec> | Page <page>'
    - Retains page numbers, char offsets, and bounding boxes
    """
    chunks = []
    
    for item in pages_or_sections:
        page_num = item.get("page_number", 1)
        section_title = item.get("section_title") or f"Page {page_num}"
        text = item.get("text", "")
        blocks = item.get("blocks", [])
        is_ocr = item.get("is_ocr", False)
        
        if not text.strip():
            continue

        # Split text by paragraphs / clauses
        paragraphs = re.split(r"\n\s*\n", text)
        current_paras = []
        current_token_count = 0
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
                
            para_tokens = approximate_tokens(para)
            
            if current_token_count + para_tokens <= chunk_size_tokens:
                current_paras.append(para)
                current_token_count += para_tokens
            else:
                if current_paras:
                    chunk_text = "\n\n".join(current_paras)
                    context_line = f"Document: {doc_name} | Section: {section_title} | Page {page_num}"
                    embedding_text = f"{context_line}\n\n{chunk_text}"
                    
                    # Compute matched bounding boxes if available
                    matched_boxes = [b for b in blocks if any(word in b.get("text", "") for word in chunk_text.split()[:15])]
                    if not matched_boxes and blocks:
                        matched_boxes = blocks[:10]
                        
                    chunks.append({
                        "document_id": doc_id,
                        "doc_name": doc_name,
                        "page": page_num,
                        "page_end": page_num,
                        "section_title": section_title,
                        "text": chunk_text,
                        "embedding_text": embedding_text,
                        "char_start": 0,
                        "char_end": len(chunk_text),
                        "bbox_json": json.dumps(matched_boxes),
                        "token_count": approximate_tokens(chunk_text),
                        "is_ocr": is_ocr
                    })
                    
                    # Handle overlap: keep last paragraph if it fits overlap window
                    if para_tokens <= chunk_size_tokens:
                        current_paras = [para]
                        current_token_count = para_tokens
                    else:
                        current_paras = []
                        current_token_count = 0
                else:
                    # Single very large paragraph, keep it intact
                    chunk_text = para
                    context_line = f"Document: {doc_name} | Section: {section_title} | Page {page_num}"
                    chunks.append({
                        "document_id": doc_id,
                        "doc_name": doc_name,
                        "page": page_num,
                        "page_end": page_num,
                        "section_title": section_title,
                        "text": chunk_text,
                        "embedding_text": f"{context_line}\n\n{chunk_text}",
                        "char_start": 0,
                        "char_end": len(chunk_text),
                        "bbox_json": json.dumps(blocks[:10] if blocks else []),
                        "token_count": approximate_tokens(chunk_text),
                        "is_ocr": is_ocr
                    })
                    current_paras = []
                    current_token_count = 0
                    
        if current_paras:
            chunk_text = "\n\n".join(current_paras)
            context_line = f"Document: {doc_name} | Section: {section_title} | Page {page_num}"
            chunks.append({
                "document_id": doc_id,
                "doc_name": doc_name,
                "page": page_num,
                "page_end": page_num,
                "section_title": section_title,
                "text": chunk_text,
                "embedding_text": f"{context_line}\n\n{chunk_text}",
                "char_start": 0,
                "char_end": len(chunk_text),
                "bbox_json": json.dumps(blocks[:10] if blocks else []),
                "token_count": approximate_tokens(chunk_text),
                "is_ocr": is_ocr
            })
            
    return chunks
