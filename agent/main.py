"""
InterviewPilot - LiveKit Voice Interview Agent (Groq & Local Embeddings)

Real-time voice agent conducting adaptive mock interviews with Groq (Whisper STT, GPT-OSS 120B LLM, Orpheus TTS),
local BGE rubric retrieval, structured evaluation, and LiveKit data channel streaming.
"""

import asyncio
import json
import logging
import time
from typing import Any

from livekit import agents
from livekit.agents import Agent, AgentSession, JobContext, RoomInputOptions
from livekit.plugins import groq, silero

from rag import CardIngestor, CardRetriever, VectorStoreManager

from .config import get_settings
from .evaluator import ResponseEvaluator
from .llm_provider import create_interviewer_llm
from .models import InterviewConfig
from .prompts import get_agent_system_prompt
from .session_state import InterviewSessionState

logger = logging.getLogger(__name__)

# Global RAG singletons initialized once per worker process
_ingestor: CardIngestor | None = None
_vectorstore: VectorStoreManager | None = None
_retriever: CardRetriever | None = None


def get_rag_pipeline() -> tuple[CardIngestor, VectorStoreManager, CardRetriever]:
    """Initialize and cache the RAG pipeline once per process."""
    global _ingestor, _vectorstore, _retriever
    if _ingestor is None or _vectorstore is None or _retriever is None:
        settings = get_settings()
        _ingestor = CardIngestor()
        _ingestor.load_cards()

        _vectorstore = VectorStoreManager(
            persist_directory=settings.chroma_persist_dir,
            embedding_model=settings.embedding_model,
        )
        _vectorstore.index_cards(list(_ingestor.cards.values()))

        _retriever = CardRetriever(
            ingestor=_ingestor,
            vectorstore_manager=_vectorstore,
        )
    return _ingestor, _vectorstore, _retriever


