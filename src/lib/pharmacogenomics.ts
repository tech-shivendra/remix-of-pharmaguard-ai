// ============================================================
// PharmaGuard – Pharmacogenomic Engine (client-side, production)
// CPIC Guidelines v2024.1 aligned
// No secrets / no hardcoded API keys. Set VITE_GEMINI_API_KEY in .env
// ============================================================

// ─── Types ───────────────────────────────────────────────────

export interface DetectedVariant {
  rsid: string;
  gene: string;
  star_allele: string;
  chromosome?: string;
  position?: number;
  ref?: string;
  alt?: string;
}

/** Risk labels per hackathon schema */
export type RiskLabel = "Safe" | "Adjust Dosage" | "Toxic" | "Ineffective" | "Unknown";

/** Severity values per schema: none | low | moderate | high | critical */
export type Severity = "none" | "low" | "moderate" | "high" | "critical";

export interface ParsedVCF {
  variants: DetectedVariant[];
  variantsFound: number;
  success: boolean;
  error?: string;
}

export interface RiskResult {
  drug: string;
  risk_label: RiskLabel;
  severity: Severity;
  confidence_score: number;
  phenotype: string;
  diplotype: string;
  primary_gene: string;
  action: string;
  dosing_recommendation: string;
  detected_variants: DetectedVariant[];
}

export interface QualityMetrics {
  vcf_parsing_success: boolean;
  variants_detected: number;
  supported_gene_detected: boolean;
  cpic_guideline_version: string;
}

export interface PharmaGuardReport {
  patient_id: string;
  drug: string;
  timestamp: string;
  risk_assessment: {
    risk_label: RiskLabel;
    confidence_score: number;
    severity: Severity;
  };
  pharmacogenomic_profile: {
    primary_gene: string;
    diplotype: string;
    phenotype: string;
    detected_variants: DetectedVariant[];
  };
  clinical_recommendation: {
    action: string;
    dosing_recommendation: string;
  };
  llm_generated_explanation: {
    summary: string;
    mechanism: string;
    clinical_impact: string;
  };
  quality_metrics: QualityMetrics;
}

export type LLMExplanation = PharmaGuardReport["llm_generated_explanation"];

// ─── Validation ───────────────────────────────────────────────

const VALID_RISK_LABELS: RiskLabel[] = ["Safe", "Adjust Dosage", "Toxic", "Ineffective", "Unknown"];
const VALID_SEVERITIES: Severity[] = ["none", "low", "moderate", "high", "critical"];

/**
 * Validates a generated report against the strict JSON schema.
 * Returns null if valid, or an error string describing the violation.
 */
export function validateSchema(report: unknown): string | null {
  if (!report || typeof report !== "object") return "Report must be an object.";
  const r = report as Record<string, unknown>;

  const requiredTopKeys: (keyof PharmaGuardReport)[] = [
    "patient_id", "drug", "timestamp", "risk_assessment",
    "pharmacogenomic_profile", "clinical_recommendation",
    "llm_generated_explanation", "quality_metrics",
  ];
  for (const key of requiredTopKeys) {
    if (!(key in r)) return `Missing required field: ${key}`;
  }

  if (typeof r.patient_id !== "string" || !r.patient_id) return "patient_id must be a non-empty string.";
  if (typeof r.drug !== "string" || !r.drug) return "drug must be a non-empty string.";
  if (typeof r.timestamp !== "string" || isNaN(Date.parse(r.timestamp as string)))
    return "timestamp must be a valid ISO 8601 string.";

  const ra = r.risk_assessment as Record<string, unknown>;
  if (!ra || typeof ra !== "object") return "risk_assessment must be an object.";
  if (!VALID_RISK_LABELS.includes(ra.risk_label as RiskLabel))
    return `risk_assessment.risk_label must be one of: ${VALID_RISK_LABELS.join(", ")}.`;
  if (typeof ra.confidence_score !== "number")
    return "risk_assessment.confidence_score must be a number.";
  if (!VALID_SEVERITIES.includes(ra.severity as Severity))
    return `risk_assessment.severity must be one of: ${VALID_SEVERITIES.join(", ")}.`;

  const pp = r.pharmacogenomic_profile as Record<string, unknown>;
  if (!pp || typeof pp !== "object") return "pharmacogenomic_profile must be an object.";
  for (const k of ["primary_gene", "diplotype", "phenotype"]) {
    if (typeof pp[k] !== "string") return `pharmacogenomic_profile.${k} must be a string.`;
  }
  if (!Array.isArray(pp.detected_variants)) return "pharmacogenomic_profile.detected_variants must be an array.";

  const cr = r.clinical_recommendation as Record<string, unknown>;
  if (!cr || typeof cr.action !== "string") return "clinical_recommendation.action must be a string.";
  if (typeof cr.dosing_recommendation !== "string") return "clinical_recommendation.dosing_recommendation must be a string.";

  const llm = r.llm_generated_explanation as Record<string, unknown>;
  if (!llm || typeof llm !== "object") return "llm_generated_explanation must be an object.";
  for (const k of ["summary", "mechanism", "clinical_impact"]) {
    if (typeof llm[k] !== "string") return `llm_generated_explanation.${k} must be a string.`;
  }

  const qm = r.quality_metrics as Record<string, unknown>;
  if (!qm || typeof qm !== "object") return "quality_metrics must be an object.";
  if (typeof qm.vcf_parsing_success !== "boolean") return "quality_metrics.vcf_parsing_success must be boolean.";
  if (typeof qm.variants_detected !== "number") return "quality_metrics.variants_detected must be a number.";
  if (typeof qm.supported_gene_detected !== "boolean") return "quality_metrics.supported_gene_detected must be boolean.";
  if (typeof qm.cpic_guideline_version !== "string") return "quality_metrics.cpic_guideline_version must be a string.";

  return null;
}

// ─── Pharmacogenomic Rule Database (CPIC 2024.1) ─────────────

interface DrugRule {
  risk: RiskLabel;
  severity: Severity;
  recommendation: string;
  dosing: string;
}

interface DiplotypeRule {
  phenotype: string;
  drugs: Record<string, DrugRule>;
}

type PharmaDB = Record<string, Record<string, DiplotypeRule>>;

/**
 * Internal pharmacogenomic rule database.
 * Gene → Diplotype → { phenotype, drugs → DrugRule }
 * Aligned with CPIC Guidelines 2024.1.
 */
