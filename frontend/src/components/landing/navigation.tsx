"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ExternalLink } from "lucide-react";

export function Navigation({ onStartClick }: { onStartClick?: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => { setIsScrolled(window.scrollY > 20); };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled || isMobileMenuOpen ? "bg-background/95 backdrop-blur-xl border-b border-border/50" : "bg-transparent"}`}>
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group"><span className="text-xl font-bold tracking-tight">InterviewPilot</span></a>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a href="https://github.com/AR21SM/InterviewPilot" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono">GitHub <ExternalLink className="w-3.5 h-3.5" /></a>
            <Button size="sm" onClick={onStartClick} className="bg-foreground hover:bg-foreground/90 text-background font-medium rounded-lg">Start Practice →</Button>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-secondary/50 transition-colors" aria-label="Toggle menu">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMobileMenuOpen ? "max-h-[300px] pb-6" : "max-h-0"}`}>
          <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
            <a href="https://github.com/AR21SM/InterviewPilot" target="_blank" rel="noreferrer" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground font-mono flex items-center justify-between">GitHub Repository <ExternalLink className="w-4 h-4" /></a>
            <Button onClick={() => { setIsMobileMenuOpen(false); onStartClick?.(); }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg">Start Practice →</Button>
          </div>
        </div>
      </nav>
    </header>
  );
}
