import dotenv from 'dotenv'
import { ipfs, sepana } from './constants.js'
import { getLastUpdated, getLatestBlock, querySubgraphProjects } from './utils.js'

dotenv.config()

async function main() {
  const lastUpdated = await getLastUpdated()
  const current = querySubgraphProjects()
  const previous = await querySubgraphProjects(lastUpdated ? lastUpdated : 12833329)
  
  let docs = (await current).filter((el, i) => 
    el.handle !== previous[i]?.handle ||
    el.metadataUri !== previous[i]?.metadataUri ||
    el.currentBalance !== previous[i]?.currentBalance ||
    el.totalPaid !== previous[i]?.totalPaid ||
    el.trendingScore !== previous[i]?.trendingScore
  )

  const ipfsPromises = []
  const now = await getLatestBlock()
  for(const i in docs){
    if(i % 50 === 0)
      await new Promise(r => setTimeout(r, 2000));
    docs[i].lastUpdated = now
    ipfsPromises.push(fetch(ipfs + docs[i].metadataUri)
    .then(async(res) => {
      if (!res.ok)
        throw new Error(`${res.status}: ${await res.text()}`);
      return(res.json())
    })
    .then(metadata => {
      console.log(docs[i].id + ': ' + metadata?.name)
      docs[i].name = metadata?.name
      docs[i].description = metadata?.description
      docs[i].logoUri = metadata?.logoUri
    })
    .catch(e => {throw new Error(`Error with CID ${docs[i].metadataUri}: ${e}`)})
    )
  }

  Promise.all(ipfsPromises).then(() => {
    return fetch(sepana + 'engine/data/delete', {
      method: 'DELETE',
      headers: { 'x-api-key': process.env.SEPANA_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        engine_id: process.env.SEPANA_ENGINE_ID,
        delete_query: {
          query: {
            terms: {
              id: docs.map(el => el.id),
            },
          },
        },
      }),
    })
  })
  .then(async() => {
    while(docs[0]){
      await new Promise(r => setTimeout(r, 2000));
      fetch(sepana + 'engine/insert_data',{
        headers: { 'x-api-key': process.env.SEPANA_API_KEY, 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ engine_id: process.env.SEPANA_ENGINE_ID,  docs: docs.splice(0, 500) }),
      }).then(res => res.json())
      .then(json => console.log(JSON.stringify(json)))
    }
  })
  .catch(e => console.log(e))
}

main()