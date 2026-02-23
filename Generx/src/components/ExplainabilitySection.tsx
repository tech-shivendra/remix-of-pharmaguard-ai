import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTiltEffect } from "@/hooks/use-animations";

const variants = [
  {
    gene: "CYP2D6",
    variant: "c.100C>T (rs1065852)",
    rsid: "rs1065852",
    impact: "Poor Metabolizer",
    drugs: ["Codeine", "Tramadol", "Metoprolol"],
    mechanism: "Loss-of-function *4 allele abolishes CYP2D6 enzyme activity, preventing codeine-to-morphine conversion.",
    color: "red" as const,
  },
  {
    gene: "CYP2C19",
    variant: "c.681G>A (rs4244285)",
    rsid: "rs4244285",
    impact: "Reduced Activation",
    drugs: ["Clopidogrel", "Omeprazole"],
    mechanism: "*2 loss-of-function variant impairs CYP2C19-mediated bioactivation of clopidogrel prodrug.",
    color: "yellow" as const,
  },
  {
    gene: "DPYD",
    variant: "c.1905+1G>A (rs3918290)",
    rsid: "rs3918290",
    impact: "DPD Deficiency",
    drugs: ["Fluorouracil", "Capecitabine"],
    mechanism: "*2A splice-site variant causes complete DPD enzyme deficiency — CPIC Level A contraindication.",
    color: "green" as const,
  },
];

const timeline = [
  { step: "1", title: "Genomic Variant Identification", desc: "Parses VCF and identifies pharmacogenomically relevant variants using curated databases.", icon: "🧬" },
  { step: "2", title: "Diplotype Assignment", desc: "Star allele nomenclature assigned using population-specific haplotype algorithms.", icon: "🔗" },
  { step: "3", title: "Phenotype Prediction", desc: "Activity scores calculated to assign metabolizer status: PM, IM, NM, RM, or UM.", icon: "📈" },
  { step: "4", title: "CPIC Guideline Lookup", desc: "Cross-reference with CPIC level A/B guidelines for drug-gene pair recommendations.", icon: "📋" },
  { step: "5", title: "Risk Synthesis", desc: "Integrates variant data, phenotype, and clinical context to generate risk score and narrative.", icon: "⚡" },
];

const colorStyles = {
  red: {
    border: "border-warm-red/20 hover:border-warm-red/40",
    text: "text-warm-red",
    bg: "bg-warm-red/10",
    gradient: "hsl(0 70% 55%)",
  },
  yellow: {
    border: "border-warm-yellow/20 hover:border-warm-yellow/40",
    text: "text-warm-yellow",
    bg: "bg-warm-yellow/10",
    gradient: "hsl(45 90% 55%)",
  },
  green: {
    border: "border-warm-green/20 hover:border-warm-green/40",
    text: "text-warm-green",
    bg: "bg-warm-green/10",
    gradient: "hsl(145 50% 40%)",
  },
};

const VariantCard = ({ variant, index }: { variant: typeof variants[0]; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  useTiltEffect(ref as React.RefObject<HTMLElement>);
  const cfg = colorStyles[variant.color];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12 }}
      className={`tilt-card card-surface p-6 border ${cfg.border} transition-all duration-300 group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className={`text-xl font-display font-bold ${cfg.text} font-mono`}>{variant.gene}</div>
          <div className="text-sm text-muted-foreground font-mono mt-0.5">{variant.variant}</div>
        </div>
        <div className={`${cfg.bg} ${cfg.text} text-xs font-bold px-3 py-1.5 rounded-full`}>
          {variant.impact}
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{variant.mechanism}</p>

      <div>
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Affected Drugs</div>
        <div className="flex flex-wrap gap-1.5">
          {variant.drugs.map((drug) => (
            <span key={drug} className="text-xs bg-muted/60 rounded-full px-2.5 py-1 text-foreground border border-border">
              {drug}
            </span>
          ))}
        </div>
      </div>

      <div
        className="mt-5 h-px rounded-full opacity-40"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.gradient}, transparent)` }}
      />
    </motion.div>
  );
};

export const ExplainabilitySection = () => {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInView = useInView(timelineRef, { once: true, margin: "-80px" });

  return (
    <section id="explainability" className="py-28 relative">
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="container mx-auto px-4">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="subtitle-accent mb-4">explainability :</div>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Variant <span className="gradient-text">Insights</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every prediction is backed by mechanistic explanation and clinical evidence.
          </p>
        </motion.div>

        {/* Variant cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-24">
          {variants.map((v, i) => (
            <VariantCard key={v.gene} variant={v} index={i} />
          ))}
        </div>

        {/* Timeline */}
        <motion.div
          ref={timelineRef}
          initial={{ opacity: 0, y: 30 }}
          animate={timelineInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <h3 className="text-2xl font-display font-bold text-center mb-10">
            Analysis <span className="gradient-text">Pipeline</span>
          </h3>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-warm-teal/30 to-transparent" />

            <div className="space-y-5">
              {timeline.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={timelineInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-5 items-start"
                >
                  <div className="relative flex-shrink-0 w-12 h-12 card-surface rounded-full flex items-center justify-center text-lg z-10 border-2 border-primary/20">
                    {item.icon}
                  </div>
                  <div className="card-surface p-5 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest font-mono">Step {item.step}</span>
                    </div>
                    <h4 className="font-display font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
