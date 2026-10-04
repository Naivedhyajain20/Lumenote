import io
import fitz  # PyMuPDF
import logging
from typing import List, Dict, Any, Tuple
from app.ingestion.ocr import perform_ocr_on_image

logger = logging.getLogger("investigator.pdf")

def extract_pdf_pages(file_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Extracts text and bounding boxes page-by-page from PDF.
    If a page has fewer than 30 characters, renders at 300 DPI and runs OCR.
    Returns list of page dicts:
    [{
        "page_number": int (1-based),
        "text": str,
        "blocks": list of {text, bbox: [x0, y0, x1, y1], norm_bbox},
        "is_ocr": bool,
        "ocr_confidence": float,
        "width": float,
        "height": float
    }]
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_data = []

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        page_num = page_idx + 1
        rect = page.rect
        width, height = rect.width, rect.height
        
        # Extract native text blocks
        blocks = page.get_text("blocks")
        native_text = page.get_text("text").strip()
        
        # Check character threshold per Section 7.1 (< 30 chars -> render 300 DPI and OCR)
        if len(native_text) < 30:
            logger.info(f"Page {page_num} has only {len(native_text)} chars. Triggering 300 DPI OCR fallback.")
            zoom = 300 / 72  # standard 72 dpi to 300 dpi
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")
            
            ocr_text, ocr_boxes, ocr_conf = perform_ocr_on_image(img_bytes)
            pages_data.append({
                "page_number": page_num,
                "text": ocr_text,
                "blocks": ocr_boxes,
                "is_ocr": True,
                "ocr_confidence": ocr_conf,
                "width": width,
                "height": height
            })
        else:
            # Process native text blocks with bounding boxes
            parsed_blocks = []
            for b in blocks:
                # b format: (x0, y0, x1, y1, text, block_no, block_type)
                b_text = b[4].strip()
                if b_text:
                    parsed_blocks.append({
                        "text": b_text,
                        "box": [round(b[0], 2), round(b[1], 2), round(b[2], 2), round(b[3], 2)],
                        "norm_box": [
                            round(b[0] / width, 4),
                            round(b[1] / height, 4),
                            round(b[2] / width, 4),
                            round(b[3] / height, 4)
                        ],
                        "conf": 1.0
                    })
                    
            pages_data.append({
                "page_number": page_num,
                "text": native_text,
                "blocks": parsed_blocks,
                "is_ocr": False,
                "ocr_confidence": 1.0,
                "width": width,
                "height": height
            })

    doc.close()
    return pages_data
