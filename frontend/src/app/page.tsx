"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Code2,
  Cpu,
  Mic,
  Sparkles,
  Zap,
  ChevronRight,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [selectedType, setSelectedType] = useState<"behavioral" | "technical" | "system_design">("behavioral");
  const [level, setLevel] = useState<"intern" | "junior" | "mid">("mid");
  const [questionCount, setQuestionCount] = useState<3 | 5>(3);
  const [targetRole, setTargetRole] = useState("");
  const [focusTopic, setFocusTopic] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const interviewTypes = [
    {
      id: "behavioral" as const,
      title: "Behavioral",
      description: "STAR structure, situation context, ownership, measurable impact, and self-awareness.",
      icon: <Mic className="w-6 h-6 text-blue-400" />,
      gradient: "from-blue-500/20 to-indigo-500/20",
      border: "hover:border-blue-500/50",
      stats: "STAR Framework",
    },
    {
      id: "technical" as const,
      title: "Technical Reasoning",
      description: "Verbal technical interview probing problem clarification, data structures, and Big-O complexity.",
      icon: <Code2 className="w-6 h-6 text-green-400" />,
      gradient: "from-green-500/20 to-emerald-500/20",
      border: "hover:border-green-500/50",
      stats: "Verbal DSA",
    },
    {
      id: "system_design" as const,
      title: "System Design",
      description: "Architect scalable distributed systems, discuss trade-offs, storage decisions, and failure modes.",
      icon: <Cpu className="w-6 h-6 text-purple-400" />,
      gradient: "from-purple-500/20 to-pink-500/20",
      border: "hover:border-purple-500/50",
      stats: "Architecture",
    },
  ];

  const handleStartSession = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_type: selectedType,
          level,
          question_count: questionCount,
          target_role: targetRole,
          focus_topic: focusTopic,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create LiveKit session");
      }

      const data = await res.json();
      sessionStorage.setItem("interview_session", JSON.stringify(data));
      router.push("/interview");
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const openConfigForType = (type: "behavioral" | "technical" | "system_design") => {
    setSelectedType(type);
    setIsConfigOpen(true);
  };

  return (
    <main className="min-h-screen bg-black text-foreground relative overflow-hidden selection:bg-white/20 font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-purple-500 opacity-20 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push("/")}>
            <span className="font-semibold tracking-tight text-white group-hover:text-gray-200 transition-colors">
              InterviewPilot
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              className="h-9 px-4 bg-white text-black hover:bg-zinc-200 transition-colors font-medium rounded-full"
              onClick={() => setIsConfigOpen(true)}
            >
              Start Practice
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-300 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Real-Time Voice AI & Rubric RAG
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 text-white"
        >
          Real-Time Voice <br />
          <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
            Interview Coach.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Adaptive mock interviews grounded in structured rubrics. Practice behavioral stories,
          technical reasoning, and system design with <span className="text-white font-medium">instant speech evaluation</span>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            size="lg"
            className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-zinc-200 transition-all shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_-5px_rgba(255,255,255,0.4)]"
            onClick={() => setIsConfigOpen(true)}
          >
            Configure Interview <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* Mode Selection Section */}
      <section id="select-mode" className="relative z-10 py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Choose Your Track</h2>
          <p className="text-zinc-400">Select an interview track to initialize your tailored session.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {interviewTypes.map((type, i) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              onClick={() => openConfigForType(type.id)}
              className="cursor-pointer"
            >
              <div
                className={cn(
                  "group relative h-full rounded-3xl border border-white/5 bg-zinc-900/50 p-8 hover:bg-zinc-900/80 transition-all duration-500 overflow-hidden",
                  type.border
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                    type.gradient
                  )}
                />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      {type.icon}
                    </div>
                    <Badge variant="outline" className="bg-black/20 border-white/10 text-zinc-400">
                      {type.stats}
                    </Badge>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all">
                    {type.title}
                  </h3>
                  <p className="text-zinc-400 mb-8 flex-grow leading-relaxed">
                    {type.description}
                  </p>

                  <div className="flex items-center text-sm font-medium text-white group-hover:translate-x-1 transition-transform">
                    Start Session <ChevronRight className="ml-1 w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 py-24 px-6 border-t border-white/5 bg-zinc-950/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Architecture Highlights</h2>
            <p className="text-zinc-400">Grounded evaluation & real-time voice streaming.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-white/10 bg-black p-8 relative overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Rubric RAG Retrieval</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Retrieves tailored interview cards and weighted rubrics from a vector store, matching candidate level and track.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black p-8 relative overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-6">
                <Zap className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Structured LLM Evaluation</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Evaluates candidate transcripts against specific rubric criteria, returning structured evidence snippets and deterministic scores.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black p-8 relative overflow-hidden">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-6">
                <Terminal className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Measurable Final Report</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Generates a final session breakdown with score trends, recurring strengths, top improvements, and system timing telemetry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Configure Interview Session</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Customize parameters for your mock interview.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div>
              <Label className="text-sm text-zinc-300 mb-2 block">Interview Track</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["behavioral", "technical", "system_design"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={selectedType === t ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "capitalize text-xs h-9",
                      selectedType === t ? "bg-white text-black" : "border-white/10 text-zinc-300"
                    )}
                    onClick={() => setSelectedType(t)}
                  >
                    {t.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-zinc-300 mb-2 block">Experience Level</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["intern", "junior", "mid"] as const).map((l) => (
                  <Button
                    key={l}
                    variant={level === l ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "capitalize text-xs h-9",
                      level === l ? "bg-white text-black" : "border-white/10 text-zinc-300"
                    )}
                    onClick={() => setLevel(l)}
                  >
                    {l}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-zinc-300 mb-2 block">Questions Count</Label>
              <div className="grid grid-cols-2 gap-2">
                {([3, 5] as const).map((cnt) => (
                  <Button
                    key={cnt}
                    variant={questionCount === cnt ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "text-xs h-9",
                      questionCount === cnt ? "bg-white text-black" : "border-white/10 text-zinc-300"
                    )}
                    onClick={() => setQuestionCount(cnt)}
                  >
                    {cnt} Questions (Demo)
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-zinc-300 mb-1 block">Target Role (Optional)</Label>
              <Input
                placeholder="e.g. Backend Engineer, Systems Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 text-sm"
              />
            </div>

            <div>
              <Label className="text-sm text-zinc-300 mb-1 block">Focus Area (Optional)</Label>
              <Input
                placeholder="e.g. Distributed Systems, Rate Limiting"
                value={focusTopic}
                onChange={(e) => setFocusTopic(e.target.value)}
                className="bg-black/50 border-white/10 text-white placeholder:text-zinc-600 text-sm"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsConfigOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartSession}
              disabled={loading}
              className="bg-white text-black hover:bg-zinc-200"
            >
              {loading ? "Initializing..." : "Launch Voice Session"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
