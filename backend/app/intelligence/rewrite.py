import logging
from typing import Dict, Any, List
from app.llm.client import llm_client
from app.llm.prompts import QUERY_REWRITE_PROMPT, QUERY_REWRITE_USER_TEMPLATE
from app.llm.schemas import QueryRewriteOutput

logger = logging.getLogger("investigator.rewrite")

def rewrite_query(question: str, history: List[Dict[str, str]] = None) -> QueryRewriteOutput:
    """
    Expands conversational follow-ups into standalone questions and produces 2 alternative phrasings.
    """
    if history is None:
        history = []
        
    history_text = "\n".join([f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-3:]])
    if not history_text:
        history_text = "None (first turn)"

    user_prompt = QUERY_REWRITE_USER_TEMPLATE.format(
        history_text=history_text,
        question=question
    )

    try:
        output: QueryRewriteOutput = llm_client.call_structured(
            system_prompt=QUERY_REWRITE_PROMPT,
            user_prompt=user_prompt,
            schema_cls=QueryRewriteOutput,
            temperature=0.1
        )
        return output
    except Exception as e:
        logger.warning(f"Query rewrite failed: {e}")
        return QueryRewriteOutput(
            standalone_question=question,
            alternative_phrasings=[question + " details", question + " terms"]
        )
