# CompSniper API examples

Production-ready Python, TypeScript, Node.js, and cURL examples for retrieving public eBay, Poshmark,
and Mercari marketplace listings with the [CompSniper API](https://compsniper.com).

One search can return up to 240 completed sales with sold price, date, condition, shipping, seller, and
a computed price summary. CompSniper supports eight eBay marketplaces and can remove accessories,
parts, and wrong-model matches before calculating the median.

Dedicated endpoints also return up to 48 Poshmark US sold listings or up to 100 Mercari US sold or
active listings per page. They use the same CompSniper API key, quota, purchased credits, and retry
behavior without requiring a Poshmark or Mercari account.

## Get an API key

Create a free CompSniper account and copy the key from the dashboard:

- [Create a free account](https://compsniper.com/signup)
- [API documentation](https://compsniper.com/docs)
- [Python tutorial](https://compsniper.com/guides/ebay-sold-listings-api-python)
- [JavaScript and TypeScript tutorial](https://compsniper.com/guides/ebay-sold-listings-api-javascript)

Copy `.env.example` to `.env`, then replace the placeholder. Never commit a real API key.

```bash
export COMPSNIPER_API_KEY="cs_live_REPLACEWITHYOURKEY"
```

## Fastest request

```bash
curl --fail-with-body -H "Authorization: Bearer $COMPSNIPER_API_KEY" "https://api.compsniper.com/v1/scrape?keyword=iphone+15+pro&count=10"
```

## Examples

| Example | Python | TypeScript | Node.js |
| --- | --- | --- | --- |
| First sold-listings request | [`python/quickstart.py`](python/quickstart.py) | [`typescript/quickstart.ts`](typescript/quickstart.ts) | [`node/quickstart.mjs`](node/quickstart.mjs) |
| Safe retries and quota handling | [`python/retry_safe.py`](python/retry_safe.py) | - | [`node/retry-safe.mjs`](node/retry-safe.mjs) |
| Pagination | [`python/paginate.py`](python/paginate.py) | - | [`node/paginate.mjs`](node/paginate.mjs) |
| Card Batch API | [`python/card_batch.py`](python/card_batch.py) | - | [`node/card-batch.mjs`](node/card-batch.mjs) |
| Poshmark sold listings | [`marketplaces/poshmark/python.py`](marketplaces/poshmark/python.py) | - | [`marketplaces/poshmark/node.mjs`](marketplaces/poshmark/node.mjs) |
| Mercari sold or active listings | [`marketplaces/mercari/python.py`](marketplaces/mercari/python.py) | - | [`marketplaces/mercari/node.mjs`](marketplaces/mercari/node.mjs) |
| Reproduce the 100-product cleaning study | - | - | [`research/100-product-cleaning-study/collect.mjs`](research/100-product-cleaning-study/collect.mjs) |
| Copyable shell requests | [`curl/examples.sh`](curl/examples.sh) | - | - |

Install the only Python dependency:

```bash
python -m pip install -r python/requirements.txt
python python/quickstart.py
```

Node examples use the built-in `fetch` available in Node.js 18 and newer:

```bash
node node/quickstart.mjs
```

Run the TypeScript example with `tsx`:

```bash
npx --yes tsx typescript/quickstart.ts
```

## Important 429 behavior

CompSniper returns two different `429` codes. Treating them the same can produce hundreds of useless
retries.

| Code | Meaning | Correct behavior |
| --- | --- | --- |
| `rate_limited` | Temporary per-minute limit | Wait for `Retry-After`, add jitter, and retry a bounded number of times. |
| `quota_exceeded` | Monthly plan quota is exhausted | Stop immediately. Wait for `reset_at` or show `upgrade_url`. Never loop. |

The retry examples also use bounded backoff for temporary `500`, `502`, and `503` responses.

## Quota model

- One successful search page uses one request, whether it returns 1 result or 240.
- Cached searches still use one customer request because they deliver the same API value.
- Each successfully processed card in a Card Batch job uses one request.
- Failed upstream requests do not consume the reserved monthly request.

Check usage programmatically:

```bash
curl --fail-with-body -H "Authorization: Bearer $COMPSNIPER_API_KEY" "https://api.compsniper.com/v1/account/usage"
```

## Useful filters

The examples demonstrate these common query parameters:

- `ebaySite`: `ebay.com`, `ebay.co.uk`, `ebay.de`, `ebay.fr`, `ebay.it`, `ebay.es`, `ebay.ca`, or `ebay.com.au`
- `itemCondition`: `any`, `new`, or `used`
- `minPrice` and `maxPrice`
- `page` and `count`
- `categoryId`
- `relevance=false` to return raw eBay matches without AI relevance cleanup

See the [complete API reference](https://compsniper.com/docs/api-reference) for every filter and response field.

## Poshmark and Mercari

- [Poshmark examples and limitations](marketplaces/poshmark)
- [Mercari examples and limitations](marketplaces/mercari)
- [Poshmark and Mercari API documentation](https://compsniper.com/docs/marketplaces)

Poshmark sold prices and Mercari prices are public displayed listing values. They may not disclose a
private offer, bundle allocation, coupon, or transaction adjustment. Mercari public search also does
not provide a reliable exact sold timestamp.

## Original research

The [100-product raw-versus-cleaned sold-comps study](https://compsniper.com/research/ebay-sold-comps-cleaning-study)
used one fixed US marketplace protocol across five product categories. The complete predeclared product
list, bounded collector, and analysis script are under
[`research/100-product-cleaning-study`](research/100-product-cleaning-study). The published report links
to its aggregate CSV and explains the limitations.

## Security

API keys belong on a server or in a local environment variable. Do not expose them in browser code,
mobile apps, public logs, screenshots, or commits. Rotate an exposed key from the CompSniper dashboard.

## License

MIT. See [LICENSE](LICENSE).

CompSniper is independent and is not affiliated with or endorsed by eBay, Poshmark, or Mercari.
