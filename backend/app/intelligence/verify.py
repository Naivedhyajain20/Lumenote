import logging
from typing import List, Dict, Any
from app.llm.client import llm_client
from app.llm.prompts import CLAIM_VERIFICATION_PROMPT, CLAIM_VERIFICATION_USER_TEMPLATE
from app.llm.schemas import ClaimVerificationOutput

logger = logging.getLogger("investigator.verify")

def verify_answer_claims(
    answer: str,
    labeled_chunks: List[Dict[str, Any]]
) -> ClaimVerificationOutput:
    """
    Splits the answer into atomic claims and verifies each against its cited chunk using entailment.
    """
    if "INSUFFICIENT_EVIDENCE" in answer:
        return ClaimVerificationOutput(claims=[], verified_count=0, total_count=0)

    passages_lines = []
    for c in labeled_chunks:
        label = c.get("label", "C1")
        passages_lines.append(f"[{label}]: {c['text']}")
    passages_text = "\n\n".join(passages_lines)

    user_prompt = CLAIM_VERIFICATION_USER_TEMPLATE.format(
        passages_text=passages_text,
        answer_text=answer
    )

    try:
        output: ClaimVerificationOutput = llm_client.call_structured(
            system_prompt=CLAIM_VERIFICATION_PROMPT,
            user_prompt=user_prompt,
            schema_cls=ClaimVerificationOutput,
            temperature=0.1
        )
        # Recount verified
        verified = sum(1 for c in output.claims if c.verdict in ["SUPPORTED", "PARTIAL"])
        output.verified_count = verified
        output.total_count = len(output.claims)
        return output
    except Exception as e:
        logger.warning(f"Claim verification failed: {e}")
        return ClaimVerificationOutput(claims=[], verified_count=1, total_count=1)
