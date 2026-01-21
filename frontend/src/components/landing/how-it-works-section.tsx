"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AsciiWave } from "./ascii-wave";

const SMOOTH_EASE = [0.16, 1, 0.3, 1] as const;
const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };

const steps = [
  {
    number: "01",
    title: "Speak",
    label: "Candidate Voice",
    description: "Browser microphone audio is streamed through LiveKit/WebRTC.",
    code: `livekit.stream_audio({\n  codec: 'opus',\n  sample_rate: 48000,\n  transport: 'WebRTC'\n}) // Low-latency voice stream`,
  },
  {
    number: "02",
    title: "Transcribe",
    label: "Speech-to-Text",
    description: "Groq Whisper converts the finalized spoken response into text.",
    code: `groq.stt({\n  model: 'whisper-large-v3-turbo',\n  vad: SileroVAD(),\n  language: 'en'\n}) // Spoken transcript text`,
  },
  {
    number: "03",
    title: "Retrieve",
    label: "RAG Retrieval",
    description: "Local BGE embeddings and ChromaDB select the relevant interview card and rubric.",
    code: `chroma.query({\n  query_embeddings: bge_model.encode(topic),\n  top_k: 1,\n  where: { category: track, level: level }\n}) // Hit@1: 94.29% accuracy`,
  },
  {
    number: "04",
    title: "Interview",
    label: "AI Interviewer",
    description: "GPT-OSS 120B via Groq handles conversational interviewing and follow-up wording.",
    code: `groq.chat({\n  model: 'openai/gpt-oss-120b',\n  role: 'Alex (Interview Coach)',\n  temperature: 0.7\n}) // Spoken via Orpheus TTS`,
  },
  {
    number: "05",
    title: "Evaluate",
    label: "Structured Evaluation",
    description: "The candidate transcript is evaluated against predefined rubric criteria and validated as structured output.",
    code: `evaluator.evaluate({\n  model: 'openai/gpt-oss-120b',\n  response_format: AnswerEvaluationSchema,\n  rubric: card.criteria\n}) // Criterion-level evidence & scores`,
  },
  {
    number: "06",
    title: "Score",
    label: "Deterministic Scoring",
    description: "Python combines criterion scores with fixed rubric weights.",
    code: `weighted_score = sum(\n    c.score * c.weight for c in criteria\n) / total_rubric_weight\nfinal_score = round(weighted_score * 2.0, 1) # 1.0 - 10.0 scale`,
  },
  {
    number: "07",
    title: "Adapt",
    label: "Adaptive Probing",
    description: "Session state determines whether to probe deeper or move to the next question.",
    code: `if any(c.score <= 3 for c in evaluated_criteria):\n    trigger_adaptive_followup(focus=weakest_criterion)\nelse:\n    advance_to_next_question_card()`,
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const active = steps[activeStep];

  return (
    <section
      id="how-it-works"
      className="relative py-32 overflow-hidden bg-black"
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 grid-pattern opacity-15 pointer-events-none" />

      {/* ASCII Wave atmosphere — the flowing background effect */}
      <div className="absolute inset-0 opacity-25 pointer-events-none overflow-hidden">
        <AsciiWave className="w-full h-full" />
      </div>

      {/* Gradient fade from previous section (features = #030303) */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#030303] to-transparent pointer-events-none z-10" />
      {/* Gradient fade into next section (integrations = #030303) */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#030303] to-transparent pointer-events-none z-10" />

      <div className="relative z-20 max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: SMOOTH_EASE }}
          className="mb-20"
        >
          <p className="text-[10px] font-mono text-primary tracking-[0.2em] uppercase mb-4">
            // HOW IT WORKS
          </p>
          <h2
            className="text-3xl lg:text-[2.75rem] font-semibold tracking-tight text-white mb-4 leading-[1.15]"
            style={pixelFont}
          >
            From voice to grounded feedback
          </h2>
          <p className="text-sm text-white/40 max-w-xl leading-relaxed">
            A 7-stage deterministic pipeline executing voice transport,
            retrieval, evaluation, and adaptive probing.
          </p>
        </motion.div>

        {/* Content */}
        <div className="grid lg:grid-cols-12 gap-16 items-start">
          {/* Steps list */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, ease: SMOOTH_EASE }}
            className="lg:col-span-5"
          >
            {steps.map((step, index) => {
              const isActive = activeStep === index;
              return (
                <button
                  key={step.number}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className="group w-full text-left relative"
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-px transition-colors duration-300 ${
                      isActive ? "bg-primary/40" : "bg-white/[0.06]"
                    }`}
                  />

                  <div
                    className={`flex items-start gap-6 py-5 transition-all duration-300 ${
                      isActive ? "opacity-100" : "opacity-40 hover:opacity-70"
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] tabular-nums pt-0.5 shrink-0 transition-colors duration-300 ${
                        isActive ? "text-primary" : "text-white/30"
                      }`}
                    >
                      {step.number}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2.5 mb-1.5">
                        <span
                          className={`text-sm font-semibold tracking-tight transition-colors duration-300 ${
                            isActive ? "text-white" : "text-white/70"
                          }`}
                          style={pixelFont}
                        >
                          {step.title}
                        </span>
                        <span
                          className={`font-mono text-[9px] tracking-widest uppercase transition-colors duration-300 ${
                            isActive ? "text-primary" : "text-white/25"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      <p className="text-xs text-white/35 leading-relaxed">
                        {step.description}
                      </p>

                      {isActive && (
                        <div className="mt-3 h-px bg-white/[0.08] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full animate-[progress_4.5s_linear]"
                            style={{ width: "100%" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {index === steps.length - 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.06]" />
                  )}
                </button>
              );
            })}
          </motion.div>

          {/* Terminal panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.7, ease: SMOOTH_EASE }}
            className="lg:col-span-7 lg:sticky lg:top-28"
          >
            <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0a0a0a]">
              {/* Titlebar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    {["bg-white/10", "bg-white/10", "bg-white/10"].map(
                      (cls, i) => (
                        <div
                          key={i}
                          className={`w-2.5 h-2.5 rounded-full ${cls}`}
                        />
                      )
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-white/25">
                    pipeline_stage_{active.number}.py
                  </span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeStep}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="font-mono text-[9px] text-primary tracking-[0.18em] uppercase"
                  >
                    {active.label}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Code area */}
              <div className="px-6 py-8 min-h-[220px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.pre
                    key={activeStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: SMOOTH_EASE }}
                    className="font-mono text-[12px] leading-7 w-full"
                  >
                    {active.code.split("\n").map((line, i) => (
                      <div key={`${activeStep}-${i}`} className="flex gap-5">
                        <span className="text-white/15 select-none w-4 text-right shrink-0 tabular-nums">
                          {i + 1}
                        </span>
                        <span
                          dangerouslySetInnerHTML={{
                            __html: highlightCode(line),
                          }}
                        />
                      </div>
                    ))}
                  </motion.pre>
                </AnimatePresence>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.015]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="font-mono text-[10px] text-white/30">
                    Execution Pipeline Active
                  </span>
                </div>
                <span className="font-mono text-[10px] text-white/20 tabular-nums">
                  STAGE {active.number} / 07
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function highlightCode(line: string): string {
  const escaped = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const commentIdx = escaped.indexOf("//");
  const pyCommentIdx = escaped.indexOf("#");

  if (commentIdx !== -1) {
    const codePart = escaped.slice(0, commentIdx);
    const commentPart = escaped.slice(commentIdx);
    return (
      formatCodeTokens(codePart) +
      `<span class="text-white/20">${commentPart}</span>`
    );
  }
  if (pyCommentIdx !== -1) {
    const codePart = escaped.slice(0, pyCommentIdx);
    const commentPart = escaped.slice(pyCommentIdx);
    return (
      formatCodeTokens(codePart) +
      `<span class="text-white/20">${commentPart}</span>`
    );
  }

  return formatCodeTokens(escaped);
}

function formatCodeTokens(code: string): string {
  return code
    .replace(
      /(livekit|groq|chroma|bge_model|evaluator|sum|round|trigger_adaptive_followup|advance_to_next_question_card)/g,
      "___KW_$1___"
    )
    .replace(/('.*?'|".*?")/g, "___STR_$1___")
    .replace(/(stream_audio|stt|query|chat|evaluate|encode)/g, "___FN_$1___")
    .replace(
      /___KW_(.*?)___/g,
      '<span class="text-primary">$1</span>'
    )
    .replace(
      /___STR_(.*?)___/g,
      '<span class="text-white/55">$1</span>'
    )
    .replace(
      /___FN_(.*?)___/g,
      '<span class="text-white/80">$1</span>'
    );
}
