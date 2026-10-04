import logging
from typing import List, Dict, Any
from app.llm.client import llm_client
from app.llm.prompts import FOLLOWUP_QUESTIONS_PROMPT
from app.llm.schemas import FollowUpQuestionsOutput

logger = logging.getLogger("investigator.followups")

def generate_followup_questions(
    question: str,
    answer: str,
    conflicts: List[Dict[str, Any]] = None,
    missing_info: List[str] = None
) -> List[str]:
    """
    Generates 3 contextual investigative follow-up questions.
    """
    conflicts_summary = "; ".join([c.get("explanation", "") for c in (conflicts or [])]) or "None"
    missing_info_summary = ", ".join(missing_info or []) or "None"

    user_prompt = FOLLOWUP_QUESTIONS_PROMPT.format(
        question=question,
        answer=answer[:500],
        conflicts_summary=conflicts_summary,
        missing_info_summary=missing_info_summary
    )

    try:
        output: FollowUpQuestionsOutput = llm_client.call_structured(
            system_prompt="You are a legal and investigative advisor suggesting next steps.",
            user_prompt=user_prompt,
            schema_cls=FollowUpQuestionsOutput,
            temperature=0.3
        )
        return output.follow_up_questions[:3]
    except Exception as e:
        logger.warning(f"Follow-up generation failed: {e}")
        return [
            "What do the signed contract terms state regarding late penalties?",
            "How does the invoice advance compare with the bank payment receipt?",
            "Are there any warranty annexures or formal delivery inspection certificates?"
        ]
