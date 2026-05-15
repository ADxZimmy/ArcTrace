import { describe, expect, it, vi } from "vitest";
import { collectSources } from "@/lib/ai/sources";

describe("source adapters", () => {
  it("reports unavailable adapters instead of fabricating data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const prior = process.env.NEWS_API_KEY;
    delete process.env.NEWS_API_KEY;
    const result = await collectSources({ question: "Will BTC rise in 7 days?", category: "crypto", useMarket: true, useNews: true, useOnchain: true, useSocial: true });
    expect(result.sources).toHaveLength(0);
    expect(result.unavailable.map((item) => item.adapter)).toEqual(expect.arrayContaining(["market", "news", "onchain", "social"]));
    process.env.NEWS_API_KEY = prior;
  });
});
