"""
InterviewPilot - Card Retriever

Retrieves candidate interview cards matching category, experience level, and query context.
"""

import logging
import time

from .ingest import CardIngestor
from .models import ExperienceLevel, InterviewCategory, RetrievedCard
from .vectorstore import VectorStoreManager

logger = logging.getLogger(__name__)


class CardRetriever:
    """Retrieves relevant rubric-backed interview cards."""

    def __init__(
        self,
        ingestor: CardIngestor,
        vectorstore_manager: VectorStoreManager,
    ):
        self.ingestor = ingestor
        self.vectorstore_manager = vectorstore_manager

    def retrieve_cards(
        self,
        query: str,
        category: InterviewCategory,
        level: ExperienceLevel | None = None,
        k: int = 3,
        exclude_ids: set[str] | None = None,
    ) -> list[RetrievedCard]:
        """
        Retrieve relevant interview cards for a query context.

        Args:
            query: Topic or natural language query
            category: Interview mode category filter
            level: Experience level filter (optional)
            k: Target count of top cards to return
            exclude_ids: Set of card IDs already used in the session

        Returns:
            Ranked list of RetrievedCard objects
        """
        start_time = time.perf_counter()
        exclude = set(exclude_ids or ())

        # Fetch extra results to allow filtering
        results = self.vectorstore_manager.search(
            query=query,
            category=category,
            k=max(k * 4, len(self.ingestor.cards)),
        )

        retrieved: list[RetrievedCard] = []
        rank = 1

        for doc, score in results:
            card_id = doc.metadata.get("card_id")
            if not card_id or card_id in exclude:
                continue

            card = self.ingestor.get_card(card_id)
            if not card:
                continue

            # Level filter: if specified, check if level is supported by card
            if level and level not in card.levels:
                continue

            retrieved.append(
                RetrievedCard(
                    card=card,
                    rank=rank,
                    score=float(score),
                )
            )
            exclude.add(card_id)
            rank += 1

            if len(retrieved) >= k:
                break

        # Fallback: if search returns fewer cards than requested due to level/filtering, pull from ingested cards
        if len(retrieved) < k:
            for card in self.ingestor.cards.values():
                if card.category != category:
                    continue
                if card.id in exclude:
                    continue
                if level and level not in card.levels:
                    continue

                retrieved.append(
                    RetrievedCard(
                        card=card,
                        rank=rank,
                        score=0.0,
                    )
                )
                exclude.add(card.id)
                rank += 1
                if len(retrieved) >= k:
                    break

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        logger.info(
            f"Retrieved {len(retrieved)} cards for category='{category}', level='{level}' in {elapsed_ms:.2f}ms"
        )
        return retrieved
