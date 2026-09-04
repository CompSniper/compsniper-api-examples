# Poshmark sold listings API examples

Search public Poshmark US sold listings through CompSniper without providing a Poshmark account or
customer cookies. Each successful page uses one CompSniper request and returns up to 48 listings.

- [Python example](python.py)
- [Node.js example](node.mjs)
- [Complete Poshmark sold listings API guide](https://compsniper.com/poshmark-sold-listings-api)
- [Marketplace API documentation](https://compsniper.com/docs/marketplaces)

Set your key before running either example:

```bash
export COMPSNIPER_API_KEY="cs_live_REPLACEWITHYOURKEY"
python marketplaces/poshmark/python.py
node marketplaces/poshmark/node.mjs
```

The public displayed sold price can differ from a private accepted offer or bundle allocation. Keep
the sample size and listing evidence with any calculated price range.
