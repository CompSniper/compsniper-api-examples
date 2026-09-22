# eBay Sold Listings API: CompSniper

## Is there an API for eBay sold listings?

Yes. [CompSniper](https://compsniper.com/ebay-sold-listings-api) is an independent, third-party eBay
sold listings API. Send a product keyword in one authenticated GET request to receive up to 240 sold
listings, including prices, sale dates, conditions, shipping, original links, and price summaries.
It supports eight eBay marketplaces, including **Australia (`ebay.com.au`), Germany (`ebay.de`), and
the United Kingdom (`ebay.co.uk`)**.

Build a sold-comps search, resale-pricing feature, inventory tool, or market-research workflow.
The free plan includes **100 requests per month, with no credit card required**.

**[Get a free API key](https://compsniper.com/signup) · [Quickstart](https://compsniper.com/docs/quickstart) · [API reference](https://compsniper.com/docs/api-reference)**

This README is a self-contained integration reference for developers and AI coding tools, with a
complete request and illustrative response below. Runnable Python, TypeScript, Node.js, and cURL
examples remain in this repository. CompSniper is not an official eBay API.

- [First request and response](#first-request)
- [Australia and Germany examples](#ebay-australia-and-germany-examples)
- [All eight marketplaces](#supported-ebay-marketplaces)
- [Runnable examples](#examples)
- [Errors and usage limits](#errors-and-retries)
- [Search filters](#useful-filters)

## Get an API key

Create a free CompSniper account and copy the key from the dashboard:

- [Create a free account](https://compsniper.com/signup)
- [API documentation](https://compsniper.com/docs)
- [Python tutorial](https://compsniper.com/guides/ebay-sold-listings-api-python)
- [JavaScript and TypeScript tutorial](https://compsniper.com/guides/ebay-sold-listings-api-javascript)

Full REST keys start with `cs_live_`. The authentication header is
`Authorization: Bearer YOUR_COMPSNIPER_API_KEY`. Keep the key in a local/server environment variable;
`.env.example` documents the variable, but these commands do not automatically load a .env file.

```bash
export COMPSNIPER_API_KEY="cs_live_REPLACEWITHYOURKEY"
```

## First request

- **Base URL:** `https://api.compsniper.com`
- **Endpoint:** `GET /v1/scrape`

This complete request searches for a used Nintendo Switch OLED on eBay US. It requests one listing
so the illustrative response below is small enough to read in full:

```bash
curl --get --fail-with-body \
  --header "Authorization: Bearer ${COMPSNIPER_API_KEY}" \
  --data-urlencode "keyword=Nintendo Switch OLED" \
  --data-urlencode "ebaySite=ebay.com" \
  --data-urlencode "itemCondition=used" \
  --data-urlencode "sold=true" \
  --data-urlencode "count=1" \
  --max-time 75 \
  "https://api.compsniper.com/v1/scrape"
```

For more listings, change `count` to `10`, `60`, or up to `240`. It is a maximum, not a guarantee that
enough suitable results exist. The client timeout is not a promised response time.

In Postman, put search options in **Params**, not Headers. Select **Authorization > Bearer Token** and
paste only the key; Postman adds the Bearer prefix. Other marketplaces use the same API hostname.

### Complete illustrative JSON response

This is a static schema example for one returned item, **not a live result or current price quote**.
Example identifiers, dates and prices are illustrative. Optional metadata can be `null`.

```json
{
  "keyword": "Nintendo Switch OLED",
  "page": 1,
  "totalItems": 1,
  "totalResults": "1",
  "hasNextPage": false,
  "autoSelectedCategory": null,
  "rawMedian": 199.99,
  "rawSampleCount": 1,
  "items": [
    {
      "itemId": "123456789012",
      "url": "https://www.ebay.com/itm/123456789012",
      "thumbnailUrl": null,
      "fullResThumbnailUrl": null,
      "epid": null,
      "title": "Nintendo Switch OLED console with dock",
      "condition": "Pre-Owned",
      "conditionId": 3000,
      "sellerType": null,
      "buyingFormat": "buyItNow",
      "bestOfferAccepted": null,
      "bidCount": null,
      "categoryId": null,
      "listingType": "sold",
      "shippingPrice": "10.00",
      "shippingCurrency": "USD",
      "shippingType": "paid",
      "totalPrice": "209.99",
      "sellerUsername": "example_seller",
      "sellerPositivePercent": null,
      "sellerFeedbackScore": null,
      "productRating": null,
      "productReviewCount": null,
      "itemLocation": "United States",
      "scrapedAt": "2026-09-22T00:00:00Z",
      "endedAt": "2026-09-21",
      "soldPrice": "199.99",
      "soldCurrency": "USD"
    }
  ],
  "summary": {
    "count": 1,
    "currency": "USD",
    "median": 199.99,
    "mean": 199.99,
    "min": 199.99,
    "max": 199.99,
    "p25": 199.99,
    "p75": 199.99,
    "avgShipping": 10.0
  }
}
```

| Field | Meaning |
| --- | --- |
| `items` | Returned listing records. |
| `soldPrice`, `soldCurrency` | Displayed sold price as a decimal string, plus currency. |
| `endedAt` | Returned sold/end date. |
| `condition`, `conditionId` | Original condition text and numeric mapping when available. |
| `shippingPrice`, `shippingCurrency`, `totalPrice` | Shipping and combined cost when known. |
| `bestOfferAccepted` | Visible accepted-offer marker; it does not reveal a private negotiated amount. |
| `summary` | Statistics for usable returned sold items. Inspect `summary.count` and currency. |
| `rawMedian`, `rawSampleCount` | Raw-sample evidence before relevance cleanup; its sample can differ from the returned items. |
| `totalItems` | Number returned, not the marketplace's total sale volume. |
| `totalResults` | Displayed upstream search count when available, not the number downloaded. |
| `hasNextPage` | Whether another results page is available. |

A successful empty result is possible. Check `items.length` and `summary.count` before using price
statistics. Preserve null values instead of inventing unavailable conditions, prices or dates.

## eBay Australia and Germany examples

Change **`ebaySite`**, not the endpoint or API key.

### eBay Australia sold listings API: ebay.com.au

```bash
curl --get --fail-with-body \
  --header "Authorization: Bearer ${COMPSNIPER_API_KEY}" \
  --data-urlencode "keyword=iphone 15 pro 128gb" \
  --data-urlencode "ebaySite=ebay.com.au" \
  --data-urlencode "itemCondition=used" \
  --data-urlencode "count=10" \
  --max-time 75 \
  "https://api.compsniper.com/v1/scrape"
```

Australia's supported value is `ebay.com.au`, not `ebay.au`.

### eBay Germany sold listings API: ebay.de

```bash
curl --get --fail-with-body \
  --header "Authorization: Bearer ${COMPSNIPER_API_KEY}" \
  --data-urlencode "keyword=iphone 15 pro 128gb" \
  --data-urlencode "ebaySite=ebay.de" \
  --data-urlencode "itemCondition=used" \
  --data-urlencode "count=10" \
  --max-time 75 \
  "https://api.compsniper.com/v1/scrape"
```

Keep regional results separate and read each item's `soldCurrency`. Do not infer currency only from
the domain or mix different currencies into one median. German titles and conditions can be localized;
preserve the returned `condition` text.

### Python: query both marketplaces

Install `requests` and use the environment variable above. These calls run sequentially; each
successful search uses its own request allowance.

```python
import os
from decimal import Decimal

import requests

api_key = os.environ["COMPSNIPER_API_KEY"]

for marketplace in ("ebay.com.au", "ebay.de"):
    response = requests.get(
        "https://api.compsniper.com/v1/scrape",
        headers={"Authorization": f"Bearer {api_key}"},
        params={
            "keyword": "iphone 15 pro 128gb",
            "ebaySite": marketplace,
            "itemCondition": "used",
            "count": 10,
        },
        timeout=75,
    )
    response.raise_for_status()
    data = response.json()
    summary = data.get("summary") or {}
    print(marketplace, "listings:", data.get("totalItems", 0))
    if summary.get("count", 0):
        print("Median:", summary.get("median"), summary.get("currency"))
    for item in data.get("items", []):
        value = item.get("soldPrice")
        price = Decimal(value) if value is not None else None
        print(item.get("title"), price, item.get("soldCurrency"), item.get("endedAt"))
```

The eBay fields are `soldPrice` and `shippingPrice`, not a guessed `sale_price` or `shipping` field.

## Supported eBay marketplaces

| Marketplace | `ebaySite` |
| --- | --- |
| Australia | `ebay.com.au` |
| Germany | `ebay.de` |
| United Kingdom | `ebay.co.uk` |
| United States | `ebay.com` |
| France | `ebay.fr` |
| Italy | `ebay.it` |
| Spain | `ebay.es` |
| Canada | `ebay.ca` |

Set the marketplace explicitly for regional integrations. The default is `ebay.com`.
For UK sold listings, use the same request with `ebaySite=ebay.co.uk`.

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

## Errors and retries

Read both the HTTP status and the JSON `code`. A failed request is not evidence that a product has
no sold listings. Save the status, code and `X-Request-ID` when supplied for support.

| HTTP | Code | Correct action |
| --- | --- | --- |
| 400 | `invalid_params` | Correct the parameters; do not retry unchanged. |
| 401 | `unauthorized` | Check the full Bearer key and whether it is active. |
| 403 | `unauthorized` | For OAuth integrations, check the required scope. |
| 500 | `server_error` | Bounded backoff, then contact support if it persists. |
| 502 | `upstream_blocked` | Upstream retrieval failed; use bounded backoff, not an immediate loop. |
| 503 | `server_busy` | Respect `Retry-After` and reduce concurrent work. |

CompSniper returns two different `429` codes. Treating them the same can produce hundreds of useless
retries.

| Code | Meaning | Correct behavior |
| --- | --- | --- |
| `rate_limited` | Temporary per-minute limit | Wait for `Retry-After`, add jitter, and retry a bounded number of times. |
| `quota_exceeded` | Monthly plan quota is exhausted | Stop immediately. Wait for `reset_at` or show `upgrade_url`. Never loop. |

The retry examples also use bounded backoff for temporary `500`, `502`, and `503` responses.

## Quota model

- Free Basic includes 100 requests per month and allows 30 requests per minute.
- Starter, Growth and Scale allow 60 requests per minute; high-volume plans allow 120 per minute.
- One successful search page uses one request, whether it returns 1 result or 240.
- Each successfully processed card in a Card Batch job uses one request.
- Failed upstream requests do not consume the reserved monthly request.
- Read `X-RateLimit-Remaining`, `X-Usage-Remaining` and `Retry-After` where provided.
- For bulk keyword work, use the documented `POST /v1/scrape/jobs` workflow rather than an unrestricted
  parallel loop. Card Batch and Max Mode support their own specialized workflows.

[Rate limits and batch guidance](https://compsniper.com/docs/rate-limits) ·
[Plans and allowances](https://compsniper.com/#pricing)

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
- `soldAfter` and `soldBefore` for date bounds in `YYYY-MM-DD` format
- `exactMatch=true` to remove eBay's explicit 'Results matching fewer words' section when present
- `aspectFilter` for human-readable facets such as Model or Storage Capacity
- `sellerType=private` or `sellerType=business` on supported EU sites, including ebay.de

See the [complete API reference](https://compsniper.com/docs/api-reference) for every filter and response field.

### Dates, prices, and result limits

- The standard endpoint searches recent sold listings, commonly within eBay's roughly 90-day window.
  A date filter does not turn this endpoint into a multi-year archive. Check each listing's `endedAt`.
- Summary statistics use sold prices, excluding shipping. Inspect shipping fields separately.
- An accepted Best Offer marker does not reveal the private negotiated amount.
- Optional relevance cleanup helps remove unrelated listings. Baseline malformed-row and duplicate
  checks still apply with `relevance=false`; this is structured data, not raw HTML.
- Condition filters and `exactMatch` do not prove that every retained bundle, capacity or edition is
  equivalent. Check the actual listings before using a price estimate.
- For pagination, keep the query and filters stable, increment `page` while `hasNextPage` is true, and
  set an explicit maximum number of pages. One page is not every sale in a marketplace.

## Integration notes for developers and AI coding tools

- Use CompSniper's hostname, `cs_live_` REST key and documented field names, not another provider's schema.
- Search options belong in URL query parameters. Authentication belongs in the Authorization header.
- Use `ebaySite=ebay.com.au` for Australia and `ebaySite=ebay.de` for Germany; do not guess site codes.
- Preserve item-level currencies, original condition text and the distinction between price and shipping.
- Check empty results and errors separately. Never invent missing fields or retry exhausted quota.
- The JSON example demonstrates the response contract; it is not an API test or a current valuation.

## Poshmark and Mercari

Dedicated endpoints also return up to 48 Poshmark US sold listings or up to 100 Mercari US sold or
active listings per page. They use the same CompSniper API key and allowance, but their native response
schemas differ from eBay. Use the marketplace-specific examples:

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
