"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };
const SMOOTH_EASE = [0.16, 1, 0.3, 1] as const;

const tracks = [
  {
    num: "01",
    type: "behavioral" as const,
    title: "Behavioral",
    description: "Practice ownership, collaboration, conflict resolution, ambiguity, failures, and impact through structured scenarios.",
    tag: "STAR • OWNERSHIP • IMPACT",
  },
  {
    num: "02",
    type: "technical" as const,
    title: "Technical Reasoning",
    description: "Explain algorithms and problem-solving approaches aloud while evaluated on correctness, complexity, and communication.",
    tag: "DSA • COMPLEXITY • EDGE CASES",
  },
  {
    num: "03",
    type: "system_design" as const,
    title: "System Design",
    description: "Work through architecture problems while discussing requirements, scalability, reliability, storage, and engineering trade-offs.",
    tag: "SCALE • RELIABILITY • TRADE-OFFS",
  },
];

const differentiators = [
  {
    num: "01",
    tag: "Grounded questions",
    title: "Rubric-grounded retrieval",
    description: "Interview questions are selected from curated cards containing predefined evaluation criteria, expected signals, and follow-up guidance.",
  },
  {
    num: "02",
    tag: "Structured evaluation",
    title: "Criterion-level evaluation",
    description: "Candidate responses are evaluated against the exact rubric attached to the question, producing structured scores, evidence, strengths, and improvements.",
  },
  {
    num: "03",
    tag: "Deterministic scoring",
    title: "The LLM doesn't invent your final score",
    description: "The model evaluates individual criteria. Python applies the predefined rubric weights and computes the final score deterministically.",
  },
  {
    num: "04",
    tag: "Adaptive interviewing",
    title: "Follow-ups target weak signals",
    description: "Evaluation results influence the next probe, allowing the interview to dig deeper when an answer misses an important criterion.",
  },
];

export function FeaturesSection({ onSelectTrack }: { onSelectTrack?: (track: "behavioral" | "technical" | "system_design") => void }) {
  return (
    <section
      id="modes"
      className="relative py-32 overflow-hidden bg-[#030303]"
    >
      {/* Top gradient separator line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      {/* Bottom gradient separator line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: SMOOTH_EASE }}
          className="mb-16"
        >
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
            {"// INTERVIEW MODES"}
          </p>
          <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight mb-4" style={pixelFont}>
            Three interview tracks
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Different interviews require different signals. Each mode uses its own questions, rubrics, and evaluation criteria.
          </p>
        </motion.div>

        {/* Track Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
          {tracks.map((track, index) => (
            <motion.div
              key={track.title}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: index * 0.08, ease: SMOOTH_EASE }}
              onClick={() => onSelectTrack?.(track.type)}
              className="group relative rounded-xl p-8 transition-colors duration-300 bg-black border border-border hover:border-zinc-700 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-sm font-bold text-primary">{track.num}</span>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3" style={pixelFont}>
                  {track.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {track.description}
                </p>
              </div>

              <div className="pt-4 border-t border-border/40">
                <span className="font-mono text-[10px] text-primary font-semibold tracking-widest uppercase">
                  {track.tag}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Architecture Differentiators */}
        <div id="features" className="pt-16 border-t border-white/[0.05]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: SMOOTH_EASE }}
            className="mb-16"
          >
            <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
              {"// ARCHITECTURE DIFFERENTIATORS"}
            </p>
            <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight mb-4" style={pixelFont}>
              More than a conversational AI
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              InterviewPilot separates conversation, retrieval, evaluation, and scoring instead of asking a language model to judge everything itself.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {differentiators.map((diff, index) => (
              <motion.div
                key={diff.num}
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: index * 0.08, ease: SMOOTH_EASE }}
                className="bg-black rounded-xl p-8 border border-border hover:border-zinc-700 transition-colors duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xl font-bold text-primary">{diff.num}</span>
                    <span className="font-mono text-[11px] text-primary bg-primary/10 border border-primary/30 px-2.5 py-1 rounded font-semibold">
                      {diff.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3" style={pixelFont}>
                    {diff.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {diff.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
