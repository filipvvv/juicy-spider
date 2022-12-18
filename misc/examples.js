import dotenv from "dotenv";
import { sepana } from "../main/constants.js";
import * as readline from "node:readline/promises";
dotenv.config();

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const method = await rl.question(`Select a query type:
  1. Basic text search.
  2. Example juicebox.money search.
  > `);
  const query = await rl.question(`Enter your query:
  > `);
  rl.close();

  switch (method) {
    case "1":
      sepanaQuery({
        query_string: {
          query: query,
        },
      });
      break;
    case "2":
      sepanaQuery({
        function_score: {
          query: {
            query_string: {
              query: `*${query}*`,
              fields: ["name^2", "handle^2", "description"],
            },
          },
          script_score: {
            script: {
              source:
                "3 * Math.max(0, doc['totalPaid.keyword'].value.length() - 17) + 3 * Math.max(0, doc['trendingScore.keyword'].value.length() - 18)",
            },
          },
          boost_mode: "sum",
        },
      });
      break;
  }
}

async function sepanaQuery(query) {
  return fetch(sepana + "search", {
    headers: {
      "x-api-key": process.env.SEPANA_API_KEY,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      engine_ids: [process.env.SEPANA_ENGINE_ID],
      query: query,
      page: 0,
    }),
  })
    .then((res) => res.json())
    .then((json) =>
      json.hits.hits.forEach((el) =>
        console.log(
          `${el._score} v${el._source.pv}, project ${el._source.projectId}: ${
            el._source.name
          }. ${el._source.totalPaid / 1e18} ETH Paid. Trending: ${
            el._source.trendingScore / 1e18
          }.`
        )
      )
    );
}

main();
