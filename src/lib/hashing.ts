import stringify from "json-stable-stringify";
import { keccak256, stringToHex } from "viem";

export function canonicalizeJson(value: unknown): string {
  const canonical = stringify(value);
  if (!canonical) throw new Error("Unable to canonicalize JSON payload");
  return canonical;
}

export function hashString(value: string): `0x${string}` {
  return keccak256(stringToHex(value));
}

export function hashJson(value: unknown): `0x${string}` {
  return hashString(canonicalizeJson(value));
}

export const defaultAgentPolicy = {
  name: "ArcTrace Default Market Reasoning Agent",
  version: "0.1.0",
  allowed_actions: [
    "collect_public_market_data",
    "collect_public_news_data",
    "score_sources",
    "generate_research_decision",
    "commit_trace_hash_to_arc_testnet",
    "track_outcomes",
  ],
  disallowed_actions: [
    "execute_real_trades",
    "place_bets",
    "move_user_capital",
    "promise_returns",
    "hide_reasoning_trace",
  ],
  risk_controls: {
    max_confidence_without_sources: 30,
    require_expiry_timestamp: true,
    require_source_quality_score: true,
    require_contrarian_review: true,
  },
} as const;

export const defaultPolicyHash = hashJson(defaultAgentPolicy);
