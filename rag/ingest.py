"""
InterviewPilot - Card Ingestion Pipeline

Loads, validates, and indexes interview cards into ChromaDB and memory lookup store.
"""

import json
import logging
from pathlib import Path

from .models import InterviewCard

logger = logging.getLogger(__name__)


class CardIngestor:
    """Ingests interview cards from disk into structured memory and vector store."""

    def __init__(self, knowledge_dir: Path | str = "./knowledge"):
        self.knowledge_dir = Path(knowledge_dir)
        self.cards: dict[str, InterviewCard] = {}

    def load_cards(self) -> dict[str, InterviewCard]:
        """Load and validate all JSON interview cards from knowledge directory."""
        if not self.knowledge_dir.exists():
            logger.warning(f"Knowledge directory does not exist: {self.knowledge_dir}")
            return self.cards

        count = 0
        for json_path in self.knowledge_dir.rglob("*.json"):
            try:
                content = json_path.read_text(encoding="utf-8")
                data = json.loads(content)
                card = InterviewCard.model_validate(data)
                self.cards[card.id] = card
                count += 1
            except Exception as e:
                logger.error(f"Failed to load/validate interview card at {json_path}: {e}")
                raise e

        logger.info(f"Successfully loaded and validated {count} interview cards.")
        return self.cards

    def get_card(self, card_id: str) -> InterviewCard | None:
        """Get a card deterministically by ID."""
        return self.cards.get(card_id)