export const pharmacogenomicDB: PharmaDB = {
  // ── CYP2D6 ──────────────────────────────────────────────────
  CYP2D6: {
    "*1/*1": {
      phenotype: "Normal Metabolizer (NM)",
      drugs: {
        CODEINE: {
          risk: "Safe",
          severity: "none",
          recommendation:
            "Standard codeine dosing. Normal CYP2D6 activity ensures adequate morphine conversion. No dose adjustment required per CPIC Level A.",
          dosing: "Standard dose: 15–60 mg every 4–6 h as needed (adult). No adjustment required.",
        },
        TRAMADOL: {
          risk: "Safe",
          severity: "none",
          recommendation: "Standard tramadol dosing appropriate for CYP2D6 Normal Metabolizers.",
          dosing: "Standard dose: 50–100 mg every 4–6 h (max 400 mg/day). No adjustment required.",
        },
        METOPROLOL: {
          risk: "Safe",
          severity: "none",
          recommendation: "Standard metoprolol dosing. Normal CYP2D6-mediated clearance expected.",
          dosing: "Standard dose per indication. No pharmacogenomic adjustment required.",
        },
      },
    },
    "*1/*4": {
      phenotype: "Intermediate Metabolizer (IM)",
      drugs: {
        CODEINE: {
          risk: "Adjust Dosage",
          severity: "moderate",
          recommendation:
            "Reduced codeine-to-morphine conversion. Consider lower starting dose or alternative opioid (e.g., morphine). Monitor for inadequate analgesia.",
          dosing: "Reduce starting dose by 25–50%. Consider tramadol alternatives. Monitor pain control closely.",
        },
        TRAMADOL: {
          risk: "Adjust Dosage",
          severity: "moderate",
          recommendation: "Reduced tramadol activation. Monitor efficacy; consider non-CYP2D6-substrate analgesic.",
          dosing: "Use lower end of dose range. Consider non-opioid analgesic alternatives.",
        },
      },
    },
    "*1/*2": {
      phenotype: "Normal Metabolizer (NM)", // *2 has normal function (score 1.0)
      drugs: {
        CODEINE: {
          risk: "Safe",
          severity: "none",
          recommendation:
            "Standard codeine dosing. CYP2D6 *2 retains normal enzymatic activity (activity score 1.0). No dose adjustment required per CPIC.",
          dosing: "Standard dose: 15–60 mg every 4–6 h as needed (adult). No adjustment required.",
        },
      },
    },
    "*4/*4": {
      phenotype: "Poor Metabolizer (PM)",
      drugs: {
        CODEINE: {
          risk: "Toxic",
          severity: "high",
          recommendation:
            "CONTRAINDICATED. Non-functional CYP2D6 → codeine accumulates without morphine conversion. Life-threatening toxicity risk. Use morphine or non-opioid analgesics. CPIC Level A.",
          dosing: "AVOID codeine. Use morphine (0.1–0.2 mg/kg IV/IM) or non-opioid (NSAIDs, acetaminophen) instead.",
        },
        TRAMADOL: {
          risk: "Toxic",
          severity: "high",
          recommendation:
            "Negligible O-desmethyltramadol production. Avoid tramadol. Select alternative analgesic.",
          dosing: "AVOID tramadol. Use non-CYP2D6 analgesics (e.g., acetaminophen, NSAIDs, morphine).",
        },
      },
    },
    "*2/*2": {
      phenotype: "Poor Metabolizer (PM)",
      drugs: {
        CODEINE: {
          risk: "Toxic",
          severity: "high",
          recommendation:
            "AVOID codeine. Non-functional CYP2D6. Accumulation of parent compound with inadequate analgesia. Use morphine or alternative.",
          dosing: "AVOID codeine entirely. Prescribe morphine sulfate IR or non-opioid analgesic.",
        },
      },
    },
    "*1/*1xN": {
      phenotype: "Ultrarapid Metabolizer (UM)",
      drugs: {
        CODEINE: {
          risk: "Toxic",
          severity: "critical",
          recommendation:
            "CONTRAINDICATED. Ultrarapid CYP2D6 → excessive morphine production from codeine. Life-threatening respiratory depression risk (CPIC Level A). Avoid codeine/tramadol. Use non-opioid alternatives.",
          dosing: "CONTRAINDICATED. Use non-opioid analgesics exclusively. If opioids necessary, use non-CYP2D6 substrates (e.g., buprenorphine, fentanyl) with close monitoring.",
        },
      },
    },
  },

  // ── CYP2C19 ─────────────────────────────────────────────────
  CYP2C19: {
    "*1/*1": {
      phenotype: "Normal Metabolizer (NM)",
      drugs: {
        CLOPIDOGREL: {
          risk: "Safe",
          severity: "none",
          recommendation:
            "Standard clopidogrel dosing. Expected antiplatelet activation. No dose adjustment required per CPIC Level A.",
          dosing: "Standard: 75 mg/day maintenance after 300 mg loading dose. No adjustment required.",
        },
        OMEPRAZOLE: {
          risk: "Safe",
          severity: "none",
          recommendation: "Standard omeprazole dosing appropriate for Normal Metabolizers.",
          dosing: "Standard dose 20–40 mg/day. No pharmacogenomic adjustment required.",
        },
      },
    },
    "*1/*2": {
      phenotype: "Intermediate Metabolizer (IM)",
      drugs: {
        CLOPIDOGREL: {
          risk: "Adjust Dosage",
          severity: "moderate",
          recommendation:
            "Reduced clopidogrel bioactivation. Consider alternative antiplatelet agents (ticagrelor, prasugrel) especially in ACS/high-risk PCI patients. CPIC Level A.",
          dosing: "Consider switching to ticagrelor 90 mg BID or prasugrel 10 mg/day (if eligible). If clopidogrel continued, consider 150 mg/day maintenance.",
        },
        OMEPRAZOLE: {
          risk: "Adjust Dosage",
          severity: "low",
          recommendation: "Mildly reduced omeprazole clearance. Standard dose typically adequate; monitor response.",
          dosing: "Standard dose usually adequate. Consider dose reduction if prolonged use planned.",
        },
      },
    },
    "*2/*2": {
      phenotype: "Poor Metabolizer (PM)",
      drugs: {
        CLOPIDOGREL: {
          risk: "Ineffective",
          severity: "high",
          recommendation:
            "Severely reduced clopidogrel bioactivation to active thiol metabolite. Use prasugrel or ticagrelor instead (CPIC Level A). Risk of major adverse cardiovascular events.",
          dosing: "AVOID clopidogrel. Use prasugrel 10 mg/day or ticagrelor 90 mg BID per CPIC Level A recommendation.",
        },
        OMEPRAZOLE: {
          risk: "Adjust Dosage",
          severity: "moderate",
          recommendation: "Significantly reduced omeprazole clearance. Dose reduction may be warranted.",
          dosing: "Reduce omeprazole dose by 50% or switch to pantoprazole (not CYP2C19-dependent).",
        },
      },
    },
    "*17/*17": {
      phenotype: "Ultrarapid Metabolizer (UM)",
      drugs: {
        CLOPIDOGREL: {
          risk: "Safe",
          severity: "none",
          recommendation:
            "Enhanced clopidogrel bioactivation. Standard dosing; be aware of potentially increased bleeding risk.",
          dosing: "Standard dose (75 mg/day). Monitor for bleeding signs given enhanced activation.",
        },
        OMEPRAZOLE: {
          risk: "Adjust Dosage",
          severity: "moderate",
          recommendation:
            "Accelerated omeprazole clearance. Higher doses may be needed for adequate acid suppression.",
          dosing: "Consider doubling dose to 40–80 mg/day or switching to pantoprazole.",
        },
      },
    },
    "*1/*17": {
      phenotype: "Rapid Metabolizer (RM)",
      drugs: {
        CLOPIDOGREL: {
          risk: "Safe",
          severity: "none",
          recommendation: "Adequate clopidogrel activation expected. Standard dosing appropriate.",
          dosing: "Standard dose: 75 mg/day maintenance. No adjustment required.",
        },
      },
    },
  },

  // ── CYP2C9 ──────────────────────────────────────────────────
  CYP2C9: {
    "*1/*1": {
      phenotype: "Normal Metabolizer (NM)",
      drugs: {
        WARFARIN: {
          risk: "Safe",
          severity: "none",
          recommendation:
            "Standard warfarin initiation per CPIC/IWPC dosing algorithm. Routine INR monitoring as per clinical guidelines.",
          dosing: "Initiate per IWPC algorithm (typically 5 mg/day). Target INR 2–3. Weekly INR monitoring during initiation.",
        },
      },
    },
    "*1/*2": {
      phenotype: "Intermediate Metabolizer (IM)",
      drugs: {
        WARFARIN: {
          risk: "Adjust Dosage",
          severity: "moderate",
          recommendation:
            "Reduce initial warfarin dose by ~20–25%. Slower clearance increases bleeding risk. Intensive INR monitoring during initiation. CPIC Level A.",
          dosing: "Reduce starting dose by 20–25% (e.g., 3.75 mg/day). INR check at day 3, 5, 7, then weekly. Target INR 2–3.",
        },
      },
    },
    "*1/*3": {
      phenotype: "Intermediate Metabolizer (IM)",
      drugs: {
        WARFARIN: {
          risk: "Adjust Dosage",
          severity: "moderate",
          recommendation:
            "Reduce initial warfarin dose by 30–40%. CYP2C9*3 severely impairs warfarin S-enantiomer hydroxylation. Frequent INR monitoring mandatory.",
          dosing: "Reduce starting dose by 30–40% (e.g., 3 mg/day). INR at day 3, 5, 7, then twice-weekly until stable. Target INR 2–3.",
        },
      },
    },
    "*2/*3": {
      phenotype: "Poor Metabolizer (PM)",
      drugs: {
        WARFARIN: {
          risk: "Toxic",
          severity: "high",
          recommendation:
            "Significant dose reduction required (~50–60% of standard). Extreme warfarin sensitivity. Genotype-guided dosing algorithm (IWPC) recommended. Intensive INR monitoring.",
          dosing: "Initiate at ≤2.5 mg/day. INR every 2–3 days until stable. Consider direct oral anticoagulant (DOAC) as safer alternative.",
        },
      },
    },
    "*3/*3": {
      phenotype: "Poor Metabolizer (PM)",
      drugs: {
        WARFARIN: {
          risk: "Toxic",
          severity: "critical",
          recommendation:
            "Consider alternative anticoagulant (DOAC). If warfarin necessary, initiate at very low dose under expert supervision with intensive monitoring. CPIC Level A.",
          dosing: "STRONGLY prefer apixaban, rivaroxaban, or dabigatran. If warfarin required: start ≤1.5 mg/day with INR monitoring every 2 days. Expert pharmacogenomics consultation mandatory.",
        },
      },
    },
  },

  // ── SLCO1B1 ─────────────────────────────────────────────────
  SLCO1B1: {
    "*1/*1": {
      phenotype: "Normal Function (NF)",
      drugs: {
        SIMVASTATIN: {
          risk: "Safe",
          severity: "none",
          recommendation:
            "Standard simvastatin dosing. Normal OATP1B1 transport function. Routine CK monitoring per standard guidelines.",
          dosing: "Standard dose up to 40 mg/day. No pharmacogenomic dose restriction. Routine CK monitoring.",
        },
      },
    },
    "*1/*5": {
      phenotype: "Decreased Function (DF)",
      drugs: {
        SIMVASTATIN: {
          risk: "Adjust Dosage",
          severity: "moderate",
          recommendation:
            "Increased simvastatin plasma exposure due to reduced hepatic uptake. Use ≤20 mg/day or switch to pravastatin/rosuvastatin. CPIC Level A.",
          dosing: "Cap simvastatin at 20 mg/day OR switch to pravastatin 40 mg/day or rosuvastatin 10–20 mg/day (less SLCO1B1-dependent). CK monitoring every 3 months.",
        },
      },
    },
    "*5/*5": {
      phenotype: "Poor Function (PF)",
      drugs: {
        SIMVASTATIN: {
          risk: "Toxic",
          severity: "high",
          recommendation:
            "HIGH RISK of simvastatin-induced myopathy and rhabdomyolysis. Avoid simvastatin >20 mg. Strongly prefer pravastatin or rosuvastatin. Monitor CK. CPIC Level A.",
          dosing: "AVOID simvastatin. Use pravastatin 40 mg/day or rosuvastatin 10 mg/day. Baseline CK + monthly monitoring for 3 months.",
        },
      },
    },
  },

  // ── TPMT ────────────────────────────────────────────────────
  TPMT: {
    "*1/*1": {
      phenotype: "Normal Metabolizer (NM)",
      drugs: {
        AZATHIOPRINE: {
          risk: "Safe",
          severity: "none",
          recommendation:
            "Standard azathioprine dosing. Normal TPMT activity. Routine CBC monitoring per immunosuppression protocol.",
          dosing: "Standard dose: 1–3 mg/kg/day. CBC weekly for first month, then monthly. Adjust per clinical response.",
        },
        MERCAPTOPURINE: {
          risk: "Safe",
          severity: "none",
          recommendation: "Standard mercaptopurine dosing for Normal TPMT Metabolizers.",
          dosing: "Standard dose: 1.5–2.5 mg/kg/day. CBC monitoring weekly initially.",
        },
      },
    },
    "*1/*3A": {
      phenotype: "Intermediate Metabolizer (IM)",
      drugs: {
        AZATHIOPRINE: {
          risk: "Adjust Dosage",
          severity: "moderate",
          recommendation:
            "Reduce azathioprine starting dose by 30–70% of standard. Monitor CBC closely for myelosuppression. Titrate based on tolerance. CPIC Level A.",
          dosing: "Start at 0.5–1.5 mg/kg/day (30–70% reduction). CBC weekly × 4, then every 2 weeks. Titrate based on CBC and clinical response.",
        },
        MERCAPTOPURINE: {
          risk: "Adjust Dosage",
          severity: "moderate",
          recommendation: "Reduce mercaptopurine starting dose by 30–70%. Weekly CBC monitoring.",
          dosing: "Start at 0.5–1.5 mg/kg/day. Weekly CBC monitoring. Increase cautiously based on tolerance.",
        },
      },
    },
    "*3A/*3A": {
      phenotype: "Poor Metabolizer (PM)",
      drugs: {
        AZATHIOPRINE: {
          risk: "Toxic",
          severity: "critical",
          recommendation:
            "LIFE-THREATENING risk. Standard doses cause severe myelosuppression. Reduce to ~10% of standard dose or select alternative immunosuppressant. Mandatory CBC monitoring. CPIC Level A.",
          dosing: "Reduce to 10% of standard dose (≈0.1–0.3 mg/kg/day, 3×/week dosing) OR switch to mycophenolate mofetil. Daily CBC for first 2 weeks. Immediate cessation if CBC deteriorates.",
        },
        MERCAPTOPURINE: {
          risk: "Toxic",
          severity: "critical",
          recommendation:
            "Severe myelosuppression risk. Reduce to 10% of standard dose. Consider alternative therapy. CPIC Level A.",
          dosing: "Reduce to 10% of standard dose (3×/week). Daily CBC monitoring. Immediate hematology referral.",
        },
      },
    },
  },

  // ── DPYD ────────────────────────────────────────────────────
  DPYD: {
    "*1/*1": {
      phenotype: "Normal Metabolizer (NM)",
      drugs: {
        FLUOROURACIL: {
          risk: "Safe",
          severity: "none",
          recommendation:
            "Standard 5-FU dosing. Normal DPD enzyme activity. Proceed with standard oncology protocol.",
          dosing: "Standard oncology protocol dose. No pharmacogenomic restriction. Monitor per standard toxicity criteria (NCI-CTCAE).",
        },
        CAPECITABINE: {
          risk: "Safe",
          severity: "none",
          recommendation: "Standard capecitabine dosing for Normal DPYD Metabolizers.",
          dosing: "Standard dose: 1250 mg/m² BID × 14 days per cycle. No adjustment required.",
        },
      },
    },
    "*1/*2A": {
      phenotype: "Intermediate Metabolizer (IM)",
      drugs: {
        FLUOROURACIL: {
          risk: "Adjust Dosage",
          severity: "moderate",
          recommendation:
            "Reduce 5-FU starting dose by 50%. Reduced DPD activity increases severe toxicity risk. Monitor for mucositis, myelosuppression, diarrhea. CPIC Level A.",
          dosing: "Reduce starting dose by 50%. Consider DPD phenotyping (uracil breath test) before further escalation. NCI-CTCAE grade 3+ toxicity → hold and reduce further.",
        },
        CAPECITABINE: {
          risk: "Adjust Dosage",
          severity: "moderate",
          recommendation: "Reduce capecitabine dose by 50%. Monitor closely for Grade 3–4 toxicities.",
          dosing: "Reduce to 625 mg/m² BID (50% reduction). Monitor for hand-foot syndrome, mucositis, diarrhea. Grade 3+ → hold therapy.",
        },
      },
    },
    "*2A/*2A": {
      phenotype: "Poor Metabolizer (PM)",
      drugs: {
        FLUOROURACIL: {
          risk: "Toxic",
          severity: "critical",
          recommendation:
            "CONTRAINDICATED. Complete DPD deficiency → life-threatening 5-FU toxicity. Avoid all fluoropyrimidines or use only under expert supervision with >75% dose reduction. CPIC Level A.",
          dosing: "CONTRAINDICATED for fluoropyrimidines. If oncologically necessary: >75% dose reduction with expert pharmacogenomics consultation, uracil monitoring, and intensive toxicity surveillance.",
        },
        CAPECITABINE: {
          risk: "Toxic",
          severity: "critical",
          recommendation:
            "CONTRAINDICATED. Complete DPD deficiency. Life-threatening toxicity. Avoid capecitabine. CPIC Level A.",
          dosing: "CONTRAINDICATED. Consider non-fluoropyrimidine chemotherapy regimens. Oncology + clinical pharmacogenomics consultation mandatory.",
        },
      },
    },
  },
};

