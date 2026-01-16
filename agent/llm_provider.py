"""
InterviewPilot - LLM Provider Factory

Centralized provider factory for Groq LLM integration.
"""

import logging
from typing import Any

from livekit.plugins import groq
from openai import AsyncOpenAI

from .config import Settings

logger = logging.getLogger(__name__)


def create_interviewer_llm(settings: Settings) -> groq.LLM:
    """
    Create LiveKit Groq LLM instance for realtime voice conversation.

    Uses Groq's ultra-low-latency inference engine with model 'openai/gpt-oss-120b'.
    Temperature is set to 0.4 for controlled, natural conversational turn-taking.
    """
    kwargs: dict[str, Any] = {"model": settings.groq_llm_model, "temperature": 0.4}
    if settings.groq_api_key:
        kwargs["api_key"] = settings.groq_api_key

    return groq.LLM(**kwargs)


def get_evaluator_client(settings: Settings) -> AsyncOpenAI:
    """
    Create AsyncOpenAI-compatible client pointing to Groq's API endpoint.

    Used by ResponseEvaluator for strict structured JSON evaluation.
    Groq API Base URL: https://api.groq.com/openai/v1
    """
    api_key = settings.groq_api_key or "mock-groq-key"
    return AsyncOpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=api_key,
    )
