# CompSniper 100-product relevance-cleaning study

This folder defines and reproduces the dataset behind CompSniper's 2026 raw-versus-cleaned sold-comps
study.

## Fixed protocol

- 100 products selected before collection.
- Five categories with 20 products each.
- Marketplace: `ebay.com`.
- Sold window: June 2 through August 31, 2026.
- Page: 1.
- Requested rows: 240.
- Sort: ended recently.
- Condition: any.
- Relevance cleaning: enabled.
- One production API call per product.

The relevance-enabled response contains the pre-cleaning `rawMedian` and `rawSampleCount`, plus the
cleaned rows and summary. This avoids a second fetch and makes the comparison use the same upstream page.

## Run

```bash
COMPSNIPER_API_KEY=cs_live_REPLACEWITHYOURKEY node collect.mjs
node analyze.mjs
```

The script resumes from its last successful checkpoint, uses at most two workers by default, and spaces
new request starts by one second. It retries only bounded temporary failures. It never retries
authentication, invalid parameters, or monthly quota exhaustion.

## Outputs

- `results/aggregate.json`: progress checkpoint and final structured results.
- `results/study-results.csv`: one aggregate row per product.
- `results/analysis.json`: overall, category, distribution, integrity, and outlier summaries.
- `results/public-study-data.csv`: publishable aggregate data without request IDs or listing-level fields.
- `results/raw/*.json`: complete private response evidence for local audit.

Raw listing-level files are not intended for publication. The aggregate CSV contains product-level
counts and statistics without copying listing titles or seller information.