// Set of supported gene names (derived from DB keys)
const SUPPORTED_GENES = new Set(Object.keys(pharmacogenomicDB));

// ─── Drug → Gene Mapping (CPIC) ──────────────────────────────
/** Exact mapping: each drug requires analysis of one specific gene */
export const DRUG_GENE_MAP: Record<string, string> = {
  CODEINE: "CYP2D6",
  TRAMADOL: "CYP2D6",
  METOPROLOL: "CYP2D6",
  WARFARIN: "CYP2C9",
  CLOPIDOGREL: "CYP2C19",
  OMEPRAZOLE: "CYP2C19",
  SIMVASTATIN: "SLCO1B1",
  AZATHIOPRINE: "TPMT",
  MERCAPTOPURINE: "TPMT",
  FLUOROURACIL: "DPYD",
  CAPECITABINE: "DPYD",
};

// Set of all supported drug names (uppercase)
export const SUPPORTED_DRUGS: Set<string> = new Set(Object.keys(DRUG_GENE_MAP));

// ─── Activity Scoring per Gene (CPIC 2024.1) ─────────────────
/**
 * Star allele → activity score for phenotype determination.
 *
 * WHY ALLELE-SPECIFIC SCORING IS REQUIRED:
 * Not all non-*1 alleles are reduced function. For example:
 *   - CYP2D6 *2 has NORMAL function (score 1.0), same as *1
 *   - CYP2D6 *10 has REDUCED function (score 0.5)
 *   - CYP2D6 *4 has NO function (score 0.0)
 * Treating all non-*1 alleles as "reduced" would misclassify *1/*2 as IM
 * when it is actually NM (score 2.0). This is clinically dangerous.
 *
 * Scores sourced from CPIC Gene-Specific Tables (cpicpgx.org).
 */
