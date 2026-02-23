import { useState, useRef } from "react";
import { useTiltEffect } from "@/hooks/use-animations";
import { AnalysisResult, PharmaGuardReport, RiskLabel, DetectedVariant } from "@/lib/pharmacogenomics";

// ─── Risk display config ──────────────────────────────────────

const riskConfig: Record<RiskLabel, {
  label: string;
  cls: string;
  icon: string;
  bar: string;
  border: string;
}> = {
  Safe: {
    label: "Safe",
    cls: "badge-safe",
    icon: "✓",
    bar: "hsl(145 50% 40%)",
    border: "border-warm-green/20 hover:border-warm-green/40",
  },
  "Adjust Dosage": {
    label: "Adjust Dosage",
    cls: "badge-adjust",
    icon: "⚠",
    bar: "hsl(45 90% 50%)",
    border: "border-warm-yellow/20 hover:border-warm-yellow/40",
  },
  Toxic: {
    label: "Toxic",
    cls: "badge-toxic",
    icon: "✕",
    bar: "hsl(0 70% 55%)",
    border: "border-warm-red/20 hover:border-warm-red/40",
  },
  Ineffective: {
    label: "Ineffective",
    cls: "badge-toxic",
    icon: "✕",
    bar: "hsl(0 70% 55%)",
    border: "border-warm-red/20 hover:border-warm-red/40",
  },
  Unknown: {
    label: "Unknown",
    cls: "badge-unknown",
    icon: "?",
    bar: "hsl(220 15% 50%)",
    border: "border-border/40 hover:border-border/60",
  },
};

// ─── Severity badge ───────────────────────────────────────────

const severityColors: Record<string, string> = {
  none: "text-warm-green",
  low: "text-warm-teal",
  moderate: "text-warm-yellow",
  high: "text-warm-red",
  critical: "text-warm-red",
};

// ─── Confidence bar ───────────────────────────────────────────

const ConfidenceBar = ({ score }: { score: number }) => {
  const pct = Math.round(score * 100);
  const color =
    score >= 0.9
      ? "hsl(145 50% 40%)"
      : score >= 0.7
      ? "hsl(45 90% 50%)"
      : "hsl(0 0% 55%)";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Confidence</span>
        <span className="font-mono font-medium" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>
    </div>
  );
};

// ─── Download helper ──────────────────────────────────────────

