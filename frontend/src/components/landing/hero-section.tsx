"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AsciiWave } from "./ascii-wave";

const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };
const SMOOTH_EASE = [0.16, 1, 0.3, 1] as const;

export function HeroSection({ onStartClick }: { onStartClick?: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20 bg-black">
      {/* Subtle grid */}
      <div className="absolute inset-0 grid-pattern opacity-50 pointer-events-none" />

      {/* ASCII Wave — full bleed, hero-exclusive atmospheric effect */}
      <div className="absolute inset-0 opacity-75 pointer-events-none overflow-hidden">
        <AsciiWave className="w-full h-full" />
      </div>

      {/* Gradient fade at bottom — bleeds into the features section (#030303) */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#030303] to-transparent pointer-events-none z-10" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 py-12 lg:py-24">
        {/* Headline */}
        <div className="text-center max-w-5xl mx-auto mb-10">
          <motion.h1
            initial={{ opacity: 0, y: 24, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: SMOOTH_EASE }}
            className="font-mono text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[0.98] mb-8"
            style={pixelFont}
          >
            Practice interviews with an AI that{" "}
            <span className="text-primary">listens, evaluates, and adapts.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: SMOOTH_EASE }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Conduct realistic voice interviews with question-specific rubrics, structured answer evaluation, and adaptive follow-ups, all delivered in real time.
          </motion.p>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: SMOOTH_EASE }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20"
        >
          <button
            onClick={onStartClick}
            className="inline-flex items-center gap-2 bg-foreground hover:bg-foreground/90 text-background px-6 h-11 text-sm font-medium rounded-lg font-mono group transition-colors"
          >
            Start Practice
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <a href="#how-it-works">
            <button className="inline-flex items-center h-11 px-6 text-sm font-medium border border-border hover:bg-secondary/50 bg-transparent rounded-lg font-mono text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </button>
          </a>
        </motion.div>

        {/* Four stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: SMOOTH_EASE }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl border border-border overflow-hidden card-shadow"
        >
          {[
            {
              value: "Real-Time Voice",
              label: "Audio Streaming",
              desc: "Speak naturally with an AI interviewer.",
              company: "CORE BENEFIT 01",
            },
            {
              value: "Adaptive Follow-Ups",
              label: "Dynamic Probing",
              desc: "Questions change based on your answers.",
              company: "CORE BENEFIT 02",
            },
            {
              value: "Rubric-Based Feedback",
              label: "Structured Evaluation",
              desc: "Every response is evaluated against clear criteria.",
              company: "CORE BENEFIT 03",
            },
            {
              value: "Detailed Reports",
              label: "Actionable Insights",
              desc: "See scores, strengths, and areas to improve.",
              company: "CORE BENEFIT 04",
            },
          ].map((stat, idx) => (
            <motion.div
              key={stat.company}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 + idx * 0.06, ease: SMOOTH_EASE }}
              className="p-6 lg:p-8 flex justify-between min-h-[160px] bg-black shadow-none flex-col"
            >
              <div>
                <span className="text-xl lg:text-2xl font-bold text-foreground block mb-1" style={pixelFont}>
                  {stat.value}
                </span>
                <span className="text-xs font-semibold text-primary block mb-1 font-mono">
                  {stat.label}
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed block">
                  {stat.desc}
                </span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground/60 tracking-widest mt-4">
                {stat.company}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
