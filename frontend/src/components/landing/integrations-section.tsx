"use client";

import { motion } from "framer-motion";

const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };
const SMOOTH_EASE = [0.16, 1, 0.3, 1] as const;

const reportCards = [
  {
    label: "Overall Score",
    value: "7.8 / 10",
    desc: "Deterministic rubric weighting",
  },
  {
    label: "Questions Completed",
    value: "3 Questions",
    desc: "Full session transcript",
  },
  {
    label: "Criterion Performance",
    value: "5 Rubric Axes",
    desc: "Per-answer evidence tags",
  },
  {
    label: "Telemetry Metrics",
    value: "Latency Logs",
    desc: "STT, RAG & LLM breakdown",
  },
];

const principles = [
  {
    title: "Grounded",
    description: "Evaluation criteria come from curated interview cards rather than being invented at runtime.",
    code: "// Rubric grounded in JSON cards",
  },
  {
    title: "Inspectable",
    description: "Structured outputs expose criterion scores and supporting evidence.",
    code: "// Explicit evidence & criterion scores",
  },
  {
    title: "Deterministic",
    description: "Session state and final numerical scoring stay outside the LLM.",
    code: "// Python weighted score calculation",
  },
];

export function IntegrationsSection() {
  return (
    <section
      id="evaluation"
      className="relative py-32 overflow-hidden bg-[#030303]"
    >
      {/* Top gradient separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      {/* Bottom gradient separator */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: SMOOTH_EASE }}
          className="max-w-3xl mb-16"
        >
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
            {"// FINAL REPORT & FEEDBACK"}
          </p>
          <h2
            className="text-3xl lg:text-5xl font-semibold tracking-tight mb-4 text-balance"
            style={pixelFont}
          >
            Every session ends with actionable feedback
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            InterviewPilot combines individual answer evaluations into a structured session report with evidence and improvement notes.
          </p>
        </motion.div>

        {/* Report stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {reportCards.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: index * 0.08, ease: SMOOTH_EASE }}
              className="bg-black p-6 rounded-xl border border-border hover:border-zinc-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs text-muted-foreground block mb-4">
                  {item.label}
                </span>
                <span className="text-2xl font-bold text-foreground block mb-2" style={pixelFont}>
                  {item.value}
                </span>
              </div>
              <span className="text-xs font-mono text-muted-foreground/60 block pt-3 border-t border-border/40">
                {item.desc}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Engineering Principles */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: SMOOTH_EASE }}
          className="pt-12 border-t border-white/[0.05] mb-12"
        >
          <p className="text-xs font-mono text-primary tracking-widest uppercase mb-3">
            {"// ENGINEERING PRINCIPLES"}
          </p>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-4" style={pixelFont}>
            Designed for control, not just generation
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {principles.map((p, index) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: index * 0.08, ease: SMOOTH_EASE }}
              className="bg-black rounded-xl p-8 border border-border hover:border-zinc-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-xs text-primary block mb-3">{p.code}</span>
                <h3 className="text-xl font-bold text-foreground mb-3" style={pixelFont}>
                  {p.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
