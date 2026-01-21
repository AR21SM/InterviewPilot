"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Plus } from "@phosphor-icons/react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal-effect";
import { FlipWords } from "@/components/ui/flip-words";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;
const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };

const tracks = [
  { type: "behavioral" as const, title: "Behavioral", kicker: "Tell stronger stories", description: "Practice ownership, conflict, ambiguity, and impact with follow-ups that test the depth behind your examples.", meta: "STAR · OWNERSHIP · IMPACT", colors: [[0, 229, 163]] },
  { type: "technical" as const, title: "Technical reasoning", kicker: "Think clearly, out loud", description: "Explain algorithms, complexity, and edge cases while the interviewer evaluates both correctness and communication.", meta: "DSA · COMPLEXITY · EDGE CASES", colors: [[0, 229, 163], [20, 184, 166]] },
  { type: "system_design" as const, title: "System design", kicker: "Defend every trade-off", description: "Work through architecture, scalability, reliability, storage, and failure modes in a realistic design conversation.", meta: "SCALE · RELIABILITY · TRADE-OFFS", colors: [[34, 197, 94], [0, 229, 163]] },
];

function TrackCard({ track, onSelect }: { track: (typeof tracks)[number]; onSelect?: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      className="group relative h-full min-h-[330px] cursor-pointer rounded-lg border border-white/15 p-2 transition-all duration-300 hover:border-white/35"
    >
      <Plus size={18} weight="regular" className="pointer-events-none absolute -left-[9px] -top-[9px] z-30 text-white" aria-hidden="true" />
      <Plus size={18} weight="regular" className="pointer-events-none absolute -right-[9px] -top-[9px] z-30 text-white" aria-hidden="true" />
      <Plus size={18} weight="regular" className="pointer-events-none absolute -bottom-[9px] -left-[9px] z-30 text-white" aria-hidden="true" />
      <Plus size={18} weight="regular" className="pointer-events-none absolute -bottom-[9px] -right-[9px] z-30 text-white" aria-hidden="true" />
      <GlowingEffect spread={46} glow disabled={false} proximity={72} inactiveZone={.01} variant="white" />
      <div className="relative h-full min-h-[312px] overflow-hidden rounded-sm bg-[#070807]">
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-300 ease-out",
            hovered ? "opacity-[0.92]" : "opacity-0"
          )}
          style={{ willChange: "opacity" }}
        >
          <CanvasRevealEffect
            animationSpeed={5.1}
            colors={track.colors}
            opacities={[.35, .45, .5, .6, .65, .72, .8, .86, .92, 1]}
            dotSize={2}
            containerClassName="bg-[#002f22]"
            showGradient={false}
            isActive={true}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        </div>
        <div className="relative z-10 flex h-full min-h-[312px] flex-col justify-end p-7 sm:p-8">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[.16em] text-primary">{track.kicker}</p>
            <h3 className="text-2xl font-semibold sm:text-[1.7rem]" style={pixelFont}>{track.title}</h3>
            <p className="mt-4 text-sm leading-6 text-white/50 transition-colors duration-200 group-hover:text-white/70">{track.description}</p>
          </div>
          <div className="mt-7 border-t border-white/[.07] pt-4">
            <span className="font-mono text-[9px] tracking-[.1em] text-white/35">{track.meta}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function FeaturesSection({ onSelectTrack }: { onSelectTrack?: (track: "behavioral" | "technical" | "system_design") => void }) {
  return (
    <section id="modes" className="section-rails relative overflow-hidden bg-[#030303] py-24 sm:py-32">
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        {/* Section 01: Modes */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .7, ease }} className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-primary">01 / Choose your interview</p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl" style={pixelFont}>
              Practice for the conversation you actually need to win.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/45">
            Each mode uses a purpose-built question set and scoring rubric, so the feedback fits the interview—not a generic chat.
          </p>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          {tracks.map((track, index) => (
            <motion.div key={track.type} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .6, delay: index * .08, ease }}>
              <TrackCard track={track} onSelect={() => onSelectTrack?.(track.type)} />
            </motion.div>
          ))}
        </div>

        {/* Section 02: Rules & Proof — Multi-Frame Gallery Wall Mosaic */}
        <div id="features" className="pt-28 sm:pt-36">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .7, ease }} className="mx-auto mb-12 max-w-4xl text-center">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-primary">02 / The rules behind the result</p>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl" style={pixelFont}>
              Every decision is <FlipWords words={["sourced.", "bounded.", "validated.", "honest."]} duration={2400} className="px-1 text-primary" />
            </h2>
          </motion.div>

          {/* Gallery Wall Photo Frame Mosaic (Interlocking Rectangles & Squares) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* Frame 1: Tall Portrait Rectangle (4 cols, 2 rows tall) */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, ease }}
              className="md:col-span-4 md:row-span-2 flex flex-col"
            >
              <article className="group relative h-full rounded-lg border border-white/10 p-2 md:p-2.5 transition-all duration-300 hover:border-white/25">
                <GlowingEffect spread={42} glow disabled={false} proximity={68} inactiveZone={0.01} borderWidth={1} movementDuration={0.35} />
                <div className="relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden rounded-sm border border-white/[.04] bg-[#070807] p-6 sm:p-7">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/[.07] pb-3.5">
                      <span className="font-mono text-[9px] text-white/20">01</span>
                      <span className="font-mono text-[9px] uppercase tracking-[.14em] text-primary">Provenance</span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold sm:text-2xl" style={pixelFont}>
                      Curated prompts, not blank chat
                    </h3>
                    <p className="mt-3 text-xs leading-5 text-white/50">
                      Each question comes from a typed card matched to the chosen track and level, with its rubric and expected signals attached.
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/[.06]">
                    <p className="mb-2 font-mono text-[8px] uppercase tracking-[.16em] text-white/30">Source Integrity</p>
                    <div className="grid gap-1.5">
                      {["Track & level matched", "Rubric weights validated", "Expected signals attached"].map((s) => (
                        <div key={s} className="flex items-center justify-between rounded-xs bg-[#090a09] border border-white/[.04] px-3 py-2">
                          <span className="text-[11px] text-white/60">{s}</span>
                          <span className="size-1 rounded-full bg-primary shadow-[0_0_8px_rgba(0,229,163,.7)]" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </motion.div>

            {/* Frame 2: Wide Landscape Rectangle (8 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: 0.08, ease }}
              className="md:col-span-8 flex flex-col"
            >
              <article className="group relative h-full rounded-lg border border-white/10 p-2 md:p-2.5 transition-all duration-300 hover:border-white/25">
                <GlowingEffect spread={42} glow disabled={false} proximity={68} inactiveZone={0.01} borderWidth={1} movementDuration={0.35} />
                <div className="relative flex h-full min-h-[14rem] flex-col justify-between overflow-hidden rounded-sm border border-white/[.04] bg-[#070807] p-6 sm:p-7">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/[.07] pb-3.5">
                      <span className="font-mono text-[9px] text-white/20">02</span>
                      <span className="font-mono text-[9px] uppercase tracking-[.14em] text-primary">Deterministic Scoring</span>
                    </div>
                    <div className="mt-4 flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
                      <h3 className="text-xl font-semibold sm:text-2xl" style={pixelFont}>
                        Scores computed, not improvised
                      </h3>
                      <span className="font-mono text-[9px] text-primary">Fixed Rubric Weights</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/50 max-w-xl">
                      The evaluator returns 1–5 criterion scores; application code applies the card’s fixed weights and normalizes the result to 10.
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-white/[.06] flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-xs bg-[#090a09] border border-white/[.04] px-3 py-1.5 font-mono text-[10px] text-white/60">
                      <span>1–5 Criteria Evaluation</span>
                    </div>
                    <span className="text-white/20 text-xs">→</span>
                    <div className="flex items-center gap-1.5 rounded-xs bg-[#090a09] border border-white/[.04] px-3 py-1.5 font-mono text-[10px] text-white/60">
                      <span>Weight Arithmetic</span>
                    </div>
                    <span className="text-white/20 text-xs">→</span>
                    <div className="flex items-center gap-1.5 rounded-xs bg-[#090a09] border border-white/[.04] px-3 py-1.5 font-mono text-[10px] text-white/60">
                      <span>Normalized 10.0 Index</span>
                    </div>
                  </div>
                </div>
              </article>
            </motion.div>

            {/* Frame 3: Square Frame (4 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: 0.12, ease }}
              className="md:col-span-4 flex flex-col"
            >
              <article className="group relative h-full rounded-lg border border-white/10 p-2 md:p-2.5 transition-all duration-300 hover:border-white/25">
                <GlowingEffect spread={42} glow disabled={false} proximity={68} inactiveZone={0.01} borderWidth={1} movementDuration={0.35} />
                <div className="relative flex h-full min-h-[14rem] flex-col justify-between overflow-hidden rounded-sm border border-white/[.04] bg-[#070807] p-6 sm:p-7">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/[.07] pb-3.5">
                      <span className="font-mono text-[9px] text-white/20">03</span>
                      <span className="font-mono text-[9px] uppercase tracking-[.14em] text-primary">Bounded Adaptivity</span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold sm:text-2xl" style={pixelFont}>
                      One focused follow-up
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-white/50">
                      A score of 3 or below can trigger one card-authored probe; otherwise the session advances.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[.06] flex items-center justify-between font-mono text-[9px] text-white/35">
                    <span>Session rule</span>
                    <span className="text-primary font-semibold">One probe max</span>
                  </div>
                </div>
              </article>
            </motion.div>

            {/* Frame 4: Square Frame (4 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: 0.16, ease }}
              className="md:col-span-4 flex flex-col"
            >
              <article className="group relative h-full rounded-lg border border-white/10 p-2 md:p-2.5 transition-all duration-300 hover:border-white/25">
                <GlowingEffect spread={42} glow disabled={false} proximity={68} inactiveZone={0.01} borderWidth={1} movementDuration={0.35} />
                <div className="relative flex h-full min-h-[14rem] flex-col justify-between overflow-hidden rounded-sm border border-white/[.04] bg-[#070807] p-6 sm:p-7">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/[.07] pb-3.5">
                      <span className="font-mono text-[9px] text-white/20">04</span>
                      <span className="font-mono text-[9px] uppercase tracking-[.14em] text-primary">Auditable Evidence</span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold sm:text-2xl" style={pixelFont}>
                      Evidence for every criterion
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-white/50">
                      Each criterion result includes a concrete evidence snippet from the candidate transcript.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[.06] flex items-center justify-between font-mono text-[9px] text-white/35">
                    <span>Evaluation output</span>
                    <span className="text-primary font-semibold">Evidence required</span>
                  </div>
                </div>
              </article>
            </motion.div>

            {/* Frame 5: Wide Landscape Rectangle (7 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
              className="md:col-span-7 flex flex-col"
            >
              <article className="group relative h-full rounded-lg border border-white/10 p-2 md:p-2.5 transition-all duration-300 hover:border-white/25">
                <GlowingEffect spread={42} glow disabled={false} proximity={68} inactiveZone={0.01} borderWidth={1} movementDuration={0.35} />
                <div className="relative flex h-full min-h-[14rem] flex-col justify-between overflow-hidden rounded-sm border border-white/[.04] bg-[#070807] p-6 sm:p-7">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/[.07] pb-3.5">
                      <span className="font-mono text-[9px] text-white/20">05</span>
                      <span className="font-mono text-[9px] uppercase tracking-[.14em] text-primary">Voice pipeline</span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold sm:text-2xl" style={pixelFont}>
                      Voice in, spoken coaching out
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-white/50 max-w-lg">
                      LiveKit carries the session while Groq handles speech-to-text, interviewer reasoning, and text-to-speech.
                    </p>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-white/[.06] flex items-center justify-between font-mono text-[9px] text-white/40">
                    <span>Real-time transport</span>
                    <span className="text-primary">LiveKit + Groq</span>
                  </div>
                </div>
              </article>
            </motion.div>

            {/* Frame 6: Square Frame (5 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, delay: 0.24, ease }}
              className="md:col-span-5 flex flex-col"
            >
              <article className="group relative h-full rounded-lg border border-white/10 p-2 md:p-2.5 transition-all duration-300 hover:border-white/25">
                <GlowingEffect spread={42} glow disabled={false} proximity={68} inactiveZone={0.01} borderWidth={1} movementDuration={0.35} />
                <div className="relative flex h-full min-h-[14rem] flex-col justify-between overflow-hidden rounded-sm border border-white/[.04] bg-[#070807] p-6 sm:p-7">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/[.07] pb-3.5">
                      <span className="font-mono text-[9px] text-white/20">06</span>
                      <span className="font-mono text-[9px] uppercase tracking-[.14em] text-primary">Honest Scope</span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold sm:text-2xl" style={pixelFont}>
                      Built for rehearsal
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-white/50">
                      A focused practice session with rubric-based feedback—not a prediction about any real hiring decision.
                    </p>
                  </div>
                  <div className="mt-5 pt-3.5 border-t border-white/[.06] flex items-center justify-between font-mono text-[9px] text-white/40">
                    <span>Session state</span>
                    <span className="text-primary font-semibold">In memory</span>
                  </div>
                </div>
              </article>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
