# InterviewPilot

> Real-time voice AI interview coach with rubric-grounded RAG, structured evaluation, and adaptive follow-ups.

InterviewPilot conducts live mock interviews over WebRTC using LiveKit. Candidate responses are transcribed, evaluated against question-specific weighted rubrics, scored deterministically in Python, and streamed back to a Next.js interface as structured feedback. All hosted inference is routed through Groq; vector embeddings are computed locally via sentence-transformers and indexed in ChromaDB.

---

## Architecture Diagram

```text
Browser / Next.js
      │
      │ WebRTC
      ▼
LiveKit Cloud
      │
      ▼
Python Voice Agent
 ├── Silero VAD
 ├── Groq Whisper STT
 ├── Groq LLM (openai/gpt-oss-120b)
 ├── Interview Session State
 ├── RAG Retriever
 │    └── BGE Embeddings → ChromaDB → Interview Cards
 └── Structured Evaluator
          │
          ▼
   Deterministic Python Score
          │
          ▼
   LiveKit Data Events
          │
          ▼
 Next.js Feedback UI
```

---

## Engineering Highlights

- **Low-Latency Voice Pipeline**: Real-time WebRTC audio streaming powered by LiveKit Agents, Silero VAD, Groq Whisper STT, and Groq TTS.
- **Rubric-Grounded RAG**: Knowledge base of 18 atomic JSON interview cards across Behavioral, Technical Reasoning, and System Design tracks with hash-based index freshness checking.
- **Structured LLM Evaluation**: Candidate spoken transcripts are evaluated against card-specific rubric criteria using Pydantic schemas on `openai/gpt-oss-120b`.
- **Deterministic Python Scoring**: Overall 1–10 scores are computed deterministically in Python using rubric weights, enforcing full rubric denominators to prevent score inflation.
- **In-Memory Session State**: Session state tracks main question indices, turn history, and adaptive follow-up state without database overhead.
- **Adaptive Probing**: Evaluates candidate responses to identify weak criteria ($\le 3/5$) and asks focused follow-up questions targeting the specific weak area.
- **Real-Time Data Streaming**: Streams versioned JSON data packets live over LiveKit data channels to update web UI score panels and feedback cards.
- **Retrieval Benchmark Suite**: Curated 35-case benchmark measuring Hit@1, Hit@3, MRR, and warm retrieval query latency.
- **Automated Quality Gate**: Comprehensive test suite (`pytest`) and strict typechecking (`mypy`, `tsc`) on CI.

---

## How an Interview Turn Works

1. **Configuration**: Session config selects interview track (Behavioral, Technical, or System Design), experience level (`intern`, `junior`, `mid`), question count, and optional focus topic.
2. **Card Retrieval**: RAG retriever retrieves an unused interview card matching the category and level using local BGE embeddings (`BAAI/bge-small-en-v1.5`) in ChromaDB.
3. **Question Spoken**: Voice agent asks the card's exact interview question verbally via Groq TTS.
4. **Speech Transcription**: Candidate responds verbally through browser microphone; Silero VAD detects end of speech and Groq Whisper Large V3 Turbo generates transcript text.
5. **Structured Evaluation**: Evaluator model (`openai/gpt-oss-120b`) parses transcript against card rubric criteria, outputting evidence snippets and 1–5 scores.
6. **Deterministic Scoring**: Python calculates the normalized 1–10 overall score using rubric criterion weights and full denominator enforcement.
7. **Live Feedback Streamed**: Data event (`type: "answer_evaluated"`) streams over LiveKit data channel to update web client score and feedback UI.
8. **Adaptive Follow-Up**: If a criterion score is weak ($\le 3/5$), the agent asks a targeted adaptive follow-up prompt before advancing to the next main question.
9. **Session Completion**: Advances turns until configured question count is reached, then streams the final report (`type: "session_completed"`).

---

## Groq & Provider Architecture

All hosted model inference (LLM, STT, TTS) is routed through **Groq** APIs. Vector embeddings are generated locally on CPU using HuggingFace sentence-transformers (`BAAI/bge-small-en-v1.5`). No OpenAI API key is required.

