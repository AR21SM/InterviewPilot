"""
InterviewPilot - Retrieval Evaluation Benchmark Script

Evaluates card retrieval quality across test cases, computing Hit@1, Hit@3, MRR,
and p95 latency. Saves results to evals/latest_results.json.
"""

import json
import logging
import time
from pathlib import Path

import numpy as np

from rag import CardIngestor, CardRetriever, VectorStoreManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def evaluate_retrieval(
    cases_path: str = "evals/retrieval_cases.jsonl",
    output_path: str = "evals/latest_results.json",
) -> dict:
    """Run retrieval evaluation suite and output metrics."""
    logger.info("Initializing RAG pipeline for retrieval evaluation...")
    ingestor = CardIngestor()
    cards = ingestor.load_cards()

    vectorstore = VectorStoreManager()
    vectorstore.index_cards(list(cards.values()))

    retriever = CardRetriever(ingestor=ingestor, vectorstore_manager=vectorstore)

    cases_file = Path(cases_path)
    if not cases_file.exists():
        raise FileNotFoundError(f"Test cases file not found: {cases_path}")

    cases = []
    with cases_file.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                cases.append(json.loads(line))

    logger.info(f"Loaded {len(cases)} retrieval test cases.")

    hits_at_1 = 0
    hits_at_3 = 0
    reciprocal_ranks = []
    latencies = []

    for _i, case in enumerate(cases, 1):
        query = case["query"]
        category = case["category"]
        level = case.get("level")
        expected_ids = set(case["expected_card_ids"])

        start_time = time.perf_counter()
        retrieved = retriever.retrieve_cards(
            query=query,
            category=category,
            level=level,
            k=3,
        )
        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        latencies.append(elapsed_ms)

        retrieved_ids = [rc.card.id for rc in retrieved]

        # Check Hit@1
        if retrieved_ids and retrieved_ids[0] in expected_ids:
            hits_at_1 += 1

        # Check Hit@3
        if any(rid in expected_ids for rid in retrieved_ids[:3]):
            hits_at_3 += 1

        # Calculate Reciprocal Rank
        rr = 0.0
        for rank_idx, rid in enumerate(retrieved_ids, start=1):
            if rid in expected_ids:
                rr = 1.0 / rank_idx
                break
        reciprocal_ranks.append(rr)

    total = len(cases)
    hit_1_pct = round((hits_at_1 / total) * 100.0, 2) if total else 0.0
    hit_3_pct = round((hits_at_3 / total) * 100.0, 2) if total else 0.0
    mrr = round(float(np.mean(reciprocal_ranks)), 4) if reciprocal_ranks else 0.0
    mean_lat = round(float(np.mean(latencies)), 2) if latencies else 0.0
    p95_lat = round(float(np.percentile(latencies, 95)), 2) if latencies else 0.0

    results = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_cases": total,
        "hit_at_1_pct": hit_1_pct,
        "hit_at_3_pct": hit_3_pct,
        "mrr": mrr,
        "mean_latency_ms": mean_lat,
        "p95_latency_ms": p95_lat,
    }

    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text(json.dumps(results, indent=2), encoding="utf-8")

    print("\n" + "=" * 50)
    print("      RETRIEVAL BENCHMARK EVALUATION RESULTS     ")
    print("=" * 50)
    print(f"Total Test Cases     : {total}")
    print(f"Hit@1 Rate           : {hit_1_pct}%")
    print(f"Hit@3 Rate           : {hit_3_pct}%")
    print(f"MRR (Mean Rec. Rank) : {mrr}")
    print(f"Mean Latency         : {mean_lat} ms")
    print(f"p95 Latency          : {p95_lat} ms")
    print("=" * 50 + "\n")

    return results


if __name__ == "__main__":
    evaluate_retrieval()
