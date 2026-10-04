from typing import Dict, Any, List

AUTHORITY_MAP = {
    "contract": 1.0,
    "signed": 1.0,
    "invoice": 0.8,
    "receipt": 0.7,
    "email": 0.6,
    "meeting_notes": 0.4,
    "notes": 0.4,
    "other": 0.5
}

def compute_document_reliability(
    doc_type: str,
    ocr_quality: float,
    completeness: float = 1.0,
    recency: float = 0.9,
    is_ocr: bool = False,
    notes: List[str] = None
) -> Dict[str, Any]:
    """
    Computes document trust score and explanatory breakdown according to Section 7.11.
    """
    if notes is None:
        notes = []
        
    doc_type_key = doc_type.lower()
    authority = AUTHORITY_MAP.get(doc_type_key, 0.5)
    
    # OCR quality: 1.0 for native text, or mean OCR confidence
    ocr_score = max(0.1, min(1.0, ocr_quality))
    
    # Calculate composite score
    reliability = (
        0.35 * authority +
        0.25 * ocr_score +
        0.20 * completeness +
        0.20 * recency
    )
    
    # Round to 2 decimal places
    reliability = round(reliability, 2)
    
    reasons = []
    if doc_type_key in ["contract", "signed"]:
        reasons.append("High legal authority (Signed commercial agreement)")
    elif doc_type_key == "invoice":
        reasons.append("Medium-high authority (Commercial tax invoice)")
    elif doc_type_key == "email":
        reasons.append("Moderate authority (Informal email correspondence)")
    elif doc_type_key in ["notes", "meeting_notes"]:
        reasons.append("Lower legal authority (Unsigned meeting notes)")
        
    if is_ocr:
        pct = int(ocr_score * 100)
        if ocr_score < 0.75:
            reasons.append(f"Image scan with blur/artifacts (OCR Confidence: {pct}%)")
        else:
            reasons.append(f"OCR extracted image (Confidence: {pct}%)")
    else:
        reasons.append("Native digital document (100% text fidelity)")
        
    if completeness < 1.0:
        reasons.append("Possible missing pages or truncated text detected")
        
    badge = "HIGH" if reliability >= 0.75 else ("MEDIUM" if reliability >= 0.50 else "LOW")
    
    return {
        "reliability_score": reliability,
        "authority": authority,
        "ocr_quality": ocr_score,
        "completeness": completeness,
        "recency": recency,
        "badge": badge,
        "reasons": reasons
    }
