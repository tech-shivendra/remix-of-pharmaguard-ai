import { describe, it, expect } from "vitest";
import { parseVCF, classifyRisk } from "@/lib/pharmacogenomics";

describe("VCF GT-based filtering", () => {
  const header = `##fileformat=VCFv4.2\n#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE\n`;

  it("includes variant when GT is 0/1", () => {
    const vcf = header + `chr22\t42523943\trs3892097\tC\tT\t60\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs3892097\tGT:DP\t0/1:58`;
    const result = parseVCF(vcf);
    expect(result.success).toBe(true);
    expect(result.variantsFound).toBe(1);
    expect(result.variants[0].star_allele).toBe("*4");
  });

  it("excludes variant when GT is 0/0 (hom-ref)", () => {
    const vcf = header + `chr22\t42523943\trs3892097\tC\tT\t60\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs3892097\tGT:DP\t0/0:58`;
    const result = parseVCF(vcf);
    expect(result.success).toBe(true);
    expect(result.variantsFound).toBe(0);
  });

  it("excludes variant when GT is ./. (missing)", () => {
    const vcf = header + `chr22\t42523943\trs3892097\tC\tT\t60\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs3892097\tGT:DP\t./.:58`;
    const result = parseVCF(vcf);
    expect(result.variantsFound).toBe(0);
  });

  it("includes variant when GT is 1/1 (hom-alt)", () => {
    const vcf = header + `chr22\t42523943\trs3892097\tC\tT\t60\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs3892097\tGT:DP\t1/1:58`;
    const result = parseVCF(vcf);
    expect(result.variantsFound).toBe(1);
  });

  it("handles phased genotypes (1|0)", () => {
    const vcf = header + `chr22\t42523943\trs3892097\tC\tT\t60\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs3892097\tGT:DP\t1|0:58`;
    const result = parseVCF(vcf);
    expect(result.variantsFound).toBe(1);
  });

  it("excludes phased hom-ref (0|0)", () => {
    const vcf = header + `chr22\t42523943\trs3892097\tC\tT\t60\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs3892097\tGT:DP\t0|0:58`;
    const result = parseVCF(vcf);
    expect(result.variantsFound).toBe(0);
  });

  it("returns *1/*1 / NM / Safe when all variants are 0/0", () => {
    const vcf = header + `chr22\t42523943\trs3892097\tC\tT\t60\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs3892097\tGT:DP\t0/0:58`;
    const parsed = parseVCF(vcf);
    const risk = classifyRisk("CODEINE", parsed.variants);
    expect(risk.diplotype).toBe("*1/*1");
    expect(risk.phenotype).toBe("Normal Metabolizer (NM)");
    expect(risk.risk_label).toBe("Safe");
  });

  it("works with legacy 8-column VCF (no FORMAT/SAMPLE)", () => {
    const legacy = `##fileformat=VCFv4.2\n#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\n` +
      `chr22\t42523943\trs3892097\tC\tT\t60\tPASS\tGENE=CYP2D6;STAR=*4;RS=rs3892097`;
    const result = parseVCF(legacy);
    expect(result.variantsFound).toBe(1);
  });
});
