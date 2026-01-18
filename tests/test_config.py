"""
Unit tests for configuration and Pydantic settings.
"""

from agent import InterviewConfig


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
