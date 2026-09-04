# Mercari sold and active listings API examples

Search public Mercari US listings through CompSniper without providing a Mercari account or customer
cookies. Sold listings are the default. Set `sold=false` when you need active asking-price inventory.

- [Python example](python.py)
- [Node.js example](node.mjs)
- [Complete Mercari sold listings API guide](https://compsniper.com/mercari-sold-listings-api)
- [Marketplace API documentation](https://compsniper.com/docs/marketplaces)

Set your key before running either example:

```bash
export COMPSNIPER_API_KEY="cs_live_REPLACEWITHYOURKEY"
python marketplaces/mercari/python.py
node marketplaces/mercari/node.mjs
```

Mercari public search does not provide a reliable exact sold timestamp. These examples use the public
listing price, condition, status, brand, category, seller ID, and item URL without inventing a sale date.
