import { randomUUID } from "node:crypto";

const API_BASE = "https://api.compsniper.com";
const TERMINAL = new Set(["done", "partial", "cancelled", "failed"]);
const apiKey = process.env.COMPSNIPER_API_KEY?.trim();
if (!apiKey) throw new Error("Set COMPSNIPER_API_KEY before running this example.");

const authorization = `Bearer ${apiKey}`;
const submitted = await fetch(`${API_BASE}/v1/cards/batch`, {
  method: "POST",
  headers: {
    Authorization: authorization,
    "Content-Type": "application/json",
    "Idempotency-Key": `example-${randomUUID()}`,
  },
  body: JSON.stringify({
    cards: [
      {
        reference: "inventory-001",
        year: 2023,
        set: "Topps Chrome",
        player: "Victor Wembanyama",
        cardNumber: "1",
        parallel: "Refractor",
        grader: "PSA",
        grade: 10,
      },
      { reference: "inventory-002", keyword: "1999 pokemon base set charizard 4/102 psa 9" },
    ],
    options: { count: 60, outputMode: "summary", relevance: true },
  }),
  signal: AbortSignal.timeout(30_000),
});
let job = await submitted.json();
if (!submitted.ok) throw new Error(job.error ?? `CompSniper returned HTTP ${submitted.status}`);
console.log("Submitted job:", job.jobId);

while (!TERMINAL.has(job.status)) {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const response = await fetch(`${API_BASE}/v1/cards/batch/${job.jobId}`, {
    headers: { Authorization: authorization },
    signal: AbortSignal.timeout(30_000),
  });
  job = await response.json();
  if (!response.ok) throw new Error(job.error ?? `CompSniper returned HTTP ${response.status}`);
  console.log(`${job.status}: ${job.processedCards}/${job.totalCards} processed`);
}

for (const result of job.results ?? []) {
  console.log(result.reference, result.status, result.summary);
}
