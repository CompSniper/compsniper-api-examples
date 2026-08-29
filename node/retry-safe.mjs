const API_URL = "https://api.compsniper.com/v1/scrape";
const MAX_ATTEMPTS = 5;
const apiKey = process.env.COMPSNIPER_API_KEY?.trim();
if (!apiKey) throw new Error("Set COMPSNIPER_API_KEY before running this example.");

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function responseBody(response) {
  try {
    const body = await response.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

function delaySeconds(response, body, attempt) {
  const parsed = Number(response.headers.get("retry-after") ?? body.retry_after);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Math.min(2 ** attempt, 30);
}

async function searchSold(keyword) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const url = new URL(API_URL);
    url.searchParams.set("keyword", keyword);
    url.searchParams.set("count", "240");

    let response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(75_000),
      });
    } catch (error) {
      if (attempt === MAX_ATTEMPTS - 1) throw error;
      await sleep((Math.min(2 ** attempt, 30) + Math.random() * 0.5) * 1000);
      continue;
    }

    const body = await responseBody(response);
    if (response.ok) {
      console.log("Requests remaining:", response.headers.get("x-usage-remaining") ?? "unknown");
      return body;
    }

    if (response.status === 429 && body.code === "quota_exceeded") {
      throw new Error(`Monthly quota exhausted. Reset: ${body.reset_at}. Upgrade: ${body.upgrade_url}`);
    }

    const temporary =
      (response.status === 429 && body.code === "rate_limited") ||
      [500, 502, 503].includes(response.status);
    if (temporary && attempt < MAX_ATTEMPTS - 1) {
      await sleep((delaySeconds(response, body, attempt) + Math.random() * 0.5) * 1000);
      continue;
    }

    throw new Error(body.error ?? `CompSniper returned HTTP ${response.status}`);
  }

  throw new Error("CompSniper request failed after five bounded attempts.");
}

const result = await searchSold(process.env.COMPSNIPER_KEYWORD ?? "9780399145636");
console.log("Listings returned:", result.totalItems);
