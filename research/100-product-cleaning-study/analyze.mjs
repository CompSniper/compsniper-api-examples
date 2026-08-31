import { readFile, writeFile } from "node:fs/promises";

const ROOT = new URL(".", import.meta.url);
const aggregate = JSON.parse(await readFile(new URL("results/aggregate.json", ROOT), "utf8"));
const rows = aggregate.rows;

if (!Array.isArray(rows) || rows.length !== 100 || rows.some((row) => row.status !== "ok")) {
  throw new Error("Analysis requires exactly 100 successful rows.");
}

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
};
const sum = (items, field) => items.reduce((total, item) => total + Number(item[field] || 0), 0);
const median = (values) => {
  const sorted = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const midpoint = (sorted.length - 1) / 2;
  return round((sorted[Math.floor(midpoint)] + sorted[Math.ceil(midpoint)]) / 2);
};
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function summarize(items) {
  const rawRows = sum(items, "rawSampleCount");
  const cleanedRows = sum(items, "cleanedSampleCount");
  const removedRows = rawRows - cleanedRows;
  const absoluteMedianChanges = items.map((row) => Math.abs(row.medianDeltaPct));
  const bestOffers = sum(items, "bestOfferAcceptedCount");
  return {
    products: items.length,
    rawRows,
    cleanedRows,
    removedRows,
    weightedRemovalRatePct: round((removedRows / rawRows) * 100),
    medianProductRemovalRatePct: median(items.map((row) => row.removalRatePct)),
    medianAbsoluteMedianChangePct: median(absoluteMedianChanges),
    productsWithAnyRemoval: items.filter((row) => row.removedCount > 0).length,
    productsWithMedianChange: items.filter((row) => Math.abs(row.medianDelta) >= 0.01).length,
    productsMedianUp: items.filter((row) => row.medianDelta > 0).length,
    productsMedianDown: items.filter((row) => row.medianDelta < 0).length,
    productsMedianUnchanged: items.filter((row) => row.medianDelta === 0).length,
    productsAbsChangeAtLeast5Pct: items.filter((row) => Math.abs(row.medianDeltaPct) >= 5).length,
    productsAbsChangeAtLeast10Pct: items.filter((row) => Math.abs(row.medianDeltaPct) >= 10).length,
    productsAbsChangeAtLeast25Pct: items.filter((row) => Math.abs(row.medianDeltaPct) >= 25).length,
    productsAbsChangeAtLeast50Pct: items.filter((row) => Math.abs(row.medianDeltaPct) >= 50).length,
    bestOfferAcceptedRows: bestOffers,
    bestOfferAcceptedRatePct: round((bestOffers / cleanedRows) * 100),
  };
}

const categories = [...new Set(rows.map((row) => row.category))].map((category) => ({
  category,
  ...summarize(rows.filter((row) => row.category === category)),
}));

const changeBuckets = [
  { label: "Under 1%", min: 0, max: 1 },
  { label: "1% to under 5%", min: 1, max: 5 },
  { label: "5% to under 10%", min: 5, max: 10 },
  { label: "10% to under 25%", min: 10, max: 25 },
  { label: "25% to under 50%", min: 25, max: 50 },
  { label: "50% or more", min: 50, max: Infinity },
].map((bucket) => ({
  label: bucket.label,
  count: rows.filter((row) => {
    const value = Math.abs(row.medianDeltaPct);
    return value >= bucket.min && value < bucket.max;
  }).length,
}));

const sortAbsoluteChange = (a, b) => Math.abs(b.medianDeltaPct) - Math.abs(a.medianDeltaPct);
const publicMetricRow = (row) => ({
  studyIndex: row.studyIndex,
  category: row.category,
  product: row.product,
  rawSampleCount: row.rawSampleCount,
  cleanedSampleCount: row.cleanedSampleCount,
  removedCount: row.removedCount,
  removalRatePct: row.removalRatePct,
  rawMedian: row.rawMedian,
  cleanedMedian: row.cleanedMedian,
  medianDelta: row.medianDelta,
  medianDeltaPct: row.medianDeltaPct,
  p25: row.p25,
  p75: row.p75,
  currency: row.currency,
  bestOfferAcceptedCount: row.bestOfferAcceptedCount,
});
const publicFields = [
  "studyIndex", "category", "product", "keyword", "ebaySite", "soldAfter", "soldBefore",
  "requestedCount", "rawSampleCount", "cleanedSampleCount", "removedCount", "removalRatePct",
  "rawMedian", "cleanedMedian", "medianDelta", "medianDeltaPct", "mean", "p25", "p75", "iqr",
  "min", "max", "avgShipping", "currency", "bestOfferAcceptedCount", "bestOfferAcceptedRatePct",
  "totalResultsReported", "firstScrapedAt",
];
const publicCsv = [
  publicFields.map(csvCell).join(","),
  ...rows.map((row) => publicFields.map((field) => csvCell(row[field])).join(",")),
].join("\r\n");

const analysis = {
  generatedAt: new Date().toISOString(),
  collectionStartedAt: aggregate.startedAt,
  collectionCompletedAt: aggregate.completedAt,
  protocol: aggregate.protocol,
  overall: summarize(rows),
  categories,
  changeBuckets,
  largestAbsoluteChanges: [...rows].sort(sortAbsoluteChange).slice(0, 15).map(publicMetricRow),
  largestIncreases: rows.filter((row) => row.medianDeltaPct > 0).sort((a, b) => b.medianDeltaPct - a.medianDeltaPct).slice(0, 10).map(publicMetricRow),
  largestDecreases: rows.filter((row) => row.medianDeltaPct < 0).sort((a, b) => a.medianDeltaPct - b.medianDeltaPct).slice(0, 10).map(publicMetricRow),
  integrity: {
    successfulRequests: rows.filter((row) => row.status === "ok").length,
    uniqueRequestIds: new Set(rows.map((row) => row.requestId)).size,
    cacheMisses: rows.filter((row) => row.cacheStatus === "MISS").length,
    currencies: [...new Set(rows.map((row) => row.currency))],
    rawEvidenceFilesExpected: rows.length,
  },
};

await writeFile(new URL("results/analysis.json", ROOT), `${JSON.stringify(analysis, null, 2)}\n`);
await writeFile(new URL("results/public-study-data.csv", ROOT), `${publicCsv}\r\n`);
console.log(JSON.stringify(analysis, null, 2));
