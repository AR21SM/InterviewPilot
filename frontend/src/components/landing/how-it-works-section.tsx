"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, ArrowRight, TerminalWindow } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;
const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };

const steps = [
  {
    number: "01",
    title: "Speak",
    label: "Candidate voice",
    category: "VOICE TRANSPORT",
    description: "Browser microphone audio enters the LiveKit room and stays active for a natural, hands-free conversation.",
    metric: "Live WebRTC Room",
    signal: "Candidate and interviewer share one real-time audio session.",
    input: { tag: "INPUT", title: "Microphone Audio", detail: "Browser audio track" },
    engine: { tag: "ENGINE", title: "LiveKit WebRTC", detail: "Room audio transport" },
    output: { tag: "OUTPUT", title: "Candidate Voice Turn", detail: "Agent audio input" },
    code: "microphone → LiveKit room → agent audio input",
    payload: {
      transport: "WebRTC SFU",
      subscription: "audio only",
      room_state: "connected",
      controls: "mute / unmute",
    },
  },
  {
    number: "02",
    title: "Transcribe",
    label: "Speech to text",
    category: "SPEECH RECOGNITION",
    description: "Finalized voice turns are converted to text before retrieval and evaluation use the candidate’s answer.",
    metric: "Whisper Large v3 Turbo",
    signal: "Only final transcript events enter the evaluation flow.",
    input: { tag: "INPUT", title: "Voice Audio Buffer", detail: "Processed audio turn" },
    engine: { tag: "ENGINE", title: "Groq Whisper", detail: "whisper-large-v3-turbo" },
    output: { tag: "OUTPUT", title: "Final Transcript", detail: "Candidate answer text" },
    code: "voice turn → Groq Whisper → final transcript",
    payload: {
      engine: "whisper-large-v3",
      event: "user_input_transcribed",
      final_only: "true",
      language: "spoken answer",
    },
  },
  {
    number: "03",
    title: "Retrieve",
    label: "Grounded context",
    category: "VECTOR RETRIEVAL",
    description: "Local BGE embeddings and ChromaDB select an unused card that matches the configured track and experience level.",
    metric: "94.29% Hit@1",
    signal: "The selected question and its rubric come from the repository’s curated knowledge cards.",
    input: { tag: "INPUT", title: "Session Metadata", detail: "Role · Level · Topic" },
    engine: { tag: "ENGINE", title: "BGE + ChromaDB", detail: "Local vector retrieval" },
    output: { tag: "OUTPUT", title: "Interview Card", detail: "Question + rubric + signals" },
    code: "embed(session_context) → chromadb.query(k=1) → grounded_interview_card",
    payload: {
      card_id: "distributed_rate_limiter",
      topic: "System Design",
      filter: "track + level",
      result_count: 1,
    },
  },
  {
    number: "04",
    title: "Interview",
    label: "Live conversation",
    category: "CONVERSATIONAL AGENT",
    description: "The Groq-backed voice agent asks one card at a time and waits for the candidate’s finalized response.",
    metric: "One Question at a Time",
    signal: "Conversation behavior is constrained by the selected track, level, role, and topic.",
    input: { tag: "INPUT", title: "Transcript + Card", detail: "Full conversation history" },
    engine: { tag: "ENGINE", title: "Groq Voice Agent", detail: "Configured LLM + TTS" },
    output: { tag: "OUTPUT", title: "Spoken Prompt", detail: "Question or bounded follow-up" },
    code: "session state + card → interviewer prompt → spoken turn",
    payload: {
      role: "AI interview coach",
      interruptions: "allowed",
      question_mode: "single turn",
      context: "session config",
    },
  },
  {
    number: "05",
    title: "Evaluate",
    label: "Rubric evidence",
    category: "EVIDENCE EXTRACTION",
    description: "The finalized answer is assessed against the selected card’s rubric and parsed into a strict Pydantic schema.",
    metric: "Structured Evaluation",
    signal: "Each returned criterion includes a score, evidence, and an optional improvement.",
    input: { tag: "INPUT", title: "Candidate Transcript", detail: "Answer turn text" },
    engine: { tag: "ENGINE", title: "Structured Evaluator", detail: "Schema-enforced JSON validation" },
    output: { tag: "OUTPUT", title: "Criterion Evidence", detail: "Strengths & gap citations" },
    code: "transcript + rubric → Groq evaluator → Pydantic validation",
    payload: {
      criterion_scores: "1–5",
      evidence: "required",
      improvements: "up to 2",
      status: "success / failed",
    },
  },
  {
    number: "06",
    title: "Score",
    label: "Fixed weighting",
    category: "DETERMINISTIC SCORING",
    description: "Application code combines validated criterion scores with the weights stored on the selected interview card.",
    metric: "Fixed Weighted Score",
    signal: "The evaluator supplies dimensions; the scoring function supplies the final arithmetic.",
    input: { tag: "INPUT", title: "Dimension Scores", detail: "1-5 point rubric ratings" },
    engine: { tag: "ENGINE", title: "Deterministic Python", detail: "Weighted linear aggregation" },
    output: { tag: "OUTPUT", title: "Readiness Index", detail: "1-10 scaled benchmark" },
    code: "sum(c.score * c.weight for c in criteria) / total_weight → final_rating",
    payload: {
      method: "deterministic_weights",
      readiness: "7.8 / 10",
      source: "validated criteria",
      display_scale: "1–10",
    },
  },
  {
    number: "07",
    title: "Adapt",
    label: "Next best probe",
    category: "ADAPTIVE CURRICULUM",
    description: "A criterion at 3 or below can trigger one card-authored follow-up; otherwise the session advances to an unused card.",
    metric: "One Follow-up Maximum",
    signal: "The rule is finite: probe once, advance, and stop at the configured question count.",
    input: { tag: "INPUT", title: "Evaluation Matrix", detail: "Weak & strong signal flags" },
    engine: { tag: "ENGINE", title: "Session Policy", detail: "Weakest-criterion threshold" },
    output: { tag: "OUTPUT", title: "Next Session Action", detail: "Follow-up, advance, or finish" },
    code: "score ≤ 3 and follow_up_unused → probe; else → advance",
    payload: {
      action: "probe_failure_mode",
      target_signal: "reliability_fallback",
      follow_up_budget: 1,
    },
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(2);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 5600);
    return () => window.clearInterval(interval);
  }, []);

  const active = steps[activeStep];

  return (
    <section id="how-it-works" className="section-rails relative overflow-hidden bg-black py-24 sm:py-32">
      <div className="absolute inset-0 grid-pattern opacity-10" />
      <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease }}
          className="mb-14 grid gap-7 lg:grid-cols-[1fr_.62fr] lg:items-end"
        >
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[.2em] text-primary">03 / Inside one interview turn</p>
            <h2 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl" style={pixelFont}>
              Follow one answer from microphone to the next question.
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-7 text-white/50 lg:justify-self-end">
            Select any stage to inspect the real input, component, event payload, and output used by this project.
          </p>
        </motion.div>

        {/* Master Bento Container with Sharp 90-Degree Corners & Inset Margin */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.08 }}
          transition={{ duration: 0.8, ease }}
          className="relative rounded-none border border-white/15 bg-[#050605] p-3 sm:p-4 shadow-2xl"
        >
          <Plus size={18} className="pointer-events-none absolute -left-[9px] -top-[9px] z-30 text-white" aria-hidden="true" />
          <Plus size={18} className="pointer-events-none absolute -right-[9px] -top-[9px] z-30 text-white" aria-hidden="true" />
          <Plus size={18} className="pointer-events-none absolute -bottom-[9px] -left-[9px] z-30 text-white" aria-hidden="true" />
          <Plus size={18} className="pointer-events-none absolute -bottom-[9px] -right-[9px] z-30 text-white" aria-hidden="true" />

          {/* Inner Chassis with Architectural Diagonal Stripe Pattern */}
          <div className="rounded-none border border-white/15 bg-[repeating-linear-gradient(-45deg,rgba(255,255,255,0.09)_0px,rgba(255,255,255,0.09)_1.5px,transparent_1.5px,transparent_7px)] p-2.5 sm:p-3 space-y-2.5 sm:space-y-3">
            
            {/* 1. Top Stage Navigation Strip Box */}
            <div className="overflow-x-auto overflow-y-hidden rounded-xs border border-white/10 bg-[#070807] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid min-w-[760px] lg:min-w-0 grid-cols-7">
                {steps.map((step, index) => {
                  const isActive = index === activeStep;
                  const isComplete = index < activeStep;
                  return (
                    <button
                      key={step.number}
                      type="button"
                      onClick={() => setActiveStep(index)}
                      className={cn(
                        "group relative min-h-[98px] border-r border-white/10 p-4 text-left transition-all duration-200 last:border-r-0 cursor-pointer select-none outline-none",
                        isActive ? "bg-primary/[.08]" : "hover:bg-white/[.03]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "font-mono text-[10px] font-semibold tracking-[0.14em] transition-colors",
                            isActive ? "text-primary" : isComplete ? "text-white/60" : "text-white/25"
                          )}
                        >
                          {step.number}
                        </span>
                      </div>
                      <strong
                        className={cn(
                          "mt-3.5 block text-base font-semibold tracking-tight transition-colors",
                          isActive ? "text-white" : "text-white/60 group-hover:text-white/90"
                        )}
                        style={pixelFont}
                      >
                        {step.title}
                      </strong>
                      <span
                        className={cn(
                          "mt-0.5 block font-mono text-[8px] uppercase tracking-[.12em] transition-colors",
                          isActive ? "text-primary" : "text-white/25 group-hover:text-white/40"
                        )}
                      >
                        {step.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="active-stage-bulb"
                          className="pointer-events-none absolute -top-px left-1/2 -translate-x-1/2 flex flex-col items-center z-20"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        >
                          {/* Fixture Mount / Socket */}
                          <div className="relative flex items-center justify-center">
                            {/* Ambient Light Cone radiating down into the active tab */}
                            <div className="absolute top-0 h-24 w-36 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(0,229,163,0.35)_0%,rgba(0,229,163,0.04)_65%,transparent_100%)] blur-sm pointer-events-none" />
                            {/* Outer fixture bevel */}
                            <div className="h-1.5 w-10 rounded-b-sm border-x border-b border-primary/45 bg-[#081711] shadow-[0_2px_10px_rgba(0,229,163,0.45)] flex items-center justify-center px-1">
                              {/* Glowing LED Filament Lens */}
                              <div className="h-0.5 w-6 rounded-full bg-white shadow-[0_0_6px_#00e5a3,0_0_14px_rgba(0,229,163,0.95)]" />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Lower Stage Body Grid (Left Overview Box + Right Inspector Box) */}
            <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-[.78fr_1.22fr]">
              {/* 2A. Left Box: Stage Overview & Value Proposition */}
              <div className="relative flex flex-col justify-between rounded-xs border border-white/10 bg-[#070807] p-7 sm:p-10 lg:p-11 overflow-hidden min-h-[460px]">
                {/* Natural Soft Ambient Top Glow */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(ellipse_75%_100%_at_50%_0%,rgba(0,229,163,0.08)_0%,transparent_100%)] z-0" />

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active.number + "-overview"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="size-2 rounded-full bg-primary animate-pulse" />
                      <span className="font-mono text-[9px] uppercase tracking-[.18em] text-primary">
                        Stage {active.number} / 07 · {active.category}
                      </span>
                    </div>

                    <h3 className="mt-5 text-4xl font-semibold sm:text-5xl" style={pixelFont}>
                      {active.title}
                    </h3>

                    <p className="mt-5 text-sm leading-7 text-white/60">
                      {active.description}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active.number + "-metric"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative z-10 mt-8 border-t border-white/[.07] pt-5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[9px] uppercase tracking-[.16em] text-white/30">
                        Why this stage matters
                      </p>
                      <span className="font-mono text-[9px] text-primary">{active.metric}</span>
                    </div>
                    <p className="mt-2.5 text-sm leading-6 text-white/70">
                      {active.signal}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* 2B. Right Box: Execution Dataflow & Inspector */}
              <div className="relative flex flex-col justify-between rounded-xs border border-white/10 bg-[#070807] p-6 sm:p-8 lg:p-10 min-h-[460px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={active.number + "-inspector"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-4"
                  >
                    {/* Connected 3-Stage Dataflow Pipeline */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2.5">
                      {[
                        { item: active.input },
                        { item: active.engine },
                        { item: active.output },
                      ].map(({ item }, idx) => (
                        <div
                          key={item.tag + idx}
                          className="relative flex flex-col justify-between rounded-xs border border-white/10 bg-black/60 p-4 transition-colors hover:border-white/20"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[8px] uppercase tracking-[.16em] text-white/50">
                              {item.tag}
                            </span>
                            <span className="font-mono text-[8px] text-white/20">
                              0{idx + 1}
                            </span>
                          </div>

                          <div className="mt-4">
                            <strong className="block text-sm font-semibold text-white/90">
                              {item.title}
                            </strong>
                            <span className="mt-1 block font-mono text-[9px] text-white/40">
                              {item.detail}
                            </span>
                          </div>

                          {idx < 2 && (
                            <ArrowRight
                              size={12}
                              className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 z-20 text-white/25 hidden sm:block"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Interactive Telemetry Console Box */}
                    <div className="rounded-xs border border-white/10 bg-black/90 p-4 sm:p-5">
                      <div className="flex items-center justify-between border-b border-white/[.06] pb-3">
                        <div className="flex items-center gap-2">
                          <TerminalWindow size={14} className="text-primary" />
                          <span className="font-mono text-[9px] uppercase tracking-[.14em] text-white/50">
                            pipeline_trace.log
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[.14em] text-primary">
                          <span className="size-1 rounded-full bg-primary animate-ping" />
                          Executing
                        </span>
                      </div>

                      {/* Code pipeline execution string */}
                      <div className="mt-3.5 overflow-x-auto rounded bg-[#090a09] px-3.5 py-2.5 font-mono text-xs text-white/80">
                        <span className="text-primary/70">$ </span>
                        {active.code}
                      </div>

                      {/* Telemetry metadata tags */}
                      <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {Object.entries(active.payload).map(([k, v]) => (
                          <div key={k} className="rounded bg-white/[.02] border border-white/[.04] px-2.5 py-1.5">
                            <span className="block font-mono text-[7px] uppercase tracking-[.1em] text-white/30">
                              {k.replaceAll("_", " ")}
                            </span>
                            <span className="mt-0.5 block font-mono text-[10px] font-semibold text-white/80">
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Inspector Footer */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] pt-3.5 font-mono text-[9px] uppercase tracking-[.14em] text-white/30">
                  <span className="flex items-center gap-1.5">
                    <span className="size-1 rounded-full bg-primary" />
                    Deterministic pipeline orchestration
                  </span>
                  <span>Stage {active.number} / 07</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
