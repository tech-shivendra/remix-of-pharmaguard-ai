import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { UploadSection } from "@/components/UploadSection";
import { ResultsSection } from "@/components/ResultsSection";
import { ExplainabilitySection } from "@/components/ExplainabilitySection";
import { CTASection } from "@/components/CTASection";
import { FooterSection } from "@/components/FooterSection";
import { useScrollReveal } from "@/hooks/use-animations";
import { AnalysisResult } from "@/lib/pharmacogenomics";

const Index = () => {
  const [results, setResults] = useState<AnalysisResult | null>(null);

  useScrollReveal();

  // Re-run observer whenever results change (new elements appear in DOM)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(
      ".reveal:not(.visible), .reveal-left:not(.visible), .reveal-right:not(.visible)"
    );
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [results]);

  const handleReset = () => {
    setResults(null);
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <UploadSection
          onResults={setResults}
          onReset={handleReset}
          hasResults={results !== null}
        />
        {results && <ResultsSection results={results} onNewAnalysis={handleReset} />}
        <ExplainabilitySection />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  );
};

export default Index;
