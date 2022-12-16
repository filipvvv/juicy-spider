import dotenv from 'dotenv'
import { sepana } from './constants.js'
dotenv.config()

async function main() {
  const results = await fetch(sepana + 'engine/data/delete',{
    headers: { 'x-api-key': process.env.SEPANA_API_KEY, 'Content-Type': 'application/json' },
    method: 'DELETE',
    body: JSON.stringify({ 
      engine_id: process.env.SEPANA_ENGINE_ID,  
      delete_query: {
        query: {
          match_all: {},
        },
      },
    }),
  }).then(res => res.json())

  console.log(JSON.stringify(results))
}

main()