"""
Unit tests for Interview Card loading and schema validation.
"""

from rag import CardIngestor


def test_card_ingestion() -> None:
    """Verify that all JSON interview cards load cleanly and satisfy schema constraints."""
    ingestor = CardIngestor(knowledge_dir="./knowledge")
    cards = ingestor.load_cards()

    assert len(cards) >= 15, f"Expected at least 15 interview cards, found {len(cards)}"

    for card_id, card in cards.items():
        assert card.id == card_id
        assert card.category in ("behavioral", "technical", "system_design")
        assert len(card.rubric) > 0

        # Verify rubric weights sum to ~1.0
        total_weight = sum(c.weight for c in card.rubric)
        assert 0.95 <= total_weight <= 1.05, f"Card {card_id} rubric weights sum to {total_weight}"

        # Verify embedding text generation
        embedding_text = card.get_embedding_text()
        assert card.title in embedding_text
        assert card.question in embedding_text
