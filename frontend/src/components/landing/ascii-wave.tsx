"use client";

import { useEffect, useRef } from "react";

export function AsciiWave({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const chars = "█▓▒░ ";

    const updateSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "12px JetBrains Mono, monospace";

      const fontSize = 12;
      const cellWidth = 8;
      const cellHeight = 14;

      const cols = Math.ceil(canvas.width / cellWidth);
      const rows = Math.ceil(canvas.height / cellHeight);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const wave1 = Math.sin(x * 0.06 + time) * Math.cos(y * 0.08 + time * 0.5);
          const wave2 = Math.sin(x * 0.04 - time * 0.6) * Math.sin(y * 0.06 + time * 0.3);
          const wave3 = Math.cos(x * 0.02 + y * 0.02 + time * 0.4);

          const combined = (wave1 + wave2 + wave3) / 3;
          const normalized = (combined + 1) / 2;

          const charIndex = Math.floor(normalized * (chars.length - 1));
          const char = chars[charIndex];

          if (char !== " ") {
            const alpha = 0.05 + normalized * 0.22;
            const silverVal = Math.floor(180 + normalized * 75);
            ctx.fillStyle = `rgba(${silverVal}, ${silverVal + 5}, ${silverVal + 15}, ${alpha})`;
            ctx.fillText(char, x * cellWidth, y * cellHeight + fontSize);
          }
        }
      }

      time += 0.025;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", updateSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
