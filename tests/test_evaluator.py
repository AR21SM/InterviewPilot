"""
Unit tests for structured evaluation and weighted score calculations.
"""

from unittest.mock import MagicMock

import pytest
from openai import AsyncOpenAI

from agent.evaluator import ResponseEvaluator
from agent.models import CriterionEvaluation
from rag.models import InterviewCard, RubricCriterion


def test_deterministic_weighted_score_calculation() -> None:
    """Verify that rubric scores (1-5 scale) map deterministically to 1-10 overall score using weights."""
    card = InterviewCard(
        id="test_card",
        category="behavioral",
        title="Test Card",
        levels=["mid"],
        question="Test Question?",
        tags=["test"],
        rubric=[
            RubricCriterion(name="ownership", weight=0.6, description="Ownership"),
            RubricCriterion(name="impact", weight=0.4, description="Impact"),
        ],
    )

    # Case 1: Perfect 5/5 scores -> 10.0 / 10
    evals_perfect = [
        CriterionEvaluation(criterion="ownership", score=5, evidence="Perfect ownership snippet"),
        CriterionEvaluation(criterion="impact", score=5, evidence="Perfect impact snippet"),
    ]
    score_perfect = ResponseEvaluator.calculate_weighted_score(card, evals_perfect)
    assert score_perfect == 10.0

    # Case 2: Mixed scores (ownership: 3/5, impact: 5/5)
    # fraction: 3/5*0.6 + 5/5*0.4 = 0.36 + 0.40 = 0.76 -> 7.6 / 10
    evals_mixed = [
        CriterionEvaluation(criterion="ownership", score=3, evidence="Some ownership"),
        CriterionEvaluation(criterion="impact", score=5, evidence="Great impact"),
    ]
    score_mixed = ResponseEvaluator.calculate_weighted_score(card, evals_mixed)
    assert score_mixed == 7.6

    # Case 3: Minimum 1/5 scores -> 2.0 / 10
    # fraction: 1/5*0.6 + 1/5*0.4 = 0.2 -> 2.0 / 10
    evals_min = [
        CriterionEvaluation(criterion="ownership", score=1, evidence="No ownership"),
        CriterionEvaluation(criterion="impact", score=1, evidence="No impact"),
    ]
    score_min = ResponseEvaluator.calculate_weighted_score(card, evals_min)
    assert score_min == 2.0


def test_missing_criterion_penalized_in_weighted_score() -> None:
    """Verify that if LLM omits a criterion, it receives minimum score 1/5 and the full rubric denominator is enforced."""
    card = InterviewCard(
        id="test_card",
        category="behavioral",
        title="Test Card",
        levels=["mid"],
        question="Test Question?",
        tags=["test"],
        rubric=[
            RubricCriterion(name="ownership", weight=0.5, description="Ownership"),
            RubricCriterion(name="impact", weight=0.5, description="Impact"),
        ],
    )

    # LLM returns ONLY ownership: 5/5, omitting impact completely
    # Ownership: 5/5*0.5 = 0.5. Missing Impact: penalized as 1/5*0.5 = 0.1.
    # Total fraction: 0.6 -> 6.0 / 10 (NOT 10.0!)
    evals_partial = [
        CriterionEvaluation(criterion="ownership", score=5, evidence="Great ownership"),
    ]
    score = ResponseEvaluator.calculate_weighted_score(card, evals_partial)
    assert score == 6.0


@pytest.mark.asyncio
async def test_empty_transcript_failure_status() -> None:
    """Verify that empty candidate responses return evaluation_status = 'failed' without fake scores."""
    card = InterviewCard(
        id="test_card",
        category="behavioral",
        title="Test Card",
        levels=["mid"],
        question="Test Question?",
        tags=["test"],
        rubric=[RubricCriterion(name="c1", weight=1.0, description="d1")],
    )

    mock_client = MagicMock(spec=AsyncOpenAI)
    evaluator = ResponseEvaluator(client=mock_client)
    res = await evaluator.evaluate_response(
        session_id="s1",
        question_number=1,
        card=card,
        candidate_transcript="   ",
    )

    assert res.evaluation_status == "failed"
    assert res.overall_score == 0.0
