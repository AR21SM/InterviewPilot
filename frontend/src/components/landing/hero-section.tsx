"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AsciiWave } from "./ascii-wave";
import { FlipWords } from "@/components/ui/flip-words";

const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };
const SMOOTH_EASE = [0.16, 1, 0.3, 1] as const;

export function HeroSection({ onStartClick }: { onStartClick?: () => void }) {
  return (
    <section className="relative flex min-h-[100svh] flex-col justify-center overflow-x-hidden bg-black pt-16 sm:pt-20">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 grid-pattern opacity-45 pointer-events-none"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 65%, transparent 90%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 65%, transparent 90%)",
        }}
      />

      {/* ASCII Wave — smooth fade starting around the stat cards */}
      <div
        className="absolute inset-0 opacity-75 pointer-events-none overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 58%, transparent 86%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 58%, transparent 86%)",
        }}
      >
        <AsciiWave className="w-full h-full" />
      </div>

      {/* Smooth darkness fade covering bottom area */}
      <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#030303] via-[#030303]/75 to-transparent pointer-events-none z-10" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-[clamp(2rem,6vh,6rem)]">
        {/* Headline */}
        <div className="mx-auto mb-7 max-w-5xl text-center sm:mb-9">
          <motion.h1
            initial={{ opacity: 0, y: 24, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: SMOOTH_EASE }}
            className="mb-5 font-mono text-[clamp(2.5rem,5.2vw,4.5rem)] font-semibold leading-[.98] tracking-tight sm:mb-7"
            style={pixelFont}
          >
            Practice interviews with an AI that{" "}
            <span className="inline-flex min-w-[6ch] justify-center text-primary">
              <FlipWords
                words={["listens deeply.", "evaluates fairly.", "adapts to you."]}
                duration={2400}
                className="px-1 text-primary"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: SMOOTH_EASE }}
            className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:text-lg"
          >
            Rehearse the exact conversation ahead of you, out loud, with an interviewer that waits for your reasoning before it responds.
          </motion.p>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: SMOOTH_EASE }}
          className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:mb-[clamp(2.5rem,7vh,5rem)]"
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
          className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border shadow-2xl shadow-black sm:grid-cols-2 lg:grid-cols-4"
        >
          {[
            { value: "Live Conversation", label: "Voice-First Practice", desc: "Answer naturally—no forms or scripted chat.", company: "SESSION FACT 01" },
            { value: "Role-Aware Setup", label: "Your Context", desc: "Choose the track, level, role, and focus area.", company: "SESSION FACT 02" },
            { value: "Finite Rounds", label: "3 or 5 Questions", desc: "A focused rehearsal with a clear stopping point.", company: "SESSION FACT 03" },
            { value: "Three Tracks", label: "Purpose-Built Modes", desc: "Behavioral, technical reasoning, or system design.", company: "SESSION FACT 04" },
          ].map((stat, idx) => (
            <motion.div
              key={stat.company}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 + idx * 0.06, ease: SMOOTH_EASE }}
              className="flex min-h-[132px] flex-col justify-between bg-black p-5 shadow-none lg:min-h-[clamp(8.25rem,16vh,10rem)] lg:p-6"
            >
              <div>
                <span className="mb-1 block text-xl font-bold text-foreground lg:text-[clamp(1.2rem,1.45vw,1.5rem)]" style={pixelFont}>{stat.value}</span>
                <span className="text-xs font-semibold text-primary block mb-1 font-mono">{stat.label}</span>
                <span className="text-muted-foreground text-xs leading-relaxed block">{stat.desc}</span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground/60 tracking-widest mt-4">{stat.company}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
