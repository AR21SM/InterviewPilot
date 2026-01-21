FROM python:3.11-slim

WORKDIR /app

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy configuration, lockfiles, and project metadata
COPY pyproject.toml uv.lock README.md ./

# Install project dependencies into container environment
RUN uv sync --frozen --no-dev

# Copy application packages and knowledge base
COPY agent/ ./agent/
COPY rag/ ./rag/
COPY knowledge/ ./knowledge/

ENV PYTHONUNBUFFERED=1

# Run LiveKit agent worker to automatically accept all room connections
CMD ["uv", "run", "python", "-m", "agent.main", "dev"]
