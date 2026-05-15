import { z } from "zod";

export const stanceSchema = z.enum(["bullish", "bearish", "neutral", "avoid"]);

export const finalDecisionSchema = z.object({
  question: z.string().min(10),
  category: z.string().min(2),
  horizon: z.string().min(2),
  stance: stanceSchema,
  confidence: z.number().int().min(0).max(100),
  risk_score: z.number().int().min(0).max(100),
  source_quality_score: z.number().int().min(0).max(100),
  decision_summary: z.string().min(1),
  reasoning_summary: z.string().min(1),
  signals: z.array(
    z.object({
      name: z.string(),
      direction: z.enum(["supporting", "opposing", "neutral"]),
      weight: z.number().min(0).max(1),
      confidence: z.number().int().min(0).max(100),
      evidence: z.string(),
      source_ids: z.array(z.string()),
    }),
  ),
  risks: z.array(z.string()),
  expiry_timestamp: z.string().datetime(),
  simulated_action: z.enum(["watch", "avoid", "simulated_long", "simulated_short", "simulated_hedge"]),
  not_financial_advice: z.literal(true),
});

export type FinalDecision = z.infer<typeof finalDecisionSchema>;

export const runTraceSchema = z.object({
  agentId: z.string().min(1),
  question: z.string().min(18),
  category: z.string().min(2),
  horizon: z.string().min(2),
  walletAddress: z.string().optional(),
  dataSources: z
    .object({
      market: z.boolean().default(true),
      news: z.boolean().default(true),
      onchain: z.boolean().default(false),
      social: z.boolean().default(false),
    })
    .default({ market: true, news: true, onchain: false, social: false }),
});

export const registerAgentSchema = z.object({
  name: z.string().min(3).default("ArcTrace Default Market Reasoning Agent"),
  metadataUri: z.string().default("arctrace://agent/default-market-reasoning-agent"),
  ownerWallet: z.string().optional(),
});
