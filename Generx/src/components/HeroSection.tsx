import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import { HeroDNAHelix } from "./HeroDNAHelix";

const AnimatedCounter = ({ target, suffix = "" }: { target: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isNumber = !isNaN(Number(target));

  useEffect(() => {
    if (!isNumber) return;
    const num = Number(target);
    let frame: number;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * num));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          frame = requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [target, isNumber]);

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-display font-bold text-primary tabular-nums">
      {isNumber ? count : target}{suffix}
    </div>
  );
};

const FloatingCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.6 }}
    className="card-surface rounded-2xl p-5 w-72 animate-float"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-warm-teal/15 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-warm-teal animate-pulse" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">Patient ID</div>
        <div className="text-sm font-semibold text-foreground font-mono">PG-2847-K</div>
      </div>
      <div className="ml-auto badge-safe px-2 py-0.5 rounded-full text-xs font-medium">Safe</div>
    </div>
    <div className="space-y-2.5">
      {[
        { gene: "CYP2D6", drug: "Codeine", risk: "safe", pct: 92 },
        { gene: "CYP2C19", drug: "Clopidogrel", risk: "adjust", pct: 61 },
        { gene: "VKORC1", drug: "Warfarin", risk: "toxic", pct: 28 },
      ].map((row) => (
        <div key={row.gene} className="flex items-center gap-2">
          <div className="text-xs text-muted-foreground w-16 font-mono">{row.gene}</div>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${row.pct}%` }}
              transition={{ duration: 1.2, delay: 1 + row.pct * 0.005, ease: "easeOut" }}
              style={{
                background:
                  row.risk === "safe"
                    ? "hsl(145 50% 40%)"
                    : row.risk === "adjust"
                    ? "hsl(45 90% 50%)"
                    : "hsl(0 70% 55%)",
              }}
            />
          </div>
          <div className="text-xs font-medium text-foreground w-8 font-mono">{row.pct}%</div>
        </div>
      ))}
    </div>
    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
      <span className="text-xs text-muted-foreground">AI Confidence</span>
      <span className="text-xs font-bold text-warm-teal font-mono">97.4%</span>
    </div>
  </motion.div>
);

export const HeroSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center overflow-hidden">
      {/* Parallax background */}
      <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
        <img src={heroBg} alt="" className="w-full h-[120%] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      </motion.div>

      {/* 3D rotating DNA helix */}
      <HeroDNAHelix />

      {/* Warm ambient orbs */}
      <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-warm-teal/5 blur-[120px] pointer-events-none z-0" />

      <motion.div
        className="container relative z-10 mx-auto px-4 pt-24 pb-16"
        style={{ y: contentY, opacity }}
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
          {/* Left content */}
          <div className="space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm"
            >
              <div className="w-2 h-2 rounded-full bg-warm-green animate-pulse" />
              <span className="text-muted-foreground font-medium">Pharmacogenomics × AI</span>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="space-y-2"
            >
              <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-display font-bold leading-[1.05] tracking-tight">
                <span className="text-foreground">Know Your</span>
                <br />
                <span className="gradient-text">Drug Risk</span>
                <br />
                <span className="text-foreground">Before You</span>{" "}
                <span className="relative">
                  <span className="text-foreground">Prescribe</span>
                  <motion.span
                    className="absolute -bottom-1 left-0 h-[3px] rounded-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, delay: 1 }}
                  />
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg text-muted-foreground max-w-lg leading-relaxed word-reveal"
            >
              {["Upload", "a", "VCF", "file.", "Select", "a", "drug.", "Get", "instant,", "CPIC-aligned", "risk", "predictions", "with", "transparent", "AI", "explanations."].map((word, i) => (
                <span key={i} style={{ animationDelay: `${0.5 + i * 0.06}s` }}>
                  {word}&nbsp;
                </span>
              ))}
            </motion.p>

            {/* Problem framing */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="glass rounded-xl p-4 border-l-4 border-l-warm-red"
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-bold text-warm-red">100,000+ Americans die annually</span>{" "}
                from preventable adverse drug reactions — many due to undetected pharmacogenomic variants.
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex gap-10"
            >
              {[
                { label: "Genes Covered", value: "6", suffix: "" },
                { label: "Drug-Gene Pairs", value: "30", suffix: "+" },
                { label: "CPIC Level", value: "A", suffix: "" },
              ].map((s) => (
                <div key={s.label}>
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                  <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </motion.div>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <motion.a
                href="#upload"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white overflow-hidden btn-warm text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analyze Patient Data
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </motion.a>

              <motion.a
                href="#about"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold bg-card text-foreground border border-border hover:border-primary/40 hover:shadow-warm transition-all duration-300"
              >
                How It Works
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </motion.a>

              <motion.a
                href="/sample.vcf"
                download="sample_generx.vcf"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-sm bg-card border border-warm-green/30 text-warm-green hover:bg-warm-green/5 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Sample VCF
              </motion.a>
            </motion.div>
          </div>

          {/* Right: floating card */}
          <div className="hidden lg:flex justify-center items-center">
            <div className="relative">
              <div className="absolute -inset-8 rounded-3xl bg-primary/5 blur-3xl" />
              <FloatingCard />
              {/* Secondary floating cards */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="absolute -top-14 -right-12 card-surface rounded-xl p-3 text-xs"
              >
                <div className="text-muted-foreground">Variant Found</div>
                <div className="text-primary font-bold font-mono">CYP2D6*4</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.4 }}
                className="absolute -bottom-12 -left-12 card-surface rounded-xl p-3 text-xs"
              >
                <div className="text-muted-foreground">Risk Level</div>
                <div className="text-warm-green font-bold">✓ Low Risk</div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};
