import io
from datetime import datetime
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

def generate_markdown_report(
    case_title: str,
    documents: List[Dict[str, Any]],
    messages: List[Dict[str, Any]],
    conflicts: List[Dict[str, Any]],
    notes: List[Dict[str, Any]]
) -> str:
    md = []
    md.append(f"# Document Investigation Report: {case_title}")
    md.append(f"**Generated:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    md.append("")
    
    # Executive Key Findings
    md.append("## 1. Executive Key Findings & Unresolved Conflicts")
    if conflicts:
        for c in conflicts:
            md.append(f"- **{c.get('topic', 'Discrepancy')}** [{c.get('severity', 'HIGH')} SEVERITY]: {c.get('explanation')}")
            md.append(f"  - Side A ({c.get('side_a_doc')}): `{c.get('side_a_value')}`")
            md.append(f"  - Side B ({c.get('side_b_doc')}): `{c.get('side_b_value')}`")
    else:
        md.append("No active contradictions detected across analyzed documents.")
    md.append("")

    # Evidence Corpus & Trust Scores
    md.append("## 2. Evidence Corpus & Document Trust Assessment")
    md.append("| Document Name | Type | Trust Score | OCR / Fidelity | Authority |")
    md.append("| :--- | :--- | :--- | :--- | :--- |")
    for d in documents:
        md.append(f"| {d.get('filename')} | {d.get('doc_type')} | {d.get('reliability_score', 0.8)*100:.0f}% | {d.get('ocr_quality', 1.0)*100:.0f}% | {d.get('authority_level', 0.5)*100:.0f}% |")
    md.append("")

    # Q&A Investigation Log
    md.append("## 3. Grounded Q&A Investigation Log")
    for idx, m in enumerate(messages, 1):
        md.append(f"### Inquiry #{idx}: {m.get('question')}")
        md.append(f"**Confidence:** {m.get('confidence_band')} ({m.get('confidence', 0)*100:.0f}%) | **Verified Claims:** {m.get('verified_claims_count', 0)}/{m.get('total_claims_count', 0)}")
        md.append("")
        md.append(f"> {m.get('answer')}")
        md.append("")
        citations = m.get("citations", [])
        if citations:
            md.append("**Citations:**")
            for cit in citations:
                md.append(f"- `[{cit.get('citation_label', 'Ref')}]` {cit.get('doc_name')}, Page {cit.get('page')}: \"{cit.get('quote')}\"")
        md.append("")

    # Evidence Board Notes
    if notes:
        md.append("## 4. Investigator Notes & Evidence Board")
        for n in notes:
            pin_badge = "📌 [PINNED] " if n.get("pinned") else ""
            md.append(f"- {pin_badge}**[{n.get('topic', 'General')}]** {n.get('text')}")
        md.append("")

    return "\n".join(md)

def generate_pdf_report(
    case_title: str,
    documents: List[Dict[str, Any]],
    messages: List[Dict[str, Any]],
    conflicts: List[Dict[str, Any]],
    notes: List[Dict[str, Any]]
) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50

    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, f"DOCUMENT INVESTIGATION REPORT")
    y -= 25
    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"Case: {case_title} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    y -= 10
    c.line(50, y, width - 50, y)
    y -= 25

    # Key Findings
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "1. KEY FINDINGS & CONFLICTS DETECTED")
    y -= 20
    c.setFont("Helvetica", 9)
    for conf in conflicts[:4]:
        c.drawString(60, y, f"• [{conf.get('severity')}] {conf.get('topic')}: {conf.get('explanation')[:85]}")
        y -= 15
        if y < 60:
            c.showPage()
            y = height - 50

    y -= 10
    # Document Trust
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "2. EVIDENCE CORPUS & TRUST SCORES")
    y -= 20
    c.setFont("Helvetica", 9)
    for doc in documents[:6]:
        c.drawString(60, y, f"• {doc.get('filename')} ({doc.get('doc_type')}) - Trust: {doc.get('reliability_score', 0.8)*100:.0f}%")
        y -= 15
        if y < 60:
            c.showPage()
            y = height - 50

    y -= 10
    # Investigation Log
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "3. INVESTIGATION INQUIRIES & GROUNDED ANSWERS")
    y -= 20
    c.setFont("Helvetica", 9)
    for m in messages[:4]:
        c.setFont("Helvetica-Bold", 9)
        c.drawString(60, y, f"Q: {m.get('question')[:80]}")
        y -= 14
        c.setFont("Helvetica", 8)
        ans_preview = m.get('answer', '')[:100].replace('\n', ' ')
        c.drawString(70, y, f"A ({m.get('confidence_band')}): {ans_preview}...")
        y -= 18
        if y < 60:
            c.showPage()
            y = height - 50

    c.save()
    buffer.seek(0)
    return buffer.getvalue()