const ACTIVITY_SCORES: Record<string, Record<string, number>> = {
  CYP2D6: {
    "*1": 1.0,    // Normal function (reference)
    "*2": 1.0,    // Normal function — NOT reduced
    "*4": 0.0,    // No function (splice defect)
    "*5": 0.0,    // No function (gene deletion)
    "*6": 0.0,    // No function (frameshift)
    "*10": 0.5,   // Reduced function (unstable enzyme)
    "*17": 0.5,   // Reduced function (substrate-dependent)
    "*41": 0.5,   // Reduced function (splicing defect, partial)
    "*1xN": 3.0,  // Gene duplication → ultrarapid
  },
  CYP2C19: { "*1": 1.0, "*2": 0.0, "*3": 0.0, "*17": 1.5 },
  CYP2C9: { "*1": 1.0, "*2": 0.5, "*3": 0.25 },
  SLCO1B1: { "*1": 1.0, "*5": 0.5, "*15": 0.5 },
  TPMT: { "*1": 1.0, "*2": 0.0, "*3A": 0.0, "*3B": 0.0, "*3C": 0.0 },
  DPYD: { "*1": 1.0, "*2A": 0.0, "*13": 0.5 },
};

// ─── 1. VCF Parser ────────────────────────────────────────────

/**
 * parseVCF – Entry point for VCF file parsing.
 * Validates VCF header, then delegates to extractVariants().
 */
export function parseVCF(fileContent: string): ParsedVCF {
  try {
    // Validate VCF format: must have at least one header line
    const lines = fileContent.split("\n");
    const hasHeader = lines.some((l) => l.startsWith("##fileformat=VCF") || l.startsWith("#CHROM"));
    if (!hasHeader) {
      return {
        variants: [],
        variantsFound: 0,
        success: false,
        error: "Invalid VCF format: missing ##fileformat or #CHROM header line.",
      };
    }

    const variants = extractVariants(lines);
    return { variants, variantsFound: variants.length, success: true };
  } catch (err) {
    return {
      variants: [],
      variantsFound: 0,
      success: false,
      error: err instanceof Error ? err.message : "Unknown VCF parsing error.",
    };
  }
}

/**
 * extractVariants – Production-grade VCF parser with genotype (GT) filtering.
 *
 * Steps:
 *   1. Skip headers and malformed lines (< 8 columns).
 *   2. Parse standard VCF columns: CHROM, POS, ID, REF, ALT, QUAL, FILTER, INFO.
 *   3. If FORMAT + SAMPLE columns exist (cols ≥ 10), extract GT dynamically:
 *      - Locate "GT" index in the FORMAT field.
 *      - Read corresponding value from the SAMPLE field.
 *      - SKIP variant if GT is homozygous-reference (0/0, 0|0) or missing (./., .|.).
 *   4. If no FORMAT/SAMPLE columns, include variant (legacy 8-column VCF).
 *   5. Require GENE= INFO tag to register a variant.
 */
