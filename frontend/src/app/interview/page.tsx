"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useParticipants,
  useLocalParticipant,
  useTranscriptions,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, RoomEvent, Participant } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Mic,
  MicOff,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  BarChart3,
  Copy,
  Check,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AsciiWave } from "@/components/landing/ascii-wave";

const pf = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };

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

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  return (
    <div className="h-1 w-full bg-white/[0.08] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(score / max) * 100}%` }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="h-full bg-primary rounded-full"
      />
    </div>
  );
}

function InterviewSession() {
  const router = useRouter();
  const room = useRoomContext();
  const roomState = useConnectionState();
  const isConnected = roomState === ConnectionState.Connected;

  const [elapsedTime, setElapsedTime] = useState(0);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const participants = useParticipants();
  const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
  const [isMicEnabled, setIsMicEnabled] = useState(true);

  const agentParticipant = participants.find((p) => !p.isLocal);
  const isAgentSpeaking = agentParticipant?.isSpeaking ?? false;
  const isUserSpeaking = localParticipant?.isSpeaking ?? false;

  const transcriptSegments = useTranscriptions();

  const [evaluations, setEvaluations] = useState<EvaluationEventData[]>([]);
  const [latestEval, setLatestEval] = useState<EvaluationEventData | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReportData | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, _participant?: Participant) => {
      try {
        const str = new TextDecoder().decode(payload);
        const data = JSON.parse(str);

        if (data.type === "answer_evaluated") {
          const evalData = data as EvaluationEventData;
          setEvaluations((prev) => [...prev, evalData]);
          setLatestEval(evalData);
        } else if (data.type === "session_completed") {
          const reportData = data as FinalReportData;
          setFinalReport(reportData);
          setIsReportOpen(true);
        }
      } catch (e) {
        console.error("Failed to parse data message", e);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  const toggleMic = async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
      setIsMicEnabled(!isMicrophoneEnabled);
    }
  };

  const averageScore =
    evaluations.length > 0
      ? (evaluations.reduce((acc, curr) => acc + curr.overall_score, 0) / evaluations.length).toFixed(1)
      : null;

  const handleEndSession = () => {
    if (room) room.disconnect();
    setIsReportOpen(true);
  };

  const copyReportText = () => {
    if (!finalReport) return;
    const text = `InterviewPilot Session Report
Track: ${finalReport.interview_type} (${finalReport.level})
Questions Answered: ${finalReport.questions_answered}
Average Score: ${finalReport.session_average}/10
Duration: ${formatTime(finalReport.duration_seconds)}

Top Strengths:
${finalReport.strengths.map((s) => `- ${s}`).join("\n")}

Areas to Improve:
${finalReport.top_improvements.map((i) => `- ${i}`).join("\n")}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const orbStatus = isAgentSpeaking
    ? "SPEAKING"
    : isUserSpeaking
    ? "LISTENING"
    : isConnected
    ? "READY"
    : "CONNECTING";

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden" style={pf}>
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <AsciiWave className="w-full h-full" />
      </div>

      <RoomAudioRenderer />

      {/* Header */}
      <header className="absolute top-0 w-full z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl h-14 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <button
            onClick={handleEndSession}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none" style={pf}>
              InterviewPilot Session
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isConnected ? "bg-primary animate-pulse" : "bg-white/20"
                )}
              />
              <span className="text-[10px] text-white/35 tracking-widest uppercase" style={pf}>
                {roomState}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03]">
            <Clock className="w-3 h-3 text-white/30" />
            <span className="font-mono text-xs text-white/50 tabular-nums" style={pf}>
              {formatTime(elapsedTime)}
            </span>
          </div>
          <button
            onClick={handleEndSession}
            className="px-3 py-1.5 rounded-lg text-xs text-white/70 border border-white/[0.08] hover:bg-white/[0.06] hover:text-white transition-colors"
            style={pf}
          >
            End Session
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 pt-14 h-screen grid grid-cols-12 overflow-hidden">
        {/* Left Panel */}
        <div className="col-span-3 border-r border-white/[0.06] flex flex-col h-full min-h-0 overflow-hidden">
          {/* Score */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-widest text-white/30 uppercase" style={pf}>
                Latest Score
              </span>
              <span
                className={cn(
                  "text-[9px] px-2 py-0.5 rounded border tracking-widest uppercase",
                  evaluations.length > 0
                    ? "text-primary border-primary/30 bg-primary/10"
                    : "text-white/20 border-white/[0.08]"
                )}
                style={pf}
              >
                {evaluations.length} Evaluated
              </span>
            </div>

            <AnimatePresence mode="wait">
              {latestEval ? (
                <motion.div
                  key={latestEval.question_number}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-end gap-1.5 mb-2">
                    <span className="text-4xl font-bold text-primary leading-none" style={pf}>
                      {latestEval.overall_score.toFixed(1)}
                    </span>
                    <span className="text-base text-white/25 mb-0.5" style={pf}>
                      / 10
                    </span>
                  </div>
                  <ScoreBar score={latestEval.overall_score} />
                  {averageScore && (
                    <p className="text-[10px] text-white/30 mt-2" style={pf}>
                      Session avg:{" "}
                      <span className="text-white/60" style={pf}>
                        {averageScore}/10
                      </span>
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] text-white/25 leading-relaxed"
                  style={pf}
                >
                  No responses evaluated yet. Answer a question to generate live feedback.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Feedback */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10px] tracking-widest text-white/50 uppercase" style={pf}>
                Grounded Rubric Feedback
              </span>
            </div>
            <ScrollArea className="flex-1 p-4">
              <AnimatePresence mode="wait">
                {latestEval ? (
                  <motion.div
                    key={latestEval.question_number}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 text-[11px]"
                    style={pf}
                  >
                    {latestEval.strengths.length > 0 && (
                      <div>
                        <h4 className="text-[9px] tracking-widest uppercase text-primary mb-2" style={pf}>
                          Strengths
                        </h4>
                        <ul className="space-y-1.5">
                          {latestEval.strengths.map((s, idx) => (
                            <li key={idx} className="flex gap-2 text-white/50 leading-relaxed">
                              <span className="text-primary shrink-0 mt-0.5">›</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {latestEval.improvements.length > 0 && (
                      <div>
                        <h4 className="text-[9px] tracking-widest uppercase text-white/30 mb-2" style={pf}>
                          Improvements
                        </h4>
                        <ul className="space-y-1.5">
                          {latestEval.improvements.map((imp, idx) => (
                            <li key={idx} className="flex gap-2 text-white/50 leading-relaxed">
                              <span className="text-white/25 shrink-0 mt-0.5">›</span>
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {latestEval.criteria.length > 0 && (
                      <div className="pt-3 border-t border-white/[0.06]">
                        <h4 className="text-[9px] tracking-widest uppercase text-white/25 mb-2.5" style={pf}>
                          Criterion Scores
                        </h4>
                        <div className="space-y-3">
                          {latestEval.criteria.map((c, idx) => (
                            <div key={idx}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-white/50 capitalize" style={pf}>
                                  {c.criterion.replace(/_/g, " ")}
                                </span>
                                <span className="text-primary font-bold text-[10px] tabular-nums" style={pf}>
                                  {c.score}/5
                                </span>
                              </div>
                              <ScoreBar score={c.score} max={5} />
                              {c.evidence && (
                                <p className="text-[10px] text-white/25 italic mt-1 leading-relaxed" style={pf}>
                                  "{c.evidence}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.p
                    key="empty-feedback"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[11px] text-white/20 text-center py-6 leading-relaxed"
                    style={pf}
                  >
                    Live rubric evaluation events will appear here after candidate response.
                  </motion.p>
                )}
              </AnimatePresence>
            </ScrollArea>
          </div>
        </div>

        {/* Center: Agent Voice Orb */}
        <div className="col-span-6 flex flex-col justify-center items-center relative">
          <div className="relative flex items-center justify-center">
            {/* Ambient glow */}
            <div
              className={cn(
                "absolute w-80 h-80 rounded-full blur-[80px] transition-all duration-700",
                isAgentSpeaking ? "bg-primary/10" : "bg-white/[0.03]"
              )}
            />

            {/* Rotating dashed ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute w-72 h-72 border border-dashed border-white/10 rounded-full"
            />

            {/* User speaking pulse rings */}
            <AnimatePresence>
              {isUserSpeaking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.55 }}
                      className="absolute w-52 h-52 rounded-full border border-white/20"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Orb */}
            <div className="relative z-10">
              {/* Glow layer */}
              <motion.div
                animate={{
                  opacity: isAgentSpeaking ? [0.5, 0.9, 0.5] : 0.2,
                  scale: isAgentSpeaking ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 2, repeat: isAgentSpeaking ? Infinity : 0 }}
                className={cn(
                  "absolute inset-0 rounded-full blur-2xl",
                  isAgentSpeaking ? "bg-primary/30" : "bg-white/5"
                )}
              />
              <motion.div
                animate={{ scale: isAgentSpeaking ? [0.97, 1.04, 0.97] : 1 }}
                transition={{ duration: 1.8, repeat: isAgentSpeaking ? Infinity : 0 }}
                className={cn(
                  "relative w-44 h-44 rounded-full border flex items-center justify-center backdrop-blur-xl transition-all duration-500",
                  isAgentSpeaking
                    ? "border-primary/40 bg-primary/5"
                    : "border-white/[0.08] bg-white/[0.02]"
                )}
              >
                <div className="text-center">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full mx-auto mb-2 transition-colors duration-300",
                      isConnected
                        ? isAgentSpeaking
                          ? "bg-primary animate-pulse"
                          : "bg-white animate-pulse"
                        : "bg-white/20"
                    )}
                  />
                  <span
                    className="text-[10px] tracking-[0.25em] text-white/40 uppercase block"
                    style={pf}
                  >
                    {orbStatus}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Status label */}
          <div className="mt-10 text-center">
            <AnimatePresence mode="wait">
              <motion.h3
                key={orbStatus}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "text-2xl font-bold tracking-tight leading-none",
                  isAgentSpeaking ? "text-primary" : "text-white"
                )}
                style={pf}
              >
                {isAgentSpeaking
                  ? "Alex is speaking..."
                  : isUserSpeaking
                  ? "Candidate speaking..."
                  : "Alex is ready"}
              </motion.h3>
            </AnimatePresence>
            {latestEval && (
              <p className="text-[10px] text-white/25 mt-2 tracking-widest uppercase" style={pf}>
                Q{latestEval.question_number} evaluated · score{" "}
                <span className="text-primary">{latestEval.overall_score.toFixed(1)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Right Panel: Transcript */}
        <div className="col-span-3 border-l border-white/[0.06] flex flex-col h-full min-h-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
            <BarChart3 className="w-3 h-3 text-white/30" />
            <span className="text-[10px] tracking-widest text-white/30 uppercase" style={pf}>
              Real-time Transcript
            </span>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-3">
              {transcriptSegments && transcriptSegments.length > 0 ? (
                transcriptSegments.map(
                  (seg: { text?: string; participant?: { isLocal?: boolean } }, idx: number) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-3 rounded-lg border",
                        seg.participant?.isLocal
                          ? "border-white/[0.1] bg-white/[0.03]"
                          : "border-primary/20 bg-primary/[0.04]"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[9px] tracking-widest uppercase block mb-1.5",
                          seg.participant?.isLocal ? "text-white/40" : "text-primary/70"
                        )}
                        style={pf}
                      >
                        {seg.participant?.isLocal ? "Candidate" : "Alex"}
                      </span>
                      <p className="text-[11px] text-white/55 leading-relaxed" style={pf}>
                        {seg.text}
                      </p>
                    </div>
                  )
                )
              ) : (
                <p className="text-[11px] text-white/20 py-6 text-center leading-relaxed" style={pf}>
                  Speech transcripts will stream here in real time as candidate and agent converse.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>

      {/* Controls Bar */}
      <div className="fixed bottom-5 left-0 right-0 flex justify-center items-center z-50">
        <div className="bg-black/80 backdrop-blur-xl border border-white/[0.08] rounded-full px-5 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isConnected ? "bg-primary animate-pulse" : "bg-white/20"
              )}
            />
            <span className="text-[10px] text-white/30 hidden sm:block tracking-widest" style={pf}>
              Voice Engine {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="w-px h-4 bg-white/[0.08]" />
          <button
            onClick={toggleMic}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
              isMicEnabled
                ? "bg-primary text-black hover:bg-primary/90"
                : "bg-white/[0.06] text-white/40 hover:bg-white/[0.1] border border-white/[0.08]"
            )}
          >
            {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Final Session Report Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent
          className="bg-[#080808] border border-white/[0.08] text-white max-w-2xl max-h-[85vh] overflow-y-auto"
          style={pf}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2.5" style={pf}>
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Final Session Report
            </DialogTitle>
            <DialogDescription className="text-[11px] text-white/30" style={pf}>
              Synthesized evaluation grounded in interview rubrics.
            </DialogDescription>
          </DialogHeader>

          {finalReport ? (
            <div className="space-y-5 text-[11px] pt-2" style={pf}>
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                {[
                  { label: "Overall", value: `${finalReport.session_average}/10`, accent: true },
                  { label: "Questions", value: String(finalReport.questions_answered) },
                  { label: "Track", value: finalReport.interview_type },
                  { label: "Duration", value: formatTime(finalReport.duration_seconds) },
                ].map((item) => (
                  <div key={item.label}>
                    <span className="text-[9px] tracking-widest uppercase text-white/25 block mb-1" style={pf}>
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "text-xl font-bold leading-none",
                        item.accent ? "text-primary" : "text-white"
                      )}
                      style={pf}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/[0.04]">
                  <h4 className="text-[9px] tracking-widest uppercase text-primary mb-2.5" style={pf}>
                    Key Strengths
                  </h4>
                  <ul className="space-y-2">
                    {finalReport.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 text-white/50 leading-relaxed">
                        <span className="text-primary shrink-0">›</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <h4 className="text-[9px] tracking-widest uppercase text-white/25 mb-2.5" style={pf}>
                    Key Improvements
                  </h4>
                  <ul className="space-y-2">
                    {finalReport.top_improvements.map((imp, i) => (
                      <li key={i} className="flex gap-2 text-white/50 leading-relaxed">
                        <span className="text-white/25 shrink-0">›</span>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Per-question Breakdown */}
              <div className="space-y-2.5">
                <h4 className="text-[9px] tracking-widest uppercase text-white/25" style={pf}>
                  Question Breakdown
                </h4>
                {finalReport.question_breakdown.map((q) => (
                  <div
                    key={q.question_number}
                    className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-2"
                  >
                    <div className="flex justify-between items-baseline gap-3">
                      <span className="font-semibold text-white/80" style={pf}>
                        Q{q.question_number}: {q.question_title}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-bold shrink-0 tabular-nums",
                          q.overall_score >= 7
                            ? "text-primary"
                            : q.overall_score >= 5
                            ? "text-white/60"
                            : "text-white/30"
                        )}
                        style={pf}
                      >
                        {q.overall_score}/10
                      </span>
                    </div>
                    <ScoreBar score={q.overall_score} />
                    <p className="text-[10px] text-white/30 italic leading-relaxed">
                      &quot;{q.candidate_transcript}&quot;
                    </p>
                  </div>
                ))}
              </div>

              {/* Latency telemetry */}
              {(finalReport.average_retrieval_ms > 0 || finalReport.average_evaluation_ms > 0) && (
                <div className="flex items-center gap-4 pt-1 text-[9px] text-white/20 font-mono" style={pf}>
                  <span>Avg retrieval: {finalReport.average_retrieval_ms}ms</span>
                  <span>Avg eval: {finalReport.average_evaluation_ms}ms</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                <button
                  onClick={copyReportText}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-white/50 border border-white/[0.08] hover:bg-white/[0.05] hover:text-white transition-colors"
                  style={pf}
                >
                  {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy Report"}
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-1.5 rounded-lg text-[11px] bg-primary text-black font-bold hover:bg-primary/90 transition-colors"
                  style={pf}
                >
                  Return to Home
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-white/25 text-[11px]" style={pf}>
              Generating final session report...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white/40 flex items-center justify-center text-xs" style={pf}>
          Loading Session...
        </div>
      }
    >
      <InterviewSessionWrapper />
    </Suspense>
  );
}

function InterviewSessionWrapper() {
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("interview_session");
    if (!stored) {
      setTimeout(() => setError("No active session found. Please start a session from the landing page."), 0);
      return;
    }

    try {
      const data = JSON.parse(stored);
      const targetUrl = data.url || data.livekit_url;
      if (!data.token || !targetUrl) {
        setTimeout(() => setError("No valid LiveKit session token found. Please configure a new session."), 0);
        return;
      }
      setTimeout(() => {
        setToken(data.token);
        setUrl(targetUrl);
      }, 0);
    } catch {
      setTimeout(() => setError("Invalid session state."), 0);
    }
  }, []);

  if (error) {
    return (
      <div
        className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center"
        style={pf}
      >
        <h2 className="text-xl font-bold text-white mb-2" style={pf}>
          Session Error
        </h2>
        <p className="text-[11px] text-white/35 mb-6 max-w-sm leading-relaxed" style={pf}>
          {error}
        </p>
        <Link href="/">
          <button
            className="px-4 py-2 rounded-lg text-xs text-white/60 border border-white/[0.08] hover:bg-white/[0.05] hover:text-white transition-colors"
            style={pf}
          >
            Back to Home
          </button>
        </Link>
      </div>
    );
  }

  if (!token || !url) {
    return (
      <div className="min-h-screen bg-black text-white/25 flex items-center justify-center text-xs" style={pf}>
        Initializing LiveKit Engine...
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={url}
      connect={true}
      data-lk-theme="default"
    >
      <InterviewSession />
    </LiveKitRoom>
  );
}
