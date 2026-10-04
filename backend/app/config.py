import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Avoid network timeouts when models are already cached
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    LLM_PROVIDER: str = "gemini"  # gemini | openai | anthropic | ollama | mock
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-2.5-flash"
    
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    RERANK_MODEL: str = "BAAI/bge-reranker-base"
    OCR_LANGS: str = "eng+hin"
    
    MAX_FILE_MB: int = 25
    ABSTAIN_THRESHOLD: float = 0.25
    TOP_K_RETRIEVE: int = 20
    TOP_K_FINAL: int = 8
    
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/data/app.db"
    CHROMA_PERSIST_DIR: str = str(BASE_DIR / "data" / "chroma")
    UPLOAD_DIR: str = str(BASE_DIR / "data" / "uploads")
    DEMO_DATA_DIR: str = str(BASE_DIR / "demo_data")

    class Config:
        env_file = [str(BASE_DIR / ".env"), str(BASE_DIR / "backend" / ".env")]
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Ensure required directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
os.makedirs(os.path.dirname(settings.DATABASE_URL.replace("sqlite:///", "")), exist_ok=True)
