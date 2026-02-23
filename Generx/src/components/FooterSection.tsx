import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import generxLogo from "@/assets/generx-logo.png";

const team = [
  { name: "Mohd. Fahad", role: "Developer", initials: "MF" },
  { name: "Shivendra Pratap Singh", role: "Developer", initials: "SP" },
];

export const FooterSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <footer ref={ref} className="relative pt-24 pb-10 overflow-hidden border-t-2 border-primary/20">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16"
        >
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={generxLogo} alt="GeneRx logo" className="w-10 h-10 rounded-xl" />
              <div>
                <div className="font-display font-bold text-foreground">GeneRx</div>
                <div className="text-xs text-muted-foreground">Pharmacogenomic Analysis</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Precision medicine powered by genomics. Turning genetic data into life-saving clinical decisions.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4 text-xs uppercase tracking-widest">Platform</h4>
            <ul className="space-y-2.5">
              {["Genomic Analysis", "Drug Database", "CPIC Guidelines", "API Access", "Clinical Reports"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary footer-link block">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground mb-4 text-xs uppercase tracking-widest">Resources</h4>
            <ul className="space-y-2.5">
              {["Documentation", "Research Papers", "CPIC Database", "PharmGKB", "GitHub Repository"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary footer-link block">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Team */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4 text-xs uppercase tracking-widest">Team</h4>
            <div className="space-y-3">
              {team.map((member) => (
                <div key={member.name} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 btn-warm text-white"
                  >
                    {member.initials}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{member.name}</div>
                    <div className="text-xs text-muted-foreground">{member.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="section-divider mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            © 2026 GeneRx. Built for{" "}
            <span className="text-primary font-medium">precision medicine research</span>.
            Not for clinical use without validation.
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card rounded-lg p-2 border border-border hover:border-primary/40 hover:shadow-warm social-icon group"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
