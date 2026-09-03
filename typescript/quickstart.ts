type SoldListing = {
  itemId: string | null;
  title: string | null;
  soldPrice: string | null;
  soldCurrency: string | null;
  endedAt: string | null;
  condition: string | null;
  shippingPrice: string | null;
  totalPrice: string | null;
  bestOfferAccepted: boolean | null;
  url: string | null;
};

type SoldSearchResponse = {
  keyword: string;
  totalItems: number;
  hasNextPage: boolean;
  summary: {
    count: number;
    currency: string | null;
    median: number | null;
    mean: number | null;
    p25: number | null;
    p75: number | null;
    avgShipping: number | null;
  };
  items: SoldListing[];
  code?: string;
  error?: string;
};

declare const process: { env: Record<string, string | undefined> };

const API_URL = "https://api.compsniper.com/v1/scrape";

async function main() {
  const apiKey = process.env.COMPSNIPER_API_KEY?.trim();
  if (!apiKey) throw new Error("Set COMPSNIPER_API_KEY before running this example.");

  const url = new URL(API_URL);
  url.searchParams.set("keyword", process.env.COMPSNIPER_KEYWORD ?? "sony wh-1000xm5");
  url.searchParams.set("count", "10");
  url.searchParams.set("ebaySite", "ebay.com");
  url.searchParams.set("itemCondition", "used");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(75_000),
  });

  const data = (await response.json()) as SoldSearchResponse;
  if (!response.ok) {
    throw new Error(data.error ?? `CompSniper returned HTTP ${response.status}`);
  }

  console.log("Listings returned:", data.totalItems);
  console.log("Median:", data.summary.median, data.summary.currency ?? "");
  console.log("Realistic range:", data.summary.p25, "to", data.summary.p75);
  console.log("Monthly requests remaining:", response.headers.get("x-usage-remaining") ?? "unknown");

  for (const item of data.items.slice(0, 5)) {
    console.log(`${item.title} | ${item.soldPrice} ${item.soldCurrency} | ${item.endedAt}`);
  }
}

void main();
