"""
InterviewPilot - Vector Store Manager (Local BGE Embeddings)

ChromaDB integration with local HuggingFace BAAI/bge-small-en-v1.5 embeddings and hash-based index freshness.
"""

import hashlib
import json
import logging
from pathlib import Path

import chromadb
from chromadb.config import Settings as ChromaSettings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings

from .models import InterviewCard

logger = logging.getLogger(__name__)

# Global singleton embedding model to ensure single load per process
_global_embeddings: HuggingFaceEmbeddings | None = None


def get_local_embeddings(model_name: str = "BAAI/bge-small-en-v1.5") -> HuggingFaceEmbeddings:
    """Get or initialize singleton local embedding model."""
    global _global_embeddings
    if _global_embeddings is None:
        logger.info(f"Loading local embedding model: {model_name}")
        _global_embeddings = HuggingFaceEmbeddings(
            model_name=model_name,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _global_embeddings


class VectorStoreManager:
    """Manages ChromaDB vector store for interview cards with local embeddings and hash-based cache validity."""

    COLLECTION_NAME = "interview_cards_bge"
    INDEX_VERSION = 1

    def __init__(
        self,
        persist_directory: str = "./data/chroma",
        embedding_model: str = "BAAI/bge-small-en-v1.5",
    ):
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        self.embedding_model = embedding_model

        self._embeddings = get_local_embeddings(embedding_model)
        self._client = chromadb.PersistentClient(
            path=str(self.persist_directory),
            settings=ChromaSettings(anonymized_telemetry=False, allow_reset=True),
        )
        self._vectorstore: Chroma | None = None

    @property
    def vectorstore(self) -> Chroma:
        """Lazy initialized Chroma vectorstore."""
        if self._vectorstore is None:
            self._vectorstore = Chroma(
                client=self._client,
                collection_name=self.COLLECTION_NAME,
                embedding_function=self._embeddings,
            )
        return self._vectorstore

    def _compute_cards_hash(self, cards: list[InterviewCard]) -> str:
        """Compute SHA256 hash of card content and model name to verify index freshness."""
        hasher = hashlib.sha256()
        hasher.update(self.embedding_model.encode("utf-8"))
        hasher.update(str(self.INDEX_VERSION).encode("utf-8"))
        for card in sorted(cards, key=lambda c: c.id):
            hasher.update(card.id.encode("utf-8"))
            hasher.update(card.title.encode("utf-8"))
            hasher.update(card.get_embedding_text().encode("utf-8"))
        return hasher.hexdigest()

    def index_cards(self, cards: list[InterviewCard], rebuild: bool = False) -> int:
        """
        Index interview cards into ChromaDB using local BGE embeddings.
        Automatically rebuilds index if card contents or embedding model change.

        Args:
            cards: List of InterviewCard objects to index
            rebuild: If True, resets existing collection and re-indexes
        """
        if not cards:
            return 0

        meta_file = self.persist_directory / ".index_meta.json"
        current_hash = self._compute_cards_hash(cards)

        if not rebuild and meta_file.exists():
            try:
                meta = json.loads(meta_file.read_text(encoding="utf-8"))
                if meta.get("cards_hash") == current_hash and meta.get("embedding_model") == self.embedding_model:
                    collection = self._client.get_or_create_collection(self.COLLECTION_NAME)
                    if collection.count() >= len(cards):
                        logger.info(f"Vector store index is fresh ({collection.count()} cards).")
                        return collection.count()
            except Exception as e:
                logger.warning(f"Failed to read index metadata: {e}")

        logger.info("Rebuilding vector store collection to ensure freshness...")
        try:
            self._client.delete_collection(self.COLLECTION_NAME)
            self._vectorstore = None
        except Exception:
            pass

        documents: list[Document] = []
        for card in cards:
            doc = Document(
                page_content=card.get_embedding_text(),
                metadata={
                    "card_id": card.id,
                    "category": card.category,
                    "title": card.title,
                    "levels": ",".join(card.levels),
                },
            )
            documents.append(doc)

        self.vectorstore.add_documents(documents)

        meta_payload = {
            "cards_hash": current_hash,
            "embedding_model": self.embedding_model,
            "index_version": self.INDEX_VERSION,
            "count": len(documents),
        }
        meta_file.write_text(json.dumps(meta_payload, indent=2), encoding="utf-8")

        logger.info(f"Indexed {len(documents)} interview cards into local vector store.")
        return len(documents)

    def search(
        self,
        query: str,
        category: str | None = None,
        k: int = 5,
    ) -> list[tuple[Document, float]]:
        """Search for cards with similarity scores."""
        filter_dict = {"category": category} if category else None
        return self.vectorstore.similarity_search_with_score(
            query=query,
            k=k,
            filter=filter_dict,
        )
