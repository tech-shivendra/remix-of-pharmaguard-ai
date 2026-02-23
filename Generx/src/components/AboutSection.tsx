import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTiltEffect } from "@/hooks/use-animations";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
    title: "VCF v4.2 Parsing",
    desc: "Validates VCF headers and extracts pharmacogenomic variants from INFO tags with strict format checking.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    title: "Diplotype → Phenotype",
    desc: "Star allele pairs mapped to metabolizer phenotypes across CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2M12 3v1m0 16v1m0-9h.01" />
      </svg>
    ),
    title: "Risk Classification",
    desc: "CPIC engine classifies drug risks as Safe, Adjust Dosage, Toxic, Ineffective, or Unknown with confidence scores.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "CPIC Guidelines",
    desc: "All recommendations aligned with CPIC Level A evidence. Schema-validated JSON output for interoperability.",
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: "-50px" });
  useTiltEffect(cardRef as React.RefObject<HTMLElement>);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="tilt-card card-surface p-6 group cursor-default"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-primary bg-primary/10 border border-primary/20">
          {feature.icon}
        </div>
        <div className="font-mono text-xs text-muted-foreground/40 pt-1">0{index + 1}</div>
      </div>
      <h3 className="text-base font-display font-bold text-foreground mb-2">{feature.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
      <div className="mt-5 h-0.5 w-8 rounded-full bg-primary/30 transition-all duration-500 group-hover:w-full" />
    </motion.div>
  );
};

export const AboutSection = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });
  const pipelineRef = useRef<HTMLDivElement>(null);
  const pipelineInView = useInView(pipelineRef, { once: true, margin: "-80px" });

  return (
    <section id="about" className="py-28 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="container mx-auto px-4">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="subtitle-accent mb-4">core technology :</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            How <span className="gradient-text">GeneRx</span> Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A multi-layered genomic analysis pipeline turning raw genetic data into actionable clinical insights.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>

        {/* Pipeline visualization */}
        <motion.div
          ref={pipelineRef}
          initial={{ opacity: 0, y: 30 }}
          animate={pipelineInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="card-surface p-8"
        >
          <div className="flex items-center justify-between text-center overflow-x-auto gap-4">
            {[
              { step: "01", label: "Upload VCF", icon: "📁" },
              { step: "02", label: "Parse Variants", icon: "🔬" },
              { step: "03", label: "Gene Mapping", icon: "🧬" },
              { step: "04", label: "CPIC Lookup", icon: "📋" },
              { step: "05", label: "Risk Report", icon: "📊" },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center gap-4 flex-shrink-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={pipelineInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-xl mb-2">{s.icon}</div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-xs font-display font-bold text-primary mb-2">
                    {s.step}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{s.label}</div>
                </motion.div>
                {i < 4 && (
                  <div className="flex items-center">
                    <div className="w-8 h-px bg-gradient-to-r from-primary/40 to-warm-teal/40" />
                    <svg className="w-3 h-3 text-muted-foreground/40" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
