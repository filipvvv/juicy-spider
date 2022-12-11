require('dotenv').config()

const ipfs = 'https://gold-binding-angelfish-816.mypinata.cloud/ipfs/'
const subgraph = 'https://api.studio.thegraph.com/query/30654/mainnet-dev/0.7.0'
const sepana = 'https://api.sepana.io/v1/engine/'

async function main() {
  let remaining = true
  let docs = []

  for(let i = 0; remaining; i+=1000){
    const query = `{
      projects(first: 1000, skip: ${i}, orderBy: projectId){
        projectId
        pv
        handle
        metadataUri
        currentBalance
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
      json.data.projects[0]
      ? docs = docs.concat(json.data.projects)
      : remaining = false
    }).catch(e => { throw new Error('Error querying Subgraph: ' + e) })
  } 

  let ipfsPromises = []
  for(const i in docs){
    ipfsPromises.push(fetch(ipfs + docs[i].metadataUri + '?' + new URLSearchParams({
      pinataGatewayToken: process.env.PINATA_GATEWAY_TOKEN,
    }))
    .then(res => res.ok ? res.json() : null)
    .then(metadata => {
      docs[i].name = metadata?.name
      docs[i].description = metadata?.description
      docs[i].logoUri = metadata?.logoUri
    })
    .catch(e => console.log(`Error with CID ${docs[i].metadataUri}: ${e}`))
    )
  }

  Promise.all(ipfsPromises).then(() => {
    while(docs[0]){
      fetch(sepana + 'insert_data',{
        headers: { 'x-api-key': process.env.SEPANA_API_KEY, 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ engine_id: process.env.SEPANA_ENGINE_ID,  docs: docs.splice(0, 500) }),
      })
    }
  })
}

main()