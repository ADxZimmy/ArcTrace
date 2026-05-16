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
    confidence: z.coerce.number().int().min(0).max(100),
  }),
  risk: z.object({
    risk_score: z.coerce.number().int().min(0).max(100),
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
    confidence: z.coerce.number().int().min(0).max(100),
  }),
  final: finalDecisionSchema,
});

const committeeJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["research", "risk", "contrarian", "final"],
  properties: {
    research: {
      type: "object",
      additionalProperties: false,
      required: ["market_context", "supporting_signals", "opposing_signals", "key_uncertainties", "initial_stance", "confidence"],
      properties: {
        market_context: { type: "string" },
        supporting_signals: { type: "array", items: { type: "string" } },
        opposing_signals: { type: "array", items: { type: "string" } },
        key_uncertainties: { type: "array", items: { type: "string" } },
        initial_stance: { type: "string", enum: ["bullish", "bearish", "neutral", "avoid"] },
        confidence: { type: "integer", minimum: 0, maximum: 100 },
      },
    },
    risk: {
      type: "object",
      additionalProperties: false,
      required: ["risk_score", "risk_flags", "volatility_assessment", "liquidity_assessment", "source_quality_concerns", "recommended_limits"],
      properties: {
        risk_score: { type: "integer", minimum: 0, maximum: 100 },
        risk_flags: { type: "array", items: { type: "string" } },
        volatility_assessment: { type: "string" },
        liquidity_assessment: { type: "string" },
        source_quality_concerns: { type: "array", items: { type: "string" } },
        recommended_limits: { type: "array", items: { type: "string" } },
      },
    },
    contrarian: {
      type: "object",
      additionalProperties: false,
      required: ["main_counterargument", "failure_modes", "what_would_change_the_decision", "contrarian_stance", "confidence"],
      properties: {
        main_counterargument: { type: "string" },
        failure_modes: { type: "array", items: { type: "string" } },
        what_would_change_the_decision: { type: "array", items: { type: "string" } },
        contrarian_stance: { type: "string", enum: ["bullish", "bearish", "neutral", "avoid"] },
        confidence: { type: "integer", minimum: 0, maximum: 100 },
      },
    },
    final: {
      type: "object",
      additionalProperties: false,
      required: [
        "question",
        "category",
        "horizon",
        "stance",
        "confidence",
        "risk_score",
        "source_quality_score",
        "decision_summary",
        "reasoning_summary",
        "signals",
        "risks",
        "expiry_timestamp",
        "simulated_action",
        "not_financial_advice",
      ],
      properties: {
        question: { type: "string" },
        category: { type: "string" },
        horizon: { type: "string" },
        stance: { type: "string", enum: ["bullish", "bearish", "neutral", "avoid"] },
        confidence: { type: "integer", minimum: 0, maximum: 100 },
        risk_score: { type: "integer", minimum: 0, maximum: 100 },
        source_quality_score: { type: "integer", minimum: 0, maximum: 100 },
        decision_summary: { type: "string" },
        reasoning_summary: { type: "string" },
        signals: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "direction", "weight", "confidence", "evidence", "source_ids"],
            properties: {
              name: { type: "string" },
              direction: { type: "string", enum: ["supporting", "opposing", "neutral"] },
              weight: { type: "number", minimum: 0, maximum: 1 },
              confidence: { type: "integer", minimum: 0, maximum: 100 },
              evidence: { type: "string" },
              source_ids: { type: "array", items: { type: "string" } },
            },
          },
        },
        risks: { type: "array", items: { type: "string" } },
        expiry_timestamp: { type: "string" },
        simulated_action: { type: "string", enum: ["watch", "avoid", "simulated_long", "simulated_short", "simulated_hedge"] },
        not_financial_advice: { type: "boolean", const: true },
      },
    },
  },
} as const;

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
  return [
    "You are ArcTrace, a market reasoning committee.",
    "Produce strict JSON only. Do not recommend real trades.",
    "You must synthesize evidence into simulated market intelligence.",
    "The root object must have exactly four keys: research, risk, contrarian, final.",
    "Do not wrap the result in markdown, explanations, agents, output, data, or schema keys.",
    "All numeric fields must be numbers, not strings. final.not_financial_advice must be true.",
  ].join(" ");
}

async function callOpenAI(prompt: string, useStructuredOutput = true) {
  if (process.env.AI_PROVIDER !== "openai") throw new Error(`Unsupported AI_PROVIDER: ${process.env.AI_PROVIDER || "unset"}`);
  if (!process.env.AI_API_KEY) throw new Error("AI_API_KEY is required to run a trace");
  const body = {
    model: process.env.AI_MODEL || "gpt-4.1-mini",
    temperature: 0,
    response_format: useStructuredOutput
      ? {
          type: "json_schema",
          json_schema: {
            name: "arctrace_committee_trace",
            strict: true,
            schema: committeeJsonSchema,
          },
        }
      : { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt() },
      { role: "user", content: prompt },
    ],
  };
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok && useStructuredOutput && [400, 404].includes(res.status)) {
    return callOpenAI(prompt, false);
  }
  if (!res.ok) throw new Error(`AI provider returned ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content as string | undefined;
}

function parseCommitteeContent(content: string) {
  const parsed = JSON.parse(content);
  const candidate =
    parsed?.research && parsed?.risk && parsed?.contrarian && parsed?.final
      ? parsed
      : parsed?.committee?.research
        ? parsed.committee
        : parsed?.result?.research
          ? parsed.result
          : parsed?.output?.research
            ? parsed.output
            : parsed?.data?.research
              ? parsed.data
              : parsed;
  return committeeSchema.parse(candidate);
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
    output_contract: {
      root_keys: ["research", "risk", "contrarian", "final"],
      stance_values: ["bullish", "bearish", "neutral", "avoid"],
      simulated_action_values: ["watch", "avoid", "simulated_long", "simulated_short", "simulated_hedge"],
      final_required_fields: [
        "question",
        "category",
        "horizon",
        "stance",
        "confidence",
        "risk_score",
        "source_quality_score",
        "decision_summary",
        "reasoning_summary",
        "signals",
        "risks",
        "expiry_timestamp",
        "simulated_action",
        "not_financial_advice",
      ],
    },
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
  for (let attempt = 0; attempt < 3; attempt++) {
    const repairInstruction = lastError
      ? `\nPrevious response failed validation. Fix these errors and return only the required root JSON object:\n${lastError}`
      : "";
    const content = await callOpenAI(`${prompt}${repairInstruction}\nAttempt ${attempt + 1}: return valid JSON only.`);
    if (!content) throw new Error("AI provider returned no content");
    try {
      parsed = parseCommitteeContent(content);
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
