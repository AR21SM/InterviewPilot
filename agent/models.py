"""
InterviewPilot - Agent Pydantic Models

Data schemas for interview configuration, structured response evaluation,
and real-time event payloads streamed over LiveKit data channels.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

from rag.models import ExperienceLevel, InterviewCard, InterviewCategory


class InterviewConfig(BaseModel):
    """Validated interview configuration parameters."""

    interview_type: InterviewCategory = Field(default="behavioral")
    level: ExperienceLevel = Field(default="mid")
    question_count: int = Field(default=3, ge=1, le=10)
    target_role: str | None = Field(default=None, max_length=100)
    focus_topic: str | None = Field(default=None, max_length=100)

    @field_validator("interview_type", mode="before")
    @classmethod
    def canonicalize_type(cls, v: Any) -> str:
        """Ensure lowercase canonical value for interview_type."""
        if isinstance(v, str):
            v_lower = v.lower().strip()
            if v_lower in ("behavioral", "technical", "system_design"):
                return v_lower
        return "behavioral"

    @field_validator("level", mode="before")
    @classmethod
    def canonicalize_level(cls, v: Any) -> str:
        """Ensure lowercase canonical value for level."""
        if isinstance(v, str):
            v_lower = v.lower().strip()
            if v_lower in ("intern", "junior", "mid"):
                return v_lower
        return "mid"

    @field_validator("question_count", mode="before")
    @classmethod
    def sanitize_question_count(cls, v: Any) -> int:
        """Sanitize question_count so invalid inputs fall back safely to 3."""
        if isinstance(v, int) and 1 <= v <= 10:
            return v
        return 3


def fit_config_to_available_cards(
    config: InterviewConfig,
    cards: list[InterviewCard],
) -> tuple[InterviewConfig, int]:
    """Limit the requested question count to matching cards in the knowledge base."""
    available_count = sum(
        1
        for card in cards
        if card.category == config.interview_type and config.level in card.levels
    )
    if available_count == 0:
        raise ValueError(
            f"No interview cards are available for {config.interview_type}/{config.level}."
        )
    if config.question_count <= available_count:
        return config, available_count
    return config.model_copy(update={"question_count": available_count}), available_count


class CriterionEvaluation(BaseModel):
    """Evaluation result for a single rubric criterion."""

    criterion: str = Field(..., description="Rubric criterion name")
    score: int = Field(..., ge=1, le=5, description="Criterion score between 1 and 5")
    evidence: str = Field(..., description="Concrete quote or evidence snippet from candidate transcript")
    improvement: str | None = Field(default=None, description="Actionable suggestion if score < 5")


class AnswerEvaluation(BaseModel):
    """Structured LLM output for evaluating a candidate's answer."""

    criterion_scores: list[CriterionEvaluation] = Field(..., description="Per-criterion evaluations")
    strengths: list[str] = Field(..., max_length=2, description="Top 1-2 concise strengths")
    improvements: list[str] = Field(..., max_length=2, description="Top 1-2 concise improvement areas")
    follow_up_focus: str | None = Field(default=None, description="Weakest criterion or focus for follow-up")
    evaluation_status: Literal["success", "failed"] = Field(default="success")


class EvaluationEvent(BaseModel):
    """Payload streamed over LiveKit data channel to the client after each answer evaluation."""

    version: int = Field(default=1)
    type: Literal["answer_evaluated"] = Field(default="answer_evaluated")
    session_id: str
    question_id: str
    question_number: int
    overall_score: float = Field(..., description="Normalized 1-10 overall score calculated deterministically")
    criteria: list[CriterionEvaluation]
    strengths: list[str]
    improvements: list[str]
    follow_up_focus: str | None = None
    evaluation_status: str = "success"
    retrieval_ms: float = 0.0
    evaluation_ms: float = 0.0


class QuestionStartedEvent(BaseModel):
    """Payload streamed when the agent begins a new main interview question."""

    version: int = Field(default=1)
    type: Literal["question_started"] = Field(default="question_started")
    session_id: str
    question_id: str
    question_number: int
    question_count: int
    question_title: str
    question_text: str


class QuestionReportEntry(BaseModel):
    """Question summary entry in final report."""

    question_number: int
    question_id: str
    question_title: str
    question_text: str
    candidate_transcript: str
    overall_score: float
    strengths: list[str]
    improvements: list[str]


class FinalReportEvent(BaseModel):
    """Payload streamed over LiveKit data channel when session ends."""

    version: int = Field(default=1)
    type: Literal["session_completed"] = Field(default="session_completed")
    session_id: str
    interview_type: str
    level: str
    target_role: str | None = None
    focus_topic: str | None = None
    duration_seconds: float
    questions_answered: int
    session_average: float
    strengths: list[str]
    top_improvements: list[str]
    question_breakdown: list[QuestionReportEntry]
    average_retrieval_ms: float = 0.0
    average_evaluation_ms: float = 0.0
