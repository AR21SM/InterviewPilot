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

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RoomInputOptions,
    UserInputTranscribedEvent,
)
from livekit.plugins import groq, silero

from rag import CardIngestor, CardRetriever, VectorStoreManager
from .config import get_settings
from .evaluator import ResponseEvaluator
from .llm_provider import create_interviewer_llm
from .models import InterviewConfig
from .prompts import get_agent_system_prompt
from .session_state import InterviewSessionState

# Load environment variables from .env
load_dotenv()

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

    # Per-session turn lock: prevents concurrent evaluations for the same turn
    # if rapid VAD events fire multiple final transcripts before the first completes.
    _turn_lock = asyncio.Lock()

    # Retrieve initial question card, measuring retrieval latency
    start_r = time.perf_counter()
    retrieved_cards = retriever.retrieve_cards(
        query=config.focus_topic or f"{config.interview_type} interview {config.level}",
        category=config.interview_type,
        level=config.level,
        k=1,
        exclude_ids=session_state.used_card_ids,
    )
    initial_retrieval_ms = (time.perf_counter() - start_r) * 1000.0

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

    session: Any = AgentSession(
        vad=silero.VAD.load(),
        stt=groq.STT(**stt_kwargs),
        llm=create_interviewer_llm(settings),
        tts=groq.TTS(**tts_kwargs),
    )

    await session.start(
        agent=agent_instance,
        room=ctx.room,
        room_input_options=RoomInputOptions(),
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
        f"for a {config.level} role. Let me begin with your first question."
    )
    await session.say(greeting, allow_interruptions=True)
    await session.say(first_card.question, allow_interruptions=True)

    # Background handler for processing spoken candidate responses
    @session.on("user_input_transcribed")  # type: ignore[untyped-decorator]
    def on_user_input(ev: UserInputTranscribedEvent) -> None:
        if not ev.is_final or not ev.transcript or not session_state.current_card:
            return

        transcript = ev.transcript.strip()
        if not transcript:
            return

        async def process_evaluation() -> None:
            # Acquire turn lock to prevent duplicate concurrent evaluations
            # for the same transcribed segment. If another evaluation is already
            # in flight, skip this duplicate event.
            if _turn_lock.locked():
                logger.debug("Turn evaluation already in progress; skipping duplicate event.")
                return

            async with _turn_lock:
                card = session_state.current_card
                if not card:
                    return

                # Measure per-turn retrieval latency (use initial if first turn)
                turn_retrieval_ms = initial_retrieval_ms if session_state.main_question_index == 1 else 0.0

                # Execute structured evaluation via Groq
                eval_event = await evaluator.evaluate_response(
                    session_id=session_state.session_id,
                    question_number=session_state.main_question_index,
                    card=card,
                    candidate_transcript=transcript,
                    retrieval_ms=turn_retrieval_ms,
                )

                # Record turn in session state
                session_state.record_turn_evaluation(
                    candidate_transcript=transcript,
                    evaluation_event=eval_event,
                    retrieval_ms=turn_retrieval_ms,
                    evaluation_ms=eval_event.evaluation_ms,
                )

                # Stream answer_evaluated event to client
                await publish_event(eval_event.model_dump())

                # Check for adaptive follow-up or next question progression
                if (
                    not session_state.follow_up_used_for_current
                    and eval_event.evaluation_status == "success"
                    and eval_event.criteria
                ):
                    weakest = min(eval_event.criteria, key=lambda c: c.score)
                    if weakest.score <= 3 and card.follow_up_prompts:
                        session_state.follow_up_used_for_current = True
                        # Select follow-up prompt matching weakest criterion if possible
                        follow_up_text = card.follow_up_prompts[0]
                        for prompt in card.follow_up_prompts:
                            if weakest.criterion.lower() in prompt.lower():
                                follow_up_text = prompt
                                break
                        logger.info(f"Asking adaptive follow-up targeting weakest criterion '{weakest.criterion}'")
                        await session.say(follow_up_text, allow_interruptions=True)
                        return

                # Check if interview is complete (checked inside lock to prevent race)
                if session_state.is_complete():
                    final_report = session_state.build_final_report()
                    await publish_event(final_report.model_dump())
                    await session.say(
                        "That concludes our mock interview session! I've synthesized your detailed performance report. Excellent work today.",
                        allow_interruptions=True,
                    )
                else:
                    # Retrieve next unused question card, measuring per-turn retrieval latency
                    start_next = time.perf_counter()
                    next_cards = retriever.retrieve_cards(
                        query=config.focus_topic or config.interview_type,
                        category=config.interview_type,
                        level=config.level,
                        k=1,
                        exclude_ids=session_state.used_card_ids,
                    )
                    next_retrieval_ms = (time.perf_counter() - start_next) * 1000.0
                    session_state.retrieval_latencies.append(next_retrieval_ms)

                    if next_cards:
                        next_card = next_cards[0].card
                        session_state.advance_question(next_card)
                        await session.say(f"Let me move on to question {session_state.main_question_index}.", allow_interruptions=True)
                        await session.say(next_card.question, allow_interruptions=True)

        # Schedule the coroutine on the running event loop.
        # LiveKit fires event callbacks from its internal thread, so we use
        # asyncio.get_event_loop().call_soon_threadsafe to safely schedule
        # the coroutine on the correct loop instead of creating tasks directly.
        loop = asyncio.get_event_loop()
        loop.call_soon_threadsafe(lambda: asyncio.ensure_future(process_evaluation()))


def main() -> None:
    """Main CLI entrypoint for running the LiveKit agent worker."""
    load_dotenv()
    settings = get_settings()

    worker_opts = agents.WorkerOptions(
        entrypoint_fnc=entrypoint,
        ws_url=settings.livekit_url or None,
        api_key=settings.livekit_api_key or None,
        api_secret=settings.livekit_api_secret or None,
    )

    agents.cli.run_app(worker_opts)


if __name__ == "__main__":
    main()
