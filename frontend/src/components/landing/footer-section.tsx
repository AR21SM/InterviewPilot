"use client";

const pixelFont = { fontFamily: "var(--font-geist-pixel-line), var(--font-pixel), var(--font-jetbrains), monospace" };

const footerLinks = {
  Product: [
    { name: "Platform", href: "#features" },
    { name: "Interview Modes", href: "#modes" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Evaluation", href: "#evaluation" },
  ],
  Repository: [
    { name: "GitHub Repo", href: "https://github.com/AR21SM/InterviewPilot" },
    { name: "README.md", href: "https://github.com/AR21SM/InterviewPilot#readme" },
    { name: "MIT License", href: "https://github.com/AR21SM/InterviewPilot/blob/main/LICENSE" },
  ],
};

export function FooterSection() {
  return (
    <footer className="relative border-t border-border bg-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand Column */}
            <div className="md:col-span-2">
              {/* Logo */}
              <a href="#" className="flex items-center gap-2.5 mb-4">
                <span className="font-semibold text-lg tracking-tight" style={pixelFont}>
                  InterviewPilot
                </span>
              </a>

              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-6">
                An open-source rehearsal room for practicing difficult interview conversations before they count.
              </p>

              <a href="https://github.com/AR21SM/InterviewPilot" target="_blank" rel="noreferrer" className="font-mono text-xs text-white/45 transition-colors hover:text-primary">View source on GitHub</a>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-xs font-mono text-primary tracking-widest uppercase mb-4">{title}</h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            © 2026 InterviewPilot. MIT Licensed.
          </p>
        </div>
      </div>
    </footer>
  );
}
