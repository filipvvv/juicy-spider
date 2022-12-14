require('dotenv').config()

const ipfs = 'https://jbx-mainnet.mypinata.cloud/ipfs/'
const subgraph = 'https://api.studio.thegraph.com/query/30654/mainnet-dev/0.7.0'
const sepana = 'https://api.sepana.io/v1/'

async function main() {
  const lastUpdated = getLastUpdated()
  const current = queryProjects()
  const previous = await queryProjects(lastUpdated ? lastUpdated : 12833329)
  
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
    docs[i].lastUpdated = now
    ipfsPromises.push(fetch(ipfs + docs[i].metadataUri)
    .then(res => { 
      try{ return(res.json()) } catch { throw new Error(res.text()) }
    })
    .then(metadata => {
      docs[i].name = metadata?.name
      docs[i].description = metadata?.description
      docs[i].logoUri = metadata?.logoUri
    })
    .catch(e => {throw new Error(`Error with CID ${docs[i].metadataUri}: ${e}`)})
    )
  }

  Promise.all(ipfsPromises).then(() => {
    fetch(sepana + 'engine/data/delete', {
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
  .then(() => {
    while(docs[0]){
      fetch(sepana + 'engine/insert_data',{
        headers: { 'x-api-key': process.env.SEPANA_API_KEY, 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ engine_id: process.env.SEPANA_ENGINE_ID,  docs: docs.splice(0, 500) }),
      })
    }
  })
  .catch(e => console.log(e))
}

async function queryProjects(block) {
  let docs = []
  let remaining = true

  for(let i = 0; remaining; i+=1000){
    const query = `{
      projects(first: 1000, orderBy: createdAt, skip: ${i}${block? `, block: {number: ${block}}` : ''}){
        id
        projectId
        pv
        handle
        metadataUri
        currentBalance
        totalPaid
        createdAt
        trendingScore
      }
    }`

    await fetch(subgraph, {
      body: JSON.stringify({ query }),
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json())
    .then(json => {
      json.data?.projects[0]
      ? docs = docs.concat(json.data.projects)
      : remaining = false
    }).catch(e => { throw new Error('Error querying Subgraph: ' + e) })
  } 

  return(docs)
}

async function getLatestBlock() {
  const query = `{
    _meta{
      block {
        number
      }
    }
  }`

  const json = await fetch(subgraph, {
    body: JSON.stringify({ query }),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).then(res => res.json())
  .catch(e => { throw new Error(e) })

  return(json.data._meta.block.number)
}

async function getLastUpdated() {
  const results = await fetch(sepana + 'search',{
    headers: { 'x-api-key': process.env.SEPANA_API_KEY, 'Content-Type': 'application/json' },
    method: 'POST',
    body: JSON.stringify({ 
      engine_ids: [ process.env.SEPANA_ENGINE_ID ],  
      filter: {
        match_all: {},
      },
      sort: [
        {
          lastUpdated: {
            order: "desc",
          },
        },
      ],
      size: 1,
      page: 0,
    }),
  }).then(res => res.json())
  .catch(e => {throw new Error(e)})

  return(results.hits?.hits[0]?._source?.lastUpdated)
}

main()