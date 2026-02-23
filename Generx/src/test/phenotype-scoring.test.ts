import { describe, it, expect } from "vitest";
import { classifyRisk, type DetectedVariant } from "@/lib/pharmacogenomics";

/** Helper to create a variant for a gene */
const v = (gene: string, star: string): DetectedVariant => ({
  rsid: "rs0000", gene, star_allele: star,
});

describe("CYP2D6 activity-score phenotype engine", () => {
  it("*1/*2 → NM (score 2.0) — *2 is normal function", () => {
    const result = classifyRisk("CODEINE", [v("CYP2D6", "*2")]);
    expect(result.diplotype).toBe("*1/*2");
    expect(result.phenotype).toBe("Normal Metabolizer (NM)");
    expect(result.risk_label).toBe("Safe");
  });

  it("*1/*4 → IM (score 1.0)", () => {
    const result = classifyRisk("CODEINE", [v("CYP2D6", "*4")]);
    expect(result.diplotype).toBe("*1/*4");
    expect(result.phenotype).toBe("Intermediate Metabolizer (IM)");
    expect(result.risk_label).toBe("Adjust Dosage");
  });

  it("*4/*4 → PM (score 0.0)", () => {
    const result = classifyRisk("CODEINE", [v("CYP2D6", "*4"), v("CYP2D6", "*4")]);
    expect(result.diplotype).toBe("*4/*4");
    expect(result.phenotype).toBe("Poor Metabolizer (PM)");
    expect(result.risk_label).toBe("Toxic");
  });

  it("*10/*41 → IM (score 1.0)", () => {
    const result = classifyRisk("CODEINE", [v("CYP2D6", "*10"), v("CYP2D6", "*41")]);
    expect(result.diplotype).toBe("*10/*41");
    expect(result.phenotype).toBe("Intermediate Metabolizer (IM)");
  });

  it("*1/*1 → NM (score 2.0)", () => {
    // No CYP2D6 variants → wildtype
    const result = classifyRisk("CODEINE", []);
    expect(result.diplotype).toBe("*1/*1");
    expect(result.phenotype).toBe("Normal Metabolizer (NM)");
    expect(result.risk_label).toBe("Safe");
  });

  it("*5/*6 → PM (score 0.0) — both no-function", () => {
    const result = classifyRisk("CODEINE", [v("CYP2D6", "*5"), v("CYP2D6", "*6")]);
    expect(result.phenotype).toBe("Poor Metabolizer (PM)");
  });

  it("*1/*10 → IM (score 1.5) → NM per CPIC threshold", () => {
    const result = classifyRisk("CODEINE", [v("CYP2D6", "*10")]);
    // *1 (1.0) + *10 (0.5) = 1.5 → NM
    expect(result.phenotype).toBe("Normal Metabolizer (NM)");
  });
});
