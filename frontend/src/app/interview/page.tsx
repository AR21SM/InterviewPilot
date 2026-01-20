"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useParticipants,
  useLocalParticipant,
  useTranscriptions,
  useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, RoomEvent } from "livekit-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Copy,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const agent = participants.find((p) => !p.isLocal);

  const isAgentSpeaking = agent?.isSpeaking || false;
  const isUserSpeaking = localParticipant?.isSpeaking || false;

  const [isMicEnabled, setIsMicEnabled] = useState(true);
  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(isMicEnabled);
    }
  }, [localParticipant, isMicEnabled]);

  const toggleMic = () => setIsMicEnabled(!isMicEnabled);

  // Live evaluation event state
  const [evaluations, setEvaluations] = useState<EvaluationEventData[]>([]);
  const [finalReport, setFinalReport] = useState<FinalReportData | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Listen to LiveKit Data Channel messages
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const text = new TextDecoder().decode(payload);
        const data = JSON.parse(text);

        if (data.type === "answer_evaluated") {
          setEvaluations((prev) => [...prev, data as EvaluationEventData]);
        } else if (data.type === "session_completed") {
          setFinalReport(data as FinalReportData);
          setIsReportOpen(true);
        }
      } catch (e) {
        console.error("Failed to parse data channel message:", e);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  // Derived evaluation scores
  const latestEval = evaluations.length > 0 ? evaluations[evaluations.length - 1] : null;
  const averageScore =
    evaluations.length > 0
      ? (evaluations.reduce((acc, curr) => acc + curr.overall_score, 0) / evaluations.length).toFixed(1)
      : null;

  // Real transcription hook
  const transcriptSegments = useTranscriptions();

  const handleEndSession = () => {
    if (room) {
      room.disconnect();
    }
    if (evaluations.length > 0 && !finalReport) {
      // Synthesize client fallback report if room ends early
      const fallbackReport: FinalReportData = {
        type: "session_completed",
        session_id: room.name,
        interview_type: "Mock Session",
        level: "mid",
        duration_seconds: elapsedTime,
        questions_answered: evaluations.length,
        session_average: parseFloat(averageScore || "0"),
        strengths: Array.from(new Set(evaluations.flatMap((e) => e.strengths))).slice(0, 3),
        top_improvements: Array.from(new Set(evaluations.flatMap((e) => e.improvements))).slice(0, 3),
        question_breakdown: evaluations.map((e) => ({
          question_number: e.question_number,
          question_id: e.question_id,
          question_title: `Question ${e.question_number}`,
          question_text: `Evaluated Question ${e.question_number}`,
          candidate_transcript: "Spoken Candidate Response",
          overall_score: e.overall_score,
          strengths: e.strengths,
          improvements: e.improvements,
        })),
        average_retrieval_ms: 0,
        average_evaluation_ms: 0,
      };
      setFinalReport(fallbackReport);
    }
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

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      <RoomAudioRenderer />

      {/* Header */}
      <header className="absolute top-0 w-full z-50 border-b border-white/10 bg-black/60 backdrop-blur-md h-16 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEndSession}
            className="text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-base font-bold tracking-tight text-white">InterviewPilot Session</h1>
            <div className="flex items-center gap-2">
              <span className={cn("text-[11px] font-mono", isConnected ? "text-green-400" : "text-yellow-400")}>
                • {roomState}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-black/60 border-white/10 px-3 py-1 font-mono text-zinc-400">
            <Clock className="w-3 h-3 mr-1.5 inline" /> {formatTime(elapsedTime)}
          </Badge>
          <Button size="sm" variant="destructive" className="rounded-full text-xs" onClick={handleEndSession}>
            End Session
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 pt-20 pb-28 px-6 h-screen flex flex-col md:grid md:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Panel: Score & Feedback */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full min-h-0">
          <Card className="bg-zinc-900/80 border-white/10 shrink-0">
            <CardHeader className="pb-2 py-3">
              <CardTitle className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                LATEST SCORE
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full bg-white/5", isConnected ? "text-green-400" : "text-zinc-500")}>
                  {evaluations.length} EVALUATED
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestEval ? (
                <div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold text-white">{latestEval.overall_score.toFixed(1)}</span>
                    <span className="text-lg text-zinc-500 mb-1">/ 10</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-white transition-all duration-500"
                      style={{ width: `${latestEval.overall_score * 10}%` }}
                    />
                  </div>
                  {averageScore && (
                    <p className="text-xs text-zinc-400 font-mono">
                      Session Average: <span className="text-white font-semibold">{averageScore}/10</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-2 text-xs text-zinc-500">No responses evaluated yet. Answer a question to generate live feedback.</div>
              )}
            </CardContent>
          </Card>

          {/* Feedback Card */}
          <Card className="bg-zinc-900/80 border-white/10 flex-1 flex flex-col min-h-0">
            <CardHeader className="py-3 border-b border-white/5 shrink-0">
              <CardTitle className="text-xs font-semibold flex items-center gap-2 text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Grounded Rubric Feedback
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              {latestEval ? (
                <div className="flex flex-col gap-4 text-xs">
                  {latestEval.strengths.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-green-400 mb-1.5">Top Strengths</h4>
                      <ul className="list-disc list-inside space-y-1 text-zinc-300">
                        {latestEval.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestEval.improvements.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-amber-400 mb-1.5">Areas for Improvement</h4>
                      <ul className="list-disc list-inside space-y-1 text-zinc-300">
                        {latestEval.improvements.map((imp, idx) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {latestEval.criteria.length > 0 && (
                    <div className="pt-2 border-t border-white/5">
                      <h4 className="font-semibold text-zinc-400 mb-2">Criterion Evidence</h4>
                      <div className="space-y-2">
                        {latestEval.criteria.map((c, idx) => (
                          <div key={idx} className="bg-black/40 p-2 rounded border border-white/5">
                            <div className="flex justify-between font-mono text-[11px] mb-1">
                              <span className="text-zinc-300 capitalize">{c.criterion.replace("_", " ")}</span>
                              <span className="text-white font-bold">{c.score}/5</span>
                            </div>
                            {c.evidence && <p className="text-[11px] text-zinc-400 italic">"{c.evidence}"</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-zinc-500 py-4 text-center">
                  Live rubric evaluation events will appear here after candidate response.
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* Center: Agent Voice Orb */}
        <div className="col-span-12 lg:col-span-6 flex flex-col justify-center items-center relative h-full min-h-0">
          <div className="relative flex items-center justify-center w-full h-full max-h-[500px]">
            <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full opacity-20" />

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute w-[360px] h-[360px] border border-white/5 rounded-full border-dashed opacity-30"
            />

            <AnimatePresence>
              {isUserSpeaking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                      className="absolute w-[200px] h-[200px] rounded-full border border-green-500/30"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative z-20">
              <motion.div
                animate={{
                  scale: isAgentSpeaking ? [1, 1.1, 1] : 1,
                  filter: isAgentSpeaking ? "blur(30px)" : "blur(10px)",
                }}
                className={cn(
                  "absolute inset-0 rounded-full bg-gradient-to-r blur-xl transition-colors duration-500",
                  isAgentSpeaking ? "from-purple-500/60 to-indigo-500/60" : "from-green-500/30 to-emerald-500/30"
                )}
              />
              <motion.div
                animate={{
                  scale: isAgentSpeaking ? [0.95, 1.05, 0.95] : 1,
                }}
                className={cn(
                  "w-44 h-44 rounded-full bg-black border flex items-center justify-center relative overflow-hidden backdrop-blur-3xl shadow-2xl transition-all duration-500",
                  isAgentSpeaking ? "border-purple-500/50" : "border-green-500/30"
                )}
              >
                <div className="relative z-10 text-center">
                  <div className={cn("w-3 h-3 rounded-full mx-auto mb-2", isConnected ? "bg-green-500" : "bg-yellow-500")} />
                  <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">
                    {isAgentSpeaking ? "SPEAKING" : isUserSpeaking ? "LISTENING" : isConnected ? "READY" : "CONNECTING"}
                  </span>
                </div>
              </motion.div>
            </div>

            <div className="absolute bottom-8 text-center z-20">
              <h3 className="text-xl font-bold tracking-tight text-white mb-1">
                {isAgentSpeaking ? "Alex is speaking..." : isUserSpeaking ? "Candidate speaking..." : "Alex is ready"}
              </h3>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Transcript */}
        <div className="col-span-12 lg:col-span-3 flex flex-col h-full min-h-0">
          <Card className="bg-zinc-900/80 border-white/10 h-full flex flex-col min-h-0">
            <CardHeader className="py-3 border-b border-white/5 shrink-0">
              <CardTitle className="text-xs font-semibold flex items-center gap-2 text-zinc-300">
                <BarChart3 className="w-3.5 h-3.5 text-zinc-400" /> Real-time Speech Transcript
              </CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-3 text-xs">
                {transcriptSegments && transcriptSegments.length > 0 ? (
                  transcriptSegments.map((seg: any, idx: number) => (
                    <div key={idx} className={cn("p-2 rounded border border-white/5", seg.participant?.isLocal ? "bg-zinc-900 text-white" : "bg-black/40 text-zinc-300")}>
                      <span className="font-mono text-[10px] text-zinc-500 block mb-1">
                        {seg.participant?.isLocal ? "CANDIDATE" : "ALEX (COACH)"}
                      </span>
                      <p>{seg.text}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-500 text-[11px] py-4 text-center">
                    Speech transcripts will stream here in real time as candidate and agent converse.
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </main>

      {/* Controls Bar */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center items-center z-50">
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-full p-2 pl-4 flex items-center gap-4 shadow-2xl">
          <div className="flex items-center gap-2 mr-2">
            <div className={cn("w-2 h-2 rounded-full", isConnected ? "bg-green-500" : "bg-yellow-500")} />
            <span className="text-xs text-zinc-400 font-mono hidden sm:block">Voice Engine Connected</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <Button
            variant={isMicEnabled ? "secondary" : "destructive"}
            size="icon"
            className="rounded-full w-10 h-10"
            onClick={toggleMic}
          >
            {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Final Session Report Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-400" /> Final Interview Session Report
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Synthesized evaluation report grounded in interview rubrics.
            </DialogDescription>
          </DialogHeader>

          {finalReport ? (
            <div className="space-y-6 text-xs pt-2">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-4 gap-3 bg-zinc-900/80 p-4 rounded-xl border border-white/10">
                <div>
                  <span className="text-zinc-400 text-[10px] block font-mono">OVERALL SCORE</span>
                  <span className="text-2xl font-bold text-white">{finalReport.session_average}/10</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] block font-mono">QUESTIONS</span>
                  <span className="text-2xl font-bold text-white">{finalReport.questions_answered}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] block font-mono">TRACK</span>
                  <span className="text-sm font-semibold text-white capitalize">{finalReport.interview_type}</span>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px] block font-mono">DURATION</span>
                  <span className="text-sm font-semibold text-white">{formatTime(finalReport.duration_seconds)}</span>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <h4 className="font-semibold text-green-400 mb-2 text-xs">Key Strengths</h4>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300">
                    {finalReport.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                  <h4 className="font-semibold text-amber-400 mb-2 text-xs">Top Priority Improvements</h4>
                  <ul className="list-disc list-inside space-y-1 text-zinc-300">
                    {finalReport.top_improvements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Technical Telemetry Section */}
              <div className="bg-black/50 p-3 rounded-lg border border-white/5 font-mono text-[10px] text-zinc-400">
                <p className="text-zinc-300 font-semibold mb-1">System Telemetry</p>
                <div className="flex gap-6">
                  <span>RAG Retrieval (avg): {finalReport.average_retrieval_ms}ms</span>
                  <span>Evaluator LLM (avg): {finalReport.average_evaluation_ms}ms</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button variant="outline" size="sm" onClick={copyReportText} className="border-white/10 text-white">
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> {copied ? "Copied!" : "Copy Report"}
                </Button>
                <Button size="sm" onClick={() => router.push("/")} className="bg-white text-black hover:bg-zinc-200">
                  Return Home
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-400">
              No session report data available.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InterviewPageContent() {
  const [sessionConfig, setSessionConfig] = useState<{ token: string; url: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("interview_session");
    if (!raw) {
      // Fallback: auto-create default behavioral session if accessed directly
      fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interview_type: "behavioral", level: "mid", question_count: 3 }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.token) {
            setSessionConfig(data);
          } else {
            setError("Failed to create session");
          }
        })
        .catch((e) => setError(e.message));
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setSessionConfig(parsed);
    } catch {
      setError("Invalid session credentials stored.");
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-400 gap-4 font-mono p-4 text-center">
        <AlertCircle className="w-12 h-12 mb-2" />
        <h2 className="text-lg font-bold text-white">Session Connection Error</h2>
        <p className="text-xs border border-red-500/20 bg-red-500/10 p-4 rounded">{error}</p>
        <Button onClick={() => (window.location.href = "/")} variant="outline">
          Return to Configuration
        </Button>
      </div>
    );
  }

  if (!sessionConfig) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs animate-pulse">
        Initializing LiveKit Voice Session...
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={sessionConfig.token}
      serverUrl={sessionConfig.url}
      connect={true}
      audio={true}
      video={false}
      data-lk-theme="default"
    >
      <InterviewSession />
    </LiveKitRoom>
  );
}

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500 font-mono text-xs">
          Loading Voice Interface...
        </div>
      }
    >
      <InterviewPageContent />
    </Suspense>
  );
}
