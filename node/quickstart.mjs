const API_URL = "https://api.compsniper.com/v1/scrape";
const apiKey = process.env.COMPSNIPER_API_KEY?.trim();
if (!apiKey) throw new Error("Set COMPSNIPER_API_KEY before running this example.");

const url = new URL(API_URL);
url.searchParams.set("keyword", process.env.COMPSNIPER_KEYWORD ?? "iphone 15 pro");
url.searchParams.set("count", "10");
url.searchParams.set("itemCondition", "used");

const response = await fetch(url, {
  headers: { Authorization: `Bearer ${apiKey}` },
  signal: AbortSignal.timeout(75_000),
});
const data = await response.json();
if (!response.ok) throw new Error(data.error ?? `CompSniper returned HTTP ${response.status}`);

console.log("Listings returned:", data.totalItems);
console.log("Median:", data.summary?.median, data.summary?.currency ?? "");
console.log("Realistic range:", data.summary?.p25, "-", data.summary?.p75);
console.log("Monthly requests remaining:", response.headers.get("x-usage-remaining") ?? "unknown");

for (const item of data.items.slice(0, 5)) {
  console.log(`- ${item.title} | ${item.soldPrice} ${item.soldCurrency} | ${item.endedAt}`);
}
