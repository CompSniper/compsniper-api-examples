const API_URL = "https://api.compsniper.com/v1/scrape";
const apiKey = process.env.COMPSNIPER_API_KEY?.trim();
if (!apiKey) throw new Error("Set COMPSNIPER_API_KEY before running this example.");

const keyword = process.env.COMPSNIPER_KEYWORD ?? "sony wh-1000xm5";
const maxPages = Math.max(1, Math.min(Number(process.env.COMPSNIPER_MAX_PAGES ?? 3), 100));
const items = [];

for (let page = 1; page <= maxPages; page += 1) {
  const url = new URL(API_URL);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("page", String(page));
  url.searchParams.set("count", "240");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(75_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `CompSniper returned HTTP ${response.status}`);

  items.push(...data.items);
  console.log(`Page ${page}: ${data.totalItems} listings`);
  if (!data.hasNextPage) break;
}

console.log(`Collected ${items.length} listing rows across at most ${maxPages} pages.`);
