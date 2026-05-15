import { describe, expect, it } from "vitest";
import { canonicalizeJson, hashJson, hashString } from "@/lib/hashing";
import { finalDecisionSchema } from "@/lib/schemas";

describe("trace canonicalization and hashing", () => {
  it("canonicalizes object keys deterministically", () => {
    expect(canonicalizeJson({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
  });

  it("hashes canonical JSON independent of key order", () => {
    expect(hashJson({ b: 2, a: 1 })).toBe(hashJson({ a: 1, b: 2 }));
  });

  it("hashes raw strings with keccak256", () => {
    expect(hashString("ArcTrace")).toMatch(/^0x[a-f0-9]{64}$/);
  });
});

describe("final decision schema", () => {
  it("accepts strict final decision JSON", () => {
    const parsed = finalDecisionSchema.parse({
      question: "Will ETH outperform BTC over the next 7 days?",
      category: "crypto",
      horizon: "7 days",
      stance: "neutral",
      confidence: 55,
      risk_score: 70,
      source_quality_score: 80,
      decision_summary: "Signals are mixed.",
      reasoning_summary: "Conflicting momentum and macro risk.",
      signals: [{ name: "Momentum", direction: "neutral", weight: 0.4, confidence: 60, evidence: "Fixture evidence", source_ids: ["src_1"] }],
      risks: ["Volatility"],
      expiry_timestamp: new Date(Date.now() + 86400000).toISOString(),
      simulated_action: "watch",
      not_financial_advice: true,
    });
    expect(parsed.stance).toBe("neutral");
  });
});
