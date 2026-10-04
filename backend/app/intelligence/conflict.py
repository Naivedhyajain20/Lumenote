import logging
from typing import List, Dict, Any
from app.llm.client import llm_client
from app.llm.prompts import CONFLICT_DETECTION_SYSTEM_PROMPT, CONFLICT_DETECTION_USER_TEMPLATE
from app.llm.schemas import ConflictDetectionOutput
from app.intelligence.crosscheck import find_deterministic_conflicts

logger = logging.getLogger("investigator.conflict")

def detect_conflicts(
    chunks: List[Dict[str, Any]],
    extracted_facts: List[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Executes dual-path conflict detection (Section 7.7):
    Path A: LLM Contradiction Analysis
    Path B: Deterministic Fact Cross-Check
    Merges results so no conflict is overlooked.
    """
    all_conflicts = []
    seen_topics = set()

    # Path B: Deterministic Fact Cross-Check (fast, exact numeric & date validation)
    if extracted_facts:
        deterministic_conflicts = find_deterministic_conflicts(extracted_facts)
        for dc in deterministic_conflicts:
            topic_key = dc["topic"].lower()
            seen_topics.add(topic_key)
            all_conflicts.append(dc)

    # Path A: LLM Contradiction Analysis
    passages_text_parts = []
    for idx, c in enumerate(chunks):
        cid = f"C{idx + 1}"
        doc_name = c.get("doc_name", "Document")
        passages_text_parts.append(f"[{cid}] ({doc_name}, Page {c.get('page', 1)}):\n{c['text']}")

    passages_text = "\n\n".join(passages_text_parts)
    user_prompt = CONFLICT_DETECTION_USER_TEMPLATE.format(passages_text=passages_text)

    try:
        llm_out: ConflictDetectionOutput = llm_client.call_structured(
            system_prompt=CONFLICT_DETECTION_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            schema_cls=ConflictDetectionOutput,
            temperature=0.1
        )

        for topic_obj in llm_out.topics:
            if topic_obj.status.upper() == "CONTRADICT":
                claims = topic_obj.claims
                side_a = claims[0] if len(claims) > 0 else None
                side_b = claims[1] if len(claims) > 1 else None

                topic_key = topic_obj.topic.lower()
                # Don't duplicate if already detected identically in Path B
                if not any(t in topic_key or topic_key in t for t in seen_topics):
                    seen_topics.add(topic_key)
                    all_conflicts.append({
                        "topic": topic_obj.topic,
                        "side_a_doc": side_a.doc if side_a else "Source A",
                        "side_a_chunk": side_a.chunk if side_a else "",
                        "side_a_value": side_a.value if side_a else "",
                        "side_b_doc": side_b.doc if side_b else "Source B",
                        "side_b_chunk": side_b.chunk if side_b else "",
                        "side_b_value": side_b.value if side_b else "",
                        "severity": topic_obj.severity.upper() if topic_obj.severity in ["HIGH", "MEDIUM", "LOW"] else "HIGH",
                        "explanation": topic_obj.explanation,
                        "resolution_suggestion": "Review signed contract vs. subsequent email representations."
                    })
    except Exception as e:
        logger.warning(f"Path A LLM conflict detection failed: {e}")

    return all_conflicts