async def entrypoint(ctx: JobContext) -> None:
    """Main entrypoint for LiveKit voice agent room session."""
    logger.info(f"Worker connected to room: {ctx.room.name}")
    settings = get_settings()

    # Connect to room audio
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)

    # Wait for candidate participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"Candidate participant joined: {participant.identity}")

    # Read and validate participant metadata
    raw_config: dict[str, Any] = {}
    if participant.metadata:
        try:
            raw_config = json.loads(participant.metadata)
        except Exception as e:
            logger.warning(f"Malformed participant metadata '{participant.metadata}', using defaults: {e}")

    try:
        config = InterviewConfig.model_validate(raw_config)
    except Exception as e:
        logger.warning(f"Invalid interview configuration, falling back to defaults: {e}")
        config = InterviewConfig()

    logger.info(
        f"Session configuration: track='{config.interview_type}', level='{config.level}', "
        f"questions={config.question_count}, role='{config.target_role}', topic='{config.focus_topic}'"
    )

    # Initialize local RAG pipeline and session state
    ingestor, vectorstore, retriever = get_rag_pipeline()
    session_state = InterviewSessionState(session_id=ctx.room.name, config=config)

    # Retrieve initial question card
    start_r = time.perf_counter()
    retrieved_cards = retriever.retrieve_cards(
        query=config.focus_topic or f"{config.interview_type} interview {config.level}",
        category=config.interview_type,
        level=config.level,
        k=1,
        exclude_ids=session_state.used_card_ids,
    )
    retrieval_ms = (time.perf_counter() - start_r) * 1000.0

    if not retrieved_cards:
        logger.error(f"No interview cards available for category '{config.interview_type}'.")
        return

    first_card = retrieved_cards[0].card
    session_state.advance_question(first_card)

    # Instantiate evaluator (calls Groq with model settings.groq_llm_model)
    evaluator = ResponseEvaluator()

    # Assemble voice agent system instructions
    system_prompt = get_agent_system_prompt(
        interview_type=config.interview_type,
        level=config.level,
        target_role=config.target_role,
        focus_topic=config.focus_topic,
        current_question=first_card.question,
    )

    agent_instance = Agent(instructions=system_prompt)

    # Create AgentSession using pure Groq stack (Whisper STT, GPT-OSS 120B LLM, Orpheus TTS)
    stt_kwargs: dict[str, Any] = {"model": settings.groq_stt_model}
    tts_kwargs: dict[str, Any] = {"model": settings.groq_tts_model, "voice": settings.groq_tts_voice}
    if settings.groq_api_key:
        stt_kwargs["api_key"] = settings.groq_api_key
        tts_kwargs["api_key"] = settings.groq_api_key

    session = AgentSession(
        vad=silero.VAD.load(),
        stt=groq.STT(**stt_kwargs),
        llm=create_interviewer_llm(settings),
        tts=groq.TTS(**tts_kwargs),
    )

    await session.start(
        agent=agent_instance,
        room=ctx.room,
        participant=participant,
        room_input_options=RoomInputOptions(noise_cancellation=True),
    )

    # Function to stream JSON events to client via LiveKit data channel
    async def publish_event(event_data: dict[str, Any]) -> None:
        try:
            payload = json.dumps(event_data).encode("utf-8")
            if ctx.room.local_participant:
                await ctx.room.local_participant.publish_data(
                    payload,
                    reliable=True,
                )
        except Exception as e:
            logger.error(f"Failed to publish data event to LiveKit room: {e}")

    # Initial spoken introduction & first question
    greeting = (
        f"Hello! Welcome to InterviewPilot. I'm Alex, your AI coach powered by Groq. "
        f"Today we'll conduct a {config.interview_type.replace('_', ' ')} interview "
        f"for a {config.level} role. Let's begin with our first question."
    )
    await session.say(greeting, allow_interruptions=True)
    await session.say(first_card.question, allow_interruptions=True)

    # Background handler for processing spoken candidate responses
    @session.on("user_speech_committed")
    def on_user_speech(msg: Any) -> None:
        transcript = getattr(msg, "content", "") if hasattr(msg, "content") else str(msg)
        if not transcript or not session_state.current_card:
            return

        async def process_evaluation() -> None:
            card = session_state.current_card
            if not card:
                return

            # Execute structured evaluation via Groq
            eval_event = await evaluator.evaluate_response(
                session_id=session_state.session_id,
                question_number=session_state.main_question_index,
                card=card,
                candidate_transcript=transcript,
                retrieval_ms=retrieval_ms,
            )

            # Record turn in session state
            session_state.record_turn_evaluation(
                candidate_transcript=transcript,
                evaluation_event=eval_event,
                retrieval_ms=retrieval_ms,
                evaluation_ms=eval_event.evaluation_ms,
            )

            # Stream answer_evaluated event to client
            await publish_event(eval_event.model_dump())

            # Check for adaptive follow-up or next question progression
            if not session_state.follow_up_used_for_current and eval_event.evaluation_status == "success" and eval_event.criteria:
                weakest = min(eval_event.criteria, key=lambda c: c.score)
                if weakest.score <= 3 and card.follow_up_prompts:
                    session_state.follow_up_used_for_current = True
                    follow_up_text = card.follow_up_prompts[0]
                    logger.info(f"Asking adaptive follow-up targeting criterion '{weakest.criterion}'")
                    await session.say(follow_up_text, allow_interruptions=True)
                    return

            # Check if interview is complete
            if session_state.is_complete():
                final_report = session_state.build_final_report()
                await publish_event(final_report.model_dump())
                await session.say(
                    "That concludes our mock interview session! I've synthesized your detailed performance report. Excellent work today.",
                    allow_interruptions=True,
                )
            else:
                # Retrieve next unused question card
                next_cards = retriever.retrieve_cards(
                    query=config.focus_topic or config.interview_type,
                    category=config.interview_type,
                    level=config.level,
                    k=1,
                    exclude_ids=session_state.used_card_ids,
                )

                if next_cards:
                    next_card = next_cards[0].card
                    session_state.advance_question(next_card)
                    await session.say(f"Let me move on to question {session_state.main_question_index}.", allow_interruptions=True)
                    await session.say(next_card.question, allow_interruptions=True)

        asyncio.create_task(process_evaluation())


def main() -> None:
    """Main CLI entrypoint for running the LiveKit agent worker."""
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
        ),
    )


if __name__ == "__main__":
    main()
