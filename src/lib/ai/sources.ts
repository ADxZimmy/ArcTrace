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
