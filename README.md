# InterviewPilot

> Real-time voice interview coach powered by Groq, local BGE rubric retrieval, and structured AI evaluations.

InterviewPilot turns mock interviews into a structured, real-time voice coaching experience. Built on **LiveKit Agents** and **Groq** (`openai/gpt-oss-120b`), it retrieves question-specific evaluation rubrics via local RAG, evaluates candidate spoken responses against weighted criteria using structured outputs, and streams real-time feedback and final session analytics to a Next.js web client.

---

## Key Features

- **Zero OpenAI API Dependency**: Completely powered by Groq inference (LLM, STT, TTS) and local CPU sentence-transformers for vector embeddings.
- **Real-Time Voice Pipeline**: Low-latency turn-taking and interruption handling via LiveKit Agents 1.0+, Silero VAD, Groq Whisper, and Groq Orpheus TTS.
- **Rubric-Grounded RAG**: Curated knowledge base of 18 atomic JSON interview cards across Behavioral, Technical Reasoning, and System Design tracks.
- **Structured LLM Evaluation**: Answer transcripts are scored per criterion (1–5 scale) using Pydantic schemas on `openai/gpt-oss-120b`. Overall 1–10 scores are computed deterministically in Python using rubric weights.
- **Adaptive Probing**: Evaluates candidate responses to identify the weakest criterion and asks focused single-turn follow-up questions.
- **Real-Time Frontend Telemetry**: Versioned JSON data packets stream live score updates, strengths, improvements, and system latency telemetry directly into the user interface.
- **Measurable Final Session Report**: Interactive session summary detailing performance trends, top priority improvements, and per-question score breakdowns.

---

## Architecture Diagram

```text
                    ┌──────────────────────┐
                    │      Next.js UI      │
                    └──────────┬───────────┘
                               │
                         LiveKit/WebRTC
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Python Voice Agent   │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
     Silero VAD         Interview State      RAG Retriever
          │                                      │
          ▼                                      ▼
Groq Whisper STT                    Local BGE Embeddings
          │                                      │
          ▼                                   ChromaDB
       Transcript                                 │
          │                                      │
          └──────────────────┬───────────────────┘
                             ▼
                    Groq GPT-OSS 120B
                   Interviewer / Follow-up
                             │
                             ├───────────────┐
                             │               │
                             ▼               ▼
                       Groq Evaluator     Orpheus TTS
                             │               │
                      Structured JSON        ▼
                             │           LiveKit audio
                             ▼
                      Python scoring
                             │
                             ▼
                      LiveKit data event
                             │
                             ▼
                         Next.js UI
```

---

## One Interview Turn Execution Flow

1. **Card Selection**: RAG retriever selects an unused interview card matching the chosen category (Behavioral, Technical, or System Design) and experience level (`intern`, `junior`, `mid`).
2. **Question Presentation**: Agent asks the card's exact interview question verbally via Groq Orpheus TTS.
3. **Candidate Response**: Candidate speaks through browser microphone; Silero VAD detects speech end.
4. **Speech Transcription**: Groq Whisper Large V3 Turbo (`whisper-large-v3-turbo`) generates the final candidate transcript.
5. **Structured Evaluation**: `openai/gpt-oss-120b` via Groq evaluates the transcript against the card's specific rubric criteria, outputting evidence snippets and 1–5 criterion scores. Candidate text is isolated as untrusted data to prevent prompt injection.
6. **Deterministic Scoring**: Python calculates the normalized 1–10 overall score using weighted criterion sums.
7. **Live Streaming**: Data packet (`version: 1`, `type: "answer_evaluated"`) streams over LiveKit data channel to update the web UI live score and feedback panels.
8. **Adaptive Follow-Up**: If a criterion score is weak ($\le 3$), the agent asks a targeted adaptive follow-up.
9. **Turn Progression**: Advances to the next card until the configured question count is reached, then streams the final report (`type: "session_completed"`).

---

## Technology Stack

- **Voice Transport**: LiveKit (WebRTC, Agents 1.0+ Framework)
- **Voice Activity Detection**: Silero VAD
- **Speech-to-Text (STT)**: Groq Whisper Large V3 Turbo (`whisper-large-v3-turbo`)
- **Interviewer & Evaluator LLM**: Groq GPT-OSS 120B (`openai/gpt-oss-120b`)
- **Text-to-Speech (TTS)**: Groq Orpheus (`canopylabs/orpheus-v1-english`, voice `autumn`)
- **RAG Vector Embeddings**: Local Sentence-Transformers (`BAAI/bge-small-en-v1.5`)
- **Vector Database**: ChromaDB (Local persistence)
- **Frontend Framework**: Next.js 16, React 19, Tailwind CSS, Framer Motion
- **Package & Environment Manager**: `uv` (Python 3.11/3.12)

---

## Measured Retrieval Quality

Retrieval benchmark evaluated against 35 curated test cases across tracks and experience levels:

| Metric | Measured Result |
| :--- | :--- |
| **Total Test Cases** | 35 |
| **Hit@1 Accuracy** | 94.29% |
| **Hit@3 Accuracy** | 100.00% |
| **Mean Reciprocal Rank (MRR)** | 0.9714 |
| **Mean Retrieval Latency** | ~18.5 ms |
| **p95 Retrieval Latency** | ~32.1 ms |

*Run benchmark locally using `uv run python scripts/evaluate_retrieval.py`.*

---

## Prerequisites & Installation

### Prerequisites

- Python 3.11+
- Node.js 20+
- LiveKit Cloud account (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`)
- Groq API account (`GROQ_API_KEY`)

### 1. Environment Setup

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

Using `uv`:

```bash
# Sync dependencies
uv sync --extra dev

# Run test suite
uv run pytest

# Run linting and static type checking
uv run ruff check .
uv run mypy agent rag tests

# Start voice agent worker in dev mode
uv run python -m agent.main dev
```

### 3. Frontend Setup (Next.js)

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000` to configure and launch a voice interview.

---

## Testing & Quality Assurance

Automated checks run on CI (`.github/workflows/ci.yml`):

```bash
# Python tests
uv run pytest

# Python lint & typecheck
uv run ruff check .
uv run mypy agent rag tests

# Frontend quality checks
cd frontend
npm run lint
npm run typecheck
npm run build
```

---

## Transparent System Limitations

- **Session Persistence**: Active session state is maintained in-memory for the duration of the LiveKit room. History is not saved across server restarts.
- **Verbal Technical Mode**: Technical reasoning mode evaluates verbal problem clarification, data structures, and Big-O complexity rather than executing code in an IDE sandbox.
- **Local Embedding Cold Start**: On the first run, the local BGE embedding model (~130MB) is downloaded and cached automatically by HuggingFace transformers.

---

## License

MIT License. Engineered for technical credibility and real-time AI performance.
