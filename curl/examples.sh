#!/usr/bin/env bash
set -euo pipefail

: "${COMPSNIPER_API_KEY:?Set COMPSNIPER_API_KEY before running this script}"

auth_header="Authorization: Bearer ${COMPSNIPER_API_KEY}"

# Public service health; does not consume quota.
curl --fail-with-body "https://api.compsniper.com/v1/status"

# Ten used sold listings.
curl --fail-with-body -H "$auth_header" "https://api.compsniper.com/v1/scrape?keyword=iphone+15+pro&itemCondition=used&count=10"

# Price summary without listing rows.
curl --fail-with-body -H "$auth_header" "https://api.compsniper.com/v1/summary?keyword=shure+sm7b&count=240"

# Category-only sold browse.
curl --fail-with-body -H "$auth_header" "https://api.compsniper.com/v1/scrape/category?categoryId=9355&count=10"

# Current plan and quota usage.
curl --fail-with-body -H "$auth_header" "https://api.compsniper.com/v1/account/usage"

# Poshmark US sold listings.
curl --fail-with-body -H "$auth_header" "https://api.compsniper.com/v1/poshmark/sold?keyword=louis+vuitton+neverfull&department=women&page=1"

# Mercari US sold listings. Use sold=false for current active listings.
curl --fail-with-body -H "$auth_header" "https://api.compsniper.com/v1/mercari?keyword=sony+wh-1000xm5&count=25&sold=true"
