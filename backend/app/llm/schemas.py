from typing import List, Optional
from pydantic import BaseModel, Field

class QueryRewriteOutput(BaseModel):
    standalone_question: str = Field(description="Self-contained question resolving previous context and pronouns")
    alternative_phrasings: List[str] = Field(default_factory=list, description="Alternative phrasing variations for retrieval")

class GroundedAnswerOutput(BaseModel):
    answer: str = Field(description="Answer citing passages with [C1], [C2] format, or INSUFFICIENT_EVIDENCE")
    used_chunks: List[str] = Field(default_factory=list, description="List of chunk IDs used like ['C1', 'C2']")
    missing_info: List[str] = Field(default_factory=list, description="List of missing information if evidence is insufficient")

class ClaimReference(BaseModel):
    chunk: str
    doc: str
    value: str
    quote: str

class TopicConflict(BaseModel):
    topic: str
    status: str = Field(description="AGREE | CONTRADICT | UNRELATED")
    claims: List[ClaimReference] = Field(default_factory=list)
    severity: str = Field(default="MEDIUM", description="HIGH | MEDIUM | LOW")
    explanation: str

class ConflictDetectionOutput(BaseModel):
    topics: List[TopicConflict] = Field(default_factory=list)

class AtomicClaimCheck(BaseModel):
    claim: str
    chunk_id: str
    verdict: str = Field(description="SUPPORTED | PARTIAL | UNSUPPORTED")
    reason: str

class ClaimVerificationOutput(BaseModel):
    claims: List[AtomicClaimCheck] = Field(default_factory=list)
    verified_count: int = 0
    total_count: int = 0

class ExtractedEntity(BaseModel):
    type: str  # PERSON, ORG, DATE, AMOUNT, PERCENT, PLACE
    value: str
    normalized_value: str

class ExtractedFact(BaseModel):
    subject: str
    predicate: str
    value: str
    unit: Optional[str] = None
    normalized_value: str
    as_of_date: Optional[str] = None

class DocumentMetadataExtraction(BaseModel):
    doc_type: str = Field(description="contract | invoice | email | meeting_notes | receipt | other")
    doc_date: Optional[str] = Field(default=None, description="YYYY-MM-DD or readable date")
    summary: str = Field(default="", description="Key takeaways or summary")
    entities: List[ExtractedEntity] = Field(default_factory=list)
    facts: List[ExtractedFact] = Field(default_factory=list)

class FollowUpQuestionsOutput(BaseModel):
    follow_up_questions: List[str] = Field(default_factory=list, description="Three relevant follow-up questions")