function downloadReport(report: PharmaGuardReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `generx-${report.patient_id}-${report.drug.toLowerCase()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Result card ──────────────────────────────────────────────

const ResultCard = ({ report }: { report: PharmaGuardReport }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  useTiltEffect(cardRef as React.RefObject<HTMLElement>);

  const risk = report.risk_assessment.risk_label;
  const cfg = riskConfig[risk] ?? riskConfig.Unknown;
  const profile = report.pharmacogenomic_profile;
  const llm = report.llm_generated_explanation;
  const qm = report.quality_metrics;
  const cr = report.clinical_recommendation;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={cardRef}
      className={`tilt-card card-surface overflow-hidden transition-all duration-300 border ${cfg.border}`}
    >
      {/* Severity top-bar */}
      <div
        className="h-1 w-full"
        style={{ background: cfg.bar, boxShadow: `0 0 10px ${cfg.bar}80` }}
      />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-foreground truncate">{report.drug}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-muted-foreground">{profile.primary_gene}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground font-mono">{profile.diplotype}</span>
            </div>
          </div>
          <div className={`${cfg.cls} px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 flex-shrink-0`}>
            <span>{cfg.icon}</span>
            <span>{cfg.label}</span>
          </div>
        </div>

        {/* Phenotype + severity + confidence */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between text-xs flex-wrap gap-2">
            <span className="text-muted-foreground">
              Phenotype:{" "}
              <span className="text-foreground font-medium">{profile.phenotype}</span>
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`font-medium uppercase tracking-wide text-xs ${severityColors[report.risk_assessment.severity] || "text-muted-foreground"}`}
              >
                {report.risk_assessment.severity} severity
              </span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs border border-primary/20">
                {qm.variants_detected} variants
              </span>
            </div>
          </div>
          <ConfidenceBar score={report.risk_assessment.confidence_score} />
        </div>

        {/* Detected variants */}
        {profile.detected_variants.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-muted-foreground mb-2">Detected Variants</div>
            <div className="flex flex-wrap gap-1.5">
              {profile.detected_variants.map((v) => (
                <a
                  key={v.rsid}
                  href={`https://www.pharmgkb.org/variant/${v.rsid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View on PharmGKB"
                  className="text-xs font-mono bg-primary/5 rounded-full px-2.5 py-1 text-primary border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  {v.rsid} ({v.star_allele})
                </a>
              ))}
            </div>
          </div>
        )}

        {/* CPIC badge */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs bg-warm-coral/10 rounded-full px-2.5 py-1 text-primary border border-primary/20 font-medium">
            CPIC {qm.cpic_guideline_version}
          </span>
          {qm.supported_gene_detected && (
            <span className="text-xs bg-warm-green/10 rounded-full px-2.5 py-1 text-warm-green border border-warm-green/20">
              ✓ Gene in DB
            </span>
          )}
        </div>

        {/* Expandable clinical details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left text-sm text-muted-foreground hover:text-foreground flex items-center justify-between py-2 border-t border-border/50 transition-colors"
          aria-expanded={expanded}
        >
          <span className="font-medium">View Clinical Details & AI Explanation</span>
          <svg
            className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          className={`overflow-hidden transition-all duration-500 ${
            expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-3 pt-3">
            <div className="card-surface p-4">
              <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
                Clinical Recommendation
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {cr.action}
              </p>
            </div>
            <div className="card-surface p-4 border border-warm-yellow/20">
              <div className="text-xs font-semibold text-warm-yellow mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Dosing Recommendation (CPIC Level A)
              </div>
              <p className="text-sm text-foreground leading-relaxed font-medium">
                {cr.dosing_recommendation}
              </p>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
                AI Summary
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{llm.summary}</p>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs font-semibold text-warm-teal mb-2 uppercase tracking-wider">
                Biological Mechanism
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{llm.mechanism}</p>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs font-semibold text-warm-green mb-2 uppercase tracking-wider">
                Clinical Impact
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{llm.clinical_impact}</p>
            </div>
          </div>
        </div>

        {/* Per-card actions */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-border/30">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-muted/50 rounded-lg px-3 py-2 hover:text-primary transition-colors border border-border"
            aria-label={`Copy ${report.drug} JSON`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {copied ? "Copied!" : "Copy JSON"}
          </button>
          <button
            onClick={() => downloadReport(report)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs rounded-lg px-3 py-2 font-medium transition-all"
            style={{
              background: "hsl(22 90% 55% / 0.1)",
              border: "1px solid hsl(22 90% 55% / 0.3)",
              color: "hsl(22 90% 50%)",
            }}
            aria-label={`Download ${report.drug} JSON`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Variant Browser Table ────────────────────────────────────

const VariantBrowser = ({ variants }: { variants: DetectedVariant[] }) => {
  const [sortKey, setSortKey] = useState<keyof DetectedVariant>("gene");
  const [sortAsc, setSortAsc] = useState(true);

  if (variants.length === 0) return null;

  const sorted = [...variants].sort((a, b) => {
    const av = String(a[sortKey] ?? "");
    const bv = String(b[sortKey] ?? "");
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const handleSort = (key: keyof DetectedVariant) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const downloadCSV = () => {
    const header = "rsID,Gene,Star Allele,Chromosome,Position,REF,ALT";
    const rows = variants.map(v =>
      `${v.rsid},${v.gene},${v.star_allele},${v.chromosome ?? ""},${v.position ?? ""},${v.ref ?? ""},${v.alt ?? ""}`
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "generx-variants.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }: { col: keyof DetectedVariant }) => (
    <svg className={`w-3 h-3 inline ml-1 ${sortKey === col ? "text-primary" : "text-muted-foreground/50"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d={sortKey === col && !sortAsc ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
    </svg>
  );

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
          <span className="text-sm font-semibold text-foreground">Variant Browser</span>
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs border border-primary/20">{variants.length} variants</span>
        </div>
        <button
          onClick={downloadCSV}
          className="flex items-center gap-1.5 text-xs bg-muted/50 rounded-lg px-3 py-1.5 hover:text-primary transition-colors border border-border"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              {([["rsid","rsID"],["gene","Gene"],["star_allele","Star Allele"],["chromosome","Chr"],["position","Position"],["ref","REF"],["alt","ALT"]] as [keyof DetectedVariant, string][]).map(([key, label]) => (
                <th
                  key={key}
                  className="px-4 py-2.5 text-left font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                  onClick={() => handleSort(key)}
                >
                  {label}<SortIcon col={key} />
                </th>
              ))}
              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">PharmGKB</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((v, i) => (
              <tr key={`${v.rsid}-${i}`} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 font-mono text-primary">{v.rsid}</td>
                <td className="px-4 py-2.5 font-bold text-foreground">{v.gene}</td>
                <td className="px-4 py-2.5 font-mono text-warm-coral">{v.star_allele}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{v.chromosome || "—"}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{v.position?.toLocaleString() || "—"}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{v.ref || "—"}</td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{v.alt || "—"}</td>
                <td className="px-4 py-2.5">
                  <a
                    href={`https://www.pharmgkb.org/variant/${v.rsid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── JSON viewer (all drugs) ──────────────────────────────────

const JsonViewer = ({
  reports,
  patientId,
}: {
  reports: PharmaGuardReport[];
  patientId: string;
}) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const report = reports[activeIdx];
  const json = JSON.stringify(report, null, 2);

  const handleCopy = (idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(reports[idx], null, 2));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleDownloadAll = () => {
    const blob = new Blob([JSON.stringify(reports, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generx-${patientId}-all.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card-surface overflow-hidden">
      {/* Drug tabs */}
      {reports.length > 1 && (
        <div className="flex overflow-x-auto border-b border-border bg-muted/20">
          {reports.map((r, i) => (
            <button
              key={r.drug}
              onClick={() => setActiveIdx(i)}
              className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                i === activeIdx
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.drug}
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warm-red/60" />
          <div className="w-3 h-3 rounded-full bg-warm-yellow/60" />
          <div className="w-3 h-3 rounded-full bg-warm-green/60" />
          <span className="ml-2 text-xs text-muted-foreground font-mono">
            {report.drug.toLowerCase()}_report.json
          </span>
          <span className="text-xs bg-warm-green/10 rounded-full px-2 py-0.5 text-warm-green border border-warm-green/20 ml-2">
            ✓ Schema Valid
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleCopy(activeIdx)}
            className="flex items-center gap-1.5 text-xs bg-muted/50 rounded-lg px-3 py-1.5 hover:text-primary transition-colors border border-border"
            aria-label="Copy JSON"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            {copiedIdx === activeIdx ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 font-medium transition-all"
            style={{
              background: "hsl(22 90% 55% / 0.1)",
              border: "1px solid hsl(22 90% 55% / 0.3)",
              color: "hsl(22 90% 50%)",
            }}
            aria-label="Download all JSON"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download All
          </button>
        </div>
      </div>

      {/* JSON body */}
      <pre className="p-5 text-xs font-mono text-muted-foreground overflow-auto max-h-72 leading-relaxed">
        <code>{json}</code>
      </pre>
    </div>
  );
};

// ─── Safety disclaimer ────────────────────────────────────────

const SafetyDisclaimer = () => (
  <div className="max-w-3xl mx-auto mt-12">
    <div
      className="glass rounded-2xl p-6 border"
      style={{ borderColor: "hsl(45 100% 60% / 0.25)" }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "hsl(45 100% 60% / 0.15)", border: "1px solid hsl(45 100% 60% / 0.4)" }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: "hsl(45 100% 60%)" }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h4
            className="font-bold text-sm mb-2 uppercase tracking-wider"
            style={{ color: "hsl(45 100% 60%)" }}
          >
            Medical Disclaimer
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This tool is intended for{" "}
            <span className="text-foreground font-medium">educational and research purposes only</span>.
            It is{" "}
            <span className="text-foreground font-medium">not a substitute</span>{" "}
            for professional medical advice, clinical diagnosis, or clinical decision-making.
            Pharmacogenomic results must be interpreted by a qualified healthcare professional
            in the context of a patient's full clinical picture. Risk assessments are aligned with{" "}
            <span className="text-primary font-medium">CPIC Guidelines v2024.1</span> but do not
            constitute clinical guidance. Always consult a licensed clinician before making
            prescribing decisions.
          </p>
        </div>
      </div>
    </div>
  </div>
);

// ─── Main section ─────────────────────────────────────────────

interface ResultsSectionProps {
  results: AnalysisResult;
  onNewAnalysis?: () => void;
}

export const ResultsSection = ({ results, onNewAnalysis }: ResultsSectionProps) => {
  const { reports, patientId, variantsFound, schemaErrors, variants } = results;

  const counts: Record<RiskLabel, number> = {
    Safe: 0,
    "Adjust Dosage": 0,
    Toxic: 0,
    Ineffective: 0,
    Unknown: 0,
  };
  reports.forEach((r) => { counts[r.risk_assessment.risk_label]++; });

  const statBadges = [
    { count: counts.Safe, label: "Safe", cls: "badge-safe" },
    { count: counts["Adjust Dosage"], label: "Adjust", cls: "badge-adjust" },
    { count: counts.Toxic + counts.Ineffective, label: "High Risk", cls: "badge-toxic" },
    { count: counts.Unknown, label: "Unknown", cls: "badge-unknown" },
  ].filter((s) => s.count > 0);

  return (
    <section id="results" className="py-24 relative">
      <div className="absolute top-0 left-0 right-0 section-divider" />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 reveal">
          <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
            <div className="inline-flex items-center gap-2 bg-warm-green/10 border border-warm-green/30 rounded-full px-4 py-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-warm-green animate-pulse" />
              <span className="text-warm-green font-medium">Analysis Complete</span>
            </div>
            {onNewAnalysis && (
              <button
                onClick={onNewAnalysis}
                className="inline-flex items-center gap-1.5 bg-card rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:border-primary/40 border border-border transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New Analysis
              </button>
            )}
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Pharmacogenomic <span className="gradient-text">Risk Report</span>
          </h2>
          <p className="text-muted-foreground">
            Patient ID:{" "}
            <span className="font-mono text-primary font-medium">{patientId}</span>{" "}
            · {variantsFound} variant{variantsFound !== 1 ? "s" : ""} parsed · {reports.length} drug
            {reports.length !== 1 ? "s" : ""} analyzed
          </p>
        </div>

        {/* Schema validation errors */}
        {schemaErrors.length > 0 && (
          <div className="max-w-3xl mx-auto mb-8">
            {schemaErrors.map((err, i) => (
              <div
                key={i}
                className="flex items-start gap-3 glass rounded-xl p-4 mb-3 border border-neon-red/30"
              >
                <svg className="w-5 h-5 text-neon-red flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-neon-red">{err}</p>
              </div>
            ))}
          </div>
        )}

        {/* Summary stats */}
        <div
          className="grid gap-4 max-w-xl mx-auto mb-12 reveal"
          style={{
            transitionDelay: "0.1s",
            gridTemplateColumns: `repeat(${statBadges.length}, 1fr)`,
          }}
        >
          {statBadges.map((s) => (
            <div key={s.label} className={`${s.cls} rounded-xl p-4 text-center`}>
              <div className="text-3xl font-black">{s.count}</div>
              <div className="text-xs font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* No variants warning */}
        {variantsFound === 0 && (
          <div className="max-w-3xl mx-auto mb-8 glass rounded-xl p-4 flex items-start gap-3 border border-neon-yellow/30">
            <svg className="w-5 h-5 text-neon-yellow flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-muted-foreground">
              <span className="text-warm-yellow font-medium">No GENE/STAR tags detected in VCF.</span>{" "}
              Engine defaulted to wildtype (*1/*1) assumptions. For accurate results ensure your VCF
              INFO column contains{" "}
              <code className="text-primary">GENE=</code> and{" "}
              <code className="text-primary">STAR=</code> annotations.
              Download the{" "}
              <a href="/sample.vcf" download className="text-primary hover:underline">sample VCF</a>{" "}
              to see the expected format.
            </p>
          </div>
        )}

        {/* Result cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {reports.map((r, i) => (
            <div key={r.drug} className="reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
              <ResultCard report={r} />
            </div>
          ))}
        </div>

        {/* Variant browser table */}
        {variants && variants.length > 0 && (
          <div className="max-w-5xl mx-auto mb-12 reveal" style={{ transitionDelay: "0.2s" }}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-primary">🔬</span>
              Parsed Variant Browser
            </h3>
            <VariantBrowser variants={variants} />
          </div>
        )}

        {/* Aggregated JSON viewer */}
        <div className="max-w-3xl mx-auto reveal" style={{ transitionDelay: "0.3s" }}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-primary">{"{ }"}</span>
            Raw JSON Output — Schema v2024.1
          </h3>
          <JsonViewer reports={reports} patientId={patientId} />
        </div>

        {/* Safety disclaimer */}
        <SafetyDisclaimer />
      </div>
    </section>
  );
};
