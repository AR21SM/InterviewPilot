"use client";

import { useEffect, useState, useRef } from "react";

const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };

function AnimatedCounter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, hasAnimated]);

  return (
    <div ref={ref} className="font-mono text-3xl lg:text-5xl font-bold tracking-tight">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

const metrics = [
  { value: 35, suffix: "", label: "Evaluation Queries", sublabel: "Curated benchmark cases" },
  { value: 94, suffix: ".29%", label: "Hit@1 Accuracy", sublabel: "Rank 1 card match" },
  { value: 100, suffix: ".0%", label: "Hit@3 Accuracy", sublabel: "Top 3 card match" },
  { value: 97, suffix: ".14", label: "MRR Score", prefix: "0.", sublabel: "Mean Reciprocal Rank" },
  { value: 30, suffix: ".0 ms", label: "Mean Warm Latency", sublabel: "Vector query search" },
  { value: 38, suffix: ".08 ms", label: "p95 Warm Latency", sublabel: "95th percentile query" },
];

export function MetricsSection() {
  return (
    <section id="evaluation" className="relative py-32 overflow-hidden border-t border-border">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header 1: Evaluation You Can Inspect */}
        <div className="mb-16 max-w-3xl">
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">{"// EVALUATION & INSPECTABILITY"}</p>
          <h2 className="font-mono text-3xl lg:text-5xl font-semibold tracking-tight mb-4" style={pixelFont}>
            Evaluation you can inspect
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Instead of returning a generic &quot;8/10&quot;, InterviewPilot exposes why an answer received its score.
          </p>
        </div>

        {/* Live Inspectable Evaluation Sample Card */}
        <div className="mb-24 bg-card rounded-xl p-8 border border-border card-shadow font-sans">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 mb-6">
            <div>
              <span className="font-mono text-xs text-primary block mb-1">REALTIME EVALUATION OUTPUT</span>
              <h3 className="text-2xl font-bold text-foreground" style={pixelFont}>System Design: Rate Limiter</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">
                Weighted final score: <strong className="text-white">6.4 / 10</strong>
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left: Criteria Breakdown */}
            <div className="lg:col-span-5 space-y-3 font-mono text-xs">
              <span className="text-muted-foreground block mb-2 font-semibold">RUBRIC CRITERIA BREAKDOWN</span>
              {[
                { name: "Requirements", score: "4 / 5", pct: 80 },
                { name: "Architecture", score: "4 / 5", pct: 80 },
                { name: "Scalability", score: "3 / 5", pct: 60 },
                { name: "Reliability", score: "2 / 5", pct: 40 },
                { name: "Trade-offs", score: "3 / 5", pct: 60 },
              ].map((c) => (
                <div key={c.name} className="bg-background/60 p-3 rounded-lg border border-border/80">
                  <div className="flex justify-between mb-1">
                    <span className="text-foreground">{c.name}</span>
                    <span className="text-primary font-bold">{c.score}</span>
                  </div>
                  <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Evidence & Follow-up */}
            <div className="lg:col-span-7 space-y-4 text-xs">
              <div className="bg-background/60 p-4 rounded-lg border border-border/80">
                <span className="font-mono text-primary font-bold block mb-1">EXTRACTED EVIDENCE</span>
                <p className="text-muted-foreground leading-relaxed italic">
                  &quot;Candidate identified token bucket and centralized Redis, but did not explain behavior during Redis failure.&quot;
                </p>
              </div>

              <div className="bg-background/60 p-4 rounded-lg border border-border/80">
                <span className="font-mono text-amber-400 font-bold block mb-1">TOP PRIORITY IMPROVEMENT</span>
                <p className="text-muted-foreground leading-relaxed">
                  Discuss degraded operation and whether the service should fail open or fail closed.
                </p>
              </div>

              <div className="bg-background/60 p-4 rounded-lg border border-border/80">
                <span className="font-mono text-indigo-400 font-bold block mb-1">ADAPTIVE FOLLOW-UP PROBE</span>
                <p className="text-foreground font-semibold">
                  &quot;What happens to your rate limiter if Redis becomes unavailable?&quot;
                </p>
              </div>

              <p className="font-mono text-[10px] text-muted-foreground/70 pt-1">
                * Calculated by application code from predefined rubric weights.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Retrieval Evaluation */}
        <div id="metrics" className="pt-12 border-t border-border">
          <div className="mb-16 max-w-3xl">
            <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">{"// RETRIEVAL EVALUATION"}</p>
            <h2 className="font-mono text-3xl lg:text-5xl font-semibold tracking-tight mb-4" style={pixelFont}>
              RAG that is measured, not just mentioned
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              The retrieval pipeline is evaluated against a curated set of expected question-card matches instead of assuming semantic search works correctly.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-xl border border-border overflow-hidden card-shadow mb-8">
            {metrics.map((metric) => (
              <div key={metric.label} className="bg-card p-6 sm:p-8 flex flex-col gap-2">
                <div className="text-primary">
                  <AnimatedCounter end={metric.value} suffix={metric.suffix} prefix={metric.prefix || ""} />
                </div>
                <div>
                  <div className="text-foreground font-semibold text-sm sm:text-base">{metric.label}</div>
                  <div className="text-xs text-muted-foreground">{metric.sublabel}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="font-mono text-xs text-muted-foreground/70">
            Metrics are generated by the repository&apos;s reproducible retrieval evaluation script (`uv run python scripts/evaluate_retrieval.py`).
          </p>
        </div>
      </div>
    </section>
  );
}