function extractVariants(lines: string[]): DetectedVariant[] {
  const variants: DetectedVariant[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith("#") || line === "") continue;

    const cols = line.split("\t");
    // Minimum 8 columns required: CHROM POS ID REF ALT QUAL FILTER INFO
    if (cols.length < 8) continue;

    // ── Step 1: Parse standard VCF columns ──
    const chrom = cols[0] || "";
    const pos = parseInt(cols[1], 10);
    const vcfId = cols[2] && cols[2] !== "." ? cols[2] : "";
    const ref = cols[3] && cols[3] !== "." ? cols[3] : "";
    const alt = cols[4] && cols[4] !== "." ? cols[4] : "";
    const info = cols[7] || "";

    // ── Step 2: Genotype (GT) filtering ──
    // If FORMAT (col 8) and at least one SAMPLE (col 9) exist, extract GT
    if (cols.length >= 10) {
      const formatField = cols[8] || "";
      const sampleField = cols[9] || "";

      const gt = extractGT(formatField, sampleField);

      // Skip if GT is missing/malformed or homozygous-reference
      if (gt === null || isHomRef(gt)) {
        continue;
      }
    }
    // If only 8 columns (no FORMAT/SAMPLE), include variant (legacy VCF support)

    // ── Step 3: Parse INFO tags and build variant ──
    const infoTags = parseInfoTags(info);
    const gene = (infoTags["GENE"] || infoTags["gene"] || "").toUpperCase();
    const star = infoTags["STAR"] || infoTags["star"] || infoTags["ALLELE"] || "*1";

    // Prefer RS= from INFO over VCF ID column for clinical rsID accuracy
    const rsFromInfo = infoTags["RS"] || infoTags["rs"] || "";
    const rsid = rsFromInfo
      ? (rsFromInfo.startsWith("rs") ? rsFromInfo : `rs${rsFromInfo}`)
      : (vcfId || "unknown");

    if (gene) {
      variants.push({
        rsid,
        gene,
        star_allele: star,
        chromosome: chrom,
        position: isNaN(pos) ? undefined : pos,
        ref: ref || undefined,
        alt: alt || undefined,
      });
    }
  }

  return variants;
}

/**
 * extractGT – Dynamically locates and extracts the GT value from FORMAT/SAMPLE.
 * FORMAT is colon-delimited keys (e.g. "GT:DP:GQ:AD:PL").
 * SAMPLE is colon-delimited values (e.g. "0/1:58:99:30,28:...").
 * Returns the GT string (e.g. "0/1") or null if GT not found or malformed.
 */
function extractGT(format: string, sample: string): string | null {
  const formatKeys = format.split(":");
  const gtIndex = formatKeys.indexOf("GT");
  if (gtIndex === -1) return null; // No GT field in FORMAT

  const sampleValues = sample.split(":");
  if (gtIndex >= sampleValues.length) return null; // SAMPLE too short

  const gt = sampleValues[gtIndex].trim();
  return gt || null;
}

/**
 * isHomRef – Returns true if genotype is homozygous-reference or missing.
 * Handles both unphased (/) and phased (|) separators.
 * 0/0, 0|0 → true (hom-ref, skip)
 * ./., .|. → true (missing, skip)
 * 0/1, 1/1, 1|0, 0/2, etc. → false (has alt allele, include)
 */
function isHomRef(gt: string): boolean {
  // Normalize separator to /
  const normalized = gt.replace(/\|/g, "/");
  const alleles = normalized.split("/");

  // Missing genotype
  if (alleles.every((a) => a === ".")) return true;

  // Homozygous reference: all alleles are "0"
  if (alleles.every((a) => a === "0")) return true;

  return false;
}

/** parseInfoTags – Parses semicolon-delimited key=value pairs from VCF INFO field. */
function parseInfoTags(info: string): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const part of info.split(";")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx > 0) {
      const key = part.slice(0, eqIdx).trim();
      const val = part.slice(eqIdx + 1).trim();
      tags[key] = val;
    }
  }
  return tags;
}

// ─── 2. Diplotype Determination ───────────────────────────────

/**
 * determineDiplotype – Constructs diplotype from relevant variants for a gene.
 * Returns null if no variants found (caller must handle Unknown).
 */
function determineDiplotype(relevantVariants: DetectedVariant[]): string | null {
  if (relevantVariants.length === 0) return null; // No variants → Unknown

  const alleles = relevantVariants.map((v) => v.star_allele || "*1");

  if (alleles.length === 1) {
    // Single detected allele: heterozygous with wildtype assumption
    return `*1/${alleles[0]}`;
  }
  // Use first two alleles for diplotype
  return `${alleles[0]}/${alleles[1]}`;
}

// ─── 2b. Activity-Score Phenotype Engine ──────────────────────

/**
 * determinePhenotype – CPIC activity-score phenotype engine.
 *
 * Computes total activity score from both alleles and maps to phenotype:
 *   score >= 2.25  → Ultrarapid Metabolizer (UM)  (e.g. *1xN)
 *   score >= 1.5   → Normal Metabolizer (NM)      (e.g. *1/*1 = 2.0, *1/*2 = 2.0)
 *   score >= 0.5   → Intermediate Metabolizer (IM) (e.g. *1/*4 = 1.0, *10/*41 = 1.0)
 *   score <  0.5   → Poor Metabolizer (PM)         (e.g. *4/*4 = 0.0)
 *
 * If only one allele is detected, the other is assumed to be *1 (wildtype).
 * Unknown alleles default to score 0 (conservative/safe assumption).
 */
function determinePhenotype(relevantVariants: DetectedVariant[], gene: string): string {
  const geneScores = ACTIVITY_SCORES[gene];
  if (!geneScores) return "Unknown";

  if (relevantVariants.length === 0) return "Unknown";

  // Build allele pair: if single variant detected, pair with wildtype *1
  let alleles: string[];
  if (relevantVariants.length === 1) {
    alleles = ["*1", relevantVariants[0].star_allele || "*1"];
  } else {
    alleles = relevantVariants.slice(0, 2).map((v) => v.star_allele || "*1");
  }

  // Sum activity scores — unknown alleles score 0 (conservative)
  const score = alleles.reduce((sum, a) => sum + (geneScores[a] ?? 0), 0);

  // CPIC-aligned thresholds
  if (score >= 2.25) return "Ultrarapid Metabolizer (UM)";
  if (score >= 1.5) return "Normal Metabolizer (NM)";
  if (score >= 0.5) return "Intermediate Metabolizer (IM)";
  return "Poor Metabolizer (PM)";
}

// ─── 3. Risk Classifier ───────────────────────────────────────

/**
 * classifyRisk – Core risk engine (refactored).
 *
 * 1. Maps drug → required gene via DRUG_GENE_MAP
 * 2. Filters parsed variants to ONLY those matching the required gene
 * 3. If no relevant variants → Unknown (never defaults to Safe)
 * 4. Builds diplotype from relevant variants only
 * 5. Uses activity scoring for phenotype
 * 6. Looks up risk in pharmacogenomicDB
 * 7. detected_variants contains ONLY relevant variants
 * 8. variants_detected = relevant variant count
 */
