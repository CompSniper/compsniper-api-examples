const API_URL = "https://api.compsniper.com/v1/poshmark/sold";
const apiKey = process.env.COMPSNIPER_API_KEY?.trim();
if (!apiKey) throw new Error("Set COMPSNIPER_API_KEY before running this example.");

const url = new URL(API_URL);
url.search = new URLSearchParams({
  keyword: process.env.COMPSNIPER_KEYWORD ?? "louis vuitton neverfull",
  department: "women",
  page: "1",
});

const response = await fetch(url, {
  headers: { Authorization: `Bearer ${apiKey}` },
  signal: AbortSignal.timeout(45_000),
});
const data = await response.json();
if (!response.ok) throw new Error(data.error ?? `CompSniper returned HTTP ${response.status}`);

console.log("Listings returned:", data.totalItems);
console.log("Median displayed price:", data.summary?.median, data.summary?.currency ?? "USD");
console.log("Monthly requests remaining:", response.headers.get("x-usage-remaining") ?? "unknown");

for (const item of data.items.slice(0, 5)) {
  console.log(`- ${item.title} | $${item.soldPrice} | ${item.soldAt ?? "date unavailable"}`);
}
