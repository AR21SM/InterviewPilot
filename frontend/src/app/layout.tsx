import type { Metadata } from "next";
import { Inter, JetBrains_Mono, VT323 } from "next/font/google";
import { GeistPixelLine } from "geist/font/pixel";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "InterviewPilot | Real-Time Voice AI Interview Coach",
  description: "Real-time voice AI interview coach with LiveKit, Groq, rubric-grounded RAG, structured evaluations, and adaptive follow-ups.",
  keywords: ["interview", "AI", "coach", "voice-ai", "livekit", "groq", "rag", "pydantic"],
  authors: [{ name: "InterviewPilot" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${vt323.variable} ${GeistPixelLine.variable} font-sans bg-background text-foreground antialiased`}>
        {children}
        <Toaster richColors position="top-right" theme="dark" />
      </body>
    </html>
  );
}
