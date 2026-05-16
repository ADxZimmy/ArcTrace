import { hashJson } from "@/lib/hashing";

export type CollectedSource = {
  id: string;
  source_type: string;
  provider: string;
  title: string;
  url_or_identifier: string;
  timestamp: string;
  excerpt: string;
  hash: `0x${string}`;
  reliability_score: number;
  recency_score: number;
  relevance_score: number;
  conflict_score: number;
  final_weight: number;
};

export type SourceCollection = {
  sources: CollectedSource[];
  unavailable: { adapter: string; reason: string }[];
};

function scoreRecency(date?: string) {
  if (!date) return 40;
  const ageHours = Math.max(1, (Date.now() - new Date(date).getTime()) / 36e5);
  return Math.max(10, Math.min(100, Math.round(100 - ageHours / 8)));
}

function source(id: string, data: Omit<CollectedSource, "id" | "hash" | "final_weight">): CollectedSource {
  const hash = hashJson(data);
  const final_weight = Number(((data.reliability_score + data.recency_score + data.relevance_score - data.conflict_score * 0.4) / 300).toFixed(2));
  return { id, hash, final_weight: Math.max(0, Math.min(1, final_weight)), ...data };
}

function inferCoinId(question: string) {
  const lower = question.toLowerCase();
  const candidates: Array<[string, string[]]> = [
    ["bitcoin", ["bitcoin", "btc"]],
    ["ethereum", ["ethereum", "eth"]],
    ["solana", ["solana", "sol"]],
    ["chainlink", ["chainlink", "link"]],
    ["arbitrum", ["arbitrum", "arb"]],
    ["optimism", ["optimism", "op"]],
    ["uniswap", ["uniswap", "uni"]],
    ["dogecoin", ["dogecoin", "doge"]],
    ["ripple", ["ripple", "xrp"]],
  ];
  return candidates.find(([, aliases]) => aliases.some((alias) => lower.includes(alias)))?.[0] || null;
}

function inferVsCurrency(question: string) {
  return /\beth\b|ethereum/i.test(question) && !/\bbtc\b|bitcoin/i.test(question) ? "usd" : "usd";
}

export async function collectSources(input: {
  question: string;
  category: string;
  useMarket: boolean;
  useNews: boolean;
  useOnchain: boolean;
  useSocial: boolean;
}): Promise<SourceCollection> {
  const sources: CollectedSource[] = [];
  const unavailable: SourceCollection["unavailable"] = [];
  const query = encodeURIComponent(input.question.slice(0, 120));

  if (input.useMarket) {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/global", { next: { revalidate: 120 } });
      if (!res.ok) throw new Error(`CoinGecko returned ${res.status}`);
      const json = await res.json();
      sources.push(
        source(`src_${sources.length + 1}`, {
          source_type: "market_data",
          provider: "coingecko",
          title: "CoinGecko global crypto market snapshot",
          url_or_identifier: "https://api.coingecko.com/api/v3/global",
          timestamp: new Date().toISOString(),
          excerpt: JSON.stringify(json?.data ?? json).slice(0, 2200),
          reliability_score: 82,
          recency_score: 96,
          relevance_score: input.category.toLowerCase().includes("crypto") ? 90 : 62,
          conflict_score: 20,
        }),
      );
    } catch (error) {
      unavailable.push({ adapter: "market", reason: error instanceof Error ? error.message : "Market adapter failed" });
    }

    const coinId = inferCoinId(input.question);
    if (coinId) {
      try {
        const marketUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${inferVsCurrency(input.question)}&ids=${coinId}&price_change_percentage=1h,24h,7d,30d`;
        const res = await fetch(marketUrl, { next: { revalidate: 120 } });
        if (!res.ok) throw new Error(`CoinGecko asset market returned ${res.status}`);
        const json = await res.json();
        sources.push(
          source(`src_${sources.length + 1}`, {
            source_type: "market_data",
            provider: "coingecko",
            title: `CoinGecko ${coinId} market performance`,
            url_or_identifier: marketUrl,
            timestamp: new Date().toISOString(),
            excerpt: JSON.stringify(json?.[0] ?? json).slice(0, 2200),
            reliability_score: 82,
            recency_score: 96,
            relevance_score: 96,
            conflict_score: 18,
          }),
        );
      } catch (error) {
        unavailable.push({ adapter: "asset_market", reason: error instanceof Error ? error.message : "Asset market adapter failed" });
      }

      try {
        const historyUrl = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=30&interval=daily`;
        const res = await fetch(historyUrl, { next: { revalidate: 300 } });
        if (!res.ok) throw new Error(`CoinGecko history returned ${res.status}`);
        const json = await res.json();
        const prices = Array.isArray(json.prices) ? json.prices.slice(-8) : [];
        const volumes = Array.isArray(json.total_volumes) ? json.total_volumes.slice(-8) : [];
        sources.push(
          source(`src_${sources.length + 1}`, {
            source_type: "market_data",
            provider: "coingecko",
            title: `CoinGecko ${coinId} 30 day price and volume history`,
            url_or_identifier: historyUrl,
            timestamp: new Date().toISOString(),
            excerpt: JSON.stringify({ recent_prices: prices, recent_volumes: volumes }).slice(0, 2200),
            reliability_score: 82,
            recency_score: 92,
            relevance_score: 92,
            conflict_score: 22,
          }),
        );
      } catch (error) {
        unavailable.push({ adapter: "market_history", reason: error instanceof Error ? error.message : "Market history adapter failed" });
      }
    } else {
      unavailable.push({ adapter: "asset_market", reason: "No supported crypto asset symbol was detected in the question" });
    }
  }

  if (input.useNews) {
    if (!process.env.NEWS_API_KEY) {
      unavailable.push({ adapter: "news", reason: "NEWS_API_KEY is not configured" });
    } else {
      try {
        const res = await fetch(`https://newsapi.org/v2/everything?q=${query}&language=en&pageSize=5&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`);
        if (!res.ok) throw new Error(`NewsAPI returned ${res.status}`);
        const json = await res.json();
        for (const article of json.articles ?? []) {
          const publishedAt = article.publishedAt ?? new Date().toISOString();
          sources.push(
            source(`src_${sources.length + 1}`, {
              source_type: "news",
              provider: "newsapi",
              title: article.title || "Untitled news item",
              url_or_identifier: article.url,
              timestamp: publishedAt,
              excerpt: [article.description, article.content].filter(Boolean).join("\n").slice(0, 1800),
              reliability_score: 70,
              recency_score: scoreRecency(publishedAt),
              relevance_score: 76,
              conflict_score: 35,
            }),
          );
        }
      } catch (error) {
        unavailable.push({ adapter: "news", reason: error instanceof Error ? error.message : "News adapter failed" });
      }
    }
  }

  if (input.useOnchain) unavailable.push({ adapter: "onchain", reason: "No onchain data adapter configured for this environment" });
  if (input.useSocial) unavailable.push({ adapter: "social", reason: "No social/sentiment adapter configured for this environment" });

  return { sources, unavailable };
}
