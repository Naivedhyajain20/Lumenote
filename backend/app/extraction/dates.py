import re
from datetime import datetime
from typing import Optional

MONTHS = {
    "jan": "01", "january": "01",
    "feb": "02", "february": "02",
    "mar": "03", "march": "03",
    "apr": "04", "april": "04",
    "may": "05",
    "jun": "06", "june": "06",
    "jul": "07", "july": "07",
    "aug": "08", "august": "08",
    "sep": "09", "september": "09",
    "oct": "10", "october": "10",
    "nov": "11", "november": "11",
    "dec": "12", "december": "12"
}

def normalize_date(text: str) -> Optional[str]:
    """
    Normalizes dates from text into YYYY-MM-DD:
    - '10 Jan 2026' -> '2026-01-10'
    - '20th Feb 2026' -> '2026-02-20'
    - '15-02-2026' -> '2026-02-15'
    - '2026-02-15' -> '2026-02-15'
    """
    cleaned = text.strip().lower()
    
    # Check ISO format YYYY-MM-DD
    iso_match = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", cleaned)
    if iso_match:
        return f"{iso_match.group(1)}-{iso_match.group(2)}-{iso_match.group(3)}"
        
    # Check DD-MM-YYYY or DD/MM/YYYY
    slash_match = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b", cleaned)
    if slash_match:
        d = int(slash_match.group(1))
        m = int(slash_match.group(2))
        y = int(slash_match.group(3))
        return f"{y:04d}-{m:02d}-{d:02d}"
        
    # Check '10 Jan 2026', '20th Feb 2026', '15 February 2026'
    word_match = re.search(r"\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\s+(\d{4})\b", cleaned)
    if word_match:
        d = int(word_match.group(1))
        month_word = word_match.group(2)
        y = int(word_match.group(3))
        m_str = MONTHS.get(month_word[:3])
        if m_str:
            return f"{y:04d}-{m_str}-{d:02d}"

    return None
