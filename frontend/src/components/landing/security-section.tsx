"use client";

import { useEffect, useState, useRef } from "react";
import { AsciiTorus } from "./ascii-torus";

const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };

const limitations = [
  {
    title: "In-memory sessions",
    description: "No persistent interview history yet. Session state is maintained for the duration of the LiveKit room.",
    ascii: `  ┌───┐
  │ MEM│
  └───┘`,
  },
  {
    title: "Verbal technical interviews",
    description: "Technical reasoning is evaluated through spoken explanations rather than code execution.",
    ascii: `  ╔═══╗
  ║DSA║
  ╚═══╝`,
  },
  {
    title: "Three focused tracks",
    description: "Behavioral, Technical Reasoning, and System Design.",
    ascii: `  ◉─◉─◉
  │ │ │`,
  },
  {
    title: "Local retrieval corpus",
    description: "The knowledge base intentionally remains small and curated.",
    ascii: `  ▪ ▪ ▪
  ▪ ▪ ▪`,
  },
];

export function SecuritySection() {
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
    <section ref={sectionRef} className="relative py-32 bg-muted/30 overflow-hidden border-t border-border">
      {/* ASCII Torus Background */}
      <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none">
        <AsciiTorus className="w-[500px] h-[450px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div
          className={`max-w-3xl mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">{"// CURRENT SCOPE"}</p>
          <h2 className="font-mono text-3xl lg:text-5xl font-semibold tracking-tight mb-4 text-balance" style={pixelFont}>
            System limitations
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            InterviewPilot focuses on short, high-quality mock interviews rather than trying to replicate every recruiting workflow.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {limitations.map((item, index) => (
            <div
              key={item.title}
              className={`bg-card rounded-xl p-6 border border-border card-shadow transition-all duration-500 hover:border-primary/50 flex flex-col justify-between ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div>
                <pre className="font-mono text-sm text-primary mb-4 leading-tight h-10 flex items-center">
                  {item.ascii}
                </pre>
                <h3 className="font-bold text-foreground mb-2" style={pixelFont}>
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