```env
GROQ_API_KEY=your_groq_api_key
GROQ_LLM_MODEL=openai/gpt-oss-120b
GROQ_STT_MODEL=whisper-large-v3-turbo
GROQ_TTS_MODEL=canopylabs/orpheus-v1-english
GROQ_TTS_VOICE=autumn

EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
```

---

## Measured Retrieval Quality

Retrieval benchmark evaluated against 35 curated test cases across tracks and experience levels:

| Metric | Measured Result |
| :--- | :--- |
| **Total Test Cases** | 35 |
| **Hit@1 Accuracy** | 94.29% |
| **Hit@3 Accuracy** | 100.00% |
| **Mean Reciprocal Rank (MRR)** | 0.9714 |
| **Mean Retrieval Latency (Warm)** | 30.0 ms |
| **p95 Retrieval Latency (Warm)** | 38.08 ms |

*Reproduce locally using `uv run python scripts/evaluate_retrieval.py`.*

---

## Project Structure

```text
InterviewPilot/
├── agent/        # Real-time voice agent worker, evaluator, and session state
├── rag/          # Interview card ingestion, BGE vector embeddings, and retrieval
├── knowledge/    # Structured rubric-backed JSON interview cards (18 cards)
├── evals/        # Retrieval evaluation cases and benchmark output
├── scripts/      # Retrieval benchmark runner
├── tests/        # Pytest unit test suite
├── frontend/     # Next.js 16 real-time voice interface
├── LICENSE       # MIT License
└── .github/      # CI workflow
```

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, LiveKit React Components, Tailwind CSS, Framer Motion
- **Voice & Transport**: LiveKit Cloud / Agents, Silero VAD, Groq Whisper STT, Groq Orpheus TTS
- **Interviewer & Evaluator**: Groq GPT-OSS 120B (`openai/gpt-oss-120b`), Pydantic Structured Outputs
- **RAG & Embeddings**: Sentence-Transformers (`BAAI/bge-small-en-v1.5`), ChromaDB
- **Tooling & CI**: `uv`, Pytest, Ruff, Mypy, ESLint, TypeScript, Docker, GitHub Actions

---

## Setup & Local Execution

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

GROQ_API_KEY=your_groq_api_key
GROQ_LLM_MODEL=openai/gpt-oss-120b
GROQ_STT_MODEL=whisper-large-v3-turbo
GROQ_TTS_MODEL=canopylabs/orpheus-v1-english
GROQ_TTS_VOICE=autumn

EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
CHROMA_PERSIST_DIR=./data/chroma
```

### 2. Backend Setup (Python)

```bash
# Install dependencies with dev extras
uv sync --extra dev

# Run Python voice agent worker
uv run python -m agent.main start
```

### 3. Frontend Setup (Next.js)

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000` to configure and launch a voice session.

---

## Tests & Quality Checks

Run the automated test suite and static type checking:

```bash
# Python lint, typecheck & tests
uv run ruff check .
uv run mypy agent/config.py agent/models.py agent/session_state.py agent/evaluator.py agent/llm_provider.py agent/main.py rag/models.py rag/ingest.py rag/vectorstore.py rag/retriever.py tests/test_cards.py tests/test_config.py tests/test_evaluator.py tests/test_retriever.py tests/test_session_state.py
uv run pytest

# Frontend quality checks
cd frontend
npm run lint
npm run typecheck
npm run build
```

---

## System Limitations

- **In-Memory Session State**: Session state is maintained in-memory for the duration of the LiveKit room. Session records do not persist across server restarts.
- **Verbal Technical Mode**: Technical reasoning mode evaluates verbal problem clarification, data structures, and Big-O complexity rather than executing code in an IDE sandbox.
- **Local Embedding Download**: On the first run, the local BGE embedding model (~130MB) is cached locally by HuggingFace sentence-transformers.

---

## Security Note

- API keys and LiveKit secrets are stored strictly server-side.
- Spoken candidate transcripts are isolated as untrusted data inputs during LLM evaluation.
- Overall candidate scores are calculated deterministically in Python outside the LLM.

---

## License

MIT License. See [LICENSE](file:///c:/dev_active/InterviewPilot/LICENSE) file for full text.
