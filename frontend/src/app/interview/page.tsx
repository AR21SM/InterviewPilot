"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTranscriptions,
} from "@livekit/components-react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ConnectionState, RoomEvent } from "livekit-client";
import { Check, Copy, Microphone, MicrophoneSlash, ShieldCheck, Waves } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };

interface CriterionEval {
  criterion: string;
  score: number;
  evidence: string;
  improvement?: string;
}

interface EvaluationEventData {
  type: "answer_evaluated";
  session_id: string;
  question_id: string;
  question_number: number;
  overall_score: number;
  criteria: CriterionEval[];
  strengths: string[];
  improvements: string[];
  follow_up_focus?: string;
  evaluation_status: string;
  retrieval_ms: number;
  evaluation_ms: number;
}

interface QuestionEventData {
  type: "question_started";
  session_id: string;
  question_id: string;
  question_number: number;
  question_count: number;
  question_title: string;
  question_text: string;
}

interface QuestionReportEntry {
  question_number: number;
  question_id: string;
  question_title: string;
  question_text: string;
  candidate_transcript: string;
  overall_score: number;
  strengths: string[];
  improvements: string[];
}

interface FinalReportData {
  type: "session_completed";
  session_id: string;
  interview_type: string;
  level: string;
  target_role?: string;
  focus_topic?: string;
  duration_seconds: number;
  questions_answered: number;
  session_average: number;
  strengths: string[];
  top_improvements: string[];
  question_breakdown: QuestionReportEntry[];
  average_retrieval_ms: number;
  average_evaluation_ms: number;
}

interface SessionBootstrap {
  token: string;
  url: string;
  roomName?: string;
  config?: {
    interview_type?: string;
    level?: string;
    question_count?: number;
    target_role?: string;
    focus_topic?: string;
  };
}

interface TranscriptEntry {
  text: string;
  participantIdentity?: string;
  participant?: { isLocal?: boolean };
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/[.08]">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, (score / max) * 100))}%` }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="h-full bg-primary shadow-[0_0_8px_rgba(0,229,163,.8)]"
      />
    </div>
  );
}