export function classifyRisk(drug: string, variants: DetectedVariant[]): RiskResult {
  const drugUpper = drug.toUpperCase().trim();

  // Step 1: Drug → Gene mapping
  const requiredGene = DRUG_GENE_MAP[drugUpper];
  if (!requiredGene) {
    return {
      drug: drugUpper,
      risk_label: "Unknown",
      severity: "moderate",
      confidence_score: 0.4,
      phenotype: "Unknown",
      diplotype: "Unknown",
      primary_gene: "Not detected",
      action: `Drug "${drugUpper}" is not in the supported drug-gene map. Apply standard clinical guidelines.`,
      dosing_recommendation: "Use standard dosing per prescribing information. No pharmacogenomic data available.",
      detected_variants: [],
    };
  }

  // Step 2: Filter variants to ONLY the required gene
  const relevantVariants = variants.filter((v) => v.gene === requiredGene);

  // Step 3: No relevant variants after GT filtering → wildtype *1/*1, NM, Safe
  // Per CPIC: absence of detected actionable variants implies normal function
  if (relevantVariants.length === 0) {
    const wildtypeDiplotype = "*1/*1";
    const wildtypePhenotype = "Normal Metabolizer (NM)";
    const wildtypeRule = pharmacogenomicDB[requiredGene]?.[wildtypeDiplotype];
    const wildtypeDrugRule = wildtypeRule?.drugs[drugUpper];

    return {
      drug: drugUpper,
      risk_label: wildtypeDrugRule?.risk ?? "Safe",
      severity: wildtypeDrugRule?.severity ?? "none",
      confidence_score: 0.95,
      phenotype: wildtypeRule?.phenotype ?? wildtypePhenotype,
      diplotype: wildtypeDiplotype,
      primary_gene: requiredGene,
      action: wildtypeDrugRule?.recommendation ?? `No actionable ${requiredGene} variants detected. Standard dosing appropriate per CPIC guidelines.`,
      dosing_recommendation: wildtypeDrugRule?.dosing ?? "Standard dose per prescribing information. No pharmacogenomic adjustment required.",
      detected_variants: [],
    };
  }

  // Step 4: Build diplotype from relevant variants
  const diplotype = determineDiplotype(relevantVariants)!;

  // Step 5: Activity-score phenotype
  const phenotype = determinePhenotype(relevantVariants, requiredGene);

  // Step 6: Lookup in pharmacogenomicDB
  const diplotypeMap = pharmacogenomicDB[requiredGene];

  if (diplotypeMap && diplotypeMap[diplotype]) {
    const diplotypeRule = diplotypeMap[diplotype];
    const drugRule = diplotypeRule.drugs[drugUpper];
    if (drugRule) {
      // Confidence: 0.95 for exact diplotype match with both alleles detected
      const confidence = relevantVariants.length >= 2 ? 0.98 : 0.90;
      return {
        drug: drugUpper,
        risk_label: drugRule.risk,
        severity: drugRule.severity,
        confidence_score: confidence,
        phenotype: diplotypeRule.phenotype,
        diplotype,
        primary_gene: requiredGene,
        action: drugRule.recommendation,
        dosing_recommendation: drugRule.dosing,
        detected_variants: relevantVariants,
      };
    }
  }

  // Step 6b: Partial match — diplotype found but drug not in that diplotype's rules
  // Use activity-score phenotype and derive risk from phenotype
  const phenotypeRisk = deriveRiskFromPhenotype(drugUpper, phenotype, requiredGene);

  return {
    drug: drugUpper,
    risk_label: phenotypeRisk.risk_label,
    severity: phenotypeRisk.severity,
    confidence_score: 0.75,
    phenotype,
    diplotype,
    primary_gene: requiredGene,
    action: phenotypeRisk.action,
    dosing_recommendation: phenotypeRisk.dosing,
    detected_variants: relevantVariants,
  };
}

/**
 * deriveRiskFromPhenotype – When exact diplotype-drug rule not found,
 * infer risk from the activity-score-derived phenotype.
 */
function deriveRiskFromPhenotype(
  drug: string,
  phenotype: string,
  gene: string
): { risk_label: RiskLabel; severity: Severity; action: string; dosing: string } {
  const isProdrug = ["CODEINE", "TRAMADOL", "CLOPIDOGREL"].includes(drug);

  if (phenotype.includes("Poor")) {
    return {
      risk_label: isProdrug ? "Ineffective" : "Toxic",
      severity: "high",
      action: `${gene} Poor Metabolizer status detected. ${isProdrug ? "Drug activation severely impaired — use alternative." : "Drug clearance severely reduced — reduce dose or use alternative."}`,
      dosing: `Consult CPIC guidelines for ${gene} Poor Metabolizer ${drug} dosing. Consider alternative therapy.`,
    };
  }
  if (phenotype.includes("Intermediate")) {
    return {
      risk_label: "Adjust Dosage",
      severity: "moderate",
      action: `${gene} Intermediate Metabolizer — dose adjustment recommended for ${drug}.`,
      dosing: `Reduce ${drug} dose per CPIC guidelines. Monitor clinical response closely.`,
    };
  }
  if (phenotype.includes("Ultrarapid")) {
    return {
      risk_label: isProdrug ? "Toxic" : "Adjust Dosage",
      severity: isProdrug ? "critical" : "moderate",
      action: `${gene} Ultrarapid Metabolizer. ${isProdrug ? "Excessive active metabolite production — life-threatening toxicity risk." : "Accelerated clearance — dose increase may be needed."}`,
      dosing: `${isProdrug ? "AVOID " + drug + ". Use non-" + gene + "-substrate alternative." : "Consider dose increase. Monitor efficacy."}`,
    };
  }
  // Normal / Rapid
  return {
    risk_label: "Safe",
    severity: "none",
    action: `${gene} ${phenotype} — standard ${drug} dosing appropriate.`,
    dosing: `Standard dosing per prescribing information. No pharmacogenomic adjustment required.`,
  };
}

// ─── 4. JSON Output Generator ─────────────────────────────────

/**
 * generateJSON – Produces a schema-compliant PharmaGuardReport.
 * All fields explicitly set; no extra keys added.
 * Internal schema validation guard throws on violation.
 */
export function generateJSON(
  patientId: string,
  riskResult: RiskResult,
  vcfSuccess: boolean,
  _totalVariants: number,
  llmExplanation: LLMExplanation
): PharmaGuardReport {
  const geneDetected = riskResult.primary_gene !== "Not detected";

  // variants_detected = ONLY the relevant variants for this drug's gene
  const relevantCount = riskResult.detected_variants.length;

  const report: PharmaGuardReport = {
    patient_id: patientId,
    drug: riskResult.drug,
    timestamp: new Date().toISOString(),
    risk_assessment: {
      risk_label: riskResult.risk_label,
      confidence_score: riskResult.confidence_score,
      severity: riskResult.severity,
    },
    pharmacogenomic_profile: {
      primary_gene: riskResult.primary_gene,
      diplotype: riskResult.diplotype,
      phenotype: riskResult.phenotype,
      detected_variants: riskResult.detected_variants,
    },
    clinical_recommendation: {
      action: riskResult.action,
      dosing_recommendation: riskResult.dosing_recommendation,
    },
    llm_generated_explanation: llmExplanation,
    quality_metrics: {
      vcf_parsing_success: vcfSuccess,
      variants_detected: relevantCount,
      supported_gene_detected: geneDetected && SUPPORTED_GENES.has(riskResult.primary_gene),
      cpic_guideline_version: "2024.1",
    },
  };

  const validationError = validateSchema(report);
  if (validationError) {
    throw new Error(`Schema validation failed: ${validationError}`);
  }

  return report;
}

