FROM python:3.11-slim

WORKDIR /app

# Install uv package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy configuration and lockfiles
COPY pyproject.toml uv.lock ./

# Install project dependencies into container environment
RUN uv sync --frozen --no-dev

# Copy application packages and knowledge base
COPY agent/ ./agent/
COPY rag/ ./rag/
COPY knowledge/ ./knowledge/

ENV PYTHONUNBUFFERED=1

# Run LiveKit agent worker in production mode
CMD ["uv", "run", "python", "-m", "agent.main", "start"]
