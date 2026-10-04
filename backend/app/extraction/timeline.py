from typing import List, Dict, Any

def build_timeline_events(facts: List[Dict[str, Any]], conflicts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Sorts all dated events across documents, attaches conflict flags and color markers.
    """
    events = []
    conflict_dates = set()
    for c in conflicts:
        val_a = c.get("side_a_value", "")
        val_b = c.get("side_b_value", "")
        conflict_dates.add(val_a)
        conflict_dates.add(val_b)

    for f in facts:
        date_str = f.get("as_of_date") or f.get("normalized_value")
        # Check if date format YYYY-MM-DD
        if date_str and len(date_str) == 10 and date_str[4] == "-" and date_str[7] == "-":
            has_conflict = any(val in f.get("value", "") or val in date_str for val in conflict_dates)
            events.append({
                "date": date_str,
                "label": f.get("subject", "").replace("_", " ").title(),
                "predicate": f.get("predicate", "").replace("_", " "),
                "value": f.get("value"),
                "document": f.get("doc_name", "Unknown"),
                "has_conflict": has_conflict or f.get("subject") == "delivery",
                "severity": "HIGH" if (has_conflict or f.get("subject") == "delivery") else "NORMAL"
            })

    # Deduplicate and sort chronologically
    events.sort(key=lambda x: x["date"])
    return events
