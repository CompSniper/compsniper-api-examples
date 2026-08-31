import { mkdir, readFile, writeFile } from "node:fs/promises";
import process from "node:process";

const ROOT = new URL(".", import.meta.url);
const PRODUCTS_PATH = new URL("products.json", ROOT);
const RESULTS_DIR = new URL("results/", ROOT);
const RAW_DIR = new URL("results/raw/", ROOT);
const API_URL = process.env.COMPSNIPER_API_URL || "https://api.compsniper.com/v1/scrape";
const API_KEY = process.env.COMPSNIPER_API_KEY?.trim();
const SOLD_AFTER = process.env.STUDY_SOLD_AFTER || "2026-06-02";
const SOLD_BEFORE = process.env.STUDY_SOLD_BEFORE || "2026-08-31";
const MAX_ATTEMPTS = 5;
const START_DELAY_MS = 1_000;

if (!API_KEY) throw new Error("COMPSNIPER_API_KEY is required.");

const products = JSON.parse(await readFile(PRODUCTS_PATH, "utf8"));
if (!Array.isArray(products) || products.length !== 100) {
  throw new Error(`Expected exactly 100 products, received ${Array.isArray(products) ? products.length : "invalid JSON"}.`);
}

await mkdir(RAW_DIR, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const round = (value, digits = 2) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return null;
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
};
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const csvCell = (value) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
};

async function fetchProduct(entry, index) {
  const query = new URLSearchParams({
    keyword: entry.keyword,
    count: "240",
    page: "1",
    ebaySite: "ebay.com",
    sortOrder: "endedRecently",
    itemCondition: "any",
    relevance: "true",
    soldAfter: SOLD_AFTER,
    soldBefore: SOLD_BEFORE,
  });
  const url = `${API_URL}?${query}`;
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
    });
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text.slice(0, 500), code: "invalid_json" };
    }

    if (response.ok) {
      const filename = `${String(index + 1).padStart(3, "0")}-${slugify(entry.product)}.json`;
      await writeFile(new URL(filename, RAW_DIR), `${JSON.stringify(body, null, 2)}\n`);
      const rawCount = Number.isFinite(Number(body.rawSampleCount)) ? Number(body.rawSampleCount) : null;
      const cleanedCount = Number.isFinite(Number(body.summary?.count)) ? Number(body.summary.count) : 0;
      const removedCount = rawCount === null ? null : Math.max(0, rawCount - cleanedCount);
      const rawMedian = round(body.rawMedian);
      const cleanedMedian = round(body.summary?.median);
      const medianDelta = rawMedian === null || cleanedMedian === null ? null : round(cleanedMedian - rawMedian);
      const medianDeltaPct = rawMedian && medianDelta !== null ? round((medianDelta / rawMedian) * 100) : null;
      const bestOfferAcceptedCount = Array.isArray(body.items)
        ? body.items.filter((item) => item.bestOfferAccepted === true).length
        : 0;
      const scrapedAtValues = Array.isArray(body.items)
        ? body.items.map((item) => item.scrapedAt).filter(Boolean).sort()
        : [];

      return {
        studyIndex: index + 1,
        category: entry.category,
        product: entry.product,
        keyword: entry.keyword,
        ebaySite: "ebay.com",
        soldAfter: SOLD_AFTER,
        soldBefore: SOLD_BEFORE,
        requestedCount: 240,
        rawSampleCount: rawCount,
        cleanedSampleCount: cleanedCount,
        removedCount,
        removalRatePct: rawCount ? round((removedCount / rawCount) * 100) : null,
        rawMedian,
        cleanedMedian,
        medianDelta,
        medianDeltaPct,
        mean: round(body.summary?.mean),
        p25: round(body.summary?.p25),
        p75: round(body.summary?.p75),
        iqr: body.summary?.p25 !== undefined && body.summary?.p75 !== undefined
          ? round(Number(body.summary.p75) - Number(body.summary.p25))
          : null,
        min: round(body.summary?.min),
        max: round(body.summary?.max),
        avgShipping: round(body.summary?.avgShipping),
        currency: body.summary?.currency ?? null,
        bestOfferAcceptedCount,
        bestOfferAcceptedRatePct: cleanedCount ? round((bestOfferAcceptedCount / cleanedCount) * 100) : null,
        totalResultsReported: body.totalResults ?? null,
        firstScrapedAt: scrapedAtValues[0] ?? null,
        lastScrapedAt: scrapedAtValues.at(-1) ?? null,
        requestId: response.headers.get("x-request-id"),
        cacheStatus: response.headers.get("x-cache"),
        durationMs: Date.now() - startedAt,
        status: "ok",
        errorCode: null,
      };
    }

    const code = body?.code || body?.error || `http_${response.status}`;
    const retryable = response.status >= 500 || ["rate_limited", "server_busy", "upstream_blocked", "server_error"].includes(code);
    if (!retryable || attempt === MAX_ATTEMPTS) {
      return {
        studyIndex: index + 1,
        category: entry.category,
        product: entry.product,
        keyword: entry.keyword,
        ebaySite: "ebay.com",
        soldAfter: SOLD_AFTER,
        soldBefore: SOLD_BEFORE,
        requestedCount: 240,
        status: "error",
        errorCode: code,
        httpStatus: response.status,
        errorMessage: body?.message || body?.error || "Request failed",
        requestId: response.headers.get("x-request-id"),
        durationMs: Date.now() - startedAt,
      };
    }

    const retryAfter = Number(response.headers.get("retry-after") || body?.retry_after || 0);
    await sleep(retryAfter > 0 ? retryAfter * 1_000 : Math.min(20_000, 2 ** attempt * 1_000));
  }
  throw new Error("Unreachable retry state.");
}

