"""Fetch a bounded number of result pages. Each successful page uses one request."""

from __future__ import annotations

import os

import requests

API_URL = "https://api.compsniper.com/v1/scrape"


def required_api_key() -> str:
    key = os.environ.get("COMPSNIPER_API_KEY", "").strip()
    if not key:
        raise SystemExit("Set COMPSNIPER_API_KEY before running this example.")
    return key


keyword = os.environ.get("COMPSNIPER_KEYWORD", "sony wh-1000xm5")
max_pages = max(1, min(int(os.environ.get("COMPSNIPER_MAX_PAGES", "3")), 100))
items: list[dict] = []

for page in range(1, max_pages + 1):
    response = requests.get(
        API_URL,
        headers={"Authorization": f"Bearer {required_api_key()}"},
        params={"keyword": keyword, "page": page, "count": 240},
        timeout=75,
    )
    response.raise_for_status()
    data = response.json()
    items.extend(data.get("items", []))
    print(f"Page {page}: {data.get('totalItems', 0)} listings")
    if not data.get("hasNextPage"):
        break

print(f"Collected {len(items)} listing rows across at most {max_pages} pages.")
