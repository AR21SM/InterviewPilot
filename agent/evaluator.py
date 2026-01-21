"""
InterviewPilot - Response Evaluator (Groq Structured Output)

Async response evaluator calling Groq with model 'openai/gpt-oss-120b'
and strict Pydantic JSON parsing to evaluate candidate spoken transcripts.
"""

import logging
import time
from typing import Any

from rag.models import InterviewCard

from .config import get_settings
from .llm_provider import get_evaluator_client
from .models import AnswerEvaluation, CriterionEvaluation, EvaluationEvent
from .prompts import get_evaluator_system_prompt

logger = logging.getLogger(__name__)


class ResponseEvaluator:
    """Evaluates candidate responses against rubric cards using Groq (openai/gpt-oss-120b)."""

    def __init__(self, client: Any = None, model: str | None = None):
        settings = get_settings()
        self.client: Any = client or get_evaluator_client(settings)
        self.model = model or settings.groq_llm_model

    async def evaluate_response(
        self,
        session_id: str,
        question_number: int,
        card: InterviewCard,
        candidate_transcript: str,
        retrieval_ms: float = 0.0,
    ) -> EvaluationEvent:
        """
        Evaluate candidate transcript against the specific interview card rubric using Groq.

        Args:
            session_id: Current interview session ID
            question_number: 1-indexed main question number
            card: InterviewCard containing question and rubric criteria
            candidate_transcript: Untrusted spoken transcript from candidate
            retrieval_ms: Measured RAG retrieval latency for telemetry

        Returns:
            EvaluationEvent with deterministic score normalization
        """
        start_time = time.perf_counter()

        # Handle empty transcript gracefully without fake scores
        if not candidate_transcript or not candidate_transcript.strip():
            logger.warning("Empty candidate transcript provided for evaluation.")
            eval_ms = (time.perf_counter() - start_time) * 1000.0
            return EvaluationEvent(
                session_id=session_id,
                question_id=card.id,
                question_number=question_number,
                overall_score=0.0,
                criteria=[],
                strengths=[],
                improvements=["Candidate provided no verbal response."],
                follow_up_focus=None,
                evaluation_status="failed",
                retrieval_ms=retrieval_ms,
                evaluation_ms=eval_ms,
            )

        # Build prompt payload
        system_prompt = get_evaluator_system_prompt(card)
        user_content = (
            f"UNTRUSTED CANDIDATE TRANSCRIPT:\n"
            f'"""\n{candidate_transcript}\n"""\n\n'
            f"Evaluate the transcript above strictly using the provided rubric criteria."
        )

        try:
            # Call Groq API via AsyncOpenAI client with structured output schema
            response = await self.client.beta.chat.completions.parse(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                response_format=AnswerEvaluation,
                temperature=0.1,
            )

            parsed = response.choices[0].message.parsed
            if not parsed:
                raise ValueError("Groq structured output returned None parsed model.")
            eval_res: AnswerEvaluation = parsed

            eval_ms = (time.perf_counter() - start_time) * 1000.0

            # Deterministic weighted score calculation in Python
            overall_score = self.calculate_weighted_score(card, eval_res.criterion_scores)

            logger.info(
                f"Evaluated session {session_id} Q{question_number} ({card.id}) via Groq ({self.model}): "
                f"score={overall_score:.1f}/10 in {eval_ms:.1f}ms"
            )

            return EvaluationEvent(
                session_id=session_id,
                question_id=card.id,
                question_number=question_number,
                overall_score=overall_score,
                criteria=eval_res.criterion_scores,
                strengths=eval_res.strengths,
                improvements=eval_res.improvements,
                follow_up_focus=eval_res.follow_up_focus,
                evaluation_status="success",
                retrieval_ms=retrieval_ms,
                evaluation_ms=eval_ms,
            )

        except Exception as e:
            logger.error(f"Structured evaluation via Groq failed for session {session_id}: {e}", exc_info=True)
            eval_ms = (time.perf_counter() - start_time) * 1000.0
            return EvaluationEvent(
                session_id=session_id,
                question_id=card.id,
                question_number=question_number,
                overall_score=0.0,
                criteria=[],
                strengths=[],
                improvements=["Evaluation unavailable for this response."],
                follow_up_focus=None,
                evaluation_status="failed",
                retrieval_ms=retrieval_ms,
                evaluation_ms=eval_ms,
            )

    @staticmethod
    def calculate_weighted_score(
        card: InterviewCard,
        evaluations: list[CriterionEvaluation],
    ) -> float:
        """
        Calculate overall 1-10 score deterministically using exact card rubric weights.

        Score per criterion is 1-5 scale:
        fraction = score / 5.0
        weighted_sum = sum(fraction * weight)
        overall_score = round((weighted_sum / total_rubric_weight) * 10.0, 1)

        Enforces full rubric denominator. Any criterion missing from LLM evaluations
        is assigned minimum score 1 (fraction 1/5 = 0.2) to prevent score inflation.
        """
        if not card.rubric:
            return 0.0

        rubric_map = {c.name.lower(): c.weight for c in card.rubric}
        total_rubric_weight = sum(c.weight for c in card.rubric)
        if total_rubric_weight <= 0:
            return 0.0

        # Map evaluated criteria (first occurrence per criterion name)
        eval_map: dict[str, int] = {}
        for item in evaluations:
            key = item.criterion.lower().strip()
            if key in rubric_map and key not in eval_map:
                eval_map[key] = max(1, min(5, item.score))

        weighted_sum = 0.0
        for criterion in card.rubric:
            key = criterion.name.lower()
            # If LLM missed a criterion, penalize with minimum score 1
            score = eval_map.get(key, 1)
            score_fraction = score / 5.0
            weighted_sum += score_fraction * criterion.weight

        normalized = (weighted_sum / total_rubric_weight) * 10.0
        return round(normalized, 1)
