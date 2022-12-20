# Juicy Spider

<p align="center">
    <img width="200" src="https://media.discordapp.net/attachments/868159148544634880/1054574511946727424/Juicy_spider.png?width=465&height=465" alt="A Juicy Spider">
</p>

**Juicy Spider** is a [Juicebox](https://juicebox.money) project crawler built for [Sepana](https://sepana.io/). You can use its Sepana engine to search by project:

- ID
- Version
- Handle
- Metadata
- Balance
- Cumulative receiving volume
- Creation timestamp
- Trending score
- Deployer

using [Elasticsearch](https://www.elastic.co/)-style queries.

Juicy Spider is built with [Node.js](https://nodejs.org/), [juice-subgraph](https://github.com/jbx-protocol/juice-subgraph), and [Sepana](https://sepana.io/).

## Installation

Clone with:

```bash
git clone https://github.com/filipvvv/juicy-spider.git
```

And install with:

```bash
cd juicy-spider && yarn
```

Create a `.env` file with:

```bash
cp .example.env .env
```

The env file has been pre-filled with a public engine ID and a read-only API key for that engine.

## Querying Sepana

For example queries, run `node misc/examples.js`.

To learn more about querying Sepana, read:

- [Sepana's API Docs](https://docs.sepana.io/sepana-search-api/web3-search-cloud/search-api).
- [Elasticsearch's Query DSL Docs](https://www.elastic.co/guide/en/elasticsearch/reference/7.10/full-text-queries.html).
- Sepana uses [Elasticsearch 7.10](https://www.elastic.co/guide/en/elasticsearch/reference/7.17/release-notes-7.10.0.html).

## Running Your Own Engine

Open `.env` and add your Sepana engine's ID to `SEPANA_ENGINE_ID` and your Sepana API key to `SEPANA_API_KEY`. Your API key must have `Read and Write` ACL Permission over your engine.

- Run `node main/` to synchronize your database with Subgraph and IPFS Juicebox Project data.
- To reset your engine, run `node misc/reset.js`.
- To print the contents of your engine to stdout, run `node misc/stringify.js`.

## About Juicebox

[Juicebox](https://juicebox.money) helps people run programmable and community funded treasuries from startup to scale, openly on Ethereum. If you have any questions, join the [Discord server](https://discord.gg/juicebox).
