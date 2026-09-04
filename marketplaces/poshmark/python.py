"""Search one page of public Poshmark US sold listings."""

from __future__ import annotations

import os

import requests

API_URL = "https://api.compsniper.com/v1/poshmark/sold"


def required_api_key() -> str:
    key = os.environ.get("COMPSNIPER_API_KEY", "").strip()
    if not key:
        raise SystemExit("Set COMPSNIPER_API_KEY before running this example.")
    return key


response = requests.get(
    API_URL,
    headers={"Authorization": f"Bearer {required_api_key()}"},
    params={
        "keyword": os.environ.get("COMPSNIPER_KEYWORD", "louis vuitton neverfull"),
        "department": "women",
        "page": 1,
    },
    timeout=45,
)
response.raise_for_status()
data = response.json()

summary = data.get("summary") or {}
print(f"Listings returned: {data['totalItems']}")
print(f"Median displayed price: {summary.get('median')} {summary.get('currency', 'USD')}")
print(f"Monthly requests remaining: {response.headers.get('X-Usage-Remaining', 'unknown')}")

for item in data.get("items", [])[:5]:
    print(f"- {item.get('title')} | ${item.get('soldPrice')} | {item.get('soldAt') or 'date unavailable'}")
