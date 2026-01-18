"""
Unit tests for card retriever logic.
"""

from typing import Literal
from unittest.mock import MagicMock

from rag import CardIngestor, CardRetriever, InterviewCard, RubricCriterion


def create_sample_card(
    card_id: str,
    category: Literal["behavioral", "technical", "system_design"],
    levels: list[Literal["intern", "junior", "mid"]],
) -> InterviewCard:
    return InterviewCard(
        id=card_id,
        category=category,
        title=f"Sample {card_id}",
        levels=levels,
        question="Sample question?",
        tags=["sample"],
        rubric=[RubricCriterion(name="crit1", weight=1.0, description="desc")],
    )


def test_retriever_filtering_and_exclusion() -> None:
    """Verify category filtering, level matching, and exclusion set handling."""
    card1 = create_sample_card("b1", "behavioral", ["mid"])
    card2 = create_sample_card("b2", "behavioral", ["intern", "junior"])
    card3 = create_sample_card("t1", "technical", ["mid"])

    ingestor = MagicMock(spec=CardIngestor)
    ingestor.cards = {"b1": card1, "b2": card2, "t1": card3}
    ingestor.get_card.side_effect = lambda cid: ingestor.cards.get(cid)

    vectorstore = MagicMock()
    vectorstore.search.return_value = []

    retriever = CardRetriever(ingestor=ingestor, vectorstore_manager=vectorstore)

    # Search behavioral mid level
    results = retriever.retrieve_cards(
        query="behavioral question",
        category="behavioral",
        level="mid",
        k=2,
        exclude_ids={"b2"},
    )

    assert len(results) == 1
    assert results[0].card.id == "b1"
