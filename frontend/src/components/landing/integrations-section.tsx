"use client";

import { motion } from "motion/react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };
const ease = [0.16, 1, 0.3, 1] as const;

const criteria = [
  { name: "Problem Framing", score: "9.0", width: "90%" },
  { name: "Technical Architecture", score: "7.8", width: "78%" },
  { name: "Communication Clarity", score: "8.4", width: "84%" },
  { name: "Failure Mode Reliability", score: "6.1", width: "61%" },
];

export function IntegrationsSection() {
  return (
    <section id="evaluation" className="section-rails relative overflow-hidden bg-[#030303] py-24 sm:py-32">
      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end"
        >
          <div className="max-w-2xl">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-primary">
              04 / Post-interview intelligence
            </p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl" style={pixelFont}>
              Know what worked, what failed, and what to drill next.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/45">
            Every score connects to transcript evidence. No generic praise and no unexplained AI verdicts.
          </p>
        </motion.div>

        {/* Gallery Wall Frame Composition (Rectangles + Squares) without + marks */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Frame 1: Wide Rectangle Frame (8 cols) — Scorecard & Dimension Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, ease }}
            className="lg:col-span-8 min-h-[22rem]"
          >
            <article className="group relative h-full rounded-lg border border-white/10 p-2 md:p-3 transition-all duration-300 hover:border-white/25">
              <GlowingEffect spread={42} glow disabled={false} proximity={68} inactiveZone={0.01} borderWidth={1} movementDuration={0.35} />

              <div className="relative flex h-full min-h-[21rem] flex-col justify-between overflow-hidden rounded-sm border border-white/[.04] bg-[#070807] p-6 sm:p-8">
                <div>
                  <div className="flex items-center justify-between border-b border-white/[.07] pb-4">
                    <span className="font-mono text-[9px] text-white/25">01</span>
                    <span className="font-mono text-[9px] uppercase tracking-[.15em] text-primary">
                      Session Scorecard
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-[9px] uppercase tracking-[.14em] text-white/30">
                        24 min · System Design
                      </span>
                    </div>
                    <h3 className="mt-2 text-2xl font-semibold sm:text-3xl text-white" style={pixelFont}>
                      Design a distributed rate limiter
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">
                      Strong structure and sound trade-off analysis. Reliability depth is the clearest opportunity before your next interview.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/[.06]">
                  <p className="mb-3.5 font-mono text-[8px] uppercase tracking-[.16em] text-white/25">
                    Competency Signal Breakdown
                  </p>
                  <div className="space-y-3">
                    {criteria.map((item, idx) => (
                      <div key={item.name} className="grid grid-cols-[10rem_1fr_2.5rem] items-center gap-3">
                        <span className="text-xs text-white/70 font-medium truncate">{item.name}</span>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/[.06]">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: item.width }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: idx * 0.08, ease }}
                            className="h-full bg-primary"
                          />
                        </div>
                        <span className="font-mono text-xs text-primary text-right font-semibold">{item.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </motion.div>

          {/* Frame 2: Square Frame (4 cols) — Overall Readiness Score Display */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.08, ease }}
            className="lg:col-span-4 min-h-[22rem]"
          >
            <article className="group relative h-full rounded-lg border border-white/10 p-2 md:p-3 transition-all duration-300 hover:border-white/25">
              <GlowingEffect spread={42} glow disabled={false} proximity={68} inactiveZone={0.01} borderWidth={1} movementDuration={0.35} />

              <div className="relative flex h-full min-h-[21rem] flex-col justify-between overflow-hidden rounded-sm border border-white/[.04] bg-[#070807] p-6 sm:p-8">
                <div>
                  <div className="flex items-center justify-between border-b border-white/[.07] pb-4">
                    <span className="font-mono text-[9px] text-white/25">02</span>
                    <span className="font-mono text-[9px] uppercase tracking-[.15em] text-primary">
                      Readiness Index
                    </span>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-baseline gap-2">
                      <strong className="text-5xl sm:text-6xl font-bold text-primary tracking-tight" style={pixelFont}>
                        7.8
                      </strong>
                      <span className="font-mono text-sm text-white/30">/ 10</span>
                    </div>

                    <h4 className="mt-3 text-lg font-semibold text-white">
                      Strong hire signal
                    </h4>
                    <p className="mt-2 text-xs leading-5 text-white/50">
                      Synthesized across 4 core competencies using fixed rubric weights.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[.06] flex items-center justify-between font-mono text-[9px] text-white/35">
                  <span>Deterministic evaluation</span>
                  <span className="text-primary font-semibold">Verified</span>
                </div>
              </div>
            </article>
          </motion.div>

          {/* Frame 3: Square Frame (4 cols) — Verbatim Evidence Citation */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.14, ease }}
            className="lg:col-span-4 min-h-[20rem]"
          >
            <article className="group relative h-full rounded-lg border border-white/10 p-2 md:p-3 transition-all duration-300 hover:border-white/25">
              <GlowingEffect spread={42} glow disabled={false} proximity={68} inactiveZone={0.01} borderWidth={1} movementDuration={0.35} />

              <div className="relative flex h-full min-h-[19rem] flex-col justify-between overflow-hidden rounded-sm border border-white/[.04] bg-[#070807] p-6 sm:p-7">
                <div>
                  <div className="flex items-center justify-between border-b border-white/[.07] pb-4">
                    <span className="font-mono text-[9px] text-white/25">03</span>
                    <span className="font-mono text-[9px] uppercase tracking-[.15em] text-primary">
                      Grounded Evidence
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold sm:text-2xl text-white" style={pixelFont}>
                    Verbatim citation
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-white/50">
                    Every judgment links back to observable transcript language.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[.06]">
                  <span className="block font-mono text-[8px] uppercase tracking-[.16em] text-white/30 mb-2">
                    Spoken Candidate Response
                  </span>
                  <p className="text-xs leading-6 text-white/80 font-normal italic">
                    “I would use a token bucket in Redis and shard counters by customer with a local fallback for low-risk endpoints.”
                  </p>
                  <div className="mt-4 flex items-center justify-between font-mono text-[9px] text-white/35">
                    <span>Signal verified</span>
                    <span className="text-primary font-semibold">Distributed Rate Limiter</span>
                  </div>
                </div>
              </div>
            </article>
          </motion.div>

          {/* Frame 4: Wide Rectangle Frame (8 cols) — Highest-Impact Action & Rehearsal */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="lg:col-span-8 min-h-[20rem]"
          >
            <article className="group relative h-full rounded-lg border border-white/10 p-2 md:p-3 transition-all duration-300 hover:border-white/25">
              <GlowingEffect spread={42} glow disabled={false} proximity={68} inactiveZone={0.01} borderWidth={1} movementDuration={0.35} />

              <div className="relative flex h-full min-h-[19rem] flex-col justify-between overflow-hidden rounded-sm border border-white/[.04] bg-[#070807] p-6 sm:p-8">
                <div>
                  <div className="flex items-center justify-between border-b border-white/[.07] pb-4">
                    <span className="font-mono text-[9px] text-white/25">04</span>
                    <span className="font-mono text-[9px] uppercase tracking-[.15em] text-primary">
                      Next Best Rehearsal
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-xl font-semibold sm:text-2xl text-white" style={pixelFont}>
                      Make the failure path as clear as the happy path
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">
                      Explain what happens when Redis is unavailable, then declare whether the limiter fails open or closed—and why.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/[.06] flex items-center justify-between font-mono text-[9px]">
                  <span className="text-white/35 uppercase tracking-[.14em]">
                    Targeted Practice Focus
                  </span>
                  <span className="text-primary font-semibold">
                    System Design · Reliability Focus (3 questions)
                  </span>
                </div>
              </div>
            </article>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
