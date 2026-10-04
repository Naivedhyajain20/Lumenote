import logging
from typing import List, Dict, Any, Tuple
from app.llm.client import llm_client
from app.llm.prompts import GROUNDED_ANSWER_SYSTEM_PROMPT, GROUNDED_ANSWER_USER_TEMPLATE
from app.llm.schemas import GroundedAnswerOutput

logger = logging.getLogger("investigator.answer")

def generate_grounded_answer(
    question: str,
    chunks: List[Dict[str, Any]]
) -> Tuple[GroundedAnswerOutput, List[Dict[str, Any]]]:
    """
    Executes Section 7.5 grounded answer generation.
    Labels each chunk with [C1], [C2], ... and requires citation IDs in the answer.
    Returns (GroundedAnswerOutput, labeled_chunks).
    """
    labeled_chunks = []
    passages_lines = []

    for idx, c in enumerate(chunks):
        cid = f"C{idx + 1}"
        chunk_copy = dict(c)
        chunk_copy["label"] = cid
        labeled_chunks.append(chunk_copy)

        doc_name = c.get("doc_name", "Document")
        page = c.get("page", 1)
        passages_lines.append(f"[{cid}] (Document: {doc_name} | Page: {page}):\n{c['text']}")

    passages_text = "\n\n".join(passages_lines)
    user_prompt = GROUNDED_ANSWER_USER_TEMPLATE.format(
        passages_text=passages_text,
        question=question
    )

    output: GroundedAnswerOutput = llm_client.call_structured(
        system_prompt=GROUNDED_ANSWER_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        schema_cls=GroundedAnswerOutput,
        temperature=0.1
    )

    return output, labeled_chunks
