# CompSniper API examples

Production-ready Python, Node.js, and cURL examples for retrieving real eBay sold listings with the
[CompSniper API](https://compsniper.com).

One search can return up to 240 completed sales with sold price, date, condition, shipping, seller, and
a computed price summary. CompSniper supports eight eBay marketplaces and can remove accessories,
parts, and wrong-model matches before calculating the median.

## Get an API key

Create a free CompSniper account and copy the key from the dashboard:

- [Create a free account](https://compsniper.com/signup)
- [API documentation](https://compsniper.com/docs)
- [Python tutorial](https://compsniper.com/guides/ebay-sold-listings-api-python)

Copy `.env.example` to `.env`, then replace the placeholder. Never commit a real API key.

```bash
export COMPSNIPER_API_KEY="cs_live_REPLACEWITHYOURKEY"
```

## Fastest request

```bash
curl --fail-with-body -H "Authorization: Bearer $COMPSNIPER_API_KEY" "https://api.compsniper.com/v1/scrape?keyword=iphone+15+pro&count=10"
```

## Examples

| Example | Python | Node.js |
| --- | --- | --- |
| First sold-listings request | [`python/quickstart.py`](python/quickstart.py) | [`node/quickstart.mjs`](node/quickstart.mjs) |
| Safe retries and quota handling | [`python/retry_safe.py`](python/retry_safe.py) | [`node/retry-safe.mjs`](node/retry-safe.mjs) |
| Pagination | [`python/paginate.py`](python/paginate.py) | [`node/paginate.mjs`](node/paginate.mjs) |
| Card Batch API | [`python/card_batch.py`](python/card_batch.py) | [`node/card-batch.mjs`](node/card-batch.mjs) |
| Copyable shell requests | [`curl/examples.sh`](curl/examples.sh) | — |

Install the only Python dependency:

```bash
python -m pip install -r python/requirements.txt
python python/quickstart.py
```

Node examples use the built-in `fetch` available in Node.js 18 and newer:

```bash
node node/quickstart.mjs
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

See the [complete API reference](https://compsniper.com/docs#scrape) for every filter and response field.

## Security

API keys belong on a server or in a local environment variable. Do not expose them in browser code,
mobile apps, public logs, screenshots, or commits. Rotate an exposed key from the CompSniper dashboard.

## License

MIT. See [LICENSE](LICENSE).

CompSniper is not affiliated with or endorsed by eBay. eBay is a trademark of eBay Inc.
