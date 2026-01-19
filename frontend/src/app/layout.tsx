import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "InterviewPilot | AI Interview Coach",
  description: "Master your interviews with AI-powered voice coaching. Practice behavioral, technical, and system design interviews with real-time feedback.",
  keywords: ["interview", "AI", "coach", "practice", "behavioral", "technical", "career"],
  authors: [{ name: "InterviewPilot" }],
  openGraph: {
    title: "InterviewPilot | AI Interview Coach",
    description: "Master your interviews with AI-powered voice coaching",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans bg-background text-foreground antialiased`}>
        {children}
        <Toaster richColors position="top-right" theme="dark" />
      </body>
    </html>
  );
}
