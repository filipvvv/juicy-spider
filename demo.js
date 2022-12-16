import dotenv from 'dotenv'
import {sepana} from './constants.js'
import * as readline from 'node:readline/promises';
dotenv.config()

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, })
  const search = await rl.question('Query? ')
  rl.close()

  const results = await fetch(sepana + 'search',{
    headers: { 'x-api-key': process.env.SEPANA_API_KEY, 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify({ 
      engine_ids: [ process.env.SEPANA_ENGINE_ID ],  
      query: {
        query_string: {
          query: search,
        },
      },
      // size: 5,
      page: 0,
    }),
  }).then(res => res.json())

  console.log('Most relevant projects:')
  results.hits.hits.forEach(el => console.log(`v${el._source.pv}, project ${el._source.projectId}: ${el._source.name}. Similarity score: ${el._score}`))
  main()
}

main()