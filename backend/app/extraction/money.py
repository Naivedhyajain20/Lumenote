import re
from typing import Optional, Tuple

def normalize_money(text: str) -> Optional[Tuple[int, str]]:
    """
    Normalizes Indian and international currency formats:
    - 'INR 5,00,000' -> (500000, 'INR')
    - 'Rs 2,50,000' -> (250000, 'INR')
    - 'Rs. 4,50,000' -> (450000, 'INR')
    - '5,90,000' -> (590000, 'INR')
    """
    cleaned = text.strip()
    # Check for currency symbols / prefixes
    currency = "INR" if ("inr" in cleaned.lower() or "rs" in cleaned.lower() or "₹" in cleaned) else "INR"
    
    # Extract digits and commas
    match = re.search(r"(\d[\d,]*\d|\d+)", cleaned)
    if not match:
        return None
        
    num_str = match.group(1).replace(",", "")
    try:
        val = int(float(num_str))
        return val, currency
    except ValueError:
        return None

def format_money_str(amount: int, currency: str = "INR") -> str:
    return f"{amount} {currency}"
