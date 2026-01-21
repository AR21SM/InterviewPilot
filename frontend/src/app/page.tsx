"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { SectionSeparator } from "@/components/landing/section-separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-warm backend container in background so it's warm when candidate enters room
  useState(() => {
    if (typeof window !== "undefined") {
      fetch("https://interviewpilot-8d3q.onrender.com/", { mode: "no-cors" }).catch(() => {});
    }
  });

  const [selectedType, setSelectedType] = useState<"behavioral" | "technical" | "system_design">("behavioral");
  const [level, setLevel] = useState<"intern" | "junior" | "mid">("mid");
  const [questionCount, setQuestionCount] = useState<3 | 5>(3);
  const [targetRole, setTargetRole] = useState("");
  const [focusTopic, setFocusTopic] = useState("");

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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartClick = () => {
    setIsConfigOpen(true);
  };

  const handleSelectTrack = (track: "behavioral" | "technical" | "system_design") => {
    setSelectedType(track);
    setIsConfigOpen(true);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation onStartClick={handleStartClick} />
      <HeroSection onStartClick={handleStartClick} />
      <FeaturesSection onSelectTrack={handleSelectTrack} />
      <SectionSeparator />
      <HowItWorksSection />
      <SectionSeparator />
      <IntegrationsSection />
      <SectionSeparator />
      <CtaSection onStartClick={handleStartClick} />
      <FooterSection />

      {/* Configuration Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Configure Interview Session</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Customize parameters for your mock interview.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-2 block">{"// TRACK"}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["behavioral", "technical", "system_design"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={cn(
                      "capitalize text-xs h-9 font-mono rounded-lg transition-colors border px-3 py-1 font-semibold outline-none focus:outline-none select-none",
                      selectedType === t
                        ? "!bg-white !text-black !border-white font-bold cursor-default"
                        : "bg-transparent border-border text-muted-foreground hover:text-white hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer"
                    )}
                    onClick={() => setSelectedType(t)}
                  >
                    {t.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-2 block">{"// EXPERIENCE LEVEL"}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["intern", "junior", "mid"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={cn(
                      "capitalize text-xs h-9 font-mono rounded-lg transition-colors border px-3 py-1 font-semibold outline-none focus:outline-none select-none",
                      level === l
                        ? "!bg-white !text-black !border-white font-bold cursor-default"
                        : "bg-transparent border-border text-muted-foreground hover:text-white hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer"
                    )}
                    onClick={() => setLevel(l)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-2 block">{"// QUESTION COUNT"}</Label>
              <div className="grid grid-cols-2 gap-2">
                {([3, 5] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    className={cn(
                      "text-xs h-9 font-mono rounded-lg transition-colors border px-3 py-1 font-semibold outline-none focus:outline-none select-none",
                      questionCount === cnt
                        ? "!bg-white !text-black !border-white font-bold cursor-default"
                        : "bg-transparent border-border text-muted-foreground hover:text-white hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer"
                    )}
                    onClick={() => setQuestionCount(cnt)}
                  >
                    {cnt} Questions (Demo)
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-1 block">{"// TARGET ROLE (OPTIONAL)"}</Label>
              <Input
                placeholder="e.g. Backend Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-background border-border text-foreground text-xs font-mono placeholder:text-muted-foreground/40 rounded-lg"
              />
            </div>

            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-1 block">{"// FOCUS AREA (OPTIONAL)"}</Label>
              <Input
                placeholder="e.g. Distributed Systems"
                value={focusTopic}
                onChange={(e) => setFocusTopic(e.target.value)}
                className="bg-background border-border text-foreground text-xs font-mono placeholder:text-muted-foreground/40 rounded-lg"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive font-mono bg-destructive/10 border border-destructive/20 p-2 rounded-lg">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setIsConfigOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartSession}
              disabled={loading}
              className="bg-foreground hover:bg-foreground/90 text-background font-semibold rounded-lg"
            >
              {loading ? "Initializing..." : "Launch Voice Session"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
