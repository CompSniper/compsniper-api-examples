"""Fetch ten recent eBay sold listings and print the CompSniper price summary."""

from __future__ import annotations

import os

import requests

API_URL = "https://api.compsniper.com/v1/scrape"


def required_api_key() -> str:
    key = os.environ.get("COMPSNIPER_API_KEY", "").strip()
    if not key:
        raise SystemExit("Set COMPSNIPER_API_KEY before running this example.")
    return key


response = requests.get(
    API_URL,
    headers={"Authorization": f"Bearer {required_api_key()}"},
    params={
        "keyword": os.environ.get("COMPSNIPER_KEYWORD", "iphone 15 pro"),
        "count": 10,
        "itemCondition": "used",
    },
    timeout=75,
)
response.raise_for_status()
data = response.json()

summary = data.get("summary") or {}
print(f"Listings returned: {data['totalItems']}")
print(f"Median: {summary.get('median')} {summary.get('currency') or ''}".rstrip())
print(f"Realistic range: {summary.get('p25')} - {summary.get('p75')}")
print(f"Monthly requests remaining: {response.headers.get('X-Usage-Remaining', 'unknown')}")

for item in data.get("items", [])[:5]:
    print(f"- {item.get('title')} | {item.get('soldPrice')} {item.get('soldCurrency')} | {item.get('endedAt')}")
