"use client";

import { motion } from "motion/react";

const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };
const ease = [0.16, 1, 0.3, 1] as const;

export function CtaSection({ onStartClick }: { onStartClick?: () => void }) {
  return (
    <section className="section-rails relative overflow-hidden bg-black py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease }}
        >
          <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#070807]">
            <div className="grid min-h-[390px] lg:grid-cols-[1.35fr_.65fr]">
              {/* Left Column */}
              <div className="flex flex-col justify-center border-b border-white/[.07] p-8 sm:p-12 lg:border-b-0 lg:border-r lg:p-16">
                <p className="mb-5 font-mono text-[10px] uppercase tracking-[.2em] text-primary">
                  05 / Start your next practice round
                </p>
                <h2
                  className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl"
                  style={pixelFont}
                >
                  The next interview should not be your first rehearsal.
                </h2>
              </div>

              {/* Right Column */}
              <div className="flex flex-col justify-center p-8 sm:p-12">
                <p className="text-base leading-7 text-white/50">
                  Pick the conversation ahead of you and practice it out loud while the stakes are still low.
                </p>
                <button
                  onClick={onStartClick}
                  className="mt-8 h-12 w-fit rounded-lg bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-primary cursor-pointer"
                >
                  Start practice
                </button>
                <p className="mt-5 font-mono text-[9px] uppercase tracking-[.14em] text-white/25">
                  No sign-up · Live voice · Focused session
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
