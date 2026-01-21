"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AsciiCube } from "./ascii-cube";
import { AsciiSphere } from "./ascii-sphere";

const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };
const SMOOTH_EASE = [0.16, 1, 0.3, 1] as const;

export function CtaSection({ onStartClick }: { onStartClick?: () => void }) {
  return (
    <section className="relative py-32 overflow-hidden bg-black">
      {/* Top gradient separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Subtle grid */}
      <div className="absolute inset-0 grid-pattern opacity-15 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.9, ease: SMOOTH_EASE }}
          className="relative rounded-2xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-foreground" />
          <div className="absolute inset-0 grid-pattern opacity-10" />

          {/* ASCII cube background animation */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 overflow-hidden opacity-25">
            <AsciiCube className="w-[600px] h-[500px]" />
          </div>

          <div className="relative z-10 px-8 lg:px-16 py-16 lg:py-12 bg-transparent">
            <div className="flex items-center justify-between gap-8">
              <div className="max-w-2xl">
                <h2
                  className="font-mono text-3xl lg:text-5xl font-semibold tracking-tight mb-6 text-background text-balance"
                  style={pixelFont}
                >
                  Ready to practice?
                </h2>

                <p className="text-lg text-background/70 mb-8 leading-relaxed max-w-lg">
                  Run a focused voice interview and receive rubric-grounded feedback on every answer.
                </p>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <button
                    onClick={onStartClick}
                    className="inline-flex items-center gap-2 bg-background hover:bg-background/90 text-foreground px-6 h-12 text-sm font-medium rounded-lg font-mono group transition-colors"
                  >
                    Start Practice
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <a href="#how-it-works">
                    <button className="inline-flex items-center h-12 px-6 text-sm font-medium border border-background/30 text-background hover:bg-background/10 bg-transparent font-mono rounded-lg transition-colors">
                      How It Works
                    </button>
                  </a>
                </div>
              </div>

              {/* ASCII Sphere */}
              <div className="hidden lg:block opacity-40">
                <AsciiSphere className="w-[500px] h-[460px]" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