function RadialDottedWaveform({
  isSpeaking,
  voiceLevel,
}: {
  isSpeaking: boolean;
  voiceLevel: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let time = 0;
    let smoothAmp = 0.15;
    const numRays = 56;
    const dotsPerRay = 13;
    const innerRadius = 58;
    const maxRayLength = 62;

    const render = () => {
      // Smooth slow time progression
      time += isSpeaking ? 0.012 : 0.004;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Smooth damped audio level (lerp)
      const targetAmp = isSpeaking ? Math.max(0.42, Math.min(0.95, voiceLevel * 3.2)) : 0.16;
      smoothAmp += (targetAmp - smoothAmp) * 0.07;

      for (let r = 0; r < numRays; r++) {
        const angle = (r / numRays) * Math.PI * 2;
        // Organic gentle acoustic ripples
        const wave =
          Math.sin(angle * 4 + time * 1.6) * 0.35 +
          Math.cos(angle * 6 - time * 1.1) * 0.22 +
          Math.sin(angle * 2 + time * 2.0) * 0.32;

        const rayAmp = Math.max(0.12, smoothAmp * (1 + wave * 0.6));
        const activeDots = Math.min(
          dotsPerRay,
          Math.floor(4 + rayAmp * (dotsPerRay - 3))
        );

        for (let d = 0; d < activeDots; d++) {
          const progress = d / dotsPerRay;
          const dist = innerRadius + progress * maxRayLength * (0.6 + rayAmp * 0.75);
          const x = centerX + Math.cos(angle) * dist;
          const y = centerY + Math.sin(angle) * dist;

          const dotRadius = 0.85 + progress * 1.4;
          const alpha = isSpeaking
            ? Math.max(0.2, (1 - progress * 0.45) * (0.55 + rayAmp * 0.45))
            : Math.max(0.12, 0.4 - progress * 0.3);

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.95, alpha)})`;
          ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
          ctx.shadowBlur = isSpeaking ? 3 : 1;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isSpeaking, voiceLevel]);

  return (
    <canvas
      ref={canvasRef}
      width={340}
      height={340}
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}

function InterviewSession({ bootstrap }: { bootstrap: SessionBootstrap }) {
  const router = useRouter();
  const room = useRoomContext();
  const roomState = useConnectionState();
  const participants = useParticipants();
  const transcriptSegments = useTranscriptions();
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [evaluations, setEvaluations] = useState<EvaluationEventData[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionEventData | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReportData | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentVoiceLevel, setCurrentVoiceLevel] = useState(0);
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const isConnected = roomState === ConnectionState.Connected;
  const agentParticipant = participants.find((participant) => !participant.isLocal);
  const isAgentAvailable = Boolean(agentParticipant);
  const isAgentSpeaking = agentParticipant?.isSpeaking ?? false;
  const isUserSpeaking = localParticipant?.isSpeaking ?? false;
  const latestEval = evaluations.at(-1) ?? null;
  const config = bootstrap.config ?? {};

  const voiceLevel = useMotionValue(0);
  const easedVoiceLevel = useSpring(voiceLevel, { stiffness: 280, damping: 28, mass: 0.3 });
  const innerRingScale = useTransform(easedVoiceLevel, [0, 0.35], [1, 1.15]);
  const middleRingScale = useTransform(easedVoiceLevel, [0, 0.35], [1, 1.25]);
  const outerRingScale = useTransform(easedVoiceLevel, [0, 0.35], [1, 1.38]);
  const ringOpacity = useTransform(easedVoiceLevel, [0, 0.35], [0.2, 0.8]);

  useEffect(() => {
    if (!isConnected) return;
    const interval = window.setInterval(() => setElapsedTime((value) => value + 1), 1000);
    return () => window.clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload)) as { type?: string };
        if (data.type === "question_started") setCurrentQuestion(data as QuestionEventData);
        if (data.type === "answer_evaluated") setEvaluations((items) => [...items, data as EvaluationEventData]);
        if (data.type === "session_completed") {
          setFinalReport(data as FinalReportData);
          setIsReportOpen(true);
        }
      } catch (error) {
        console.error("Failed to parse interview event", error);
      }
    };
    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  useEffect(() => {
    let animationFrame = 0;
    const sampleVoiceLevel = () => {
      const activeParticipant = isAgentSpeaking ? agentParticipant : isUserSpeaking ? localParticipant : undefined;
      const lvl = activeParticipant?.audioLevel ?? 0;
      voiceLevel.set(lvl);
      setCurrentVoiceLevel(lvl);
      animationFrame = window.requestAnimationFrame(sampleVoiceLevel);
    };
    sampleVoiceLevel();
    return () => window.cancelAnimationFrame(animationFrame);
  }, [agentParticipant, isAgentSpeaking, isUserSpeaking, localParticipant, voiceLevel]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcriptSegments]);

  const questionNumber = currentQuestion?.question_number ?? latestEval?.question_number ?? 1;
  const questionCount = currentQuestion?.question_count ?? config.question_count ?? 3;
  const activity = isAgentSpeaking
    ? "Sarah is speaking"
    : isUserSpeaking
    ? "Your answer is live"
    : !isConnected
    ? "Connecting voice engine"
    : !isAgentAvailable
    ? "Connecting to Sarah..."
    : "Listening for your response";

  const toggleMic = async () => {
    await localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const endSession = () => {
    room.disconnect();
    sessionStorage.removeItem("interview_session");
    if (finalReport) setIsReportOpen(true);
    else router.push("/");
  };

  const copyReport = async () => {
    if (!finalReport) return;
    await navigator.clipboard.writeText(
      [
        "InterviewPilot session report",
        `${finalReport.interview_type} · ${finalReport.level}`,
        `${finalReport.questions_answered} questions · ${finalReport.session_average}/10`,
        "",
        "Strengths",
        ...finalReport.strengths.map((item) => `- ${item}`),
        "",
        "Priority for next time",
        ...finalReport.top_improvements.map((item) => `- ${item}`),
      ].join("\n")
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  // Mock initial criteria if evaluation hasn't run yet so the user sees all criteria boxes immediately
  const defaultCriteria = [
    { criterion: "Problem Framing & Scope", score: latestEval?.criteria[0]?.score ?? 0, evidence: latestEval?.criteria[0]?.evidence ?? "Analyzing opening structure and boundary clarification." },
    { criterion: "Technical Reasoning & Trade-offs", score: latestEval?.criteria[1]?.score ?? 0, evidence: latestEval?.criteria[1]?.evidence ?? "Evaluating architecture decisions and failure modes." },
    { criterion: "Communication Clarity", score: latestEval?.criteria[2]?.score ?? 0, evidence: latestEval?.criteria[2]?.evidence ?? "Tracking structured reasoning and answer conciseness." },
  ];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#030303] text-white select-none">
      <RoomAudioRenderer />

      {/* Top Cockpit Header */}
      <header className="relative z-30 shrink-0 border-b border-white/10 bg-[#070807] px-4 py-3 sm:px-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold tracking-tight text-white hover:text-primary transition-colors" style={pixelFont}>
              InterviewPilot
            </Link>
            <span className="hidden sm:inline-block h-3.5 w-px bg-white/15" />
            <span className="hidden font-mono text-[10px] uppercase tracking-[.18em] text-white/50 sm:inline-block">
              {config.interview_type ? `${config.interview_type.toUpperCase()} TRACK` : "INTERVIEW STUDIO"} · {config.level ? config.level.toUpperCase() : "SENIOR"}
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Live Connection Status */}
            <div className="flex items-center gap-2 rounded-xs border border-white/10 bg-[#090a09] px-2.5 py-1">
              <span className={cn("size-1.5 rounded-full", isConnected ? "bg-primary shadow-[0_0_8px_#00e5a3]" : "bg-white/30")} />
              <span className="font-mono text-[9px] uppercase tracking-[.16em] text-white/60">
                {isConnected ? "Voice Live" : "Connecting"}
              </span>
            </div>

            {/* Live Session Timer */}
            <div className="flex items-center gap-1.5 rounded-xs border border-white/10 bg-[#090a09] px-3 py-1 font-mono text-xs tabular-nums text-white/80">
              <span className="text-[10px] text-white/30">TIME</span>
              <span>{formatTime(elapsedTime)}</span>
            </div>

            {/* End Session Button */}
            <button
              onClick={endSession}
              className="cursor-pointer rounded-xs border border-white/20 bg-white/5 px-3.5 py-1 font-mono text-[10px] uppercase tracking-[.14em] text-white/80 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
            >
              End Session
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Multi-Box Grid (3 + 6 + 3 = 12 cols, Zero Dead Space) */}
      <main className="grid h-[calc(100dvh-3.75rem)] w-full flex-1 grid-cols-1 gap-3 p-3 sm:gap-3.5 sm:p-4 lg:grid-cols-12">
        
        {/* BOX 1 (Left 3 cols): Live Real-Time Transcript Stream */}
        <section className="flex h-full flex-col overflow-hidden rounded-lg border border-white/12 bg-[#070807] lg:col-span-3">
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#050605] px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[.18em] text-white/80">
              01 / Live Transcript
            </span>
            <span className="font-mono text-[9px] text-white/30">
              {transcriptSegments.length} turns
            </span>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3.5 pr-2">
              {transcriptSegments.length ? (
                transcriptSegments.map((segment, index) => {
                  const seg = segment as unknown as TranscriptEntry;
                  const isLocal = seg.participantIdentity
                    ? seg.participantIdentity === localParticipant?.identity
                    : seg.participant?.isLocal;
                  return (
                    <div
                      key={`${segment.text}-${index}`}
                      className={cn(
                        "rounded-sm border p-3 transition-colors",
                        isLocal
                          ? "border-white/10 bg-white/[.02]"
                          : "border-primary/20 bg-primary/[.03]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={cn(
                            "font-mono text-[8px] uppercase tracking-[.18em] font-semibold",
                            isLocal ? "text-white/70" : "text-primary"
                          )}
                        >
                          {isLocal ? "Candidate (You)" : "AI Interviewer (Sarah)"}
                        </span>
                        <span className="font-mono text-[8px] text-white/20">Turn #{index + 1}</span>
                      </div>
                      <p className="text-xs leading-5 text-white/85">{segment.text}</p>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-48 flex-col items-center justify-center text-center">
                  <span className="font-mono text-[10px] uppercase tracking-[.16em] text-white/30">
                    Listening for voice input...
                  </span>
                  <p className="mt-2 text-xs text-white/40 max-w-[200px]">
                    Spoken dialogue will stream here in real-time as you speak.
                  </p>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t border-white/10 bg-[#050605] px-4 py-2.5 font-mono text-[8px] uppercase tracking-[.16em] text-white/30 flex items-center justify-between">
            <span>Speech Recognition</span>
            <span className="text-primary font-semibold">Groq Whisper Large</span>
          </div>
        </section>

        {/* BOX 2 (Center 6 cols): Question Display & Interactive Voice Cockpit */}
        <section className="flex h-full flex-col justify-between overflow-hidden rounded-lg border border-white/15 bg-[#070807] lg:col-span-6">
          {/* Question Stepper Strip */}
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#050605] px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[.2em] text-primary">
              Question {String(questionNumber).padStart(2, "0")} of {String(questionCount).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: questionCount }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    index < questionNumber ? "w-6 bg-primary" : "w-3 bg-white/15"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Main Question Display & Voice Orb */}
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            {/* Question Text */}
            <div className="max-w-xl">
              <span className="font-mono text-[9px] uppercase tracking-[.22em] text-white/35">
                {currentQuestion?.question_title ?? "Live Question"}
              </span>
              <h1
                className="mt-3 text-balance text-xl font-semibold leading-snug tracking-tight sm:text-2xl lg:text-3xl text-white"
                style={pixelFont}
              >
                {currentQuestion?.question_text ?? "Your first interview question is being prepared."}
              </h1>
            </div>

            {/* Radial Dotted Soundwave Equalizer & Voice Cockpit Orb */}
            <div className="relative my-7 grid size-64 place-items-center sm:my-8 sm:size-72">
              {/* Radial Dotted Acoustic Particle Waveform Canvas */}
              <RadialDottedWaveform
                isSpeaking={isAgentSpeaking || isUserSpeaking}
                voiceLevel={currentVoiceLevel}
              />

              {/* Center Interactive Microphone Orb */}
              <button
                onClick={toggleMic}
                aria-label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
                className={cn(
                  "relative z-10 grid size-24 place-items-center rounded-full border transition-all cursor-pointer sm:size-28",
                  isMicrophoneEnabled
                    ? isAgentSpeaking || isUserSpeaking
                      ? "border-white bg-[#141614] text-white shadow-[0_0_36px_rgba(255,255,255,0.3),0_0_80px_rgba(255,255,255,0.15)]"
                      : "border-white/50 bg-[#0d0e0d] text-white shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:border-white"
                    : "border-white/20 bg-[#090a09] text-white/40 hover:border-white/40 hover:text-white"
                )}
              >
                {isMicrophoneEnabled ? <Microphone size={28} weight="fill" /> : <MicrophoneSlash size={28} />}
                <span className="absolute inset-x-0 bottom-4 font-mono text-[7px] uppercase tracking-[.18em] text-white/70">
                  {isMicrophoneEnabled ? (isAgentSpeaking ? "SARAH SPEAKING" : isUserSpeaking ? "YOU SPEAKING" : "LIVE MIC") : "MUTED"}
                </span>
              </button>
            </div>

            {/* Status Feedback */}
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", isAgentSpeaking ? "bg-primary animate-pulse" : isUserSpeaking ? "bg-primary animate-ping" : "bg-white/30")} />
              <p className="text-xs font-semibold text-white/80">{activity}</p>
            </div>
            <p className="mt-1.5 font-mono text-[9px] text-white/35">
              {isMicrophoneEnabled ? "Tap orb to mute microphone" : "Tap orb to unmute microphone"}
            </p>
          </div>

          {/* Turn Telemetry Footer */}
          <div className="shrink-0 border-t border-white/10 bg-[#050605] px-4 py-2.5 font-mono text-[8px] uppercase tracking-[.16em] text-white/35 flex items-center justify-between">
            <span>Audio Latency: &lt; 580ms</span>
            <span className="text-white/60">Deterministic Evaluation Engine</span>
          </div>
        </section>

        {/* BOX 3 (Right 3 cols): Live Rubric Scoring & Evidence Grounding */}
        <section className="flex h-full flex-col justify-between overflow-hidden rounded-lg border border-white/12 bg-[#070807] lg:col-span-3">
          <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#050605] px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[.18em] text-white/80">
              03 / Live Rubric Signals
            </span>
            <span className="font-mono text-[9px] text-primary font-semibold">
              {latestEval ? `${latestEval.overall_score} / 10` : "Active"}
            </span>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3.5 pr-2">
              {/* Overall Readiness Snapshot */}
              <div className="rounded-sm border border-white/10 bg-white/[.02] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-[.16em] text-white/40">
                    Calculated Readiness
                  </span>
                  <span className="font-mono text-sm font-semibold text-primary">
                    {latestEval ? `${latestEval.overall_score} / 10` : "Pending Evaluation"}
                  </span>
                </div>
                <div className="mt-2.5">
                  <ScoreBar score={latestEval?.overall_score ?? 0} />
                </div>
              </div>

              {/* Criterion Breakdown */}
              <div className="space-y-2.5">
                <p className="font-mono text-[8px] uppercase tracking-[.16em] text-white/35">
                  Evaluation Dimensions
                </p>
                {(latestEval?.criteria ?? defaultCriteria).map((c, i) => (
                  <div key={c.criterion + i} className="rounded-sm border border-white/[.07] bg-[#090a09] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white/85">{c.criterion}</span>
                      <span className="font-mono text-[10px] text-primary font-semibold">
                        {c.score > 0 ? `${c.score} / 5` : "Evaluating..."}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-4 text-white/45">
                      {c.evidence}
                    </p>
                  </div>
                ))}
              </div>

              {/* Verified Evidence Citation */}
              {latestEval?.strengths?.[0] && (
                <div className="rounded-sm border border-white/[.08] bg-[#050605] p-3">
                  <span className="font-mono text-[8px] uppercase tracking-[.14em] text-white/40 block mb-1">
                    Detected Strength
                  </span>
                  <p className="text-xs leading-5 text-white/70">
                    “{latestEval.strengths[0]}”
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t border-white/10 bg-[#050605] px-4 py-2.5 font-mono text-[8px] uppercase tracking-[.16em] text-white/30 flex items-center justify-between">
            <span>Scoring Mode</span>
            <span className="text-primary font-semibold">Grounded in Transcript</span>
          </div>
        </section>

      </main>

      {/* Final Comprehensive Report Modal */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-h-[90dvh] max-w-4xl overflow-y-auto border-white/15 bg-[#050605] p-0 text-white" style={pixelFont}>
          <DialogHeader className="border-b border-white/10 p-6 text-left sm:p-8">
            <p className="font-mono text-[9px] uppercase tracking-[.2em] text-primary">Session Complete</p>
            <DialogTitle className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Your interview evidence, distilled.
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6 text-white/50">
              Scores connect directly to your spoken answers and the rubric used for this session.
            </DialogDescription>
          </DialogHeader>

          {finalReport ? (
            <div className="grid gap-px bg-white/10 sm:grid-cols-12">
              <div className="bg-[#050605] p-6 sm:col-span-4 sm:p-8">
                <p className="font-mono text-[8px] uppercase tracking-[.18em] text-white/30">Overall Score</p>
                <p className="mt-4 text-6xl font-semibold text-primary">{finalReport.session_average}</p>
                <p className="mt-2 text-xs text-white/40">
                  {finalReport.questions_answered} questions · {formatTime(finalReport.duration_seconds)}
                </p>
              </div>
              <div className="bg-[#050605] p-6 sm:col-span-8 sm:p-8">
                <p className="font-mono text-[8px] uppercase tracking-[.18em] text-primary">Strongest Signals</p>
                <div className="mt-4 space-y-2.5">
                  {finalReport.strengths.map((item) => (
                    <p key={item} className="border-l-2 border-primary/70 pl-3.5 text-xs leading-5 text-white/70">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
              <div className="bg-[#050605] p-6 sm:col-span-5 sm:p-8">
                <p className="font-mono text-[8px] uppercase tracking-[.18em] text-white/35">Priority For Next Round</p>
                <div className="mt-4 space-y-2.5">
                  {finalReport.top_improvements.map((item) => (
                    <p key={item} className="text-xs leading-5 text-white/60">
                      • {item}
                    </p>
                  ))}
                </div>
              </div>
              <div className="bg-[#050605] p-6 sm:col-span-7 sm:p-8">
                <p className="font-mono text-[8px] uppercase tracking-[.18em] text-primary">Question Breakdown</p>
                <div className="mt-4 space-y-3.5">
                  {finalReport.question_breakdown.map((question) => (
                    <div key={question.question_id}>
                      <div className="mb-1.5 flex justify-between gap-4 text-xs">
                        <span className="text-white/70">{question.question_title}</span>
                        <span className="font-mono font-semibold text-primary">{question.overall_score}/10</span>
                      </div>
                      <ScoreBar score={question.overall_score} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#050605] p-5 sm:col-span-12 sm:px-8">
                <button
                  onClick={copyReport}
                  className="flex items-center gap-2 rounded-xs border border-white/15 px-4 py-2 font-mono text-xs text-white/70 hover:border-white/35 hover:text-white cursor-pointer"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy Report Summary"}
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="rounded-xs bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-primary cursor-pointer transition-colors"
                >
                  Return Home
                </button>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-white/35">
              Finishing the current evaluation before closing your report.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Free Tier Cold Start Sharp Rectangular Notification */}
      {!isAgentAvailable && !isNoticeDismissed && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md rounded-none border border-white/20 bg-[#080a08] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase tracking-[.18em] text-primary font-bold">
                [NOTICE] FREE CLOUD COLD START
              </span>
              <p className="text-xs text-white/75 leading-relaxed">
                Backend is hosted on a free cloud tier. First connection takes ~45–60s to wake from cold sleep. Sarah will join and begin speaking automatically.
              </p>
              <div className="border-t border-white/10 pt-2 text-xs text-white/60 space-y-1">
                <p>Or run local worker for instant 0s join:</p>
                <code className="block rounded-none bg-black/60 px-2.5 py-1 text-xs font-mono text-primary select-all">
                  uv run python -m agent.main dev
                </code>
              </div>
            </div>
            <button
              onClick={() => setIsNoticeDismissed(true)}
              aria-label="Dismiss notice"
              className="shrink-0 p-1 text-white/40 hover:text-white transition-colors cursor-pointer rounded-none"
            >
              <span className="font-mono text-sm leading-none">✕</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InterviewSessionWrapper() {
  const [bootstrap, setBootstrap] = useState<SessionBootstrap | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("interview_session");
    if (!stored) {
      setError("No active interview session was found. Start a new session from the landing page.");
      return;
    }
    try {
      const data = JSON.parse(stored) as SessionBootstrap & { livekit_url?: string };
      const normalized = { ...data, url: data.url || data.livekit_url || "" };
      if (!normalized.token || !normalized.url) throw new Error("The LiveKit session token is incomplete.");
      setBootstrap(normalized);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The saved interview session is invalid.");
    }
  }, []);

  if (error)
    return (
      <div className="grid min-h-dvh place-items-center bg-black px-6 text-center text-white" style={pixelFont}>
        <div className="max-w-md border border-white/15 bg-[#050605] p-8 rounded-lg">
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-primary">Session unavailable</p>
          <h1 className="mt-4 text-2xl font-semibold">We could not open the interview room.</h1>
          <p className="mt-3 text-sm leading-6 text-white/50">{error}</p>
          <Link href="/" className="mt-6 inline-block bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-primary rounded-xs">
            Return home
          </Link>
        </div>
      </div>
    );

  if (!bootstrap)
    return (
      <div className="grid min-h-dvh place-items-center bg-black font-mono text-[10px] uppercase tracking-[.2em] text-white/40">
        Preparing interview studio
      </div>
    );

  return (
    <LiveKitRoom video={false} audio token={bootstrap.token} serverUrl={bootstrap.url} connect data-lk-theme="default">
      <InterviewSession bootstrap={bootstrap} />
    </LiveKitRoom>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center bg-black font-mono text-[10px] uppercase tracking-[.2em] text-white/40">Loading interview</div>}>
      <InterviewSessionWrapper />
    </Suspense>
  );
}
