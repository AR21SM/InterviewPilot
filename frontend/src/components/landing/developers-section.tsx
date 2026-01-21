"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

const codeExamples = [
  {
    label: "Agent Worker",
    code: `from agent.main import entrypoint
from livekit.agents import WorkerOptions, cli

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))`,
  },
  {
    label: "Evaluator",
    code: `from agent.evaluator import evaluate_answer

eval_result = await evaluate_answer(
    candidate_transcript=transcript,
    card=interview_card,
    settings=settings
)`,
  },
  {
    label: "Next.js Session",
    code: `const res = await fetch("/api/session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ interview_type: "behavioral", level: "mid" })
});
const { token, url } = await res.json();`,
  },
];

const features = [
  {
    title: "Python LiveKit Agent Worker",
    description: "Built on LiveKit Agents SDK 0.12+ with Silero VAD and Groq model inference.",
  },
  {
    title: "Pydantic Structured Evaluation",
    description: "Strongly typed schemas enforcing explicit rubric criterion evidence and weights.",
  },
  {
    title: "Local BGE Embeddings",
    description: "HuggingFace BAAI/bge-small-en-v1.5 sentence-transformers in ChromaDB.",
  },
  {
    title: "Real-Time WebRTC DataChannel",
    description: "Streams versioned evaluation events directly to browser client UI panels.",
  },
];

export function DevelopersSection() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExamples[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developers" className="relative py-32 overflow-hidden border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Content */}
          <div>
            <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">{"// FOR DEVELOPERS"}</p>
            <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight mb-6 text-balance">
              Built for AI engineers,<br />by developers.
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Modular Python voice agent architecture with local vector RAG, Groq LLM inference, and Next.js LiveKit room components.
            </p>

            {/* Features list */}
            <div className="grid gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <div className="w-1 bg-primary/30 rounded-full shrink-0" />
                  <div>
                    <h3 className="font-medium mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Code block */}
          <div className="lg:sticky lg:top-32">
            <div className="rounded-xl overflow-hidden bg-card border border-border card-shadow">
              {/* Tabs */}
              <div className="flex items-center gap-1 p-2 border-b border-border bg-secondary/30">
                {codeExamples.map((example, idx) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => setActiveTab(idx)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
                      activeTab === idx
                        ? "bg-card text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {example.label}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy code"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Code content */}
              <div className="p-6 font-mono text-sm overflow-x-auto">
                <pre className="text-muted-foreground">
                  <code>
                    {codeExamples[activeTab].code.split("\n").map((line, i) => (
                      <div key={i} className="leading-relaxed">
                        <span className="text-muted-foreground/40 select-none w-8 inline-block">{i + 1}</span>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: highlightSyntax(line),
                          }}
                        />
                      </div>
                    ))}
                  </code>
                </pre>
              </div>

              {/* Terminal output */}
              <div className="border-t border-border p-4 bg-secondary/20">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
                  <span className="text-white">$</span>
                  <span>uv sync --extra dev</span>
                </div>
                <div className="text-xs font-mono text-muted-foreground/60">
                  Resolved 42 packages in 0.8s
                </div>
              </div>
            </div>

            {/* Docs link */}
            <div className="mt-6 flex items-center gap-4 text-sm">
              <a href="https://github.com/AR21SM/InterviewPilot" target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono">
                View Repository
              </a>
              <span className="text-border">|</span>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground font-mono">
                Architecture Flow
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function highlightSyntax(line: string): string {
  return line
    .replace(/(import|from|const|await|for|process|async|def|return)/g, '<span class="text-primary">$1</span>')
    .replace(/('.*?'|".*?")/g, '<span class="text-zinc-300">$1</span>')
    .replace(/(\/\/.*$|#.*$)/g, '<span class="text-muted-foreground/50">$1</span>')
    .replace(/(\{|\}|\(|\)|\[|\])/g, '<span class="text-muted-foreground">$1</span>');
}
