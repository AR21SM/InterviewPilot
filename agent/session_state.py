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

    def build_final_report(self) -> FinalReportEvent:
        """Synthesize session state into FinalReportEvent."""
        self.ended_at = datetime.now()
        duration_seconds = (self.ended_at - self.started_at).total_seconds()

        valid_evals = [t.evaluation_event for t in self.turns if t.evaluation_event and t.evaluation_event.evaluation_status == "success"]
        session_avg = (
            sum(e.overall_score for e in valid_evals) / len(valid_evals)
            if valid_evals
            else 0.0
        )

        all_strengths: list[str] = []
        all_improvements: list[str] = []
        question_breakdown: list[QuestionReportEntry] = []

        for turn in self.turns:
            score = turn.evaluation_event.overall_score if turn.evaluation_event else 0.0
            strengths = turn.evaluation_event.strengths if turn.evaluation_event else []
            improvements = turn.evaluation_event.improvements if turn.evaluation_event else []

            all_strengths.extend(strengths)
            all_improvements.extend(improvements)

            question_breakdown.append(
                QuestionReportEntry(
                    question_number=turn.question_number,
                    question_id=turn.card.id,
                    question_title=turn.card.title,
                    question_text=turn.card.question,
                    candidate_transcript=turn.candidate_transcript,
                    overall_score=round(score, 1),
                    strengths=strengths,
                    improvements=improvements,
                )
            )

        # Unique strengths and improvements preserving order
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
            questions_answered=len(self.turns),
            session_average=round(session_avg, 1),
            strengths=unique_strengths,
            top_improvements=unique_improvements,
            question_breakdown=question_breakdown,
            average_retrieval_ms=round(avg_retrieval, 1),
            average_evaluation_ms=round(avg_eval, 1),
        )
