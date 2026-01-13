"""
InterviewPilot - RAG Data Models

Typed models for structured interview cards, evaluation rubrics, and retrieval results.
"""

from typing import Literal

from pydantic import BaseModel, Field, field_validator

InterviewCategory = Literal["behavioral", "technical", "system_design"]
ExperienceLevel = Literal["intern", "junior", "mid"]


class RubricCriterion(BaseModel):
    """Single evaluation criterion with weight and description."""

    name: str = Field(..., description="Criterion identifier")
    weight: float = Field(..., ge=0.0, le=1.0, description="Criterion weight summing to 1.0")
    description: str = Field(..., description="Detailed description of what to look for")


class InterviewCard(BaseModel):
    """Structured interview question card with evaluation rubric."""

    id: str = Field(..., description="Unique card identifier")
    category: InterviewCategory = Field(..., description="Interview track category")
    title: str = Field(..., description="Short descriptive card title")
    levels: list[ExperienceLevel] = Field(default_factory=list, description="Target experience levels")
    question: str = Field(..., description="Exact interview question text")
    tags: list[str] = Field(default_factory=list, description="Topic and domain tags")
    rubric: list[RubricCriterion] = Field(..., description="Structured evaluation criteria")
    expected_signals: list[str] = Field(default_factory=list, description="Positive candidate signals")
    red_flags: list[str] = Field(default_factory=list, description="Negative or warning signals")
    follow_up_prompts: list[str] = Field(default_factory=list, description="Curated follow-up questions")

    @field_validator("rubric")

    @classmethod
    def validate_weights(cls, rubric: list[RubricCriterion]) -> list[RubricCriterion]:
        """Verify that rubric weights sum to approximately 1.0."""
        total = sum(c.weight for c in rubric)
        if not (0.95 <= total <= 1.05):
            raise ValueError(f"Rubric weights must sum to 1.0 (got {total:.2f})")
        return rubric

    def get_embedding_text(self) -> str:
        """Construct deterministic text representation for vector indexing."""
        tags_str = ", ".join(self.tags)
        signals_str = "; ".join(self.expected_signals)
        return (
            f"Title: {self.title}\n"
            f"Category: {self.category}\n"
            f"Question: {self.question}\n"
            f"Tags: {tags_str}\n"
            f"Expected Signals: {signals_str}"
        )


class RetrievedCard(BaseModel):
    """Card search result with score and rank metadata."""

    card: InterviewCard
    rank: int
    score: float = Field(..., description="Distance or similarity metric from vector search")
