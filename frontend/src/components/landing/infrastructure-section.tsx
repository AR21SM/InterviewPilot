"use client";

import { useEffect, useState, useRef } from "react";
import { AsciiDna } from "./ascii-dna";

const archComponents = [
  { name: "LiveKit", desc: "Realtime voice transport", detail: "WebRTC audio streaming" },
  { name: "Groq", desc: "STT + LLM inference", detail: "Whisper & GPT-OSS 120B" },
  { name: "BGE", desc: "Local semantic embeddings", detail: "BAAI/bge-small-en-v1.5" },
  { name: "ChromaDB", desc: "Interview-card retrieval", detail: "30.0ms warm query latency" },
  { name: "Pydantic", desc: "Structured evaluation validation", detail: "AnswerEvaluation Schema" },
  { name: "Python", desc: "Session state & deterministic scoring", detail: "Weighted rubric math" },
];

export function InfrastructureSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="architecture" ref={sectionRef} className="relative py-32 bg-muted/30 overflow-hidden border-t border-border">
      {/* ASCII DNA Background */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
        <AsciiDna className="w-[600px] h-[500px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-16">
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">{"// SYSTEM ARCHITECTURE"}</p>
          <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight mb-4 text-balance">
            Built as a realtime AI system
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            The model handles reasoning and conversation. Application state, retrieval, scoring, and session control remain deterministic components.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left: Clean ASCII Diagram Box */}
          <div className="lg:col-span-7 bg-card rounded-xl p-6 border border-border card-shadow font-mono text-xs overflow-x-auto">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4 text-muted-foreground">
              <span>SYSTEM ARCHITECTURE DIAGRAM</span>
              <span className="text-primary">DETERMINISTIC PIPELINE</span>
            </div>
            <pre className="text-muted-foreground leading-relaxed">
{`Browser / Next.js
        │
        │ WebRTC
        ▼
     LiveKit Cloud
        │
        ▼
Python Interview Agent Worker
        │
 ┌──────┼───────────────┐
 │      │               │
 ▼      ▼               ▼
STT   Session State   RAG Retriever
Groq                   │
                       ▼
                 Local BGE Embeddings
                       │
                       ▼
                   ChromaDB
                       │
        ┌──────────────┘
        ▼
 GPT-OSS 120B / Groq
        │
        ├── Interview response (Audio via Orpheus TTS)
        │
        └── Structured evaluation (Pydantic Schema)
                     │
                     ▼
             Python weighted score (1.0 - 10.0)
                     │
                     ▼
              LiveKit data event (DataChannel)
                     │
                     ▼
                  Next.js Feedback UI`}
            </pre>
          </div>

          {/* Right: Component Stack Cards */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-3">
            {archComponents.map((comp) => (
              <div
                key={comp.name}
                className="bg-card rounded-lg p-5 border border-border card-shadow hover:border-primary/50 transition-all duration-300 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <span className="text-primary font-mono text-xs">•</span> {comp.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{comp.desc}</p>
                </div>
                <span className="font-mono text-[10px] text-primary/80 bg-primary/10 border border-primary/20 px-2 py-1 rounded">
                  {comp.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