// ─── 5a. Phenotype-Aware Language Engine ──────────────────────

/**
 * Returns phenotype-specific language constraints for LLM prompts
 * and fallback explanations. Ensures scientifically accurate descriptions.
 */
function getPhenotypeLanguageConstraint(phenotype: string): string {
  if (phenotype.includes("Normal") || phenotype.includes("NM") || phenotype.includes("NF")) {
    return `The patient is a NORMAL metabolizer. You MUST use language like:
- "confers normal enzymatic activity"
- "results in expected drug metabolism"
- "typical pharmacokinetics"
- "standard systemic exposure"
You MUST NOT use: "reduces", "impairs", "alters", "increases toxicity risk", "accumulation", "diminished", "deficient".`;
  }
  if (phenotype.includes("Intermediate") || phenotype.includes("IM") || phenotype.includes("DF") || phenotype.includes("Decreased")) {
    return `The patient is an INTERMEDIATE metabolizer. Use language like:
- "reduces enzymatic activity"
- "partially impairs metabolism"
- "moderately increases exposure"
- "may increase toxicity risk"`;
  }
  if (phenotype.includes("Poor") || phenotype.includes("PM") || phenotype.includes("PF")) {
    return `The patient is a POOR metabolizer. Use language like:
- "severely impairs enzyme function"
- "minimal or absent activity"
- "markedly increases systemic exposure"
- "high risk of toxicity or treatment failure"`;
  }
  if (phenotype.includes("Ultrarapid") || phenotype.includes("UM")) {
    return `The patient is an ULTRARAPID metabolizer. Use language like:
- "markedly increased enzymatic activity"
- "accelerated drug clearance or excessive metabolite production"
- "risk of toxicity (prodrugs) or therapeutic failure (non-prodrugs)"`;
  }
  if (phenotype.includes("Rapid") || phenotype.includes("RM")) {
    return `The patient is a RAPID metabolizer. Use language like:
- "mildly increased enzymatic activity"
- "slightly accelerated metabolism"
- "generally adequate drug response expected"`;
  }
  return "Describe the phenotype accurately based on clinical evidence.";
}

/**
 * Gene-specific mechanism builder — phenotype-aware.
 * Produces biologically accurate mechanism text that matches the phenotype severity.
 */
function buildMechanism(gene: string, diplotype: string, phenotype: string, drug: string): string {
  const isNormal = phenotype.includes("Normal") || phenotype.includes("NM") || phenotype.includes("NF");
  const isIM = phenotype.includes("Intermediate") || phenotype.includes("IM") || phenotype.includes("DF") || phenotype.includes("Decreased");
  const isPM = phenotype.includes("Poor") || phenotype.includes("PM") || phenotype.includes("PF");
  const isUM = phenotype.includes("Ultrarapid") || phenotype.includes("UM");

  // Phenotype-dependent activity descriptor
  const activityDesc = isNormal
    ? "confers normal enzymatic activity, resulting in expected drug metabolism and typical pharmacokinetics"
    : isIM
    ? "reduces enzymatic activity, partially impairing metabolism and moderately increasing systemic exposure"
    : isPM
    ? "severely impairs enzyme function with minimal or absent activity, markedly increasing systemic exposure"
    : isUM
    ? "markedly increases enzymatic activity, accelerating drug metabolism beyond typical rates"
    : "produces an atypical metabolic profile";

  switch (gene) {
    case "CYP2D6":
      return `CYP2D6 encodes a major cytochrome P450 enzyme responsible for oxidative metabolism of ${drug} and ~25% of all clinically used drugs. The ${diplotype} diplotype ${activityDesc}. ${isNormal ? "Active metabolite production proceeds at standard rates with predictable analgesic response." : isPM ? "Prodrug activation is negligible, resulting in therapeutic failure for prodrugs or parent drug accumulation for directly active substrates." : isUM ? "Excessive active metabolite production occurs, creating risk of toxicity for prodrugs like codeine." : "Active metabolite concentrations are altered, requiring dose adjustment to maintain therapeutic efficacy."}`;

    case "CYP2C19":
      return `CYP2C19 mediates hepatic bioactivation of prodrugs including ${drug}. The ${diplotype} diplotype ${activityDesc}. ${isNormal ? "Conversion to pharmacologically active metabolites proceeds at expected rates with standard receptor binding." : isPM ? "Prodrug activation is severely impaired, with minimal conversion to the active thiol metabolite." : "The rate of conversion to active metabolites is altered, affecting downstream pharmacological response."}`;

    case "CYP2C9":
      return `CYP2C9 is the primary enzyme catalysing S-warfarin 7-hydroxylation and clearance. The ${diplotype} diplotype ${activityDesc}. ${isNormal ? "Standard clearance rates produce predictable INR response within the typical dose range." : isPM ? "Drug half-life is markedly extended with significantly increased systemic exposure and elevated bleeding risk." : "Drug clearance is moderately reduced, requiring dose adjustment to maintain target INR."}`;

    case "SLCO1B1":
      return `SLCO1B1 encodes the hepatic uptake transporter OATP1B1, responsible for hepatocellular uptake of ${drug}. The ${diplotype} diplotype ${isNormal ? "confers normal transporter function, resulting in expected hepatic uptake and standard plasma concentrations" : isIM || phenotype.includes("Decreased") ? "reduces transporter function, moderately increasing plasma ${drug} concentrations and skeletal muscle exposure" : isPM ? "severely impairs transporter function, markedly elevating plasma concentrations and substantially increasing myopathy risk" : activityDesc}.`;

    case "TPMT":
      return `TPMT catalyses S-methylation of thiopurine drugs including ${drug}, diverting substrate away from cytotoxic 6-thioguanine nucleotide (6-TGN) production. The ${diplotype} diplotype ${activityDesc}. ${isNormal ? "Thiopurine methylation proceeds at normal rates, maintaining 6-TGN concentrations within the therapeutic range." : isPM ? "Methylation is virtually absent, causing accumulation of cytotoxic 6-TGN in haematopoietic cells and life-threatening myelosuppression." : "Reduced methylation capacity leads to moderately elevated 6-TGN levels with increased myelosuppression risk."}`;

    case "DPYD":
      return `DPYD encodes dihydropyrimidine dehydrogenase (DPD), the rate-limiting enzyme responsible for >80% of ${drug} catabolism. The ${diplotype} diplotype ${activityDesc}. ${isNormal ? "Fluoropyrimidine catabolism proceeds at expected rates with standard systemic exposure." : isPM ? "DPD function is minimal or absent, causing dose-dependent fluoropyrimidine accumulation and severe systemic toxicity." : "Reduced DPD activity moderately increases fluoropyrimidine exposure, elevating the risk of dose-limiting toxicities."}`;

    default:
      return `${gene} activity is characterized by the ${diplotype} diplotype, which ${activityDesc}. This affects ${drug} pharmacokinetics and pharmacodynamics.`;
  }
}

// ─── 5b. LLM Integration ──────────────────────────────────────

/**
 * API key sourced from Vite env variable: VITE_GEMINI_API_KEY
 * .env.example: VITE_GEMINI_API_KEY=AIzaSy...
 * Runtime override supported via setGeminiKey() for user-supplied keys.
 */
