# 🧬 PharmaGuard — AI-Powered Pharmacogenomic Risk Prediction System

> **HealthTech Hackathon 2025** | Precision Medicine · CPIC v2024.1 · Client-Side · Schema-Validated

[![Live Demo](https://img.shields.io/badge/Live_Demo-ai--genom--insight.lovable.app-00d4ff?style=flat-square)](https://ai-genom-insight.lovable.app)
[![CPIC Level A](https://img.shields.io/badge/CPIC-Level_A_v2024.1-8b5cf6?style=flat-square)](https://cpicpgx.org)
[![JSON Schema](https://img.shields.io/badge/JSON_Schema-v2024.1-22c55e?style=flat-square)](#json-output-schema)
[![Client-Side](https://img.shields.io/badge/Privacy-100%25_Client--Side-00d4ff?style=flat-square)](#privacy)

---

## Problem Statement

**Adverse drug reactions (ADRs) kill over 100,000 Americans annually** — making them the 4th leading cause of death. Up to 60% of ADRs are preventable through pharmacogenomic testing: analyzing how a patient's genetic variants alter drug metabolism.

The clinical barrier: no accessible, explainable, real-time tool exists to translate raw VCF genomic data into actionable drug risk predictions at point-of-care.

**PharmaGuard solves this.**

---

## Solution Overview

PharmaGuard is a fully client-side AI web application that:

1. **Parses authentic VCF v4.2 files** — extracting pharmacogenomic variants from INFO tags
2. **Identifies variants across 6 critical genes**: CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD
3. **Predicts drug-specific risks**: Safe · Adjust Dosage · Toxic · Ineffective · Unknown
4. **Generates clinical explanations** via Google Gemini 2.0 Flash (with CPIC fallback)
5. **Outputs schema-validated JSON** compliant with the required clinical report schema
6. **Provides CPIC-aligned dosing recommendations** per Level A evidence

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                      │
│                                                         │
│  VCF Upload → [VCF Parser] → [Variant Extractor]        │
│                                ↓                        │
│              [Diplotype Engine] → [Risk Classifier]     │
│                                ↓                        │
│          [Gemini LLM / CPIC Fallback] → [JSON Generator]│
│                                ↓                        │
│                  [Schema Validator] → Output            │
└─────────────────────────────────────────────────────────┘
```

All processing is **100% client-side**. No genomic data ever leaves the browser.

---

## Features

| Feature | Details |
|---|---|
| VCF Parsing | VCF v4.2, validates ##fileformat header, extracts GENE/STAR/RS INFO tags |
| Gene Coverage | CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD |
| Drug Coverage | Codeine, Warfarin, Clopidogrel, Simvastatin, Azathioprine, Fluorouracil + 5 more |
| Risk Labels | Safe · Adjust Dosage · Toxic · Ineffective · Unknown |
| Severity Scale | none · low · moderate · high · critical |
| Confidence Score | 0.95 (exact match) · 0.75 (partial) · 0.40 (unknown) |
| LLM Integration | Google Gemini 2.0 Flash via REST API |
| Fallback | Deterministic CPIC rule-based explanations |
| JSON Schema | Strict validation — timestamp ISO 8601, typed fields, all required keys |
| Privacy | Zero server uploads — 100% client-side processing |

---

## JSON Output Schema

Every analysis produces a schema-validated report:

```json
{
  "patient_id": "PG-A3B7K2",
  "drug": "CODEINE",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "risk_assessment": {
    "risk_label": "Toxic",
    "confidence_score": 0.95,
    "severity": "high"
  },
  "pharmacogenomic_profile": {
    "primary_gene": "CYP2D6",
    "diplotype": "*4/*4",
    "phenotype": "Poor Metabolizer (PM)",
    "detected_variants": [
      { "rsid": "rs3892097", "gene": "CYP2D6", "star_allele": "*4" }
    ]
  },
  "clinical_recommendation": {
    "action": "CONTRAINDICATED. Non-functional CYP2D6...",
    "dosing_recommendation": "Avoid codeine. Use morphine or non-opioid analgesic."
  },
  "llm_generated_explanation": {
    "summary": "...",
    "mechanism": "...",
    "clinical_impact": "..."
  },
  "quality_metrics": {
    "vcf_parsing_success": true,
    "variants_detected": 6,
    "supported_gene_detected": true,
    "cpic_guideline_version": "2024.1"
  }
}
```

### Schema Validation Rules

| Field | Type | Constraint |
|---|---|---|
| `patient_id` | string | Non-empty, format `PG-XXXXXX` |
| `drug` | string | Non-empty |
| `timestamp` | string | ISO 8601 |
| `risk_assessment.risk_label` | enum | `Safe\|Adjust Dosage\|Toxic\|Ineffective\|Unknown` |
| `risk_assessment.confidence_score` | number | 0.0 – 1.0 |
| `risk_assessment.severity` | enum | `none\|low\|moderate\|high\|critical` |
| `pharmacogenomic_profile.phenotype` | enum | `PM\|IM\|NM\|RM\|UM\|Unknown` |
| `quality_metrics.vcf_parsing_success` | boolean | — |
| `quality_metrics.cpic_guideline_version` | string | `"2024.1"` |

---

## Quick Start

### Online (No Install Required)

Visit **[ai-genom-insight.lovable.app](https://ai-genom-insight.lovable.app)**

1. Download the [sample VCF file](public/sample.vcf) (multi-gene test case)
2. Upload via drag-and-drop
3. Select drugs: Codeine, Warfarin, Clopidogrel, Simvastatin, Azathioprine, Fluorouracil
4. Click **Run Pharmacogenomic Analysis**
5. View color-coded risk cards and download validated JSON

### Local Development

```bash
# Clone
git clone <repo-url>
cd pharmaguard

# Install
npm install

# Optional: Add Gemini API key for live LLM explanations
echo "VITE_GEMINI_API_KEY=AIzaSy..." > .env

# Start dev server
npm run dev

# Run tests
npm test
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | Optional | Google Gemini API key for live AI explanations |

> Without an API key, the system uses a deterministic CPIC rule-based fallback — results are still schema-valid and clinically accurate.

---

## VCF File Format

PharmaGuard requires VCF v4.1/v4.2 files with pharmacogenomic INFO annotations:

```
##fileformat=VCFv4.2
#CHROM  POS  ID  REF  ALT  QUAL  FILTER  INFO
chr22   42523943  rs3892097  C  T  60  PASS  GENE=CYP2D6;STAR=*4;RS=rs3892097
chr10   96702047  rs4244285  G  A  60  PASS  GENE=CYP2C19;STAR=*2;RS=rs4244285
```

**Required INFO tags:**

| Tag | Description | Example |
|---|---|---|
| `GENE` | Gene symbol (uppercase) | `GENE=CYP2D6` |
| `STAR` | Star allele designation | `STAR=*4` |
| `RS` | dbSNP rsID (optional) | `RS=rs3892097` |

---

## Supported Genes & Drugs

| Gene | Key Drugs | Clinical Significance |
|---|---|---|
| CYP2D6 | Codeine, Tramadol, Metoprolol | Opioid toxicity/inefficacy risk |
| CYP2C19 | Clopidogrel, Omeprazole | Antiplatelet therapy failure |
| CYP2C9 | Warfarin | Bleeding risk with anticoagulants |
| SLCO1B1 | Simvastatin | Statin-induced myopathy risk |
| TPMT | Azathioprine, Mercaptopurine | Life-threatening myelosuppression |
| DPYD | Fluorouracil, Capecitabine | Fatal chemotherapy toxicity |

---

## CPIC Alignment

All drug-gene recommendations follow **CPIC Guidelines v2024.1 Level A** evidence — the highest evidence tier, indicating strong recommendation based on high-quality genetic and clinical data.

References:
- [CPIC Guidelines](https://cpicpgx.org/guidelines/)
- [PharmGKB](https://www.pharmgkb.org/)
- [DPWG Guidelines](https://www.pharmgkb.org/page/dpwg)

---

## LLM Integration

### Primary: Google Gemini 2.0 Flash

- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Structured prompt generates 4 clinical sections: Summary · Biological Mechanism · Clinical Implication · Dosing Recommendation
- Temperature: 0.2 (low hallucination, high consistency)
- Max tokens: 600

### Fallback: Deterministic CPIC Engine

When no API key is provided or the LLM call fails:
- Pre-built mechanistic templates per gene (CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD)
- Risk-label-specific summaries
- CPIC recommendation text passed through directly
- Output is schema-identical to LLM output

---

## Privacy

PharmaGuard processes all genomic data **entirely within the user's browser**:

- ✅ No VCF data sent to servers
- ✅ No patient identifiers stored
- ✅ Optional LLM call sends only gene/diplotype/drug metadata (not raw genomic sequence)
- ✅ Patient IDs are randomly generated per session

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + custom design system |
| Components | shadcn/ui + Radix UI |
| Animations | Custom CSS animations |
| LLM | Google Gemini 2.0 Flash REST API |
| Testing | Vitest |
| Routing | React Router v6 |

---

## Project Structure

```
src/
├── lib/
│   └── pharmacogenomics.ts    # Core engine: parser, classifier, LLM, schema
├── components/
│   ├── HeroSection.tsx        # Landing hero with problem statement
│   ├── AboutSection.tsx       # Feature overview + pipeline visualization
│   ├── UploadSection.tsx      # VCF upload + drug selection + analysis
│   ├── ResultsSection.tsx     # Risk cards + variant browser + JSON viewer
│   ├── ExplainabilitySection.tsx  # Variant insights + AI pipeline
│   └── FooterSection.tsx      # Brand + resources
├── pages/
│   └── Index.tsx              # Page orchestration + scroll reveal
└── hooks/
    └── use-animations.ts      # Scroll reveal + tilt effects
```

---

## Test Cases

### Expected Outputs (sample.vcf)

| Drug | Gene | Diplotype | Phenotype | Risk | Confidence |
|---|---|---|---|---|---|
| Codeine | CYP2D6 | *1/*4 | IM | Adjust Dosage | 0.95 |
| Warfarin | CYP2C9 | *1/*3 | IM | Adjust Dosage | 0.95 |
| Clopidogrel | CYP2C19 | *1/*2 | IM | Adjust Dosage | 0.95 |
| Simvastatin | SLCO1B1 | *1/*5 | DF | Adjust Dosage | 0.95 |
| Azathioprine | TPMT | *1/*3A | IM | Adjust Dosage | 0.95 |
| Fluorouracil | DPYD | *1/*2A | IM | Adjust Dosage | 0.95 |

---

## License

MIT — For educational and research purposes only. Not for clinical use without validation by a licensed clinical pharmacist or physician.
