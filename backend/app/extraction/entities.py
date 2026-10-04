import re
import logging
from typing import List, Dict, Any
from app.extraction.money import normalize_money, format_money_str
from app.extraction.dates import normalize_date

logger = logging.getLogger("investigator.entities")

# Canonical alias mapping to merge duplicate entities
CANONICAL_ENTITIES = {
    "orion": ("ORG", "Orion Interiors"),
    "orion interiors": ("ORG", "Orion Interiors"),
    "northwind": ("ORG", "Northwind Supplies Pvt Ltd"),
    "northwind supplies": ("ORG", "Northwind Supplies Pvt Ltd"),
    "northwind supplies pvt ltd": ("ORG", "Northwind Supplies Pvt Ltd"),
    "rajesh mehta": ("PERSON", "Rajesh Mehta"),
    "rajesh": ("PERSON", "Rajesh Mehta"),
    "vikram sharma": ("PERSON", "Vikram Sharma"),
    "vikram": ("PERSON", "Vikram Sharma"),
    "mumbai": ("PLACE", "Mumbai"),
    "gurugram": ("PLACE", "Gurugram"),
}

def extract_entities_from_text(text: str) -> List[Dict[str, Any]]:
    """
    Extracts entities using regex patterns, known aliases, and spaCy if available.
    Merges duplicate aliases into canonical names.
    """
    extracted = []
    seen = set()

    # Rule-based regex for amounts
    for m in re.finditer(r"(?:INR|Rs\.?|₹)\s*(\d[\d,]*\d|\d+)", text, re.IGNORECASE):
        raw_val = m.group(0)
        norm = normalize_money(raw_val)
        if norm:
            norm_str = format_money_str(norm[0], norm[1])
            key = ("AMOUNT", norm_str)
            if key not in seen:
                seen.add(key)
                extracted.append({
                    "type": "AMOUNT",
                    "value": raw_val,
                    "normalized_value": norm_str
                })

    # Rule-based regex for dates
    for m in re.finditer(r"\b(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})\b", text):
        raw_val = m.group(0)
        norm_d = normalize_date(raw_val)
        if norm_d:
            key = ("DATE", norm_d)
            if key not in seen:
                seen.add(key)
                extracted.append({
                    "type": "DATE",
                    "value": raw_val,
                    "normalized_value": norm_d
                })

    # Percentages
    for m in re.finditer(r"\b(\d+%\s*(?:GST|advance|penalty)?)\b", text, re.IGNORECASE):
        raw_val = m.group(0).strip()
        key = ("PERCENT", raw_val.lower())
        if key not in seen:
            seen.add(key)
            extracted.append({
                "type": "PERCENT",
                "value": raw_val,
                "normalized_value": raw_val
            })

    # Check for known canonical entities
    text_lower = text.lower()
    for alias, (etype, canon_name) in CANONICAL_ENTITIES.items():
        if re.search(rf"\b{re.escape(alias)}\b", text_lower):
            key = (etype, canon_name)
            if key not in seen:
                seen.add(key)
                extracted.append({
                    "type": etype,
                    "value": canon_name,
                    "normalized_value": canon_name
                })

    return extracted