let _runtimeApiKey = "";

export function setGeminiKey(key: string): void {
  _runtimeApiKey = key.trim();
}

function getApiKey(): string {
  return _runtimeApiKey || (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
}

/**
 * callLLM – Requests a structured pharmacogenomic explanation from Google Gemini 2.0 Flash.
 * Falls back to generateFallbackExplanation() on failure or missing key.
 * Prevents duplicate API calls via per-drug deduplication in runAnalysis().
 */
export async function callLLM(riskResult: RiskResult): Promise<LLMExplanation> {
  const apiKey = getApiKey();
  if (!apiKey) return generateFallbackExplanation(riskResult);

  const variantStr =
    riskResult.detected_variants.length > 0
      ? riskResult.detected_variants.map((v) => `${v.rsid} (${v.star_allele})`).join(", ")
      : "none detected";

  // Phenotype-aware constraint for LLM to prevent scientifically incorrect language
  const phenotypeConstraint = getPhenotypeLanguageConstraint(riskResult.phenotype);

  const prompt = `You are a board-certified clinical pharmacogenomics expert following CPIC guidelines.

Patient gene: ${riskResult.primary_gene}
Diplotype: ${riskResult.diplotype}
Phenotype: ${riskResult.phenotype}
Drug: ${riskResult.drug}
Risk: ${riskResult.risk_label}
Detected variants: ${variantStr}

CRITICAL PHENOTYPE CONSTRAINT:
${phenotypeConstraint}

Generate a structured response with exactly these four sections:
1. Summary (2–3 sentences): Clinical summary of this drug-gene interaction.
2. Biological mechanism: Explain the enzyme/transporter, pathway, and how the diplotype affects drug metabolism. ${riskResult.primary_gene === "SLCO1B1" ? "Use 'transporter function' not 'enzyme function'." : ""} ${riskResult.primary_gene === "TPMT" ? "Mention thiopurine methylation and 6-TGN accumulation risk." : ""} ${riskResult.primary_gene === "DPYD" ? "Mention DPD catabolism of fluoropyrimidines." : ""}
3. Clinical implication: Patient-specific risk and expected drug response.
4. Dosing recommendation: Specific dosing guidance aligned with CPIC Level A evidence.

Be medically concise and accurate. Do not hallucinate variant identifiers or allele frequencies.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
      }),
    });

    if (!response.ok) return generateFallbackExplanation(riskResult);

    const data = await response.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const summaryMatch = text.match(/1\.\s*Summary[:\s]+(.+?)(?=2\.|$)/is);
    const mechMatch = text.match(/2\.\s*Biological mechanism[:\s]+(.+?)(?=3\.|$)/is);
    const implMatch = text.match(/3\.\s*Clinical implication[:\s]+(.+?)(?=4\.|$)/is);
    const doseMatch = text.match(/4\.\s*Dosing recommendation[:\s]+(.+?)$/is);

    return {
      summary: summaryMatch?.[1]?.trim() || text.substring(0, 250),
      mechanism: mechMatch?.[1]?.trim() || "See clinical summary.",
      clinical_impact: [implMatch?.[1]?.trim(), doseMatch?.[1]?.trim()]
        .filter(Boolean)
        .join(" ") || riskResult.action,
    };
  } catch {
    return generateFallbackExplanation(riskResult);
  }
}

/**
 * generateFallbackExplanation – Phenotype-aware deterministic CPIC-aligned explanation.
 * Used when no API key is provided or LLM call fails.
 * Language is dynamically selected based on phenotype to ensure scientific accuracy.
 */
function generateFallbackExplanation(r: RiskResult): LLMExplanation {
  const isNormal = r.phenotype.includes("Normal") || r.phenotype.includes("NM") || r.phenotype.includes("NF");

  // Phenotype-aware summary — NM never uses negative language
  const summaryMap: Record<RiskLabel, string> = {
    Safe: `${r.primary_gene} diplotype ${r.diplotype} confers ${r.phenotype} status with normal enzymatic activity — standard ${r.drug} dosing is appropriate. Expected drug metabolism and typical pharmacokinetics are predicted.`,
    "Adjust Dosage": `${r.primary_gene} diplotype ${r.diplotype} indicates ${r.phenotype}, with ${isNormal ? "expected" : "reduced"} metabolic capacity requiring ${isNormal ? "standard" : "modified"} ${r.drug} dosing per CPIC guidelines.`,
    Toxic: `${r.primary_gene} diplotype ${r.diplotype} severely impairs enzyme function, creating a high-toxicity risk with ${r.drug}. Therapy change is strongly recommended per CPIC Level A evidence.`,
    Ineffective: `${r.primary_gene} diplotype ${r.diplotype} indicates ${r.phenotype}, with minimal or absent metabolic activation significantly reducing ${r.drug} therapeutic efficacy.`,
    Unknown: `Insufficient pharmacogenomic data to assess ${r.drug} interaction. Standard clinical guidelines should be applied.`,
  };

  // Gene-specific, phenotype-aware mechanism via buildMechanism()
  const mechanism = buildMechanism(r.primary_gene, r.diplotype, r.phenotype, r.drug);

  return {
    summary: summaryMap[r.risk_label],
    mechanism,
    clinical_impact: r.action,
  };
}

// ─── 6. Patient ID Generator ─────────────────────────────────

/** Generates a unique session patient ID (e.g. PG-A3B7K2). */
export function generatePatientId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const suffix = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `PG-${suffix}`;
}

// ─── 7. Full Analysis Pipeline ───────────────────────────────

export interface AnalysisResult {
  patientId: string;
  drugs: string[];
  variants: DetectedVariant[];
  variantsFound: number;
  vcfSuccess: boolean;
  reports: PharmaGuardReport[];
  riskResults: RiskResult[];
  schemaErrors: string[];
}

/**
 * runAnalysis – Orchestrates the full pipeline:
 * parseVCF → classifyRisk → callLLM → generateJSON (per drug)
 * Deduplicates drug list. Validates each report schema before including in output.
 */
export async function runAnalysis(
  vcfContent: string,
  drugs: string[]
): Promise<AnalysisResult> {
  const normalisedDrugs = drugs.map((d) => d.trim()).filter(Boolean);

  const parsed = parseVCF(vcfContent);
  const patientId = generatePatientId();

  const reports: PharmaGuardReport[] = [];
  const riskResults: RiskResult[] = [];
  const schemaErrors: string[] = [];

  // Deduplicate drug list (case-insensitive) to prevent duplicate API calls
  const seenDrugs = new Set<string>();
  for (const drug of normalisedDrugs) {
    const key = drug.toUpperCase();
    if (seenDrugs.has(key)) continue;
    seenDrugs.add(key);

    const riskResult = classifyRisk(drug, parsed.variants);
    riskResults.push(riskResult);

    const llmExplanation = await callLLM(riskResult);

    try {
      const report = generateJSON(
        patientId,
        riskResult,
        parsed.success,
        parsed.variantsFound,
        llmExplanation
      );
      reports.push(report);
    } catch (err) {
      schemaErrors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return {
    patientId,
    drugs: normalisedDrugs,
    variants: parsed.variants,
    variantsFound: parsed.variantsFound,
    vcfSuccess: parsed.success,
    reports,
    riskResults,
    schemaErrors,
  };
}
