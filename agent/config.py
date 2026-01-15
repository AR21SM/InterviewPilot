"""
InterviewPilot - Configuration Management

Centralized configuration using Pydantic Settings for Groq (LLM, STT, TTS) and local BGE embeddings.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # LiveKit Configuration
    livekit_url: str = Field(default="", description="LiveKit server WebSocket URL")
    livekit_api_key: str = Field(default="", description="LiveKit API key")
    livekit_api_secret: str = Field(default="", description="LiveKit API secret")

    # Groq Configuration (LLM, STT & TTS)
    groq_api_key: str = Field(default="", description="Groq API key")
    groq_llm_model: str = Field(
        default="openai/gpt-oss-120b",
        description="Groq model name for interviewer conversation and structured evaluation",
    )
    groq_stt_model: str = Field(
        default="whisper-large-v3-turbo",
        description="Groq Whisper model for speech-to-text",
    )
    groq_tts_model: str = Field(
        default="canopylabs/orpheus-v1-english",
        description="Groq Orpheus model for text-to-speech",
    )
    groq_tts_voice: str = Field(
        default="autumn",
        description="Groq Orpheus voice name",
    )

    # Local RAG Embedding Configuration
    embedding_model: str = Field(
        default="BAAI/bge-small-en-v1.5",
        description="Local HuggingFace embedding model name",
    )

    # RAG Persistence
    chroma_persist_dir: str = Field(
        default="./data/chroma",
        description="ChromaDB persistence directory",
    )

    # Application Settings
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(default="INFO")
    debug: bool = Field(default=False)


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
