"""
Unit tests for configuration and Pydantic settings.
"""

from agent import InterviewConfig
from agent.models import fit_config_to_available_cards
from rag import CardIngestor


def test_interview_config_canonicalization() -> None:
    """Verify canonicalization of interview configuration parameters."""
    config = InterviewConfig.model_validate({
        "interview_type": "behavioral",
        "level": "mid",
        "question_count": 5,
        "target_role": " Backend Engineer ",
    })

    assert config.interview_type == "behavioral"
    assert config.level == "mid"
    assert config.question_count == 5
    assert config.target_role == " Backend Engineer "


def test_interview_config_invalid_fallback() -> None:
    """Verify fallback when invalid strings or counts are provided."""
    config = InterviewConfig.model_validate({
        "interview_type": "invalid_mode",
        "level": "ultra_senior",
        "question_count": 99,
    })

    assert config.interview_type == "behavioral"
    assert config.level == "mid"
    assert config.question_count == 3


def test_question_count_is_limited_to_matching_cards() -> None:
    """A session cannot request more questions than its track and level provide."""
    config = InterviewConfig(
        interview_type="system_design",
        level="intern",
        question_count=5,
    )
    cards = list(CardIngestor(knowledge_dir="./knowledge").load_cards().values())

    adjusted, available_count = fit_config_to_available_cards(config, cards)

    assert available_count == 1
    assert adjusted.question_count == 1
