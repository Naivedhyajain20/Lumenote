import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, txt, md, jpg, png, etc.
    sha256 = Column(String(64), unique=True, index=True, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    page_count = Column(Integer, default=1)
    doc_date = Column(String(50), nullable=True)
    doc_type = Column(String(50), default="other")  # contract, invoice, email, meeting_notes, receipt, other
    authority_level = Column(Float, default=0.5)    # 1.0 contract/signed, 0.8 invoice, 0.6 email, 0.4 notes
    ocr_quality = Column(Float, default=1.0)        # 1.0 for native text, else mean OCR confidence
    completeness = Column(Float, default=1.0)       # 0 if missing/truncated
    recency = Column(Float, default=1.0)            # newer documents of same type score higher
    reliability_score = Column(Float, default=0.8)  # computed composite trust score
    status = Column(String(50), default="uploading") # uploading, extracting, indexing, ready, failed
    error_message = Column(Text, nullable=True)
    file_path = Column(String(512), nullable=False)

    chunks = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="document", cascade="all, delete-orphan")
    facts = relationship("Fact", back_populates="document", cascade="all, delete-orphan")


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    page = Column(Integer, nullable=False, index=True)
    page_end = Column(Integer, nullable=True)
    section_title = Column(String(255), default="")
    text = Column(Text, nullable=False)
    char_start = Column(Integer, default=0)
    char_end = Column(Integer, default=0)
    bbox_json = Column(Text, default="[]")  # List of bounding box objects
    token_count = Column(Integer, default=0)
    is_ocr = Column(Boolean, default=False)
    chroma_id = Column(String(64), index=True, nullable=True)

    document = relationship("Document", back_populates="chunks")


class Entity(Base):
    __tablename__ = "entities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(36), ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(50), nullable=False, index=True)  # PERSON, ORG, DATE, AMOUNT, PERCENT, PLACE
    value = Column(String(255), nullable=False)
    normalized_value = Column(String(255), nullable=False, index=True)

    document = relationship("Document", back_populates="entities")


class Fact(Base):
    __tablename__ = "facts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(36), ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True)
    subject = Column(String(255), nullable=False, index=True)
    predicate = Column(String(255), nullable=False, index=True)
    value = Column(Text, nullable=False)
    unit = Column(String(50), nullable=True)
    normalized_value = Column(String(255), nullable=False, index=True)
    as_of_date = Column(String(50), nullable=True)

    document = relationship("Document", back_populates="facts")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(64), default="default", index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    confidence = Column(Float, default=0.0)
    confidence_band = Column(String(20), default="LOW")  # HIGH, MEDIUM, LOW
    confidence_breakdown_json = Column(Text, default="{}")
    abstained = Column(Boolean, default=False)
    missing_info_json = Column(Text, default="[]")
    follow_ups_json = Column(Text, default="[]")
    verified_claims_count = Column(Integer, default=0)
    total_claims_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    citations = relationship("Citation", back_populates="message", cascade="all, delete-orphan")
    conflicts = relationship("Conflict", back_populates="message", cascade="all, delete-orphan")


class Citation(Base):
    __tablename__ = "citations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_id = Column(String(36), ForeignKey("chunks.id", ondelete="CASCADE"), nullable=False)
    citation_label = Column(String(20), default="")  # e.g. C1, C2
    quote = Column(Text, nullable=False)
    supports_claim = Column(Boolean, default=True)
    page = Column(Integer, default=1)
    doc_name = Column(String(255), default="")
    bbox_json = Column(Text, default="[]")

    message = relationship("Message", back_populates="citations")


class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True, index=True)
    topic = Column(String(255), nullable=False, index=True)
    side_a_doc = Column(String(255), nullable=False)
    side_a_chunk = Column(String(36), nullable=True)
    side_a_value = Column(Text, nullable=False)
    side_b_doc = Column(String(255), nullable=False)
    side_b_chunk = Column(String(36), nullable=True)
    side_b_value = Column(Text, nullable=False)
    severity = Column(String(20), default="MEDIUM")  # HIGH, MEDIUM, LOW
    explanation = Column(Text, nullable=False)
    resolution_suggestion = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    message = relationship("Message", back_populates="conflicts")


class Note(Base):
    __tablename__ = "notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    text = Column(Text, nullable=False)
    topic = Column(String(100), default="General")
    pinned = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ts = Column(DateTime, default=datetime.utcnow, index=True)
    event = Column(String(100), nullable=False)
    payload_json = Column(Text, default="{}")
    model = Column(String(100), nullable=True)
    prompt_version = Column(String(50), default="1.0")
