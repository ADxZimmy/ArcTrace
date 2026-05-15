import { z } from "zod";
import { canonicalizeJson, hashJson, hashString } from "@/lib/hashing";
import { finalDecisionSchema, type FinalDecision } from "@/lib/schemas";
import { collectSources, type CollectedSource } from "./sources";

const committeeSchema = z.object({
  research: z.object({
    market_context: z.string(),
    supporting_signals: z.array(z.string()),
    opposing_signals: z.array(z.string()),
    key_uncertainties: z.array(z.string()),
    initial_stance: z.enum(["bullish", "bearish", "neutral", "avoid"]),
    confidence: z.number().int().min(0).max(100),
  }),
  risk: z.object({
    risk_score: z.number().int().min(0).max(100),
    risk_flags: z.array(z.string()),
    volatility_assessment: z.string(),
    liquidity_assessment: z.string(),
    source_quality_concerns: z.array(z.string()),
    recommended_limits: z.array(z.string()),
  }),
  contrarian: z.object({
    main_counterargument: z.string(),
    failure_modes: z.array(z.string()),
    what_would_change_the_decision: z.array(z.string()),
    contrarian_stance: z.enum(["bullish", "bearish", "neutral", "avoid"]),
    confidence: z.number().int().min(0).max(100),
  }),
  final: finalDecisionSchema,
});

export type AgentCommittee = z.infer<typeof committeeSchema>;

export type TraceRunResult = {
  questionHash: `0x${string}`;
  traceHash: `0x${string}`;
  sourceBundleHash: `0x${string}`;
  canonicalTraceJson: string;
  finalDecision: FinalDecision;
  committee: AgentCommittee;
  sources: CollectedSource[];
  unavailableAdapters: { adapter: string; reason: string }[];
};

function validateQuestion(question: string, horizon: string) {
  if (question.trim().length < 18) throw new Error("Question is too vague. Ask for a measurable market outcome.");
  if (!/\d|day|week|month|quarter|hour|by|before|after/i.test(`${question} ${horizon}`)) {
    throw new Error("Question must include a measurable outcome window.");
  }
}

function systemPrompt() {
  return `You are ArcTrace, a market reasoning committee. Produce strict JSON only. Do not recommend real trades. You must synthesize evidence into simulated market intelligence. The output has four objects: research, risk, contrarian, final. The final.not_financial_advice must be true.`;
}

async function callOpenAI(prompt: string) {
  if (process.env.AI_PROVIDER !== "openai") throw new Error(`Unsupported AI_PROVIDER: ${process.env.AI_PROVIDER || "unset"}`);
  if (!process.env.AI_API_KEY) throw new Error("AI_API_KEY is required to run a trace");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4.1-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI provider returned ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content as string | undefined;
}

export async function runAgentPipeline(input: {
  question: string;
  category: string;
  horizon: string;
  dataSources: { market: boolean; news: boolean; onchain: boolean; social: boolean };
}): Promise<TraceRunResult> {
  validateQuestion(input.question, input.horizon);
  const collected = await collectSources({
    question: input.question,
    category: input.category,
    useMarket: input.dataSources.market,
    useNews: input.dataSources.news,
    useOnchain: input.dataSources.onchain,
    useSocial: input.dataSources.social,
  });
  if (collected.sources.length === 0) {
    throw new Error(`No real sources available. Configure at least one source adapter. Unavailable: ${collected.unavailable.map((u) => `${u.adapter}: ${u.reason}`).join("; ")}`);
  }

  const sourceQualityScore = Math.round(collected.sources.reduce((sum, s) => sum + s.final_weight * 100, 0) / collected.sources.length);
  const prompt = JSON.stringify({
    task: "Run Research Agent, Risk Agent, Contrarian Agent, and Final Decision Agent. Return one JSON object with keys research, risk, contrarian, final.",
    required_final_schema: finalDecisionSchema.toString(),
    input: {
      question: input.question,
      category: input.category,
      horizon: input.horizon,
      source_quality_score: sourceQualityScore,
      disclaimer: "research and simulation only; no real trades, bets, or capital movement",
    },
    sources: collected.sources,
    unavailable_adapters: collected.unavailable,
  });

  let parsed: AgentCommittee | null = null;
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const content = await callOpenAI(`${prompt}\nAttempt ${attempt + 1}: return valid JSON only.`);
    if (!content) throw new Error("AI provider returned no content");
    try {
      parsed = committeeSchema.parse(JSON.parse(content));
      break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Schema validation failed";
    }
  }
  if (!parsed) throw new Error(`AI output failed schema validation: ${lastError}`);

  const finalTrace = {
    ...parsed.final,
    source_bundle_hash: hashJson(collected.sources),
    generated_at: new Date().toISOString(),
    unavailable_adapters: collected.unavailable,
  };
  const canonicalTraceJson = canonicalizeJson(finalTrace);

  return {
    questionHash: hashString(input.question),
    traceHash: hashString(canonicalTraceJson),
    sourceBundleHash: hashJson(collected.sources),
    canonicalTraceJson,
    finalDecision: parsed.final,
    committee: parsed,
    sources: collected.sources,
    unavailableAdapters: collected.unavailable,
  };
}
