"""
Unit tests for session state and final report aggregation.
"""

from agent import EvaluationEvent, InterviewConfig, InterviewSessionState
from agent.models import QuestionStartedEvent
from rag.models import InterviewCard, RubricCriterion


def test_session_state_progression_and_report() -> None:
    """Verify session progression, question index increment, and final report generation."""
    config = InterviewConfig(
        interview_type="behavioral",
        level="mid",
        question_count=2,
        target_role="Software Engineer",
    )

    state = InterviewSessionState(session_id="test_room", config=config)
    assert not state.is_complete()

    card1 = InterviewCard(
        id="b1",
        category="behavioral",
        title="Ownership",
        levels=["mid"],
        question="Tell me about ownership?",
        tags=["ownership"],
        rubric=[RubricCriterion(name="ownership", weight=1.0, description="desc")],
    )

    card2 = InterviewCard(
        id="b2",
        category="behavioral",
        title="Conflict",
        levels=["mid"],
        question="Tell me about conflict?",
        tags=["conflict"],
        rubric=[RubricCriterion(name="conflict", weight=1.0, description="desc")],
    )

    # Turn 1
    state.advance_question(card1)
    eval1 = EvaluationEvent(
        session_id="test_room",
        question_id="b1",
        question_number=1,
        overall_score=8.0,
        criteria=[],
        strengths=["Clear ownership"],
        improvements=["Add quantifiable impact"],
        evaluation_status="success",
        retrieval_ms=15.0,
        evaluation_ms=450.0,
    )
    state.record_turn_evaluation("Candidate answer 1", eval1, retrieval_ms=15.0, evaluation_ms=450.0)

    assert not state.is_complete()

    # Turn 2
    state.advance_question(card2)
    eval2 = EvaluationEvent(
        session_id="test_room",
        question_id="b2",
        question_number=2,
        overall_score=6.0,
        criteria=[],
        strengths=["Good communication"],
        improvements=["Listen actively"],
        evaluation_status="success",
        retrieval_ms=20.0,
        evaluation_ms=500.0,
    )
    state.record_turn_evaluation("Candidate answer 2", eval2, retrieval_ms=20.0, evaluation_ms=500.0)

    assert state.is_complete()

    report = state.build_final_report()
    same_report = state.build_final_report()
    assert report.questions_answered == 2
    assert report.session_average == 7.0
    assert len(report.question_breakdown) == 2
    assert "Clear ownership" in report.strengths
    assert state.has_ended
    assert same_report.duration_seconds == report.duration_seconds


def test_question_started_event_contract() -> None:
    """The frontend receives enough structured data to render question progress."""
    event = QuestionStartedEvent(
        session_id="test_room",
        question_id="b1",
        question_number=1,
        question_count=3,
        question_title="Ownership",
        question_text="Tell me about a time you took ownership.",
    )

    assert event.type == "question_started"
    assert event.question_number == 1
    assert event.question_count == 3
    assert event.question_text.startswith("Tell me")