let prior = null;
try {
  prior = JSON.parse(await readFile(new URL("aggregate.json", RESULTS_DIR), "utf8"));
} catch {}

const startedAt = prior?.startedAt || new Date().toISOString();
const rows = Array.isArray(prior?.rows) ? prior.rows.filter((row) => row.status === "ok") : [];
const completedIndexes = new Set(rows.map((row) => row.studyIndex));
const pendingIndexes = products.map((_, index) => index).filter((index) => !completedIndexes.has(index + 1));
const concurrency = Math.min(3, Math.max(1, Number(process.env.STUDY_CONCURRENCY || 2)));
let pendingCursor = 0;
let nextStartAt = Date.now();
let checkpointChain = Promise.resolve();

async function scheduleStart() {
  const now = Date.now();
  const waitMs = Math.max(0, nextStartAt - now);
  nextStartAt = Math.max(now, nextStartAt) + START_DELAY_MS;
  if (waitMs) await sleep(waitMs);
}

async function recordRow(row) {
  const existingIndex = rows.findIndex((item) => item.studyIndex === row.studyIndex);
  if (existingIndex >= 0) rows[existingIndex] = row;
  else rows.push(row);
  rows.sort((a, b) => a.studyIndex - b.studyIndex);
  const metric = row.status === "ok"
    ? `${row.rawSampleCount} -> ${row.cleanedSampleCount}, median ${row.rawMedian} -> ${row.cleanedMedian}`
    : `${row.httpStatus || ""} ${row.errorCode}`;
  process.stdout.write(`[${String(row.studyIndex).padStart(3, "0")}/100] ${row.product}: ${metric}\n`);
  checkpointChain = checkpointChain.then(() =>
    writeFile(new URL("aggregate.json", RESULTS_DIR), `${JSON.stringify({ startedAt, completedAt: null, rows }, null, 2)}\n`),
  );
  await checkpointChain;
}

async function worker() {
  while (true) {
    const cursor = pendingCursor;
    pendingCursor += 1;
    if (cursor >= pendingIndexes.length) return;
    const index = pendingIndexes[cursor];
    await scheduleStart();
    await recordRow(await fetchProduct(products[index], index));
  }
}

if (rows.length) process.stdout.write(`Resuming after ${rows.length} completed searches.\n`);
await Promise.all(Array.from({ length: concurrency }, () => worker()));
await checkpointChain;

const completedAt = new Date().toISOString();
const aggregate = { startedAt, completedAt, protocol: { ebaySite: "ebay.com", soldAfter: SOLD_AFTER, soldBefore: SOLD_BEFORE, requestedCount: 240, relevance: true, sortOrder: "endedRecently", itemCondition: "any" }, rows };
await writeFile(new URL("aggregate.json", RESULTS_DIR), `${JSON.stringify(aggregate, null, 2)}\n`);

const columns = [
  "studyIndex", "category", "product", "keyword", "ebaySite", "soldAfter", "soldBefore",
  "requestedCount", "rawSampleCount", "cleanedSampleCount", "removedCount", "removalRatePct",
  "rawMedian", "cleanedMedian", "medianDelta", "medianDeltaPct", "mean", "p25", "p75", "iqr",
  "min", "max", "avgShipping", "currency", "bestOfferAcceptedCount", "bestOfferAcceptedRatePct",
  "totalResultsReported", "firstScrapedAt", "lastScrapedAt", "requestId", "cacheStatus", "durationMs",
  "status", "errorCode",
];
const csv = [columns.map(csvCell).join(","), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\r\n");
await writeFile(new URL("study-results.csv", RESULTS_DIR), `${csv}\r\n`);
process.stdout.write(`Completed ${rows.filter((row) => row.status === "ok").length}/100 searches.\n`);
