import hashlib
from pathlib import Path
from typing import Tuple

def compute_sha256(file_bytes: bytes) -> str:
    hasher = hashlib.sha256()
    hasher.update(file_bytes)
    return hasher.hexdigest()

def detect_file_type(filename: str, file_bytes: bytes) -> Tuple[str, str]:
    """
    Detects file type using magic bytes and extension fallback.
    Returns (normalized_type, mime_hint).
    """
    ext = Path(filename).suffix.lower()
    
    # Magic bytes check
    if file_bytes.startswith(b"%PDF-"):
        return "pdf", "application/pdf"
    elif file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png", "image/png"
    elif file_bytes.startswith(b"\xff\xd8\xff"):
        return "jpg", "image/jpeg"
    elif file_bytes.startswith(b"II*\x00") or file_bytes.startswith(b"MM\x00*"):
        return "tiff", "image/tiff"
    elif file_bytes.startswith(b"PK\x03\x04") and ext in [".docx", ".doc"]:
        return "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    
    # Extension fallback for plain text formats
    if ext in [".txt", ".log"]:
        return "txt", "text/plain"
    elif ext in [".md", ".markdown"]:
        return "md", "text/markdown"
    elif ext in [".docx"]:
        return "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif ext in [".pdf"]:
        return "pdf", "application/pdf"
    elif ext in [".jpg", ".jpeg"]:
        return "jpg", "image/jpeg"
    elif ext in [".png"]:
        return "png", "image/png"
    elif ext in [".tiff", ".tif"]:
        return "tiff", "image/tiff"
        
    return "unknown", "application/octet-stream"
