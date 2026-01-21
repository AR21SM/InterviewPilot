"""
InterviewPilot - Interview Session State

In-memory state management for active voice interview sessions.
"""

import logging
from dataclasses import dataclass
from datetime import datetime

from rag.models import InterviewCard

from .models import (
    EvaluationEvent,
    FinalReportEvent,
    InterviewConfig,
    QuestionReportEntry,
)

logger = logging.getLogger(__name__)


@dataclass
class TurnRecord:
    """Record of a single question-answer turn."""

    question_number: int
    card: InterviewCard
    candidate_transcript: str
    evaluation_event: EvaluationEvent | None = None
    follow_up_asked: bool = False


class InterviewSessionState:
    """State manager for an active mock interview session."""

    def __init__(self, session_id: str, config: InterviewConfig):
        self.session_id = session_id
        self.config = config
        self.started_at: datetime = datetime.now()
        self.ended_at: datetime | None = None

        self.used_card_ids: set[str] = set()
        self.current_card: InterviewCard | None = None
        self.main_question_index: int = 0
        self.follow_up_used_for_current: bool = False

        self.turns: list[TurnRecord] = []
        self.retrieval_latencies: list[float] = []
        self.evaluation_latencies: list[float] = []

    def advance_question(self, card: InterviewCard) -> int:
        """Advance to the next interview question card."""
        self.main_question_index += 1
        self.current_card = card
        self.used_card_ids.add(card.id)
        self.follow_up_used_for_current = False
        logger.info(f"Session {self.session_id}: Advanced to question {self.main_question_index} (card '{card.id}')")
        return self.main_question_index

    def record_turn_evaluation(
        self,
        candidate_transcript: str,
        evaluation_event: EvaluationEvent,
        retrieval_ms: float = 0.0,
        evaluation_ms: float = 0.0,
    ) -> None:
        """Record evaluation for the current turn."""
        if not self.current_card:
            return

        record = TurnRecord(
            question_number=self.main_question_index,
            card=self.current_card,
            candidate_transcript=candidate_transcript,
            evaluation_event=evaluation_event,
            follow_up_asked=self.follow_up_used_for_current,
        )
        self.turns.append(record)
        if retrieval_ms > 0:
            self.retrieval_latencies.append(retrieval_ms)
        if evaluation_ms > 0:
            self.evaluation_latencies.append(evaluation_ms)

    def is_complete(self) -> bool:
        """Check whether session has reached configured question count."""
        return self.main_question_index >= self.config.question_count

    @property
    def has_ended(self) -> bool:
        """Return whether the final session report has already been built."""
        return self.ended_at is not None

    def build_final_report(self) -> FinalReportEvent:
        """Synthesize session state into FinalReportEvent with exact main question breakdown."""
        if self.ended_at is None:
            self.ended_at = datetime.now()
        duration_seconds = (self.ended_at - self.started_at).total_seconds()

        # Guard against sessions that ended with no evaluated turns
        if not self.turns:
            logger.warning(f"Session {self.session_id} ended with no recorded turns.")
            return FinalReportEvent(
                session_id=self.session_id,
                interview_type=self.config.interview_type,
                level=self.config.level,
                target_role=self.config.target_role,
                focus_topic=self.config.focus_topic,
                duration_seconds=round(duration_seconds, 1),
                questions_answered=0,
                session_average=0.0,
                strengths=[],
                top_improvements=[],
                question_breakdown=[],
                average_retrieval_ms=0.0,
                average_evaluation_ms=0.0,
            )

        # Group turns by main question_number to ensure 1 breakdown entry per main question card
        turns_by_question: dict[int, list[TurnRecord]] = {}
        for t in self.turns:
            turns_by_question.setdefault(t.question_number, []).append(t)

        all_strengths: list[str] = []
        all_improvements: list[str] = []
        question_breakdown: list[QuestionReportEntry] = []
        question_scores: list[float] = []

        for q_num in sorted(turns_by_question.keys()):
            q_turns = turns_by_question[q_num]
            card = q_turns[0].card

            # Extract successful evaluations for this main question (main + follow-up)
            evals = [t.evaluation_event for t in q_turns if t.evaluation_event and t.evaluation_event.evaluation_status == "success"]
            q_score = evals[-1].overall_score if evals else 0.0

            question_scores.append(q_score)

            combined_transcript = " | ".join(t.candidate_transcript for t in q_turns)
            q_strengths = [s for e in evals for s in e.strengths]
            q_improvements = [imp for e in evals for imp in e.improvements]

            all_strengths.extend(q_strengths)
            all_improvements.extend(q_improvements)

            question_breakdown.append(
                QuestionReportEntry(
                    question_number=q_num,
                    question_id=card.id,
                    question_title=card.title,
                    question_text=card.question,
                    candidate_transcript=combined_transcript,
                    overall_score=round(q_score, 1),
                    strengths=list(dict.fromkeys(q_strengths))[:2],
                    improvements=list(dict.fromkeys(q_improvements))[:2],
                )
            )

        session_avg = (
            sum(question_scores) / len(question_scores)
            if question_scores
            else 0.0
        )

        unique_strengths = list(dict.fromkeys(all_strengths))[:3]
        unique_improvements = list(dict.fromkeys(all_improvements))[:3]

        avg_retrieval = (
            sum(self.retrieval_latencies) / len(self.retrieval_latencies)
            if self.retrieval_latencies
            else 0.0
        )
        avg_eval = (
            sum(self.evaluation_latencies) / len(self.evaluation_latencies)
            if self.evaluation_latencies
            else 0.0
        )

        return FinalReportEvent(
            session_id=self.session_id,
            interview_type=self.config.interview_type,
            level=self.config.level,
            target_role=self.config.target_role,
            focus_topic=self.config.focus_topic,
            duration_seconds=round(duration_seconds, 1),
            questions_answered=len(question_breakdown),
            session_average=round(session_avg, 1),
            strengths=unique_strengths,
            top_improvements=unique_improvements,
            question_breakdown=question_breakdown,
            average_retrieval_ms=round(avg_retrieval, 1),
            average_evaluation_ms=round(avg_eval, 1),
        )
